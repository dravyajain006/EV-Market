@echo off
echo ========================================================
echo Starting EV Market Analysis and BI Platform...
echo ========================================================
start "EV Market Server (Port 5000)" cmd /k "cd /d %~dp0server && npm.cmd run dev"
timeout /t 3 /nobreak >nul
start "EV Market Client (Port 5173)" cmd /k "cd /d %~dp0client && npm.cmd run dev"

echo.
echo Both servers have been launched in separate windows!
echo - Backend API:  http://localhost:5000
echo - Frontend UI:   http://localhost:5173
echo.
