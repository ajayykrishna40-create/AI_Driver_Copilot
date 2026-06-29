# ==========================================
# GitHub Security Verification Script
# Run this BEFORE pushing to GitHub
# ==========================================

Write-Host "`n=== AI Driver Copilot - GitHub Security Check ===" -ForegroundColor Cyan
Write-Host "Running pre-push security verification...`n" -ForegroundColor Yellow

$allGood = $true

# Check 1: .gitignore exists
Write-Host "[1/6] Checking .gitignore exists..." -ForegroundColor White
if (Test-Path ".gitignore") {
    Write-Host "✓ .gitignore found" -ForegroundColor Green
} else {
    Write-Host "✗ .gitignore NOT FOUND!" -ForegroundColor Red
    $allGood = $false
}

# Check 2: .env.example exists
Write-Host "[2/6] Checking .env.example exists..." -ForegroundColor White
if (Test-Path ".env.example") {
    Write-Host "✓ .env.example found" -ForegroundColor Green
} else {
    Write-Host "✗ .env.example NOT FOUND!" -ForegroundColor Red
    $allGood = $false
}

# Check 3: .env is in .gitignore
Write-Host "[3/6] Checking .env is in .gitignore..." -ForegroundColor White
$gitignoreContent = Get-Content ".gitignore" -Raw
if ($gitignoreContent -match "\.env") {
    Write-Host "✓ .env is listed in .gitignore" -ForegroundColor Green
} else {
    Write-Host "✗ .env NOT in .gitignore!" -ForegroundColor Red
    $allGood = $false
}

# Check 4: database.py uses environment variables
Write-Host "[4/6] Checking database.py uses environment variables..." -ForegroundColor White
$dbContent = Get-Content "backend\database.py" -Raw
if ($dbContent -match "os\.getenv") {
    Write-Host "✓ database.py uses environment variables" -ForegroundColor Green
} else {
    Write-Host "✗ database.py has hardcoded credentials!" -ForegroundColor Red
    $allGood = $false
}

# Check 5: No API keys in code files
Write-Host "[5/6] Scanning for hardcoded API keys..." -ForegroundColor White
$foundKeys = $false
$patterns = @("sk_", "ABSKQmVkcm9ja", "7d5cf574c8d478fb")

Get-ChildItem -Recurse -Include *.py,*.js,*.jsx,*.ts,*.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    foreach ($pattern in $patterns) {
        if ($content -match $pattern) {
            Write-Host "✗ Possible API key found in: $($_.Name)" -ForegroundColor Red
            $foundKeys = $true
            $allGood = $false
        }
    }
}

if (-not $foundKeys) {
    Write-Host "✓ No hardcoded API keys detected" -ForegroundColor Green
}

# Check 6: Git status (if git is initialized)
Write-Host "[6/6] Checking git status..." -ForegroundColor White
if (Test-Path ".git") {
    $gitStatus = git status --porcelain
    $envInStatus = $gitStatus | Select-String "\.env$"
    
    if ($envInStatus) {
        Write-Host "✗ .env file is staged for commit!" -ForegroundColor Red
        Write-Host "  Run: git reset HEAD .env" -ForegroundColor Yellow
        $allGood = $false
    } else {
        Write-Host "✓ .env is not staged" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ Git not initialized yet" -ForegroundColor Yellow
}

# Final verdict
Write-Host "`n=== RESULT ===" -ForegroundColor Cyan
if ($allGood) {
    Write-Host "✓✓✓ ALL CHECKS PASSED! Safe to push to GitHub ✓✓✓" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor White
    Write-Host "1. git add ." -ForegroundColor Gray
    Write-Host "2. git commit -m 'Initial commit'" -ForegroundColor Gray
    Write-Host "3. git remote add origin <your-repo-url>" -ForegroundColor Gray
    Write-Host "4. git push -u origin main`n" -ForegroundColor Gray
} else {
    Write-Host "✗✗✗ SECURITY ISSUES FOUND! DO NOT PUSH YET ✗✗✗" -ForegroundColor Red
    Write-Host "`nPlease fix the issues above before pushing to GitHub." -ForegroundColor Yellow
    Write-Host "See GITHUB_SETUP_GUIDE.md for detailed instructions.`n" -ForegroundColor Yellow
}
