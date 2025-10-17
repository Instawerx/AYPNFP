# Git History Cleanup Script
# WARNING: This script rewrites Git history. Use with caution!
# This will remove the exposed credential file from ALL commits

Write-Host "🚨 GIT HISTORY CLEANUP - REMOVE EXPOSED CREDENTIALS" -ForegroundColor Red
Write-Host "===================================================" -ForegroundColor Red
Write-Host ""
Write-Host "⚠️  WARNING: This script will rewrite Git history!" -ForegroundColor Yellow
Write-Host "This is a DESTRUCTIVE operation that cannot be undone." -ForegroundColor Yellow
Write-Host ""
Write-Host "What this script will do:" -ForegroundColor Cyan
Write-Host "  1. Remove exposed credential file from all commits" -ForegroundColor White
Write-Host "  2. Rewrite Git history to eliminate all traces" -ForegroundColor White
Write-Host "  3. Require force-push to update remote repository" -ForegroundColor White
Write-Host ""
Write-Host "Prerequisites:" -ForegroundColor Cyan
Write-Host "  - Python 3.6+ installed" -ForegroundColor White
Write-Host "  - git-filter-repo installed (pip install git-filter-repo)" -ForegroundColor White
Write-Host "  - All team members must re-clone the repository after this" -ForegroundColor White
Write-Host "  - Backup of repository recommended" -ForegroundColor White
Write-Host ""

# Confirm user wants to proceed
$confirm = Read-Host "Do you want to proceed? Type 'YES' to continue"
if ($confirm -ne "YES") {
    Write-Host "❌ Cleanup cancelled." -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Cyan

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python is installed: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.6+ from https://www.python.org/" -ForegroundColor Yellow
    exit 1
}

# Check if git-filter-repo is installed
try {
    git filter-repo --help 2>&1 | Out-Null
    Write-Host "✅ git-filter-repo is installed" -ForegroundColor Green
} catch {
    Write-Host "❌ git-filter-repo is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing git-filter-repo..." -ForegroundColor Yellow
    pip install git-filter-repo
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install git-filter-repo" -ForegroundColor Red
        Write-Host "Please install manually: pip install git-filter-repo" -ForegroundColor Yellow
        exit 1
    }
    Write-Host "✅ git-filter-repo installed successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 2: Creating backup..." -ForegroundColor Cyan
$backupDir = "C:\AYPNFP-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "Backing up repository to: $backupDir" -ForegroundColor Yellow

try {
    Copy-Item -Path "C:\AYPNFP" -Destination $backupDir -Recurse -Force
    Write-Host "✅ Backup created successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create backup: $_" -ForegroundColor Red
    Write-Host "Please create a manual backup before proceeding" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Step 3: Removing exposed file from Git history..." -ForegroundColor Cyan
Write-Host "File to remove: adopt-a-young-parent-firebase-adminsdk-fbsvc-813342c77d.json" -ForegroundColor Yellow

# Remove the file from all commits
try {
    git filter-repo --path adopt-a-young-parent-firebase-adminsdk-fbsvc-813342c77d.json --invert-paths --force
    Write-Host "✅ File removed from Git history" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to remove file from history: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "You can try manually with BFG Repo-Cleaner:" -ForegroundColor Yellow
    Write-Host "1. Download BFG from https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor White
    Write-Host "2. Run: java -jar bfg.jar --delete-files adopt-a-young-parent-firebase-adminsdk-fbsvc-813342c77d.json" -ForegroundColor White
    Write-Host "3. Run: git reflog expire --expire=now --all" -ForegroundColor White
    Write-Host "4. Run: git gc --prune=now --aggressive" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "Step 4: Verifying cleanup..." -ForegroundColor Cyan

# Check if file still exists in history
$checkHistory = git log --all --full-history -- "adopt-a-young-parent-firebase-adminsdk-fbsvc-813342c77d.json" 2>&1
if ([string]::IsNullOrWhiteSpace($checkHistory)) {
    Write-Host "✅ File successfully removed from all commits" -ForegroundColor Green
} else {
    Write-Host "⚠️  File may still exist in history. Please verify manually." -ForegroundColor Yellow
    Write-Host "Run: git log --all --full-history -- '*firebase*adminsdk*.json'" -ForegroundColor White
}

Write-Host ""
Write-Host "Step 5: Next steps..." -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: You must now force-push to update the remote repository!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Add back the remote (git-filter-repo removes it)" -ForegroundColor White
Write-Host "  git remote add origin https://github.com/Instawerx/AYPNFP.git" -ForegroundColor Yellow
Write-Host ""
Write-Host "  # Force push to update GitHub" -ForegroundColor White
Write-Host "  git push origin --force --all" -ForegroundColor Yellow
Write-Host "  git push origin --force --tags" -ForegroundColor Yellow
Write-Host ""
Write-Host "After force-pushing:" -ForegroundColor Cyan
Write-Host "  1. All team members must delete their local copies" -ForegroundColor White
Write-Host "  2. All team members must re-clone the repository" -ForegroundColor White
Write-Host "  3. Verify file is not in GitHub history" -ForegroundColor White
Write-Host "  4. Generate new service account key" -ForegroundColor White
Write-Host "  5. Update all secrets with new key" -ForegroundColor White
Write-Host ""
Write-Host "Backup location: $backupDir" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Cleanup complete! Proceed with force-push when ready." -ForegroundColor Green
Write-Host ""
