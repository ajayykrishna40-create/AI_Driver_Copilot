# AI Driver Copilot - System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js 15)                          │
│                     localhost:3000 (ai-driver-copilot)                  │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Login Page   │  │  Chat Page   │  │ Chat History │                 │
│  │ (Auth)       │  │ (Main UI)    │  │  (Sidebar)   │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                         │
│         └──────────────────┴──────────────────┘                         │
│                            │                                            │
│                     API Service Layer                                   │
│                     (services/api.ts)                                   │
└────────────────────────────┬────────────────────────────────────────────┘
                             │
                             │ HTTP/WebSocket
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      BACKEND (FastAPI + Python)                         │
│                          localhost:8001                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                      FastAPI Application                        │   │
│  │                         (main.py)                               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │ Auth Routes  │  │  Routes      │  │ Voice Router │                 │
│  │ (auth.py)    │  │ (routes.py)  │  │ (voice.py)   │                 │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                  │                         │
│         │                  │                  │                         │
│  ┌──────┴──────────────────┴──────────────────┴───────┐               │
│  │             Agent Orchestration Layer               │               │
│  │                  (agent.py)                         │               │
│  │  ┌──────────────────────────────────────────────┐  │               │
│  │  │  • Tool Execution (get_driver_assignments,   │  │               │
│  │  │    verify_hookup, confirm_hookup, etc.)      │  │               │
│  │  │  • Agentic Loop (up to 5 iterations)         │  │               │
│  │  │  • Context Building (3-Layer Memory)         │  │               │
│  │  └──────────────────────────────────────────────┘  │               │
│  └─────────────────────────────────────────────────────┘               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    Context Builder                              │   │
│  │                 (context_builder.py)                            │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │  Three-Layer Memory System:                              │  │   │
│  │  │  • Layer 1 (RAM): Current conversation context           │  │   │
│  │  │  • Layer 2 (Session): SQLite session logs & history      │  │   │
│  │  │  • Layer 3 (Lookup): Database entities (drivers, loads)  │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                    Database Layer                               │   │
│  │                  (database.py + models.py)                      │   │
│  │  ┌──────────────────────────────────────────────────────────┐  │   │
│  │  │  SQLite Database (fleet_data.db)                         │  │   │
│  │  │  • Users (authentication)                                 │  │   │
│  │  │  • Drivers (profiles, assignments)                        │  │   │
│  │  │  • Loads (shipments, status, destinations)                │  │   │
│  │  │  • Trailers (equipment specs, temperature)                │  │   │
│  │  │  • Tractors (vehicle info)                                │  │   │
│  │  │  • Locations (facilities, contacts)                       │  │   │
│  │  │  • SessionLog (conversation history, events)              │  │   │
│  │  │  • HookupVerification (trailer verification logs)         │  │   │
│  │  └──────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │
                               │ API Calls
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │                         AI & Voice Services                     │   │
│  ├────────────────────────────────────────────────────────────────┤   │
│  │                                                                 │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                   │   │
│  │  │  AWS Bedrock     │  │  Deepgram        │                   │   │
│  │  │  Nova-micro LLM  │  │  Nova-3 STT      │                   │   │
│  │  │  ~688ms latency  │  │  ~150ms latency  │                   │   │
│  │  └──────────────────┘  └──────────────────┘                   │   │
│  │                                                                 │   │
│  │  ┌──────────────────┐                                          │   │
│  │  │  ElevenLabs      │                                          │   │
│  │  │  Flash TTS v2.5  │                                          │   │
│  │  │  ~300ms latency  │                                          │   │
│  │  └──────────────────┘                                          │   │
│  │                                                                 │   │
│  │  Total Voice Pipeline: ~1150ms (STT + LLM + TTS)               │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Detailed Component Breakdown

### Frontend Architecture

#### Technology Stack
- **Framework**: Next.js 15 (React)
- **Styling**: Tailwind CSS
- **Language**: TypeScript + JSX
- **Port**: localhost:3000

#### Key Components

1. **Login Page** (`ai_driver_login.jsx`)
   - User authentication UI
   - Registration flow
   - JWT token management

2. **Chat Page** (`ChatPage.jsx`)
   - Main chat interface
   - Assignment card (shows active load)
   - Voice recording (WebRTC MediaRecorder)
   - Message display with typing indicators
   - Session management

3. **Chat History** (`ChatHistory.tsx`)
   - Sidebar panel showing conversation history
   - Combines current + persisted messages
   - Date grouping (Today, Yesterday, etc.)
   - Real-time refresh

4. **API Service** (`api.ts`)
   - Login/register endpoints
   - Agent chat communication
   - Error handling

---

### Backend Architecture

#### Technology Stack
- **Framework**: FastAPI (Python)
- **Database**: SQLite + SQLAlchemy ORM
- **LLM**: AWS Bedrock (Nova-micro)
- **STT**: Deepgram Nova-3
- **TTS**: ElevenLabs Flash v2.5
- **Port**: localhost:8001

#### Core Modules

1. **Main Application** (`main.py`)
   - FastAPI app initialization
   - CORS configuration
   - Router registration
   - Database initialization

2. **Authentication** (`auth.py`, `jwt_handler.py`, `security.py`)
   - User registration
   - Login with JWT tokens
   - Password hashing (bcrypt)
   - Token validation

3. **Routes** (`routes.py`)
   - Driver profile endpoints
   - Load management (get, update, confirm hookup)
   - Hookup verification workflow
   - Active load queries

4. **Agent** (`agent.py`)
   - Agentic loop (up to 5 tool iterations)
   - AWS Bedrock Converse API integration
   - Tool execution (12+ tools available)
   - Fallback to mock responses if API fails

5. **Voice Pipeline** (`voice.py`)
   - WebSocket endpoint (`/ws/voice/{driver_id}`)
   - Audio transcription (Deepgram)
   - LLM processing (Nova-micro)
   - Speech synthesis (ElevenLabs)
   - Streaming audio response

6. **Context Builder** (`context_builder.py`)
   - **Three-Layer Memory System**:
     - Layer 1: Current conversation (RAM)
     - Layer 2: Session history (SQLite)
     - Layer 3: Database lookups (driver, loads, trailers)
   - System prompt construction
   - Session logging
   - Conversation turn tracking

7. **Database** (`database.py`, `models.py`)
   - SQLAlchemy models
   - Session management
   - Relationships (drivers → loads → trailers)

---

## Data Flow Examples

### Text Chat Flow
```
User types message
       ↓
ChatPage sends to /agent/chat
       ↓
Agent.py receives request
       ↓
Context Builder builds system prompt (3 layers)
       ↓
AWS Bedrock processes with tools
       ↓
Agent executes tools (verify_hookup, get_assignments, etc.)
       ↓
Agent logs to SessionLog (Layer 2 memory)
       ↓
Response sent back to frontend
       ↓
ChatPage displays message
```

### Voice Chat Flow
```
User clicks mic → starts recording
       ↓
Audio chunks sent to WebSocket (/ws/voice/{driver_id})
       ↓
Backend receives audio → sends to Deepgram STT
       ↓
Transcript received → sent to Agent
       ↓
Agent processes (same as text flow)
       ↓
Response text → sent to ElevenLabs TTS
       ↓
Audio chunks streamed back via WebSocket
       ↓
Frontend plays audio in real-time
```

### Hookup Verification Flow
```
Driver: "I'll hook up"
       ↓
Agent: "Remember to set reefer to [TEMP]°C"
       ↓
Driver: "I'm hooked up"
       ↓
Agent: "Confirm tractor, trailer, temp"
       ↓
Driver provides details
       ↓
Agent calls verify_hookup tool
       ↓
Backend checks database (expected vs provided)
       ↓
If VERIFIED: confirm_hookup called → load status updated
       ↓
If MISMATCH: agent informs driver of discrepancy
```

---

## API Endpoints

### Authentication
- `POST /register_user` - Create new user account
- `POST /login` - Login and get JWT token

### Driver & Load Management
- `GET /drivers/{driver_id}/active-loads` - Get driver assignments
- `POST /loads/{order_id}/hookup` - Confirm trailer hookup
- `POST /loads/{order_id}/verify-hookup` - Verify hookup details
- `POST /loads/{order_id}/notify-departure` - Notify departure
- `POST /loads/{order_id}/complete-delivery` - Mark delivery complete

### Agent & Voice
- `POST /agent/chat` - Text-based agent interaction
- `WS /ws/voice/{driver_id}` - Voice chat WebSocket

### History
- `GET /voice/chat-history/{driver_id}` - Retrieve conversation history

---

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS enabled for localhost:3000
- Token expiration (24 hours)
- Input validation on all endpoints
- Secure WebSocket connections

---

## Database Schema

### Key Tables
- **users**: Authentication & profiles
- **drivers**: Driver information, contact, tractor assignment
- **loads**: Shipments, status, destinations, temperature requirements
- **trailers**: Equipment specs, type (REEFER, DRY_VAN)
- **tractors**: Vehicle info
- **locations**: Facilities (shippers, consignees, dispatchers)
- **session_logs**: Conversation events (JSON), session metadata
- **hookup_verifications**: Verification attempts, matches/mismatches

---

## Environment Variables

### Backend (.env)
```
DEEPGRAM_API_KEY=<deepgram_key>
ELEVENLABS_API_KEY=<elevenlabs_key>
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM
AWS_ACCESS_KEY_ID=<aws_key>
AWS_SECRET_ACCESS_KEY=<aws_secret>
AWS_DEFAULT_REGION=us-east-1
JWT_SECRET=<jwt_secret>
```

---

## Performance Metrics

### Voice Pipeline Latency
- **STT (Deepgram Nova-3)**: ~150ms
- **LLM (AWS Bedrock Nova-micro)**: ~688ms
- **TTS (ElevenLabs Flash)**: ~300ms
- **Total End-to-End**: ~1150ms

### Database
- SQLite (local file: `fleet_data.db`)
- Fast reads (<10ms for typical queries)
- JSON column support for events/metadata

---

## Deployment Architecture

### Current Setup (Development)
```
Frontend: localhost:3000 (Next.js dev server)
Backend:  localhost:8001 (uvicorn FastAPI)
Database: fleet_data.db (SQLite file)
```

### Production Recommendations
- Frontend: Vercel / AWS Amplify / Netlify
- Backend: AWS EC2 / ECS / Lambda
- Database: PostgreSQL (RDS) or DynamoDB
- WebSocket: AWS API Gateway WebSocket
- CDN: CloudFront for static assets

---

## Key Features

✅ **Authentication**: Secure login with JWT  
✅ **Real-time Voice**: WebSocket-based voice chat  
✅ **Text Chat**: Traditional message interface  
✅ **Chat History**: Persistent conversation logs  
✅ **Three-Layer Memory**: Context-aware responses  
✅ **Tool Execution**: 12+ agent tools (verify hookup, get assignments, etc.)  
✅ **Assignment Tracking**: Live load status display  
✅ **Temperature Verification**: Reefer temp validation  
✅ **Responsive UI**: Mobile-friendly design  

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend Framework | Next.js 15 + React |
| UI Styling | Tailwind CSS |
| Language (Frontend) | TypeScript, JSX |
| Backend Framework | FastAPI (Python 3.10+) |
| Database | SQLite + SQLAlchemy |
| LLM | AWS Bedrock Nova-micro |
| STT | Deepgram Nova-3 |
| TTS | ElevenLabs Flash v2.5 |
| Authentication | JWT + bcrypt |
| WebSocket | FastAPI WebSocket |
| API Client | httpx (Python), fetch (JS) |

---

**Last Updated**: June 8, 2026  
**Version**: 1.0
