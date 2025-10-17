# Firebase Admin SDK Secret Setup Script
# This script creates the firebase-admin-private-key secret

Write-Host "🔐 Firebase Admin SDK Secret Setup" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check for environment variable first
$serviceAccountPath = $env:FIREBASE_SERVICE_ACCOUNT_PATH

if (-not $serviceAccountPath) {
    Write-Host "⚠️  FIREBASE_SERVICE_ACCOUNT_PATH environment variable not set" -ForegroundColor Yellow
    Write-Host "Please provide the path to your Firebase service account JSON file:" -ForegroundColor White
    $serviceAccountPath = Read-Host "Path"
}

if (-not (Test-Path $serviceAccountPath)) {
    Write-Host "❌ Error: Service account file not found at: $serviceAccountPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "⚠️  SECURITY WARNING: Never commit service account files to Git!" -ForegroundColor Red
    Write-Host "Store the file outside your repository or use environment variables." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Found service account file" -ForegroundColor Green

# Parse JSON and extract private key
$serviceAccount = Get-Content $serviceAccountPath | ConvertFrom-Json
$privateKey = $serviceAccount.private_key

if (-not $privateKey) {
    Write-Host "❌ Error: Could not extract private key from service account file" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Extracted private key" -ForegroundColor Green
Write-Host ""

# Save private key to temporary file
$tempKeyFile = "C:\AYPNFP\.temp-private-key.txt"
$privateKey | Out-File -FilePath $tempKeyFile -Encoding UTF8 -NoNewline

Write-Host "📝 Private key saved to temporary file: $tempKeyFile" -ForegroundColor Yellow
Write-Host ""

Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Run this command to create the secret:" -ForegroundColor White
Write-Host ""
Write-Host "   firebase apphosting:secrets:set firebase-admin-private-key --data-file=`"$tempKeyFile`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. After creating the secret, delete the temporary file:" -ForegroundColor White
Write-Host ""
Write-Host "   Remove-Item `"$tempKeyFile`"" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Deploy the application:" -ForegroundColor White
Write-Host ""
Write-Host "   firebase deploy --only apphosting:aaypnfp" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚠️  IMPORTANT: The temporary key file will be deleted after you create the secret!" -ForegroundColor Red
Write-Host ""
