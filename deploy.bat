@echo off
echo ========================================
echo   Deployment zu Vercel
echo ========================================
echo.

REM Prüfe ob Git installiert ist
where git >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo FEHLER: Git ist nicht installiert!
    echo Bitte installiere Git: https://git-scm.com
    pause
    exit /b 1
)

REM Prüfe ob wir in einem Git-Repository sind
git rev-parse --git-dir >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo FEHLER: Kein Git-Repository gefunden!
    echo Bitte initialisiere zuerst: git init
    pause
    exit /b 1
)

REM Prüfe ob es Änderungen gibt
git diff --quiet
if %ERRORLEVEL% EQU 0 (
    git diff --cached --quiet
    if %ERRORLEVEL% EQU 0 (
        echo Keine Änderungen gefunden!
        echo Nichts zu deployen.
        pause
        exit /b 0
    )
)

REM Commit-Nachricht abfragen
if "%1"=="" (
    set /p COMMIT_MSG="Commit-Nachricht: "
) else (
    set COMMIT_MSG=%*
)

if "%COMMIT_MSG%"=="" (
    echo FEHLER: Keine Commit-Nachricht angegeben!
    echo Verwendung: deploy.bat "Meine Änderung"
    pause
    exit /b 1
)

echo.
echo Schritt 1: Änderungen hinzufügen...
git add .
if %ERRORLEVEL% NEQ 0 (
    echo FEHLER beim git add!
    pause
    exit /b 1
)

echo Schritt 2: Committen...
git commit -m "%COMMIT_MSG%"
if %ERRORLEVEL% NEQ 0 (
    echo FEHLER beim git commit!
    pause
    exit /b 1
)

echo Schritt 3: Auf GitHub pushen...
git push
if %ERRORLEVEL% NEQ 0 (
    echo FEHLER beim git push!
    echo Prüfe deine Git-Konfiguration.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Erfolgreich deployed!
echo ========================================
echo.
echo Vercel baut jetzt automatisch die neue Version...
echo Deine Spieler sehen die Änderungen in 1-2 Minuten.
echo.
echo Prüfe Status: https://vercel.com/dashboard
echo.
pause












