# Deployment-Script für PowerShell
# Verwendung: .\deploy.ps1 "Meine Änderung"

param(
    [Parameter(Mandatory=$false)]
    [string]$CommitMessage = ""
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deployment zu Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Prüfe ob Git installiert ist
try {
    $null = Get-Command git -ErrorAction Stop
} catch {
    Write-Host "FEHLER: Git ist nicht installiert!" -ForegroundColor Red
    Write-Host "Bitte installiere Git: https://git-scm.com" -ForegroundColor Yellow
    Read-Host "Drücke Enter zum Beenden"
    exit 1
}

# Prüfe ob wir in einem Git-Repository sind
try {
    $null = git rev-parse --git-dir 2>$null
} catch {
    Write-Host "FEHLER: Kein Git-Repository gefunden!" -ForegroundColor Red
    Write-Host "Bitte initialisiere zuerst: git init" -ForegroundColor Yellow
    Read-Host "Drücke Enter zum Beenden"
    exit 1
}

# Prüfe ob es Änderungen gibt
$hasChanges = $false
try {
    $null = git diff --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { $hasChanges = $true }
    
    $null = git diff --cached --quiet 2>$null
    if ($LASTEXITCODE -ne 0) { $hasChanges = $true }
} catch {
    $hasChanges = $true
}

if (-not $hasChanges) {
    Write-Host "Keine Änderungen gefunden!" -ForegroundColor Yellow
    Write-Host "Nichts zu deployen." -ForegroundColor Yellow
    Read-Host "Drücke Enter zum Beenden"
    exit 0
}

# Commit-Nachricht abfragen falls nicht angegeben
if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    $CommitMessage = Read-Host "Commit-Nachricht"
}

if ([string]::IsNullOrWhiteSpace($CommitMessage)) {
    Write-Host "FEHLER: Keine Commit-Nachricht angegeben!" -ForegroundColor Red
    Write-Host "Verwendung: .\deploy.ps1 'Meine Änderung'" -ForegroundColor Yellow
    Read-Host "Drücke Enter zum Beenden"
    exit 1
}

Write-Host ""
Write-Host "Schritt 1: Änderungen hinzufügen..." -ForegroundColor Green
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "FEHLER beim git add!" -ForegroundColor Red
    Read-Host "Drücke Enter zum Beenden"
    exit 1
}

Write-Host "Schritt 2: Committen..." -ForegroundColor Green
git commit -m $CommitMessage
if ($LASTEXITCODE -ne 0) {
    Write-Host "FEHLER beim git commit!" -ForegroundColor Red
    Read-Host "Drücke Enter zum Beenden"
    exit 1
}

Write-Host "Schritt 3: Auf GitHub pushen..." -ForegroundColor Green
git push
if ($LASTEXITCODE -ne 0) {
    Write-Host "FEHLER beim git push!" -ForegroundColor Red
    Write-Host "Prüfe deine Git-Konfiguration." -ForegroundColor Yellow
    Read-Host "Drücke Enter zum Beenden"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✅ Erfolgreich deployed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Vercel baut jetzt automatisch die neue Version..." -ForegroundColor Cyan
Write-Host "Deine Spieler sehen die Änderungen in 1-2 Minuten." -ForegroundColor Cyan
Write-Host ""
Write-Host "Prüfe Status: https://vercel.com/dashboard" -ForegroundColor Yellow
Write-Host ""
Read-Host "Drücke Enter zum Beenden"












