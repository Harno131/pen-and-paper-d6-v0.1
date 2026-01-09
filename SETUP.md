# Setup-Anleitung für die Rollenspiel-App

## Voraussetzungen

Die App benötigt **Node.js** (Version 18 oder höher) und **npm**.

### Node.js installieren

1. Gehen Sie zu https://nodejs.org/
2. Laden Sie die LTS-Version herunter (empfohlen: Version 20.x oder höher)
3. Installieren Sie Node.js mit den Standardeinstellungen
4. Starten Sie PowerShell/Terminal neu

### Installation prüfen

Öffnen Sie PowerShell und führen Sie aus:
```powershell
node --version
npm --version
```

Beide Befehle sollten Versionsnummern anzeigen.

## App starten

1. Öffnen Sie PowerShell im Projektverzeichnis:
   ```powershell
   cd "C:\DEV\FM P&P"
   ```

2. Installieren Sie die Dependencies:
   ```powershell
   npm install
   ```

3. Starten Sie den Entwicklungsserver:
   ```powershell
   npm run dev
   ```

4. Öffnen Sie im Browser:
   ```
   http://localhost:3000
   ```

## Alternative: Node.js über nvm-windows installieren

Falls Sie mehrere Node.js-Versionen verwalten möchten:

1. Laden Sie nvm-windows von https://github.com/coreybutler/nvm-windows/releases herunter
2. Installieren Sie nvm-windows
3. Installieren Sie Node.js:
   ```powershell
   nvm install 20
   nvm use 20
   ```

## Fehlerbehebung

### "npm ist nicht erkannt"
- Node.js ist nicht installiert oder nicht im PATH
- Starten Sie PowerShell/Terminal neu nach der Installation
- Prüfen Sie die Umgebungsvariablen

### Port 3000 bereits belegt
- Ändern Sie den Port in `package.json`:
  ```json
  "dev": "next dev -p 3001"
  ```

### Dependencies-Fehler
- Löschen Sie `node_modules` und `package-lock.json`
- Führen Sie `npm install` erneut aus

