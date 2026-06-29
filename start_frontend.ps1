# ==========================================
# Frontend Startup Script
# ==========================================

Write-Host "`n=== AI Driver Copilot - Frontend Startup ===" -ForegroundColor Cyan

# Navigate to frontend directory
$frontendPath = "d:\trailer_analytics\frontend\login\ai-driver-copilot"
Set-Location $frontendPath

Write-Host "`n[1/4] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "Please install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>&1
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n[2/4] Checking dependencies..." -ForegroundColor Yellow

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠ node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    Write-Host "This may take a few minutes..." -ForegroundColor Gray
    npm install
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm install failed!" -ForegroundColor Red
        Write-Host "See error above for details." -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✓ node_modules exists" -ForegroundColor Green
}

Write-Host "`n[3/4] Checking backend..." -ForegroundColor Yellow

# Test if backend is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ Backend is running on http://localhost:8000" -ForegroundColor Green
} catch {
    Write-Host "⚠ Backend not responding on http://localhost:8000" -ForegroundColor Yellow
    Write-Host "  Make sure backend is running first!" -ForegroundColor Gray
    Write-Host "  Run: cd backend && python -m uvicorn main:app --reload" -ForegroundColor Gray
}

Write-Host "`n[4/4] Starting frontend..." -ForegroundColor Yellow
Write-Host "Frontend will start on: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray

# Start the development server
npm run dev
