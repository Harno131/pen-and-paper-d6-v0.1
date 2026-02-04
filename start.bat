@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   Rollenspiel-App - Entwicklungsserver
echo ========================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo FEHLER: Node.js ist nicht installiert!
  pause
  exit /b 1
)

where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo FEHLER: npm ist nicht installiert!
  pause
  exit /b 1
)

if not exist package.json (
  echo FEHLER: package.json nicht gefunden!
  pause
  exit /b 1
)

call npm run dev
pause