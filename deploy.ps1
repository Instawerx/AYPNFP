# Deployment Script for AYPNFP
# This script installs dependencies and deploys to Firebase App Hosting

Write-Host "🚀 AYPNFP Deployment Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "📦 Step 1: Installing dependencies..." -ForegroundColor Yellow
Set-Location apps/web
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Step 2: Go back to root
Set-Location ../..

# Step 3: Deploy to Firebase
Write-Host "🚀 Step 2: Deploying to Firebase App Hosting..." -ForegroundColor Yellow
firebase deploy --only apphosting:aaypnfp --project adopt-a-young-parent
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "Your application should be live at:" -ForegroundColor Cyan
Write-Host "https://aaypnfp--adopt-a-young-parent.us-central1.hosted.app" -ForegroundColor Cyan
