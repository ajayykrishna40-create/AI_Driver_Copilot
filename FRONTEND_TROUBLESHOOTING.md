# 🔧 Frontend Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: "npm is not recognized" or "node is not recognized"

**Problem**: Node.js is not installed or not in PATH

**Solution**:
```bash
# Check if Node.js is installed
node --version
npm --version

# If not found, install Node.js from:
# https://nodejs.org/ (Download LTS version)
```

After installation, restart your terminal/PowerShell.

---

### Issue 2: "node_modules not found" or dependency errors

**Problem**: Dependencies not installed

**Solution**:
```bash
cd d:\trailer_analytics\frontend\login\ai-driver-copilot
npm install
```

This will install all required packages from package.json.

---

### Issue 3: Port 3000 is already in use

**Problem**: Another process is using port 3000

**Solution A - Use different port**:
```bash
# Windows PowerShell
$env:PORT=3001; npm run dev

# Or in package.json, change "dev" script to:
"dev": "next dev -p 3001"
```

**Solution B - Kill process on port 3000**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

---

### Issue 4: "Module not found" errors

**Problem**: Dependencies are corrupted or incomplete

**Solution**:
```bash
cd d:\trailer_analytics\frontend\login\ai-driver-copilot

# Delete node_modules and package-lock.json
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json -Force

# Reinstall
npm install
```

---

### Issue 5: Build errors or TypeScript errors

**Problem**: TypeScript configuration or build cache issues

**Solution**:
```bash
cd d:\trailer_analytics\frontend\login\ai-driver-copilot

# Clear Next.js cache
Remove-Item .next -Recurse -Force

# Rebuild
npm run dev
```

---

### Issue 6: "Cannot find module 'next'"

**Problem**: Next.js not installed properly

**Solution**:
```bash
cd d:\trailer_analytics\frontend\login\ai-driver-copilot

# Install Next.js specifically
npm install next@16.2.7 react@19.2.4 react-dom@19.2.4

# Then run
npm run dev
```

---

### Issue 7: Backend API connection errors

**Problem**: Backend not running or wrong URL

**Solution**:
```bash
# 1. Make sure backend is running first
cd d:\trailer_analytics\backend
python -m uvicorn main:app --reload

# 2. Check API URL in frontend
# File: frontend/login/ai-driver-copilot/services/api.ts
# Should have: const API_URL = 'http://localhost:8000'
```

---

## 🚀 Step-by-Step Startup Guide

### Step 1: Check Prerequisites
```powershell
# Check Node.js (should be 18+)
node --version

# Check npm (should be 9+)
npm --version

# If missing, install from: https://nodejs.org/
```

### Step 2: Install Dependencies (First time only)
```bash
cd d:\trailer_analytics\frontend\login\ai-driver-copilot
npm install
```

**Expected output**: Installing packages... ✓ Done

### Step 3: Start Backend First
```bash
# Open Terminal 1
cd d:\trailer_analytics\backend
python -m uvicorn main:app --reload
```

**Expected output**: Uvicorn running on http://localhost:8000

### Step 4: Start Frontend
```bash
# Open Terminal 2
cd d:\trailer_analytics\frontend\login\ai-driver-copilot
npm run dev
```

**Expected output**: 
```
▲ Next.js 16.2.7
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

### Step 5: Access Application
Open browser: http://localhost:3000

---

## 📋 Quick Diagnostic Commands

Run these to diagnose issues:

```powershell
# Navigate to frontend
cd d:\trailer_analytics\frontend\login\ai-driver-copilot

# Check Node/npm
node --version
npm --version

# Check if package.json exists
Test-Path package.json

# Check if node_modules exists
Test-Path node_modules

# Check if all dependencies installed
npm list --depth=0

# Check for outdated packages
npm outdated

# Verify Next.js installation
npm list next

# Try to run (see actual error)
npm run dev
```

---

## 🆘 Still Having Issues?

### Get Full Error Details

Run this in PowerShell:
```powershell
cd d:\trailer_analytics\frontend\login\ai-driver-copilot
npm run dev 2>&1 | Out-File -FilePath error.log
notepad error.log
```

This will capture the full error message.

### Common Error Messages and Solutions

**Error**: "ENOENT: no such file or directory"
- **Fix**: Check you're in correct directory
- **Run**: `pwd` to verify location

**Error**: "EADDRINUSE: address already in use"
- **Fix**: Port 3000 is taken
- **Run**: Use different port or kill process

**Error**: "Module not found: Can't resolve"
- **Fix**: Missing dependency
- **Run**: `npm install <missing-package>`

**Error**: "TypeScript error in..."
- **Fix**: TypeScript compilation issue
- **Run**: Check the file mentioned, fix syntax

---

## 🔄 Nuclear Option (Complete Reset)

If nothing works, try complete reset:

```powershell
cd d:\trailer_analytics\frontend\login\ai-driver-copilot

# 1. Delete everything except source code
Remove-Item node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue

# 2. Clear npm cache
npm cache clean --force

# 3. Reinstall
npm install

# 4. Try running
npm run dev
```

---

## ✅ Verification Checklist

Before asking for help, verify:

- [ ] Node.js is installed (v18+)
- [ ] npm is installed (v9+)
- [ ] You're in correct directory (`frontend/login/ai-driver-copilot`)
- [ ] `package.json` exists
- [ ] `node_modules` folder exists
- [ ] Backend is running on port 8000
- [ ] Port 3000 is available
- [ ] No firewall blocking
- [ ] Internet connection available (for npm install)

---

## 📞 Get Help

If you've tried everything above, share:

1. **Node/npm versions**: `node --version` and `npm --version`
2. **Full error message**: Copy the entire error from terminal
3. **Steps you tried**: What troubleshooting steps did you attempt?
4. **Current directory**: Run `pwd` or `cd` to show where you are
5. **File structure**: Run `ls` to show what files exist

---

## 🎯 Most Common Fix

**90% of issues are solved by**:
```bash
cd d:\trailer_analytics\frontend\login\ai-driver-copilot
npm install
npm run dev
```

If that doesn't work, the error message will tell you what's wrong!
