@echo off
echo =====================================================================
echo  Smart Recruitment & Hiring Platform - B.Tech Final Year Capstone
echo =====================================================================
echo Starting Backend API (Port 5000)...
start "Backend API (Port 5000)" cmd /k "cd backend && npm run dev"

echo Starting AI FastAPI Microservice (Port 8000)...
start "AI Service (Port 8000)" cmd /k "cd ai-service && python -m uvicorn app.main:app --reload --port 8000"

echo Starting React Frontend (Port 5173)...
start "React Frontend (Port 5173)" cmd /k "cd frontend && npm run dev"

echo =====================================================================
echo All services launched!
echo Open your browser at: http://localhost:5173
echo =====================================================================
pause
