# ============================================
# Supabase-Keys aktualisieren
# Ersetzt alte Keys durch neue "Fallcrest" Keys
# ============================================

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Supabase-Keys aktualisieren" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prüfe ob .env.local existiert
if (-not (Test-Path ".env.local")) {
    Write-Host "❌ Fehler: .env.local nicht gefunden!" -ForegroundColor Red
    Write-Host "   Erstelle die Datei manuell oder führe die Anleitung in SUPABASE_KEYS_AUSTAUSCH.md aus." -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Aktuelle Keys in .env.local:" -ForegroundColor Yellow
Write-Host ""
Get-Content .env.local | Select-String "SUPABASE"
Write-Host ""

# Frage nach neuen Keys
Write-Host "Bitte gib die neuen Keys aus dem 'Fallcrest' Projekt ein:" -ForegroundColor Cyan
Write-Host ""

$newUrl = Read-Host "NEXT_PUBLIC_SUPABASE_URL (z.B. https://xxxxx.supabase.co)"
$newAnonKey = Read-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY (beginnt mit sb_publishable_)"
$newServiceKey = Read-Host "SUPABASE_SERVICE_ROLE_KEY (beginnt mit sb_secret_)"

# Validiere Eingaben
if ([string]::IsNullOrWhiteSpace($newUrl) -or 
    [string]::IsNullOrWhiteSpace($newAnonKey) -or 
    [string]::IsNullOrWhiteSpace($newServiceKey)) {
    Write-Host "❌ Fehler: Alle Felder müssen ausgefüllt sein!" -ForegroundColor Red
    exit 1
}

# Erstelle Backup
$backupFile = ".env.local.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item ".env.local" $backupFile
Write-Host "✅ Backup erstellt: $backupFile" -ForegroundColor Green

# Lese aktuelle Datei
$content = Get-Content ".env.local"

# Ersetze Keys
$newContent = $content | ForEach-Object {
    if ($_ -match "^NEXT_PUBLIC_SUPABASE_URL=") {
        "NEXT_PUBLIC_SUPABASE_URL=$newUrl"
    }
    elseif ($_ -match "^NEXT_PUBLIC_SUPABASE_ANON_KEY=") {
        "NEXT_PUBLIC_SUPABASE_ANON_KEY=$newAnonKey"
    }
    elseif ($_ -match "^SUPABASE_SERVICE_ROLE_KEY=") {
        "SUPABASE_SERVICE_ROLE_KEY=$newServiceKey"
    }
    else {
        $_
    }
}

# Schreibe neue Datei
$newContent | Set-Content ".env.local"

Write-Host ""
Write-Host "✅ .env.local wurde aktualisiert!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Neue Keys:" -ForegroundColor Yellow
Get-Content .env.local | Select-String "SUPABASE"
Write-Host ""
Write-Host "💡 Nächste Schritte:" -ForegroundColor Cyan
Write-Host "   1. Starte die App neu: npm run dev" -ForegroundColor White
Write-Host "   2. Prüfe ob die App funktioniert" -ForegroundColor White
Write-Host "   3. Falls Probleme: Siehe Backup in $backupFile" -ForegroundColor White
Write-Host ""
