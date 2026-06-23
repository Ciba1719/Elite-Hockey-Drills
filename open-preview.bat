@echo off
cd /d "%~dp0"
title Elite Hockey Drills - Preview Launcher
echo ===================================================
echo   ELITE HOCKEY DRILLS - LOCAL PREVIEW
echo ===================================================
echo.
echo Starting the local server in a separate window...
start "EHD Preview Server (KEEP THIS WINDOW OPEN)" cmd /k node _serve.mjs
echo Waiting a moment for it to start...
timeout /t 2 /nobreak >nul
echo Opening the site in your browser...
start "" "http://localhost:8123/program-9-11-office.html"
echo.
echo ---------------------------------------------------
echo  The server now runs in the window titled:
echo    "EHD Preview Server (KEEP THIS WINDOW OPEN)"
echo.
echo  Keep that window open while you review the site.
echo  Closing it stops the site (you'd get "refused to
echo  connect" again).
echo.
echo  You can close THIS window now.
echo ---------------------------------------------------
timeout /t 10 /nobreak >nul
