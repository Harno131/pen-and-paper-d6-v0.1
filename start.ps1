# Start-Skript für die Rollenspiel-App
# Beendet alle Node-Prozesse, löscht den Cache und startet die App neu

Write-Host "🛑 Beende alle Node-Prozesse..." -ForegroundColor Yellow

# Beende alle Node-Prozesse
$nodeProcesses = Get-Process | Where-Object {$_.ProcessName -like "*node*"}
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✓ Node-Prozesse beendet" -ForegroundColor Green
} else {
    Write-Host "✓ Keine Node-Prozesse gefunden" -ForegroundColor Green
}

# Warte kurz, damit Prozesse beendet werden können
Start-Sleep -Seconds 2

Write-Host "🗑️ Lösche Cache (.next Ordner)..." -ForegroundColor Yellow

# Lösche .next Ordner (Next.js Cache)
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force
    Write-Host "✓ Cache gelöscht" -ForegroundColor Green
} else {
    Write-Host "✓ Kein Cache gefunden" -ForegroundColor Green
}

Write-Host "🚀 Starte Entwicklungsserver..." -ForegroundColor Yellow
Write-Host ""

# Starte den Entwicklungsserver
npm run dev













