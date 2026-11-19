@echo off
title SmartRecruit AI - Live Mobile Presentation Tunnel
cd /d "%~dp0"

echo =====================================================================
echo    SmartRecruit AI - Live Presentation & Mobile Tunnel
echo =====================================================================
echo.
echo [1/4] Starting Backend API (Port 5000)...
start "SmartRecruit - Backend (:5000)" cmd /k "cd backend && npm run dev"

echo [2/4] Starting AI Microservice (Port 8000)...
start "SmartRecruit - AI Service (:8000)" cmd /k "cd ai-service && python -m uvicorn app.main:app --port 8000"

echo [3/4] Starting React Frontend (Port 5173)...
start "SmartRecruit - Frontend (:5173)" cmd /k "cd frontend && npm run dev"

echo.
echo Waiting 5 seconds for local services to warm up...
timeout /t 5 /nobreak >nul

echo.
echo =====================================================================
echo [4/4] Launching Secure Cloudflare Tunnel...
echo Your public HTTPS link will appear in a few seconds below!
echo Look for the link ending in: .trycloudflare.com
echo.
echo You can copy that link, open it on your phone, or share it!
echo (Press Ctrl + C whenever you want to stop the live presentation)
echo =====================================================================
echo.
"%~dp0cloudflared.exe" tunnel --url http://localhost:5173
pause
