"""
DriverCopilot Voice Pipeline
WebSocket: Audio in → Deepgram Nova-3 STT → Nova-micro LLM → ElevenLabs Flash TTS → Audio out

STACK (all cloud, zero model loading):
  STT : Deepgram Nova-3       (~150ms)
  LLM : amazon.nova-micro     (~688ms)
  TTS : ElevenLabs Flash v2.5 (~300ms)
  Total: ~1150ms
"""

import os
import io
import json
import time
import asyncio
import warnings
import httpx
from dotenv import load_dotenv
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from database import SessionLocal
from context_builder import ContextBuilder
from models import SessionLog

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)

load_dotenv()

router = APIRouter()

BACKEND_BASE        = "http://localhost:8001"
DEEPGRAM_API_KEY    = os.getenv("DEEPGRAM_API_KEY", "")
ELEVENLABS_API_KEY  = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel


# ─────────────────────────────────────────────
# STT — Deepgram Nova-3 (cloud, ~150ms)
# ─────────────────────────────────────────────

async def transcribe_audio(audio_bytes: bytes) -> str:
    """
    Transcribes WebM audio using Deepgram Nova-3.
    Returns transcript string or empty string on failure.
    """
    if not DEEPGRAM_API_KEY:
        raise RuntimeError("DEEPGRAM_API_KEY not set")

    keyterms = [
        "24087", "24085", "31042", "42010", "51020",
        "TF-8821", "SF-3101", "WM-4500", "WM-2291", "SF-7712",
        "reefer", "hookup", "dispatch"
    ]

    params = {
        "model": "nova-3",
        "language": "en-US",
        "smart_format": "true",
        "numerals": "true",
        "punctuate": "true",
        "keyterm": keyterms,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(
            "https://api.deepgram.com/v1/listen",
            headers={
                "Authorization": f"Token {DEEPGRAM_API_KEY}",
                "Content-Type": "audio/webm",
            },
            params=params,
            content=audio_bytes,
        )

    if resp.status_code != 200:
        raise RuntimeError(f"Deepgram error {resp.status_code}: {resp.text[:200]}")

    data = resp.json()
    try:
        transcript = data["results"]["channels"][0]["alternatives"][0]["transcript"]
        return transcript.strip()
    except (KeyError, IndexError):
        return ""


# ─────────────────────────────────────────────
# TTS pre-processor
# Converts IDs and numbers into TTS-friendly spoken form
# ─────────────────────────────────────────────

DIGIT_WORDS = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'
}

def _prepare_text_for_tts(text: str) -> str:
    import re

    text = re.sub(r'-(\d+)\s*°C', lambda m: f"minus {m.group(1)} degrees Celsius", text)
    text = re.sub(r'(\d+)\s*°C', r'\1 degrees Celsius', text)

    def spell_alphanum_id(m):
        parts = []
        for ch in m.group(0):
            if ch == '-':
                continue
            elif ch.isdigit():
                parts.append(DIGIT_WORDS[ch])
            else:
                parts.append(ch.upper())
        return ' '.join(parts)

    text = re.sub(r'\b[A-Z]{1,4}-\d{2,6}\b', spell_alphanum_id, text)

    def spell_digits(m):
        return ' '.join(DIGIT_WORDS[ch] for ch in m.group(0))

    text = re.sub(r'(?<!\d)(\d{4,6})(?!\d)', spell_digits, text)
    return text


# ─────────────────────────────────────────────
# TTS — ElevenLabs Flash v2.5 (cloud, ~300ms)
# ─────────────────────────────────────────────

async def synthesize_speech_streaming(text: str, websocket):
    """
    Single-call TTS using ElevenLabs Flash v2.5.
    Sends the full response as one MP3 for natural, uninterrupted speech.
    Falls back to Google TTS if ElevenLabs fails.
    """
    tts_text = _prepare_text_for_tts(text)
    audio_bytes = await _elevenlabs_tts(tts_text)

    if audio_bytes:
        # Send as a single WebSocket message — avoids partial MP3 frame issues
        await websocket.send_bytes(audio_bytes)
        print(f"[TTS] Sent {len(audio_bytes)} bytes in one frame")
    else:
        print("[TTS] No audio generated")

    await websocket.send_text(json.dumps({"type": "audio_end"}))


async def _elevenlabs_tts(text: str) -> bytes:
    """Google Translate TTS — free, no credentials, ~400ms."""
    return await _google_tts_fallback(text)


async def _google_tts_fallback(text: str) -> bytes:
    """Google Translate TTS — splits at sentence boundaries to handle long text."""
    import urllib.parse, re

    # Split at sentence boundaries to stay under Google's 200-char limit
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if s.strip()]

    parts = []
    async with httpx.AsyncClient(timeout=15.0) as client:
        for sentence in sentences:
            # Further split if sentence still too long
            chunks = [sentence[i:i+180] for i in range(0, len(sentence), 180)]
            for chunk in chunks:
                encoded = urllib.parse.quote(chunk)
                url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded}&tl=en&client=tw-ob"
                try:
                    resp = await client.get(url, headers={"User-Agent": "Mozilla/5.0"})
                    if resp.status_code == 200:
                        parts.append(resp.content)
                except Exception as e:
                    print(f"[TTS] Google chunk error: {e}")
    return b"".join(parts)


# ─────────────────────────────────────────────
# Agent call
# ─────────────────────────────────────────────

async def call_agent(driver_id: str, conversation: list, session_id: int = None) -> dict:
    # Only send last 6 messages to keep context short and LLM fast
    trimmed = conversation[-6:] if len(conversation) > 6 else conversation
    
    # Ensure conversation starts with user message (Bedrock requirement)
    # If first message is assistant, include one more message before it
    if trimmed and trimmed[0].get("role") == "assistant":
        # Go back one more message to get the user message
        start_idx = max(0, len(conversation) - 7)
        trimmed = conversation[start_idx:]
        # If still starts with assistant (shouldn't happen), remove it
        if trimmed and trimmed[0].get("role") == "assistant":
            trimmed = trimmed[1:]
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        payload = {"driver_id": driver_id, "messages": trimmed}
        if session_id:
            payload["session_id"] = session_id

        resp = await client.post(f"{BACKEND_BASE}/agent/chat", json=payload)
        text = resp.text

        if resp.status_code != 200:
            raise RuntimeError(f"Agent endpoint returned {resp.status_code}: {text[:200]}")

        try:
            return resp.json()
        except ValueError:
            raise RuntimeError(f"Agent endpoint returned invalid JSON: {text[:200]}")


# ─────────────────────────────────────────────
# WebSocket endpoint
# ─────────────────────────────────────────────

@router.websocket("/ws/voice/{driver_id}")
async def voice_websocket(websocket: WebSocket, driver_id: str):
    """
    Full voice pipeline over a single WebSocket connection.

    Client → Server:
      binary frames : raw audio chunks (WebM from MediaRecorder)
      "END_AUDIO"   : triggers STT → Agent → TTS pipeline
      "INIT"        : ping on connect

    Server → Client:
      {"type":"ready"}              : connected
      {"type":"transcribing"}       : STT running
      {"type":"transcript","text"}  : what was heard
      {"type":"thinking"}           : agent processing
      {"type":"reply","text"}       : agent text response
      {"type":"action","action"}    : agentic action taken
      {"type":"session","session_id"}: session tracking
      {"type":"synthesizing"}       : TTS running
      binary frames                 : MP3 audio chunks
      {"type":"audio_end"}          : all audio sent
      {"type":"error","message"}    : error
    """
    await websocket.accept()

    conversation = []
    audio_buffer  = []
    session_id    = None
    system_prompt_cache = None  # built once per session, reused each turn

    try:
        while True:
            message = await websocket.receive()

            if "bytes" in message and message["bytes"]:
                audio_buffer.append(message["bytes"])

            elif "text" in message:
                ctrl = message["text"]

                if ctrl in ("INIT", '{"type":"init"}'):
                    await websocket.send_text(json.dumps({"type": "ready"}))
                    continue

                if ctrl == "END_AUDIO":
                    if not audio_buffer:
                        await websocket.send_text(json.dumps({
                            "type": "error", "message": "No audio received"
                        }))
                        continue

                    audio_bytes  = b"".join(audio_buffer)
                    audio_buffer = []

                    # ── Step 1: Deepgram STT ──
                    await websocket.send_text(json.dumps({"type": "transcribing"}))
                    t_stt = time.time()
                    try:
                        transcript = await transcribe_audio(audio_bytes)
                        print(f"[PERF] STT: {(time.time()-t_stt)*1000:.0f}ms — '{transcript}'")
                    except Exception as e:
                        print(f"[VOICE] STT error: {e}")
                        await websocket.send_text(json.dumps({
                            "type": "error", "message": f"Could not transcribe audio: {str(e)}"
                        }))
                        continue

                    if not transcript:
                        await websocket.send_text(json.dumps({
                            "type": "error", "message": "Could not understand that. Please try again."
                        }))
                        continue

                    await websocket.send_text(json.dumps({"type": "transcript", "text": transcript}))

                    # ── Step 2: LLM Agent ──
                    await websocket.send_text(json.dumps({"type": "thinking"}))
                    conversation.append({"role": "user", "content": transcript})

                    t_llm = time.time()
                    try:
                        result = await call_agent(driver_id, conversation, session_id)
                    except Exception as e:
                        await websocket.send_text(json.dumps({
                            "type": "error", "message": f"Agent error: {str(e)}"
                        }))
                        continue
                    print(f"[PERF] LLM: {(time.time()-t_llm)*1000:.0f}ms")

                    reply_text   = result.get("reply", "")
                    action_taken = result.get("action_taken")
                    session_id   = result.get("session_id")

                    if not reply_text:
                        continue

                    conversation.append({"role": "assistant", "content": reply_text})

                    await websocket.send_text(json.dumps({"type": "reply", "text": reply_text}))

                    if session_id:
                        await websocket.send_text(json.dumps({"type": "session", "session_id": session_id}))
                    if action_taken and action_taken != "get_driver_assignments":
                        await websocket.send_text(json.dumps({"type": "action", "action": action_taken}))

                    # ── Step 3: ElevenLabs TTS ──
                    await websocket.send_text(json.dumps({"type": "synthesizing"}))
                    t_tts = time.time()
                    try:
                        await synthesize_speech_streaming(reply_text, websocket)
                        print(f"[PERF] TTS: {(time.time()-t_tts)*1000:.0f}ms")
                        print(f"[PERF] Total turn: {(time.time()-t_stt)*1000:.0f}ms")
                    except Exception as e:
                        print(f"[VOICE] TTS error: {e}")
                        await websocket.send_text(json.dumps({"type": "tts_error", "message": str(e)}))
                        await websocket.send_text(json.dumps({"type": "audio_end"}))

    except WebSocketDisconnect:
        if session_id:
            try:
                db = SessionLocal()
                ContextBuilder(db)
                db.close()
            except Exception as e:
                print(f"[VOICE] Session cleanup error: {e}")
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        except Exception:
            pass


@router.post("/voice/end-session/{driver_id}")
async def end_voice_session(driver_id: str):
    try:
        db = SessionLocal()
        context_builder = ContextBuilder(db)
        session = context_builder.get_active_session(driver_id)
        if session:
            context_builder.end_session(session.id)
            db.close()
            return {"status": "success", "session_id": session.id}
        db.close()
        return {"status": "no_active_session"}
    except Exception as e:
        return {"status": "error", "message": str(e)}


@router.get("/voice/chat-history/{driver_id}")
async def get_chat_history(driver_id: str, limit: int = 100):
    """
    Get complete chat history for a driver from ALL sessions.
    Returns messages from all sessions, sorted by timestamp.
    Like ChatGPT, shows entire conversation history across sessions.
    """
    try:
        db = SessionLocal()
        
        # Get ALL sessions for this driver, ordered by most recent first
        sessions = db.query(SessionLog).filter(
            SessionLog.driver_id == driver_id
        ).order_by(SessionLog.session_start.desc()).limit(20).all()  # Last 20 sessions
        
        # Collect all messages from all sessions
        all_messages = []
        for session in sessions:
            if session.events and isinstance(session.events, list):
                # Add session_id to each message for grouping
                for event in session.events:
                    message = event.copy()
                    message['session_id'] = session.id
                    message['session_start'] = session.session_start.isoformat() if session.session_start else None
                    all_messages.append(message)
        
        # Sort all messages by timestamp (newest first for display)
        all_messages.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        # Limit to last N messages
        limited_messages = all_messages[:limit] if len(all_messages) > limit else all_messages
        
        # Reverse to show oldest first (chronological order)
        limited_messages.reverse()
        
        db.close()
        
        return {
            "status": "success",
            "messages": limited_messages,
            "total_messages": len(all_messages),
            "session_count": len(sessions)
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
