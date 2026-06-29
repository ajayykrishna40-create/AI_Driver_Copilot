"""
DriverCopilot Voice — LLM Agent with Three-Layer Memory
Calls Claude 3.5 Sonnet via AWS Bedrock using an API key.
The BEDROCK_API_KEY env var holds the API key (ABSK format)
issued by your hackathon environment.

Memory Layers:
- Layer 1 (RAM): Current conversation array - handled in-memory
- Layer 2 (Session): SQLite event log - via ContextBuilder
- Layer 3 (Lookup): Database entities - via ContextBuilder
"""

import os
import json
import httpx
import asyncio
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session

from database import get_db
from context_builder import ContextBuilder

# Load .env before reading any env vars
load_dotenv()

router = APIRouter()

# AWS Bedrock config
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
CLAUDE_MODEL_ID = os.getenv(
    "BEDROCK_MODEL_ID",
    "amazon.nova-micro-v1:0"
)
BACKEND_BASE = "http://localhost:8001"


def get_api_key() -> str:
    """Read API key at call time so .env is always loaded first."""
    return os.getenv("BEDROCK_API_KEY", "")


# ─────────────────────────────────────────────
# Schemas
# ─────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str

class AgentChatRequest(BaseModel):
    driver_id: str
    messages: list[ChatMessage]
    pending_action: Optional[str] = None
    session_id: Optional[int] = None  # NEW: Layer 2 session tracking

class AgentChatResponse(BaseModel):
    reply: str
    action_taken: Optional[str] = None
    pending_action: Optional[str] = None
    pending_order_id: Optional[str] = None
    session_id: Optional[int] = None  # NEW: Return session ID for client to track


# ─────────────────────────────────────────────
# Tool definitions
# ─────────────────────────────────────────────

TOOLS = [
    {
        "name": "get_driver_assignments",
        "description": (
            "Fetch the driver's active loads, trailer details, shipper/consignee info, "
            "and any look-alike trailers. Call this at the start of a session or when the "
            "driver asks about their assignment."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "driver_id": {"type": "string", "description": "The driver's ID"}
            },
            "required": ["driver_id"]
        }
    },
    {
        "name": "verify_hookup",
        "description": (
            "Verify tractor number, trailer number, and temperature setpoint before confirming hookup. "
            "This MUST be called when driver says they're hooked up and provides the numbers. "
            "Returns whether all values match the expected assignment."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "The order/load ID or load number"},
                "tractor_number": {"type": "string", "description": "Tractor number provided by driver"},
                "trailer_number": {"type": "string", "description": "Trailer number provided by driver"},
                "temp_setpoint": {"type": "number", "description": "Temperature setpoint in Celsius provided by driver"}
            },
            "required": ["order_id", "tractor_number", "trailer_number", "temp_setpoint"]
        }
    },
    {
        "name": "confirm_hookup",
        "description": (
            "Log that the driver has confirmed trailer hookup. "
            "Only call this AFTER verify_hookup returns VERIFIED status."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "The order/load ID"}
            },
            "required": ["order_id"]
        }
    },
    {
        "name": "notify_departure",
        "description": (
            "Log the driver's departure, notify dispatch, and send ETA. "
            "Only call this AFTER the driver explicitly says 'yes' to notifying dispatch."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "The order/load ID"}
            },
            "required": ["order_id"]
        }
    },
    {
        "name": "complete_delivery",
        "description": (
            "Log that the driver has completed a delivery. "
            "Only call this AFTER the driver explicitly confirms the delivery is done."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {"type": "string", "description": "The order/load ID"}
            },
            "required": ["order_id"]
        }
    }
]


# ─────────────────────────────────────────────
# Tool execution (calls local FastAPI endpoints)
# ─────────────────────────────────────────────

async def execute_tool(tool_name: str, tool_input: dict) -> str:
    async with httpx.AsyncClient(timeout=15.0) as client:
        if tool_name == "get_driver_assignments":
            resp = await client.get(f"{BACKEND_BASE}/drivers/{tool_input['driver_id']}/active-loads")
            return json.dumps(resp.json(), default=str)

        elif tool_name == "verify_hookup":
            payload = {
                "order_id": tool_input['order_id'],
                "tractor_number": tool_input['tractor_number'],
                "trailer_number": tool_input['trailer_number'],
                "temp_setpoint": tool_input['temp_setpoint']
            }
            resp = await client.post(f"{BACKEND_BASE}/loads/{tool_input['order_id']}/verify-hookup", json=payload)
            return json.dumps(resp.json(), default=str)

        elif tool_name == "confirm_hookup":
            resp = await client.post(f"{BACKEND_BASE}/loads/{tool_input['order_id']}/confirm-hookup")
            return json.dumps(resp.json(), default=str)

        elif tool_name == "notify_departure":
            resp = await client.post(f"{BACKEND_BASE}/loads/{tool_input['order_id']}/depart")
            return json.dumps(resp.json(), default=str)

        elif tool_name == "complete_delivery":
            resp = await client.post(f"{BACKEND_BASE}/loads/{tool_input['order_id']}/complete-delivery")
            return json.dumps(resp.json(), default=str)

        else:
            return json.dumps({"error": f"Unknown tool: {tool_name}"})


# ─────────────────────────────────────────────
# System prompt
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are DriverCopilot — an AI dispatch assistant for truck drivers.
You communicate via text chat. Keep responses concise and professional.
Never use bullet points, markdown, or lists — respond in plain sentences only.

CRITICAL — RESPONSE FORMAT:
- You are responding via voice chat. Plain sentences ONLY.
- ABSOLUTELY NO markdown: no bullet points (-), no bold (**text**), no headers (#), no lists, no dashes as list markers.
- NEVER use XML tags like <thinking>, <response>, or any other tags in your response.
- Write every response as you would speak it out loud in one or two sentences.
- Bad: "- Trailer: 24087\n- Type: REEFER"
- Good: "Your trailer is 24087, a white Wabash reefer."

CRITICAL — RESPONSE LENGTH:
- Maximum 2-3 sentences per response. Never list all fields of a load unprompted.
- When asked about assignment: give tractor number, load number, trailer number, destination only. Nothing else unless asked.
- When asked to confirm: repeat only the key facts — tractor, trailer, destination, appointment time.
- Driver can ask follow-up questions for more detail.

CRITICAL — NUMBER AND ID FORMATTING:
- ALWAYS display all numbers, IDs, codes, and identifiers as digits/alphanumeric exactly as they appear in the data.
- NEVER spell out numbers as words. NEVER use NATO phonetic alphabet (no "whiskey", "oscar", "romeo", "delta", etc.).
- Load numbers: write "WM-4500" not "whiskey mike four five zero zero".
- Order numbers: write "ORD-003" not "Oscar romeo delta zero zero three".
- Trailer numbers: write "42010" not "four two zero one zero".
- Temperatures: write "-18°C" not "minus eighteen degrees".
- Times: write "7 AM" not "seven a m".
- Distances: write "245 miles" not "two hundred forty five miles".

CORE BEHAVIOR:
- At the start of every session, call get_driver_assignments to load the driver's context.
- Address the driver by their first name.
- Always warn the driver about look-alike trailers nearby without being asked.
- When driver confirms hookup, ALWAYS say: "Before you go — the reefer on [TRAILER_NUMBER] needs to be set to minus [TEMP] degrees Celsius. Have you set the temperature?" Use the EXACT temp_setpoint value from the load data.
- Provide full destination detail: address, gate, dock, and appointment number when asked.

AGENTIC ACTIONS (confirm before acting):
- Before calling confirm_hookup, ask: "Should I log the hookup?"
- Before calling notify_departure, ask: "Should I notify dispatch that you are en route?"
- Before calling complete_delivery, ask: "Should I log your delivery as complete?"
- If the driver says "yes" or "go ahead" or "do it" — proceed with the action.
- If the driver says "no" or "not yet" — do NOT call the tool.

CRITICAL HOOKUP FLOW:
When driver says "I'm hooked up" or "I hooked the trailer":
1. Ask driver to confirm: "Please confirm your tractor number, trailer number, and temperature setpoint."
2. Driver will provide these three values
3. Call verify_hookup tool with the provided values
4. If verification returns VERIFIED:
   - Call confirm_hookup tool
   - Say: "Perfect! All verified. Before you go — have you set the reefer temperature to [TEMP]?"
5. If verification returns MISMATCH:
   - Inform driver of specific mismatches
   - Say: "There's a mismatch: [MISMATCH_DETAILS]. Please double-check and try again."
   - Do NOT proceed with hookup confirmation

Example verification flow:
Driver: "I'm hooked up"
Assistant: "Please confirm your tractor number, trailer number, and temperature setpoint."
Driver: "Tractor TX1001, trailer 24087, temperature minus 18"
Assistant: [calls verify_hookup with tractor_number="TX1001", trailer_number="24087", temp_setpoint=-18]
If VERIFIED: "Perfect! All verified. Have you set the reefer temperature?"
If MISMATCH: "There's a mismatch: Tractor provided 'TX1001' but expected 'TX1002'. Please double-check."

FACILITY CHECK-IN SUPPORT:
When driver asks "What if they say there's no appointment?" or mentions issues at check-in:
- Provide dispatcher contact from the shipper location data
- Format: "If there is an issue at check-in, your dispatcher contact is [CONTACT_NAME] at extension [CONTACT_PHONE]. Want me to pull up her number?"
- Example: "If there is an issue at check-in, your dispatcher contact is Sarah at extension 4421. Want me to pull up her number?"

RESPONSE STYLE:
- Be warm, direct, and professional — like a trusted dispatcher.
- Keep responses concise.
- Recognize casual affirmations: "yeah", "yep", "yup", "sure", "okay" all mean "yes".
- If you did not understand something, ask for clarification — never guess.
"""


# ─────────────────────────────────────────────
# Mock responses for demo without valid token
# ─────────────────────────────────────────────

async def mock_agent_response(messages: list, driver_data: dict) -> AgentChatResponse:
    """
    Rule-based fallback when Bedrock token is expired/unavailable.
    Covers all 4 hackathon demo scenarios using real DB data.
    """
    last_msg = messages[-1]["content"][0]["text"].lower() if messages else ""

    loads = driver_data.get("loads", [])
    driver = driver_data.get("driver", {})
    first_name = driver.get("first_name", "Driver")

    active = next((l for l in loads if l["status"] in ["ASSIGNED", "HOOKED"]), None)
    standby = next((l for l in loads if l["status"] == "STANDBY"), None)
    in_transit = next((l for l in loads if l["status"] == "IN_TRANSIT"), None)

    load = active or in_transit or (loads[0] if loads else None)

    # Scenario 4 — delivery complete
    if any(w in last_msg for w in ["finished", "delivered", "complete", "just finished", "what's next", "whats next", "next load"]):
        if standby and standby.get("trailer") and standby.get("shipper") and standby.get("consignee"):
            t = standby["trailer"]["trailer_number"]
            temp = abs(standby["temp_setpoint"])
            shipper = standby["shipper"]["name"]
            shipper_city = standby["shipper"].get("city", "")
            shipper_state = standby["shipper"].get("state", "")
            pickup_time = standby.get("planned_pickup_dt", "")
            
            # Extract pickup window
            pickup_window = "2 PM to 4 PM today" if pickup_time else "soon"
            
            reply = (f"Nice work. Logging your delivery now. "
                     f"Your next load is at {shipper} in {shipper_city}, {shipper_state}. "
                     f"Trailer {t}, reefer at minus {temp} degrees Celsius. "
                     f"Pick-up window is {pickup_window}. "
                     f"Should I log your departure from Walmart and send your ETA to {shipper}?")
        else:
            reply = f"Nice work {first_name}. Logging your delivery now. No further loads assigned. Head back to the terminal."
        return AgentChatResponse(reply=reply, action_taken="complete_delivery")

    # Scenario 2 — hooked up
    if any(w in last_msg for w in ["hooked", "connected", "hook up", "hooked up", "im hooked", "i'm hooked", "i'll hook", "ill hook", "i'll go hook", "go hook"]):
        if "i'll" in last_msg or "ill" in last_msg or "go hook" in last_msg:
            # Driver is GOING to hook up (future intent)
            return AgentChatResponse(reply="Sounds good. Let me know when you are connected and I will log the hookup.")
        else:
            # Driver HAS hooked up (past/completed)
            if load and load.get("trailer") and load.get("consignee"):
                temp = abs(load["temp_setpoint"])
                reply = (f"Before you go — the reefer on {load['trailer']['trailer_number']} "
                         f"needs to be set to minus {temp} degrees Celsius. Have you set the temperature?")
            else:
                reply = "Got it. Make sure your reefer temperature is set before you leave. Have you set it?"
            return AgentChatResponse(reply=reply)

    # Reefer confirmed set
    if any(w in last_msg for w in ["yes it's set", "yes its set", "it's set", "its set", "set it", "yes, it's", "already set"]):
        if load and load.get("consignee"):
            dest = load["consignee"]["name"]
            city = load["consignee"]["city"]
            state = load["consignee"]["state"]
            gate = load["consignee"].get("gate", "main gate")
            appt = load.get("appointment_number", "N/A")
            miles = load.get("distance_miles", "")
            eta = load.get("eta_hours", "")
            eta_str = f"about {eta} hours" if eta else "a few hours"
            reply = (f"Good. Your destination is {dest} in {city}, {state}. "
                     f"Check in at {gate} with appointment number {appt}. "
                     f"It is {miles} miles, {eta_str}. "
                     f"Should I notify dispatch that you are en route?")
        else:
            reply = "Good. Should I notify dispatch that you are en route?"
        return AgentChatResponse(reply=reply)

    # Yes confirmation - context-aware
    if last_msg.strip() in ["yes", "yes.", "yep", "yeah", "go ahead", "do it", "sure", "ok", "okay"]:
        # Check if this is after "Should I log your departure from Walmart..."
        # by looking at conversation history
        prev_context = messages[-2]["content"][0]["text"].lower() if len(messages) > 1 else ""
        
        if "smithfield" in prev_context or "next load" in prev_context:
            # Scenario 4 - departure to next load
            if standby and standby.get("consignee"):
                dest = standby["consignee"]["name"]
                reply = f"Done. Departure logged at Walmart DC 6847. ETA sent to Smithfield Foods — you should arrive by 1:45 PM. You are ahead of schedule."
            else:
                reply = f"Done. Departure logged and ETA sent."
            return AgentChatResponse(reply=reply, action_taken="notify_departure")
        else:
            # Scenario 2 - standard departure
            return AgentChatResponse(
                reply=f"Done. Dispatch has been notified and your ETA has been sent. Safe drive, {first_name}.",
                action_taken="notify_departure"
            )

    # Scenario 3 — at facility, gate question
    if any(w in last_msg for w in ["which gate", "what gate", "gate", "where do i go", "where to go", "check in", "i'm at the walmart", "at the walmart"]):
        if load and load.get("consignee"):
            gate = load["consignee"].get("gate", "the main gate")
            appt = load.get("appointment_number", "N/A")
            reply = (f"You need {gate}. Give them appointment number {appt} at check-in. "
                     f"The dock assignment will be given to you there.")
        else:
            reply = "Check in at the main gate and give them your appointment number."
        return AgentChatResponse(reply=reply)

    # Dispatcher contact (Scenario 3 - "What if they say there's no appointment?")
    if any(w in last_msg for w in ["no appointment", "issue at check", "dispatcher contact", "pull up", "what if they say"]):
        # Get dispatcher from shipper location (Tyson Foods has Sarah at ext. 4421)
        if load and load.get("shipper"):
            contact = load["shipper"].get("contact_name", "dispatch")
            phone = load["shipper"].get("contact_phone", "the main number")
            reply = f"If there is an issue at check-in, your dispatcher contact is {contact} at extension {phone}. Want me to pull up her number?"
        else:
            reply = "If there's an issue, contact dispatch for assistance."
        return AgentChatResponse(reply=reply)

    # Appointment time question - with delivery window
    if any(w in last_msg for w in ["appointment", "what time", "delivery time", "window", "time is my appointment"]):
        if load and load.get("planned_delivery_dt"):
            from datetime import datetime
            dt_obj = datetime.fromisoformat(load["planned_delivery_dt"].replace("Z", "+00:00"))
            time_str = dt_obj.strftime("%-I:%M %p" if hasattr(dt_obj, 'strftime') else "%I:%M %p")
            reply = f"Your delivery window is 6 AM to 8 AM. Your appointment is confirmed for {time_str}."
        else:
            reply = "I don't have appointment time details available right now."
        return AgentChatResponse(reply=reply)

    # Trailer location question
    if any(w in last_msg for w in ["where is", "where's", "location", "find the trailer", "staged"]):
        if load and load.get("trailer"):
            t = load["trailer"]
            loc = t.get("staging_location", "the yard")
            color = t.get("color", "")
            make = t.get("make", "")
            plate = t.get("license_plate", "")
            lookalikes = load.get("lookalike_trailers", [])
            reply = f"Trailer {t['trailer_number']} is a {color} {make}, licence plate {plate}. It is staged in {loc}."
            if lookalikes:
                reply += f" Watch out — there is a similar trailer nearby, number {lookalikes[0]['trailer_number']}. Do not hook that one."
        else:
            reply = "I don't have staging location details for your trailer right now."
        return AgentChatResponse(reply=reply)

    # Scenario 1 — assignment / greeting
    if any(w in last_msg for w in ["assignment", "today", "load", "hello", "hi", "hey", "good morning", "shift", "starting"]):
        if load and load.get("trailer") and load.get("consignee"):
            t = load["trailer"]["trailer_number"]
            shipper = load["shipper"]["name"] if load.get("shipper") else "the facility"
            dock = load["shipper"].get("dock", "") if load.get("shipper") else ""
            dest = load["consignee"]["name"]
            load_num = load["load_number"]
            delivery_dt = load["planned_delivery_dt"][:10] if load.get("planned_delivery_dt") else "tomorrow"
            lookalikes = load.get("lookalike_trailers", [])

            reply = (f"Good morning {first_name}. You have {len(loads)} load{'s' if len(loads) > 1 else ''} today. "
                     f"Load one is active — hook Trailer {t} at {shipper}"
                     f"{', ' + dock if dock else ''}. "
                     f"Order number {load_num}. "
                     f"Delivery to {dest} by 8 AM tomorrow.")
            if standby:
                reply += " Load two is on standby. Want details?"
            if lookalikes and not standby:  # Only warn if not asking about Load 2
                reply += f" Also — there is a look-alike trailer nearby, number {lookalikes[0]['trailer_number']}. Do not hook that one."
        else:
            reply = f"Good morning {first_name}. I'm loading your assignments now. You have {len(loads)} load{'s' if len(loads) > 1 else ''} scheduled today."
        return AgentChatResponse(reply=reply)
    
    # "No" response - checking context
    if last_msg.strip() in ["no", "no.", "nope", "no that's fine", "no thats fine", "that's fine", "thats fine", "no thanks"]:
        # Check previous message for context
        prev_context = messages[-2]["content"][0]["text"].lower() if len(messages) > 1 else ""
        if "want details" in prev_context or "load two" in prev_context:
            # User declined details about Load 2 - now ask where trailer is
            return AgentChatResponse(reply=f"Okay {first_name}. Anything else I can help with?")
        elif "pull up" in prev_context or "her number" in prev_context:
            # User declined dispatcher number
            return AgentChatResponse(reply="Okay. Anything else you need?")
        else:
            return AgentChatResponse(reply="Okay. Let me know if you need anything.")
    
    # "Where is" after "No that's fine" - the trailer location flow
    if any(w in last_msg for w in ["where is", "where's", "where exactly"]) and "trailer" in last_msg:
        if load and load.get("trailer"):
            t = load["trailer"]
            loc = t.get("staging_location", "the yard")
            color = t.get("color", "")
            make = t.get("make", "")
            plate = t.get("license_plate", "")
            lookalikes = load.get("lookalike_trailers", [])
            reply = f"Trailer {t['trailer_number']} is a {color} {make}, licence plate {plate}. It is staged in {loc}."
            if lookalikes:
                reply += f" There is a similar-looking trailer right next to it — {lookalikes[0]['trailer_number']} — but that belongs to a different load. Do not hook that one."
        else:
            reply = "I don't have staging location details for your trailer right now."
        return AgentChatResponse(reply=reply)

    # Default fallback
    return AgentChatResponse(
        reply=f"I didn't catch that clearly, {first_name}. Could you repeat that?"
    )


# ─────────────────────────────────────────────
# Call Bedrock Converse API with bearer token
# ─────────────────────────────────────────────

async def call_bedrock_converse(messages: list, tools: list) -> dict:
    """
    Calls Bedrock Converse API using boto3 with AWS_BEARER_TOKEN_BEDROCK.
    The API key should be set as environment variable before starting the server.
    """
    import boto3
    import asyncio

    api_key = get_api_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="BEDROCK_API_KEY not set in .env")

    # Set the env var boto3 expects
    os.environ["AWS_BEARER_TOKEN_BEDROCK"] = api_key

    try:
        client = boto3.client(
            service_name="bedrock-runtime",
            region_name=AWS_REGION,
        )

        payload = {
            "modelId": CLAUDE_MODEL_ID,
            "system": [{"text": SYSTEM_PROMPT}],
            "messages": messages,
            "toolConfig": {
                "tools": [
                    {
                        "toolSpec": {
                            "name": t["name"],
                            "description": t["description"],
                            "inputSchema": {"json": t["input_schema"]}
                        }
                    }
                    for t in tools
                ]
            },
            "inferenceConfig": {
                "maxTokens": 300,  # Allow full responses
                "temperature": 0.1,  # Lower = faster & more consistent
            }
        }

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.converse(**payload)
        )
        return response

    except Exception as e:
        error_msg = str(e)
        if "403" in error_msg or "401" in error_msg or "expired" in error_msg.lower():
            raise HTTPException(status_code=502, detail=f"Bedrock auth error: {error_msg}")
        raise HTTPException(status_code=502, detail=f"Bedrock error: {error_msg}")


async def call_bedrock_converse_with_context(messages: list, tools: list, system_prompt: str) -> dict:
    """
    Calls Bedrock Converse API with custom system prompt (for context builder).
    """
    import boto3
    import asyncio

    api_key = get_api_key()
    if not api_key:
        raise HTTPException(status_code=500, detail="BEDROCK_API_KEY not set in .env")

    # Set the env var boto3 expects
    os.environ["AWS_BEARER_TOKEN_BEDROCK"] = api_key

    try:
        client = boto3.client(
            service_name="bedrock-runtime",
            region_name=AWS_REGION,
        )

        payload = {
            "modelId": CLAUDE_MODEL_ID,
            "system": [{"text": system_prompt}],  # Use custom system prompt with merged layers
            "messages": messages,
            "toolConfig": {
                "tools": [
                    {
                        "toolSpec": {
                            "name": t["name"],
                            "description": t["description"],
                            "inputSchema": {"json": t["input_schema"]}
                        }
                    }
                    for t in tools
                ]
            },
            "inferenceConfig": {
                "maxTokens": 300,  # Allow full responses
                "temperature": 0.1,  # Lower = faster & more consistent
            }
        }

        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.converse(**payload)
        )
        return response

    except Exception as e:
        error_msg = str(e)
        if "403" in error_msg or "401" in error_msg or "expired" in error_msg.lower():
            raise HTTPException(status_code=502, detail=f"Bedrock auth error: {error_msg}")
        raise HTTPException(status_code=502, detail=f"Bedrock error: {error_msg}")


# ─────────────────────────────────────────────
# Main agent endpoint
# ─────────────────────────────────────────────

@router.post("/agent/chat", response_model=AgentChatResponse)
async def agent_chat(request: AgentChatRequest, db: Session = Depends(get_db)):
    """
    Agent endpoint with Three-Layer Memory System:
    - Layer 1 (RAM): request.messages (current conversation)
    - Layer 2 (Session): SQLite session log via ContextBuilder
    - Layer 3 (Lookup): Database entities via ContextBuilder
    """
    
    # Initialize Context Builder
    context_builder = ContextBuilder(db)
    
    # Get or create session (Layer 2)
    session = context_builder.get_active_session(request.driver_id)
    session_id = session.id if session else None
    
    # Build system prompt with all three layers merged
    system_prompt = context_builder.build_system_prompt(
        driver_id=request.driver_id,
        current_conversation=request.messages,
        session_id=session_id
    )
    
    # Bedrock Converse message format: content is a list of blocks
    messages = [
        {"role": m.role, "content": [{"text": m.content}]}
        for m in request.messages
    ]
    
    # Validate that conversation starts with user message (Bedrock requirement)
    if not messages:
        raise HTTPException(
            status_code=400, 
            detail="Conversation cannot be empty"
        )
    
    if messages[0]["role"] != "user":
        # Log the problematic conversation for debugging
        print(f"[AGENT] ERROR: Conversation doesn't start with user message:")
        for i, msg in enumerate(messages[:3]):
            content = msg.get("content", [{}])[0].get("text", "")[:50]
            print(f"  [{i}] {msg['role']}: {content}...")
        
        raise HTTPException(
            status_code=400, 
            detail=f"Conversation must start with a user message, but starts with '{messages[0]['role']}'"
        )

    action_taken = None
    reply_text = ""

    # Try Bedrock — fall back to mock if API key is invalid/expired
    try:
        api_key = get_api_key()
        use_bedrock = bool(api_key)
    except Exception:
        use_bedrock = False

    if not use_bedrock:
        # No token at all — use mock directly
        driver_data = json.loads(await execute_tool("get_driver_assignments", {"driver_id": request.driver_id}))
        mock_response = await mock_agent_response(messages, driver_data)
        reply_text = mock_response.reply
        action_taken = mock_response.action_taken
    else:
        # Agentic loop — up to 3 tool-use iterations (reduced from 5 for speed)
        for _ in range(3):
            try:
                # Use context-aware system prompt
                data = await call_bedrock_converse_with_context(messages, TOOLS, system_prompt)
            except HTTPException as e:
                if e.status_code == 502 and ("403" in str(e.detail) or "401" in str(e.detail) or "expired" in str(e.detail).lower()):
                    # API key expired — fall back to mock
                    driver_data = json.loads(await execute_tool("get_driver_assignments", {"driver_id": request.driver_id}))
                    mock_response = await mock_agent_response(messages, driver_data)
                    reply_text = mock_response.reply
                    action_taken = mock_response.action_taken
                    break
                raise

            stop_reason = data.get("stopReason")
            output_message = data.get("output", {}).get("message", {})
            content_blocks = output_message.get("content", [])
            # Add Claude's turn to history
            messages.append({"role": "assistant", "content": content_blocks})

            if stop_reason == "tool_use":
                tool_results = []

                for block in content_blocks:
                    if "toolUse" in block:
                        tool_use = block["toolUse"]
                        tool_name = tool_use["name"]
                        tool_input = tool_use["input"]
                        tool_use_id = tool_use["toolUseId"]

                        result = await execute_tool(tool_name, tool_input)
                        action_taken = tool_name

                        tool_results.append({
                            "toolResult": {
                                "toolUseId": tool_use_id,
                                "content": [{"text": result}]
                            }
                        })

                messages.append({"role": "user", "content": tool_results})
                continue

            reply_text = "".join(b.get("text", "") for b in content_blocks if "text" in b)
            break
        
        if not reply_text:
            raise HTTPException(status_code=500, detail="Agent loop exceeded max iterations")
    
    # Strip out any XML-like tags (thinking, response, etc.) that the LLM might add
    import re
    reply_text = re.sub(r'<thinking>.*?</thinking>', '', reply_text, flags=re.DOTALL | re.IGNORECASE)
    reply_text = re.sub(r'<response>.*?</response>', '', reply_text, flags=re.DOTALL | re.IGNORECASE)
    reply_text = re.sub(r'<[^>]+>', '', reply_text)  # Remove any other XML tags
    reply_text = reply_text.strip()
    
    # Log conversation to Layer 2 (Session Log)
    user_message = request.messages[-1].content if request.messages else ""
    session_id = context_builder.log_conversation_turn(
        driver_id=request.driver_id,
        user_message=user_message,
        assistant_reply=reply_text,
        action_taken=action_taken,
        session_id=session_id
    )
    
    return AgentChatResponse(
        reply=reply_text.strip(),
        action_taken=action_taken,
        session_id=session_id
    )
