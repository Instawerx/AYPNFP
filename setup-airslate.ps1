# airSlate Configuration Setup Script
# Run this in PowerShell to configure airSlate credentials

Write-Host "🚀 airSlate Configuration Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Firebase CLI is installed
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseVersion = firebase --version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Firebase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g firebase-tools" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
Write-Host ""

# Prompt for password
Write-Host "Your airSlate credentials:" -ForegroundColor Cyan
Write-Host "  Client ID: b424f954-c331-4754-af4c-86853f1f3006" -ForegroundColor Gray
Write-Host "  Username: tabor.dangelo@gmail.com" -ForegroundColor Gray
Write-Host ""

$password = Read-Host "Enter your airSlate password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

Write-Host ""
$orgId = Read-Host "Enter your airSlate Organization ID"

Write-Host ""
Write-Host "Setting Firebase Functions configuration..." -ForegroundColor Yellow

# Set configuration (single command)
$result = firebase functions:config:set airslate.client_id="b424f954-c331-4754-af4c-86853f1f3006" airslate.client_secret="tU6xGQ2y9iwTRgleL07YvjxCTgHDsr8TWJjJHzkE" airslate.username="tabor.dangelo@gmail.com" airslate.password="$passwordPlain" airslate.organization_id="$orgId"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Configuration set successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Verifying configuration..." -ForegroundColor Yellow
    firebase functions:config:get
    Write-Host ""
    Write-Host "🎉 airSlate credentials configured!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Create workflows in airSlate dashboard" -ForegroundColor Gray
    Write-Host "  2. Update workflow IDs in Firestore" -ForegroundColor Gray
    Write-Host "  3. Deploy functions: firebase deploy --only functions" -ForegroundColor Gray
    Write-Host "  4. Test Form 990 generation" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Configuration failed!" -ForegroundColor Red
    Write-Host "Please check your Firebase login and try again." -ForegroundColor Yellow
}

# Clear password from memory
$passwordPlain = $null
