# ==========================================
# Frontend Diagnostic Script
# ==========================================

Write-Host "`n=== Frontend Diagnostic Tool ===" -ForegroundColor Cyan
Write-Host "Checking for common issues...`n" -ForegroundColor Yellow

$issues = 0
$warnings = 0

# Check 1: Node.js
Write-Host "[1/8] Node.js" -ForegroundColor White
try {
    $nodeVersion = node --version 2>&1
    Write-Host "  ✓ Found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ NOT FOUND - Install from https://nodejs.org/" -ForegroundColor Red
    $issues++
}

# Check 2: npm
Write-Host "[2/8] npm" -ForegroundColor White
try {
    $npmVersion = npm --version 2>&1
    Write-Host "  ✓ Found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ✗ NOT FOUND" -ForegroundColor Red
    $issues++
}

# Check 3: Frontend directory
Write-Host "[3/8] Frontend directory" -ForegroundColor White
$frontendPath = "d:\trailer_analytics\frontend\login\ai-driver-copilot"
if (Test-Path $frontendPath) {
    Write-Host "  ✓ Exists: $frontendPath" -ForegroundColor Green
    Set-Location $frontendPath
} else {
    Write-Host "  ✗ NOT FOUND: $frontendPath" -ForegroundColor Red
    $issues++
    exit 1
}

# Check 4: package.json
Write-Host "[4/8] package.json" -ForegroundColor White
if (Test-Path "package.json") {
    Write-Host "  ✓ Found" -ForegroundColor Green
} else {
    Write-Host "  ✗ NOT FOUND - Critical file missing!" -ForegroundColor Red
    $issues++
}

# Check 5: node_modules
Write-Host "[5/8] node_modules" -ForegroundColor White
if (Test-Path "node_modules") {
    $moduleCount = (Get-ChildItem node_modules -Directory -ErrorAction SilentlyContinue | Measure-Object).Count
    Write-Host "  ✓ Found ($moduleCount packages)" -ForegroundColor Green
} else {
    Write-Host "  ⚠ NOT FOUND - Run: npm install" -ForegroundColor Yellow
    $warnings++
}

# Check 6: Critical dependencies
Write-Host "[6/8] Critical dependencies" -ForegroundColor White
if (Test-Path "node_modules/next") {
    Write-Host "  ✓ Next.js installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ Next.js NOT installed" -ForegroundColor Red
    $issues++
}

if (Test-Path "node_modules/react") {
    Write-Host "  ✓ React installed" -ForegroundColor Green
} else {
    Write-Host "  ✗ React NOT installed" -ForegroundColor Red
    $issues++
}

# Check 7: Port 3000
Write-Host "[7/8] Port 3000 availability" -ForegroundColor White
try {
    $netstat = netstat -ano | Select-String ":3000"
    if ($netstat) {
        Write-Host "  ⚠ Port 3000 is in use" -ForegroundColor Yellow
        Write-Host "    Run: netstat -ano | findstr :3000" -ForegroundColor Gray
        $warnings++
    } else {
        Write-Host "  ✓ Port 3000 is available" -ForegroundColor Green
    }
} catch {
    Write-Host "  ○ Could not check port" -ForegroundColor Gray
}

# Check 8: Backend
Write-Host "[8/8] Backend API" -ForegroundColor White
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "  ✓ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Backend not responding" -ForegroundColor Yellow
    Write-Host "    Start backend first: cd backend && python -m uvicorn main:app --reload" -ForegroundColor Gray
    $warnings++
}

# Summary
Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
if ($issues -eq 0 -and $warnings -eq 0) {
    Write-Host "✓✓✓ ALL CHECKS PASSED!" -ForegroundColor Green
    Write-Host "`nYou can start the frontend:" -ForegroundColor White
    Write-Host "  npm run dev" -ForegroundColor Gray
    Write-Host "`nOr use the startup script:" -ForegroundColor White
    Write-Host "  .\start_frontend.ps1`n" -ForegroundColor Gray
} elseif ($issues -eq 0) {
    Write-Host "⚠ $warnings Warning(s) found" -ForegroundColor Yellow
    Write-Host "`nMost likely fix:" -ForegroundColor White
    Write-Host "  npm install" -ForegroundColor Gray
    Write-Host "  npm run dev`n" -ForegroundColor Gray
} else {
    Write-Host "✗ $issues Issue(s) and $warnings Warning(s) found" -ForegroundColor Red
    Write-Host "`nFix the issues above before starting frontend" -ForegroundColor Yellow
    Write-Host "See FRONTEND_TROUBLESHOOTING.md for solutions`n" -ForegroundColor Gray
}

# Additional help
Write-Host "Need help? Check:" -ForegroundColor Cyan
Write-Host "  - FRONTEND_TROUBLESHOOTING.md" -ForegroundColor Gray
Write-Host "  - Run: .\start_frontend.ps1 (automated startup)" -ForegroundColor Gray
Write-Host "  - Run: .\start_app.ps1 (start both backend & frontend)`n" -ForegroundColor Gray
