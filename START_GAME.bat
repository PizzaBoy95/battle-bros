@echo off
echo ============================================
echo   BATTLE BROS - Starting servers...
echo ============================================
echo.
echo [1/2] Starting game server on port 3001...
start "Battle Bros Server" cmd /k "cd /d "%~dp0server" && npm start"

echo Waiting 3 seconds for server to initialise...
timeout /t 3 /nobreak >nul

echo [2/2] Starting game client on port 5173...
start "Battle Bros Client" cmd /k "cd /d "%~dp0client" && npm run dev"

echo.
echo ============================================
echo   Both servers are starting!
echo.
echo   Open your browser to:
echo   http://localhost:5173
echo.
echo   Share your local IP for LAN play, or
echo   run:  npx ngrok http 5173
echo   for a public shareable URL.
echo ============================================
timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"
