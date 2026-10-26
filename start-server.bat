@echo off
echo Starting EV Market Analysis Backend Server (Port 5000)...
cd /d "%~dp0server"
npm.cmd run dev
pause
