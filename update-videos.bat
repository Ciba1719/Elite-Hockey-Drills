@echo off
title Elite Hockey Drills - Publish New Videos
cd /d "%~dp0"

echo ================================================
echo    ELITE HOCKEY DRILLS  -  PUBLISH NEW VIDEOS
echo ================================================
echo.
echo Please wait, this takes about 30 seconds...
echo.

echo [1 of 4] Checking Cloudflare for newly uploaded videos...
call node match-videos.mjs --write >nul
if errorlevel 1 goto error

echo [2 of 4] Rebuilding the exercise (library) pages...
call node generate.js >nul
if errorlevel 1 goto error

echo [3 of 4] Rebuilding the main program page...
call node build.js >nul
if errorlevel 1 goto error

echo [4 of 4] Adding videos to the age-group programs...
call node wire-program-videos.mjs >nul
if errorlevel 1 goto error

echo Saving changes...
set DIDCOMMIT=0
git add exercises/ exercises.json sitemap.xml video-map.json program*.html >nul 2>&1
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "Wire new R2 demo videos into exercise + program pages (%date% %time%)" >nul
    set DIDCOMMIT=1
)

echo Publishing to the live website...
git push origin main >nul 2>&1
if errorlevel 1 goto pusherror

echo.
echo ================================================
if "%DIDCOMMIT%"=="1" (
    echo   SUCCESS^^!  New videos are now publishing.
    echo   The live site updates in about 1-2 minutes.
    echo   Then refresh the page:  Ctrl + Shift + R
) else (
    echo   All done - no NEW videos were found.
    echo   Your site is already up to date.
)
echo ================================================
goto done

:pusherror
echo.
echo ################################################
echo   The build worked, but PUBLISHING failed.
echo   Your changes are saved on this computer but
echo   are NOT live yet. Check your internet and run
echo   this again, or send a screenshot to Claude.
echo ################################################
goto done

:error
echo.
echo ################################################
echo   SOMETHING WENT WRONG during the build.
echo   Read the messages above, then send a
echo   screenshot to Claude. Nothing was published.
echo ################################################

:done
echo.
echo Press any key to close this window...
pause >nul
