Write-Host "Starting Festival Lineup Evaluator...`n"

# Start backend in a new window
Write-Host "Starting backend (FastAPI)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; uvicorn backend.main:app --reload"

# Give backend a moment to start
Start-Sleep -Seconds 2

# Start frontend in a new window
Write-Host "Starting frontend (Vite)..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm run dev"

Write-Host "`nBoth servers starting in separate windows."
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173"
Write-Host "`nClose the terminal windows to stop the servers."
