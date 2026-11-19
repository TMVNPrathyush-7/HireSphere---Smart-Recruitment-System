Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " Smart Recruitment & Hiring Platform - B.Tech Final Year Capstone" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan

Write-Host "Starting Backend API (Port 5000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Write-Host "Starting Python AI FastAPI Microservice (Port 8000)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ai-service; python -m uvicorn app.main:app --reload --port 8000"

Write-Host "Starting React Frontend (Port 5173)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host "All 3 services successfully launched!" -ForegroundColor Green
Write-Host "Access the application at: http://localhost:5173" -ForegroundColor Yellow
Write-Host "=====================================================================" -ForegroundColor Cyan
