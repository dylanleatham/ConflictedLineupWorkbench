@echo off
echo Starting Festival Lineup Evaluator...
echo.

:: Start backend in a new window
echo Starting backend (FastAPI)...
start "Backend - FastAPI" cmd /k "cd /d %~dp0 && uvicorn backend.main:app --reload"

:: Give backend a moment to start
timeout /t 2 /nobreak > nul

:: Start frontend in a new window
echo Starting frontend (Vite)...
start "Frontend - Vite" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Both servers starting in separate windows.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the servers.
