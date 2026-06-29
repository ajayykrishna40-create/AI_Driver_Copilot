# 🚛 AI Driver Copilot

**Voice-Enabled Fleet Management System**

An enterprise-grade AI voice assistant for commercial truck drivers, enabling hands-free fleet operations through natural language conversations.

[![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-16.0-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-blue.svg)](https://reactjs.org/)
[![AWS Bedrock](https://img.shields.io/badge/AWS-Bedrock-orange.svg)](https://aws.amazon.com/bedrock/)

---

## 🎯 Overview

AI Driver Copilot revolutionizes fleet operations by enabling truck drivers to manage their assignments, confirm hookups, and communicate with dispatch—all through natural voice conversations. The system achieves **sub-1.2 second response times** with a sophisticated three-layer memory architecture for persistent context across sessions.

### ✨ Key Features

- 🎤 **Voice-First Interface** - Hands-free operation with natural language processing
- 🧠 **Intelligent Conversations** - AWS Bedrock LLM with context-aware responses
- 🔐 **Safety Verification** - Automated hookup validation preventing equipment mismatches
- 💾 **Persistent Memory** - Three-layer architecture maintaining conversation history
- ⚡ **Real-Time Performance** - Sub-1.2 second voice pipeline with optimized TTS playback
- 📊 **Complete History** - Cross-session conversation logging with JSON storage

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────┐
│      Frontend (Next.js 16 + React 19)      │
│  • Voice Chat Interface                     │
│  • Real-time Audio Playback (1.3x speed)    │
│  • Session History Sidebar                  │
└─────────────────┬───────────────────────────┘
                  │ REST API (HTTPS)
┌─────────────────▼───────────────────────────┐
│       Backend (Python + FastAPI)            │
│  • JWT Authentication                       │
│  • Agentic Workflow Engine                  │
│  • Context Builder (3-Layer Memory)         │
│  • Tool Execution Framework                 │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼────────┐  ┌──────▼──────────────┐
│   MySQL DB     │  │   External APIs     │
│  • Drivers     │  │  • AWS Bedrock      │
│  • Loads       │  │  • Deepgram STT     │
│  • Trailers    │  │  • Google TTS       │
│  • Locations   │  │                     │
│  • Sessions    │  └─────────────────────┘
└────────────────┘
```

### Three-Layer Memory Architecture

1. **Layer 1 (RAM)** - Real-time conversation state (zero latency)
2. **Layer 2 (Session Logs)** - Persistent event logging (last 20 sessions, 100+ messages)
3. **Layer 3 (Database)** - Driver profiles, loads, trailers, locations

---

## 🚀 Quick Start

### Prerequisites

- Python 3.9+
- Node.js 18+
- MySQL 8.0+
- AWS Bedrock API access
- Deepgram API key (for STT)
- Google Cloud API key (for TTS)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ai-driver-copilot.git
   cd ai-driver-copilot
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   
   # Copy environment template
   cp ../.env.example ../.env
   # Edit .env with your API keys and database credentials
   
   # Initialize database
   python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"
   
   # Seed sample data
   python scripts/seed.py
   
   # Start backend server
   uvicorn main:app --reload --port 8001
   ```

3. **Frontend Setup**
   ```bash
   cd frontend/login/ai-driver-copilot
   npm install
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Docs: http://localhost:8001/docs

5. **Default Login**
   - Email: `mike@fleet.com`
   - Password: `test123`

---

## 🔧 Configuration

Create a `.env` file in the root directory (use `.env.example` as template):

```bash
# AWS Bedrock
BEDROCK_API_KEY=your_api_key_here
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-micro-v1:0

# Speech Services
DEEPGRAM_API_KEY=your_deepgram_key_here

# Database
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/truck_assistant

# JWT
JWT_SECRET_KEY=your_secret_key_minimum_32_characters
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24
```

---

## 💬 Usage Examples

### Scenario 1: Morning Assignment

```
Driver: "What's my assignment?"
AI: "Good morning Mike. You have two loads today. 
     Load one is active — you are driving tractor TX1002. 
     Hook Trailer 24087 at Tyson Foods, Dock 4. 
     Order number TF-8821. Delivery to Walmart DC 6847 
     by June 9th at 8 AM."
```

### Scenario 2: Hookup Verification

```
Driver: "I will hook up"
AI: "Before you hook up — make sure to set the reefer 
     on trailer 24087 to minus 18 degrees Celsius."

Driver: "I'm hooked up"
AI: "Please confirm your tractor number and trailer number."

Driver: "TX1002 and 24087"
AI: [Verifies] "Perfect. Your destination is Walmart DC 6847..."
```

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI
- **ORM**: SQLAlchemy
- **Database**: MySQL
- **Authentication**: JWT (python-jose, bcrypt)
- **AI/LLM**: AWS Bedrock (boto3, Nova-micro)
- **Validation**: Pydantic

### Frontend
- **Framework**: Next.js 16 (App Router)
- **UI Library**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion

### AI Services
- **LLM**: AWS Bedrock Nova-micro (688ms response time)
- **STT**: Deepgram Nova-3 (150ms latency)
- **TTS**: Google Text-to-Speech (300ms synthesis)

---

## 📊 Performance Metrics

- ⚡ **Response Time**: Sub-1.2 seconds end-to-end
- 🔄 **API Endpoints**: 12+ RESTful endpoints
- 🗄️ **Database Tables**: 8 normalized tables with relationships
- 💾 **Message Capacity**: 100+ messages per session
- 📈 **Session Storage**: Last 20 sessions per driver
- 🎯 **Speech Speed**: 1.3x playback (30% faster)
- 🔢 **Token Optimization**: 300 max tokens (reduced from 500)

---

## 🏗️ Project Structure

```
ai-driver-copilot/
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── routes.py               # API endpoints
│   ├── models.py               # Database models
│   ├── schemas.py              # Pydantic schemas
│   ├── auth.py                 # JWT authentication
│   ├── agent.py                # AI agent logic
│   ├── context_builder.py      # Three-layer memory system
│   ├── voice.py                # Voice endpoints
│   ├── database.py             # Database connection
│   └── scripts/
│       └── seed.py             # Sample data seeder
│
├── frontend/login/ai-driver-copilot/
│   ├── app/
│   │   ├── components/         # React components
│   │   │   ├── ChatPage.jsx    # Main chat interface
│   │   │   ├── ChatHistory.tsx # History sidebar
│   │   │   ├── Sidebar.jsx     # Navigation sidebar
│   │   │   └── ...
│   │   ├── layout.tsx          # App layout
│   │   └── page.tsx            # Home page
│   └── services/
│       └── api.ts              # API client
│
├── .env.example                # Environment template
├── .gitignore                  # Git ignore rules
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

---

## 🔒 Security

- ✅ JWT-based authentication with bcrypt password hashing
- ✅ Role-based access control (driver/dispatcher)
- ✅ Environment variables for all secrets
- ✅ SQL injection prevention via ORM
- ✅ Input validation with Pydantic
- ✅ CORS configuration for production
- ✅ HTTPS recommended for deployment

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend/login/ai-driver-copilot
npm test
```

---

## 📈 Future Enhancements

- [ ] Real-time GPS tracking integration
- [ ] Multi-language support (Spanish, French)
- [ ] Mobile app (iOS/Android)
- [ ] Analytics dashboard for dispatchers
- [ ] Predictive ETA with traffic data
- [ ] ELD system integration
- [ ] Offline mode with sync

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

---

## 🙏 Acknowledgments

- AWS Bedrock for LLM capabilities
- Deepgram for speech-to-text
- FastAPI for the excellent backend framework
- Next.js team for the amazing React framework

---

## 📸 Screenshots

### Login Page
<img width="1918" height="963" alt="Screenshot 2026-06-29 164646" src="https://github.com/user-attachments/assets/54a6c17b-f126-40c9-9cf4-d5495a38ff15" />


### Chat Interface
<img width="1918" height="967" alt="Screenshot 2026-06-29 165401" src="https://github.com/user-attachments/assets/ca9f2c08-015e-4034-93cd-ccc447c87289" />


### Conversation History
<img width="1590" height="892" alt="image" src="https://github.com/user-attachments/assets/f2525f12-93d9-450d-ac7c-a9569263bc1f" />





---

## 📞 Support

For questions or issues:
- 📧 Email: ajayykrishna40@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/ajayykrishna40-create/AI_Driver_Copilot/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/ajayykrishna40-create/AI_Driver_Copilot/discussions)

---

**⭐ Star this repository if you find it helpful!**
