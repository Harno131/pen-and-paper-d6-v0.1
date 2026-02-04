@echo off
REM Start-Skript für die Rollenspiel-App (Windows Batch)
REM Beendet alle Node-Prozesse, löscht den Cache und startet die App neu

setlocal enabledelayedexpansion

REM Farben für bessere Lesbarkeit (optional)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "RESET=[0m"

echo.
echo ========================================
echo   Rollenspiel-App - Entwicklungsserver
echo ========================================
echo.

REM Prüfe ob Node.js installiert ist
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %RED%FEHLER: Node.js ist nicht installiert!%RESET%
    echo Bitte installiere Node.js: https://nodejs.org
    pause
    exit /b 1
)

REM Prüfe ob npm installiert ist
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo %RED%FEHLER: npm ist nicht installiert!%RESET%
    echo Bitte installiere npm (normalerweise mit Node.js).
    pause
    exit /b 1
)

REM Prüfe ob package.json existiert
if not exist package.json (
    echo %RED%FEHLER: package.json nicht gefunden!%RESET%
    echo Bitte führe dieses Skript im Projektverzeichnis aus.
    pause
    exit /b 1
)

REM Prüfe ob node_modules existiert, wenn nicht: npm install
if not exist node_modules (
    echo %YELLOW%⚠ node_modules nicht gefunden. Installiere Dependencies...%RESET%
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo %RED%FEHLER beim npm install!%RESET%
        pause
        exit /b 1
    )
    echo %GREEN%✓ Dependencies installiert%RESET%
    echo.
)

REM Prüfe ob Port 3000 bereits belegt ist (optional - kann übersprungen werden)
netstat -ano | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo %YELLOW%⚠ Port 3000 scheint bereits belegt zu sein.%RESET%
    echo Möglicherweise läuft bereits ein Server.
    echo.
    choice /C YN /M "Trotzdem fortfahren"
    if errorlevel 2 exit /b 0
    echo.
)

REM Beende nur Node-Prozesse die auf Port 3000 lauschen (spezifischer)
echo 🛑 Beende laufende Node-Prozesse auf Port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    if !errorlevel! == 0 (
        echo ✓ Prozess %%a beendet
    )
)

REM Fallback: Beende alle Node-Prozesse (wenn Port-Check nicht funktioniert)
REM Nur wenn kein Prozess auf Port 3000 gefunden wurde
netstat -ano | findstr ":3000" >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo 🛑 Beende alle Node-Prozesse...
    taskkill /F /IM node.exe >nul 2>&1
    if %errorlevel% == 0 (
        echo ✓ Node-Prozesse beendet
    ) else (
        echo ✓ Keine Node-Prozesse gefunden
    )
)

REM Kurze Pause damit Prozesse sauber beendet werden
timeout /t 1 /nobreak >nul

REM Cache löschen (optional - kann mit Parameter übersprungen werden)
if "%1"=="--keep-cache" (
    echo ℹ Cache wird beibehalten (--keep-cache Parameter)
) else (
    echo 🗑️ Lösche Cache (.next Ordner)...
    if exist .next (
        rmdir /s /q .next
        if %errorlevel% == 0 (
            echo ✓ Cache gelöscht
        ) else (
            echo %YELLOW%⚠ Fehler beim Löschen des Caches (möglicherweise noch in Verwendung)%RESET%
        )
    ) else (
        echo ✓ Kein Cache gefunden
    )
)

echo.
echo 🚀 Starte Entwicklungsserver...
echo.
echo %GREEN%Die App wird unter http://localhost:3000 erreichbar sein%RESET%
echo %YELLOW%Drücke Strg+C zum Beenden%RESET%
echo.
echo ========================================
echo.

REM Starte den Entwicklungsserver
call npm run dev

REM Falls npm run dev fehlschlägt
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo %RED%FEHLER: Entwicklungsserver konnte nicht gestartet werden!%RESET%
    echo.
    echo Mögliche Lösungen:
    echo - Prüfe ob alle Dependencies installiert sind: npm install
    echo - Prüfe ob Port 3000 frei ist
    echo - Prüfe die Konsolen-Ausgabe auf Fehlermeldungen
    echo.
    pause
    exit /b 1
)

endlocal