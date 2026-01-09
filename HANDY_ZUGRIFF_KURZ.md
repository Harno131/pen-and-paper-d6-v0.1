# 📱 App auf Handy öffnen - Kurzanleitung

## ✅ Deine IP-Adresse: `192.168.56.1`

## 🚀 So geht's (3 Schritte):

### 1. App starten
```powershell
npm run dev
```

### 2. Auf Handy öffnen
- Handy muss im **gleichen WLAN** sein wie der PC
- Browser öffnen (Chrome, Safari, etc.)
- URL eingeben: **`http://192.168.56.1:3000`**

### 3. Fertig! 🎉

---

## ⚠️ Falls es nicht funktioniert:

### Firewall erlauben (einmalig):
```powershell
New-NetFirewallRule -DisplayName "Node.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

### Prüfen:
- ✅ Läuft `npm run dev` noch?
- ✅ Handy im gleichen WLAN?
- ✅ Firewall erlaubt Port 3000?

---

## 📖 Detaillierte Anleitung:
Siehe `HANDY_ZUGRIFF.md`
