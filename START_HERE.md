# 🚀 START HERE - Complete Startup Guide

## ✅ Issues Fixed

1. ✓ Cleared Next.js build cache (`.next` folder)
2. ✓ Removed extra lockfile
3. ✓ Ready to start!

---

## 📍 Port Information

- **Backend**: Port **8000** (`http://localhost:8000`)
- **Frontend**: Port **3000** (`http://localhost:3000`)

---

## 🎯 Quick Start (2 Steps)

### Step 1: Start Backend (FIRST)

Open **Terminal 1** (PowerShell or CMD):

```powershell
cd d:\trailer_analytics\backend
python -m uvicorn main:app --reload
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

✓ Backend is now running on: **http://localhost:8000**

---

### Step 2: Start Frontend (SECOND)

Open **Terminal 2** (PowerShell or CMD):

```powershell
cd d:\trailer_analytics\frontend\login\ai-driver-copilot
npm run dev
```

**Expected output:**
```
▲ Next.js 16.2.7
- Local:   http://localhost:3000
✓ Ready in 2.5s
```

✓ Frontend is now running on: **http://localhost:3000**

---

## 🌐 Access Your Application

1. Open browser: **http://localhost:3000**
2. Login with:
   - **Email**: `mike@fleet.com`
   - **Password**: `test123`

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Backend NOT RUNNING" error in frontend

**Problem**: Frontend can't connect to backend

**Solution**: Make sure backend is running FIRST
```powershell
cd d:\trailer_analytics\backend
python -m uvicorn main:app --reload
```

---

### Issue 2: "Port 8000 is already in use"

**Solution**: Kill the existing process
```powershell
# Find the process
netstat -ano | findstr :8000

# Kill it (replace 12345 with actual PID)
taskkill /PID 12345 /F
```

---

### Issue 3: "Port 3000 is already in use"

**Solution**: Kill the existing process
```powershell
# Find the process
netstat -ano | findstr :3000

# Kill it (replace 12345 with actual PID)
taskkill /PID 12345 /F
```

---

### Issue 4: React bundler errors

**Solution**: Clear cache and restart
```powershell
cd d:\trailer_analytics\frontend\login\ai-driver-copilot

# Clear cache
Remove-Item .next -Recurse -Force

# Restart
npm run dev
```

---

## 🎬 Alternative: Auto-Start Script

I created a script that starts both automatically:

```powershell
cd d:\trailer_analytics
.\start_app.ps1
```

This will:
- ✓ Start backend in separate window
- ✓ Start frontend in separate window  
- ✓ Show you all URLs

---

## 🔍 Verify Everything is Running

### Check Backend:
- Open: http://localhost:8000/docs
- Should see: FastAPI Swagger documentation

### Check Frontend:
- Open: http://localhost:3000
- Should see: Login page

---

## 🛑 How to Stop

### Stop Backend:
- Go to backend terminal
- Press `Ctrl+C`

### Stop Frontend:
- Go to frontend terminal
- Press `Ctrl+C` (twice)

---

## 📋 Startup Checklist

Before starting:
- [ ] Python is installed (`python --version`)
- [ ] Node.js is installed (`node --version`)
- [ ] Backend dependencies installed (`pip install -r requirements.txt`)
- [ ] Frontend dependencies installed (`npm install` in frontend dir)
- [ ] Database is running (MySQL)
- [ ] `.env` file exists with credentials

To start:
- [ ] Terminal 1: Start backend on port 8000
- [ ] Terminal 2: Start frontend on port 3000
- [ ] Open browser: http://localhost:3000
- [ ] Login and test!

---

## 🎉 You're Ready!

**Backend**: `http://localhost:8000`  
**Frontend**: `http://localhost:3000`  
**Login**: `mike@fleet.com` / `test123`

Start backend first, then frontend. Enjoy your AI Driver Copilot! 🚛
