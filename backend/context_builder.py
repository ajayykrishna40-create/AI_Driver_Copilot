# Context Builder - Three-Layer Memory System
# Merges conversation history, session logs, and database context into system prompt

from datetime import datetime
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from models import Driver, Load, SessionLog, Trailer, Location


class ContextBuilder:
    """
    Builds the complete context for Claude by merging three memory layers:

    Layer 1 (RAM): Current conversation array - zero latency
    Layer 2 (Session): SQLite event log - read at shift start, written after each turn
    Layer 3 (Lookup): Database entities - drivers, orders, trailers, locations
    """

    def __init__(self, db: Session):
        self.db = db

    def build_system_prompt(
        self,
        driver_id: str,
        current_conversation: List[Dict],
        session_id: Optional[int] = None,
    ) -> str:
        driver_context = self._build_driver_context(driver_id)
        loads_context = self._build_loads_context(driver_id)
        session_context = self._build_session_context(session_id)

        system_prompt = f"""You are DriverCopilot — an AI voice assistant for truck drivers.
You communicate via voice chat in a natural, conversational style.

CRITICAL — RESPONSE FORMAT:
- Plain spoken sentences ONLY. No markdown, no bullet points, no lists, no XML tags.
- NEVER use symbols like (-), (**), (#), or formatting.
- Write exactly as you would speak out loud naturally.
- Bad: "- Trailer: 24087\n- Type: REEFER"
- Good: "Trailer 24087 is a white Wabash reefer, license plate AR-4821. It is staged in the east lot, second row."

CRITICAL — RESPONSE STYLE AND LENGTH:
- Respond in complete, natural sentences like a professional dispatcher would speak.
- When asked about assignments, provide full context: tractor number, load number, trailer details, pickup/delivery locations, appointment times, and distances.
- When providing trailer location, always include: color, make, license plate, staging location, AND warn about similar trailers nearby.
- When confirming hookup or departure, include relevant trip details: destination, gate, appointment number, distance, and ETA.
- Be conversational but informative. Think "helpful dispatcher on the radio" not "brief text message."
- Always greet the driver warmly at session start using their first name.

CRITICAL — NUMBER AND ID FORMATTING:
- Display all numbers, IDs, codes exactly as they appear. Never spell them out.
- Load numbers: "WM-4500" or "TF-8821" (not "whiskey mike four five zero zero")
- Trailer numbers: "24087" or "42010" (not "two four zero eight seven")
- Temperatures: "minus 18 degrees Celsius" or "minus 4 degrees Celsius" (spell out for clarity)
- Times: "8 AM" or "6:30 AM" (not "eight a m")
- Distances: "528 miles" (not "five hundred twenty eight miles")
- License plates: "AR-4821" (as written)

⚠️ CRITICAL — ASSIGNMENT QUERY:
When driver asks "what's my assignment" or "what do I need to do":
1. Greet warmly: "Good morning [NAME]" or "Hey [NAME]"
2. State number of loads: "You have [N] load(s) today"
3. For active load: "Load one is active — you are driving tractor [TRACTOR]. Hook Trailer [NUM] at [SHIPPER], Dock [NUM]. Order number [ORDER]. Delivery to [CONSIGNEE] by [TIME]."
4. If multiple loads: "Load two is on standby. Want details?"
5. Be ready for follow-up questions about trailer location, delivery details, etc.

Example: "Good morning Mike. You have two loads today. Load one is active — you are driving tractor TX1002. Hook Trailer 24087 at Tyson Foods, Dock 4. Order number TF-8821. Delivery to Walmart DC 6847 by 8 AM tomorrow. Load two is on standby. Want details?"

⚠️ CRITICAL — TRAILER LOCATION:
When driver asks "where is the trailer":
- Full description: "Trailer [NUM] is a [COLOR] [MAKE], license plate [PLATE]. It is staged in [LOCATION]."
- ALWAYS warn about similar trailers: "There is a similar-looking trailer right next to it — [NUM] — but that belongs to a different load. Do not hook that one."

⚠️⚠️⚠️ CRITICAL HOOKUP FLOW - FOLLOW THIS EXACT SEQUENCE ⚠️⚠️⚠️

THIS IS THE MOST IMPORTANT BEHAVIOR. DO NOT DEVIATE FROM THIS FLOW.

═══ STEP 1: DRIVER SAYS "I'LL HOOK UP" ═══
Triggers: "I'll hook up", "I will hook up", "I'll go hook up", "going to hook up"

✅ YOU MUST DO THIS:
Say: "Before you hook up — make sure to set the reefer on trailer [TRAILER_NUMBER] to [TEMP] degrees Celsius. Let me know when you are hooked up."

❌ DO NOT:
- Ask for tractor number
- Ask for trailer number  
- Provide trip details
- Call any tools

═══ STEP 2: DRIVER SAYS "I'M HOOKED UP" ═══
Triggers: "I'm hooked up", "I am hooked up", "hooked up", "I hooked up"

✅ YOU MUST DO THIS:
Say EXACTLY: "Please confirm your tractor number and trailer number."

❌ DO NOT:
- Ask about temperature
- Provide trip details
- Call any tools yet
- Say anything else

═══ STEP 3: DRIVER PROVIDES NUMBERS ═══
Example: "TX1002 and 42010" or "TX1002, 42010" or "tractor TX1002 trailer 42010"

✅ YOU MUST DO THIS:
1. Extract tractor_number and trailer_number from their message
2. Call verify_hookup tool with these parameters
3. Wait for result
4. IF VERIFIED: Say "Perfect. Your destination is [CONSIGNEE] in [CITY], [STATE]. Check in at Gate [GATE] with appointment number [APPT]. It is [MILES] miles, about [HOURS] hours [MINS] minutes. You need to arrive by [TIME]. Should I notify dispatch that you are en route?"
5. IF MISMATCH: Say "There's a mismatch. [EXPLAIN ERROR]. Please double-check and verify again."

❌ DO NOT:
- Skip calling verify_hookup
- Provide trip details before verification
- Proceed without verification result

═══ STEP 4: DRIVER SAYS "YES" ═══
Triggers: "yes", "yeah", "yep", "go ahead", "sure", "okay"

✅ YOU MUST DO THIS:
1. Call notify_departure tool
2. Say: "Done. Dispatch has been notified and your ETA of [TIME] has been sent. Safe drive, [NAME]."

REMEMBER: Follow steps 1→2→3→4 in EXACT order. Never skip or combine steps.

⚠️ CRITICAL — FACILITY CHECK-IN:
When driver asks about gates, docks, or appointments:
- Provide specific info: "You need Gate [GATE]. Give them appointment number [APPT] at check-in."
- If they ask about problems: "If there is an issue at check-in, your dispatcher contact is [NAME] at extension [EXT]. Want me to pull up her number?"
- Appointment time: "Your delivery window is [START] to [END]. Your appointment is confirmed for [TIME]."

⚠️ CRITICAL — DELIVERY COMPLETE:
When driver says "I finished the delivery" or "delivery is done":
1. Acknowledge: "Nice work. Logging your delivery now."
2. Provide next load: "Your next load is at [SHIPPER] in [CITY], [STATE]. Trailer [NUM], reefer at [TEMP] degrees Celsius. Pick-up window is [TIME] to [TIME] today."
3. Ask: "Should I log your departure from [CURRENT] and send your ETA to [NEXT]?"
4. When confirmed: "Done. Departure logged at [CURRENT]. ETA sent to [NEXT] — you should arrive by [TIME]. You are ahead of schedule." (or "on time" or relevant status)

AGENTIC ACTIONS:
- Call get_driver_assignments at session start to load context
- Before tool calls, ask driver for confirmation using natural language
- Recognize casual affirmations: "yeah", "yep", "yup", "sure", "okay", "go ahead", "do it" all mean "yes"
- If driver says "no" or "not yet", do not proceed with action

RESPONSE TONE:
- Warm, professional, helpful — like a trusted dispatcher
- Use contractions naturally: "you're", "it's", "that's"
- Sound human and conversational, not robotic
- Address driver by first name throughout conversation

===== DRIVER CONTEXT (Layer 3 - Database) =====
{driver_context}

===== CURRENT ASSIGNMENTS (Layer 3 - Database) =====
{loads_context}

===== SESSION HISTORY (Layer 2 - Previous Conversations) =====
{session_context if session_context else 'This is a new session. No previous history.'}

===== CURRENT CONVERSATION (Layer 1 - RAM) =====
The current conversation is maintained in the messages array below this prompt.
"""
        return system_prompt

    def _build_driver_context(self, driver_id: str) -> str:
        driver = self.db.query(Driver).filter(Driver.driver_id == driver_id).first()
        if not driver:
            return f"Driver ID: {driver_id} (details not found)"

        return f"""Driver: {driver.first_name} {driver.last_name}
Driver ID: {driver.driver_id}
Status: {driver.status}
Phone: {driver.phone}
Email: {driver.email}
"""

    def _build_loads_context(self, driver_id: str) -> str:
        loads = self.db.query(Load).filter(
            Load.driver_id == driver_id,
            Load.status.in_(["ASSIGNED", "HOOKED", "IN_TRANSIT", "STANDBY"]),
        ).all()

        if not loads:
            return "No active assignments."

        context_parts = []
        for i, load in enumerate(loads, 1):
            trailer = load.trailer
            shipper = load.shipper
            consignee = load.consignee
            tractor = load.tractor

            # Format delivery datetime for natural speech
            delivery_str = 'N/A'
            if load.planned_delivery_dt:
                # Convert to natural format: "June 9th at 4 PM" instead of "2026-06-09 16:00"
                # Windows uses %#d and %#I (not %-d, %-I which are Unix)
                import platform
                if platform.system() == 'Windows':
                    day_fmt = '%#d'
                    hour_fmt = '%#I'
                else:
                    day_fmt = '%-d'
                    hour_fmt = '%-I'
                
                day = load.planned_delivery_dt.day
                # Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
                if 10 <= day % 100 <= 20:
                    suffix = 'th'
                else:
                    suffix = {1: 'st', 2: 'nd', 3: 'rd'}.get(day % 10, 'th')
                
                # Format: "June 9th at 4:00 PM"
                month = load.planned_delivery_dt.strftime('%B')
                hour = load.planned_delivery_dt.strftime(hour_fmt)
                minute = load.planned_delivery_dt.strftime('%M')
                period = load.planned_delivery_dt.strftime('%p')
                
                # Only include minutes if not :00
                if minute == '00':
                    delivery_str = f"{month} {day}{suffix} at {hour} {period}"
                else:
                    delivery_str = f"{month} {day}{suffix} at {hour}:{minute} {period}"
            
            # Format pickup time if available
            pickup_str = 'N/A'
            if load.planned_pickup_dt:
                import platform
                if platform.system() == 'Windows':
                    hour_fmt = '%#I'
                else:
                    hour_fmt = '%-I'
                
                hour = load.planned_pickup_dt.strftime(hour_fmt)
                minute = load.planned_pickup_dt.strftime('%M')
                period = load.planned_pickup_dt.strftime('%p')
                
                if minute == '00':
                    pickup_str = f"{hour} {period}"
                else:
                    pickup_str = f"{hour}:{minute} {period}"
            
            # Find similar-looking trailers nearby (same type, color, staging location)
            similar_trailers = []
            if trailer:
                similar = self.db.query(Trailer).filter(
                    Trailer.trailer_id != trailer.trailer_id,
                    Trailer.type == trailer.type,
                    Trailer.color == trailer.color,
                    Trailer.staging_location == trailer.staging_location
                ).limit(3).all()
                similar_trailers = [t.trailer_number for t in similar]
            
            # Natural language format matching the scenarios
            load_info = f"LOAD {i} (Status: {load.status.upper()}):\n"
            load_info += f"  Order: {load.load_number}\n"
            
            if tractor:
                load_info += f"  Tractor: {tractor.tractor_number}\n"
            
            if trailer:
                load_info += f"  Trailer: {trailer.trailer_number}"
                trailer_details = []
                if trailer.color:
                    trailer_details.append(trailer.color)
                if trailer.make:
                    trailer_details.append(trailer.make)
                if trailer.type:
                    trailer_details.append(trailer.type.lower())
                if trailer_details:
                    load_info += f" ({' '.join(trailer_details)})"
                if trailer.license_plate:
                    load_info += f", plate {trailer.license_plate}"
                load_info += "\n"
                
                if trailer.staging_location:
                    load_info += f"  Trailer Location: {trailer.staging_location}\n"
                
                # Add warning about similar trailers
                if similar_trailers:
                    load_info += f"  ⚠️ SIMILAR TRAILERS NEARBY: {', '.join(similar_trailers)} (DO NOT hook these!)\n"
            
            # Temperature for reefer
            if load.temp_setpoint is not None:
                temp_val = load.temp_setpoint
                if temp_val < 0:
                    load_info += f"  Reefer Temp: minus {abs(temp_val):.0f} degrees Celsius\n"
                else:
                    load_info += f"  Reefer Temp: {temp_val:.0f} degrees Celsius\n"
            
            # Pickup location
            if shipper:
                load_info += f"  Pickup: {shipper.name}"
                if shipper.city and shipper.state:
                    load_info += f", {shipper.city}, {shipper.state}"
                if shipper.dock:
                    load_info += f", Dock {shipper.dock}"
                load_info += "\n"
                
                if pickup_str != 'N/A':
                    load_info += f"  Pickup Window: {pickup_str}\n"
                
                # Dispatcher contact
                if shipper.contact_name or shipper.contact_phone:
                    contact_name = shipper.contact_name if shipper.contact_name else 'N/A'
                    contact_phone = shipper.contact_phone if shipper.contact_phone else 'N/A'
                    load_info += f"  Dispatcher Contact: {contact_name}, ext. {contact_phone}\n"
            
            # Delivery location
            if consignee:
                load_info += f"  Delivery: {consignee.name}"
                if consignee.city and consignee.state:
                    load_info += f", {consignee.city}, {consignee.state}"
                if consignee.gate:
                    load_info += f", Gate {consignee.gate}"
                if consignee.dock:
                    load_info += f", Dock {consignee.dock}"
                load_info += "\n"
            
            # Appointment details
            if load.appointment_number:
                load_info += f"  Appointment: {load.appointment_number}\n"
            
            if delivery_str != 'N/A':
                load_info += f"  Delivery Time: {delivery_str}\n"
            
            # Distance and ETA
            if load.distance_miles and load.eta_hours:
                hours = int(load.eta_hours)
                minutes = int((load.eta_hours - hours) * 60)
                if minutes > 0:
                    load_info += f"  Distance: {load.distance_miles:.0f} miles, ETA: {hours} hours {minutes} minutes\n"
                else:
                    load_info += f"  Distance: {load.distance_miles:.0f} miles, ETA: {hours} hours\n"
            
            context_parts.append(load_info)

        return "\n".join(context_parts)

    def _build_session_context(self, session_id: Optional[int]) -> str:
        if not session_id:
            return ""

        session = self.db.query(SessionLog).filter(SessionLog.id == session_id).first()
        if not session or not session.events:
            return ""

        events = session.events if isinstance(session.events, list) else []
        context = f"Previous session started: {session.session_start.strftime('%Y-%m-%d %H:%M')}\n"
        context += f"Total interactions: {session.total_interactions}\n"

        if session.actions_taken:
            actions = session.actions_taken if isinstance(session.actions_taken, list) else []
            context += f"Actions taken: {', '.join(actions)}\n"

        context += "\nKey events:\n"
        recent_events = events[-5:] if len(events) > 5 else events
        for event in recent_events:
            timestamp = event.get('timestamp', '')
            role = event.get('role', '')
            content = event.get('content', '')[:120]
            action = event.get('action', '')

            if action:
                context += f"  [{timestamp}] {role}: {content} → ACTION: {action}\n"
            else:
                context += f"  [{timestamp}] {role}: {content}\n"

        return context

    def get_active_session(self, driver_id: str) -> Optional[SessionLog]:
        return self.db.query(SessionLog).filter(
            SessionLog.driver_id == driver_id,
            SessionLog.session_end == None,
        ).order_by(SessionLog.session_start.desc()).first()

    def end_session(self, session_id: int) -> None:
        session = self.db.query(SessionLog).filter(SessionLog.id == session_id).first()
        if not session:
            return
        session.session_end = datetime.utcnow()
        self.db.add(session)
        self.db.commit()

    def log_conversation_turn(
        self,
        driver_id: str,
        user_message: str,
        assistant_reply: str,
        action_taken: Optional[str] = None,
        session_id: Optional[int] = None,
    ) -> Optional[int]:
        session = None
        if session_id:
            session = self.db.query(SessionLog).filter(SessionLog.id == session_id).first()

        if not session:
            session = SessionLog(
                driver_id=driver_id,
                events=[],
                total_interactions=0,
                actions_taken=[],
                session_start=datetime.utcnow(),
            )
            self.db.add(session)
            self.db.commit()
            self.db.refresh(session)

        user_event = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "role": "user",
            "content": user_message,
            "action": None,
        }
        
        assistant_event = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "role": "assistant",
            "content": assistant_reply,
            "action": action_taken,
        }
        
        # Get current events list
        events = session.events if isinstance(session.events, list) else []
        events.append(user_event)
        events.append(assistant_event)
        
        # Reassign to trigger SQLAlchemy change detection
        session.events = events

        session.total_interactions += 1
        if action_taken:
            actions = session.actions_taken if isinstance(session.actions_taken, list) else []
            actions.append(action_taken)
            session.actions_taken = actions

        session.session_end = datetime.utcnow()
        
        # Mark the JSON column as modified to ensure SQLAlchemy saves it
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(session, "events")
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)

        return session.id
