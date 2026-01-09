# Start-Skript Anleitung

## Verwendung

### Option 1: PowerShell-Skript direkt ausführen
```powershell
.\start.ps1
```

### Option 2: Batch-Datei (Windows)
```cmd
start.bat
```

### Option 3: Über npm
```bash
npm run restart
```

## Was macht das Skript?

1. 🛑 **Beendet alle Node-Prozesse** - Stoppt laufende Entwicklungsserver
2. 🗑️ **Löscht den Cache** - Entfernt den `.next` Ordner (Next.js Build-Cache)
3. 🚀 **Startet die App neu** - Führt `npm run dev` aus

## Hinweis

Falls PowerShell die Ausführung des Skripts verhindert, führe zuerst aus:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```













