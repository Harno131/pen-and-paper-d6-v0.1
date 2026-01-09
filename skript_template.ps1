# ============================================
# Projekt: [PROJEKTNAME]
# Beschreibung: [WAS MACHT DAS SKRIPT?]
# ============================================

# WICHTIG: Automatisch zum Skript-Verzeichnis wechseln
# Dadurch funktioniert das Skript unabhängig vom Ordnernamen oder Pfad
Set-Location $PSScriptRoot

# ============================================
# Konfiguration
# ============================================

# Hier können Projekt-spezifische Variablen definiert werden
$ProjectName = "Mein Projekt"
$Environment = "development"  # development, staging, production

# ============================================
# Funktionen
# ============================================

function Write-Header {
    param([string]$Title)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ $Message" -ForegroundColor Cyan
}

function Test-Command {
    param([string]$Command)
    
    $null = Get-Command $Command -ErrorAction SilentlyContinue
    return $?
}

# ============================================
# Hauptlogik
# ============================================

Write-Header "Starte $ProjectName"

# Beispiel: Prüfe ob Tool installiert ist
# if (-not (Test-Command "flutter")) {
#     Write-Error "Flutter nicht gefunden!"
#     Write-Info "Bitte installiere Flutter: https://flutter.dev"
#     exit 1
# }

# Beispiel: Führe Befehl aus
# try {
#     Write-Info "Starte Projekt..."
#     flutter run -d edge
#     
#     if ($LASTEXITCODE -eq 0) {
#         Write-Success "Projekt gestartet!"
#     } else {
#         Write-Error "Fehler beim Starten!"
#         exit 1
#     }
# } catch {
#     Write-Error "Fehler: $_"
#     exit 1
# }

# ============================================
# ENDE
# ============================================

Write-Host ""
Write-Success "Fertig!"

