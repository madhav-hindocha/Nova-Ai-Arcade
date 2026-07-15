@echo off
title Arcane Cards Launcher
echo =========================================
echo  Starting Arcane Cards Local Dev Server...
echo =========================================

:: Start Vite dev server in the background
start /b cmd /c "npm run dev"

echo Waiting for server to start...
timeout /t 3 >nul

echo Opening game in your browser...
start http://localhost:5173

echo.
echo Dev server is running. Press Ctrl+C in this window to stop it.
echo =========================================
pause
