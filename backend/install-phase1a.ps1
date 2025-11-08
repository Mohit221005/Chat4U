# Phase 1A Package Installation Script (PowerShell)
# Run this from the backend directory

Write-Host "📦 Installing Phase 1A dependencies..." -ForegroundColor Cyan

npm install express-rate-limit helmet express-validator winston

Write-Host ""
Write-Host "✅ Dependencies installed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. Verify .env file has all required variables"
Write-Host "2. Test locally: npm run dev"
Write-Host "3. Check logs directory: dir logs\"
Write-Host "4. Test endpoints with rate limiting"
Write-Host ""
Write-Host "📖 See PHASE_1A_IMPLEMENTATION.md for complete documentation" -ForegroundColor Cyan
