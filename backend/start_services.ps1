# Start essential services for BenGo

Write-Host "=================================================="  -ForegroundColor Cyan
Write-Host "   Starting BenGo Essential Services" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

$backendPath = "C:\Users\HP\OneDrive\Documents\test\backend"
Set-Location $backendPath

# Start API Gateway
Write-Host "[1/3] Starting API Gateway (Port 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; py -m api_gateway.main" -WindowStyle Minimized

Start-Sleep -Seconds 3

# Start Wallet Service
Write-Host "[2/3] Starting Wallet Service (Port 8002)..." -ForegroundColor Yellow  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; py -m services.wallet.main" -WindowStyle Minimized

Start-Sleep -Seconds 2

# Start Crypto Service
Write-Host "[3/3] Starting Crypto Service (Port 8006)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; py -m services.crypto.main" -WindowStyle Minimized

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "✅ All essential services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  • API Gateway    : http://localhost:8000" -ForegroundColor White
Write-Host "  • Wallet Service : http://localhost:8002" -ForegroundColor White
Write-Host "  • Crypto Service : http://localhost:8006" -ForegroundColor White
Write-Host ""
Write-Host "Check the minimized PowerShell windows for service logs" -ForegroundColor Yellow
Write-Host "To stop services: Close the PowerShell windows or run: Stop-Process -Name 'python*' -Force" -ForegroundColor Yellow
Write-Host ""
