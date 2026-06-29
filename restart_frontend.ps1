# Quick Frontend Restart Script

Write-Host "`n=== Restarting Frontend ===" -ForegroundColor Cyan

cd "d:\trailer_analytics\frontend\login\ai-driver-copilot"

Write-Host "[1/2] Clearing build cache..." -ForegroundColor Yellow
Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✓ Cache cleared" -ForegroundColor Green

Write-Host "`n[2/2] Starting frontend..." -ForegroundColor Yellow
Write-Host "Backend: http://localhost:8001" -ForegroundColor Gray
Write-Host "Frontend: http://localhost:3000`n" -ForegroundColor Gray

npm run dev
