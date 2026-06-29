# ==========================================
# AI Driver Copilot - Complete Startup Script
# Starts both Backend and Frontend
# ==========================================

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  AI Driver Copilot - App Startup     ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Check prerequisites
Write-Host "[Prerequisites Check]" -ForegroundColor Yellow

# Check Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Python not found!" -ForegroundColor Red
    Write-Host "Install from: https://www.python.org/" -ForegroundColor Yellow
    exit 1
}

# Check Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found!" -ForegroundColor Red
    Write-Host "Install from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[Starting Backend]" -ForegroundColor Yellow
Write-Host "Backend will run on: http://localhost:8000" -ForegroundColor Cyan

# Start backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\trailer_analytics\backend'; Write-Host 'Starting Backend...' -ForegroundColor Green; python -m uvicorn main:app --reload"

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Test backend
$backendReady = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
        Write-Host "✓ Backend is ready!" -ForegroundColor Green
        $backendReady = $true
        break
    } catch {
        Write-Host "  Waiting... ($i/10)" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }
}

if (-not $backendReady) {
    Write-Host "⚠ Backend did not start successfully" -ForegroundColor Yellow
    Write-Host "Check the backend window for errors" -ForegroundColor Gray
}

Write-Host "`n[Starting Frontend]" -ForegroundColor Yellow
Write-Host "Frontend will run on: http://localhost:3000" -ForegroundColor Cyan

# Start frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\trailer_analytics\frontend\login\ai-driver-copilot'; Write-Host 'Starting Frontend...' -ForegroundColor Green; npm run dev"

Write-Host "`n╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║         Application Started!          ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📍 Access Points:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:   http://localhost:8000" -ForegroundColor White
Write-Host "  API Docs:  http://localhost:8000/docs" -ForegroundColor White

Write-Host "`n👤 Default Login:" -ForegroundColor Cyan
Write-Host "  Email:     mike@fleet.com" -ForegroundColor White
Write-Host "  Password:  test123" -ForegroundColor White

Write-Host "`n🔴 To Stop: Close the backend and frontend windows`n" -ForegroundColor Yellow

Write-Host "Press any key to exit this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
