# 📱 App auf dem Handy öffnen - Schritt für Schritt

## 🎯 Schnell-Anleitung (2 Minuten)

### Voraussetzungen:
- ✅ App läuft auf dem PC (`npm run dev`)
- ✅ Handy und PC sind im **gleichen WLAN**

---

## 📋 Schritt-für-Schritt:

### Schritt 1: App auf PC starten

```powershell
npm run dev
```

Du siehst:
```
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

**Wichtig:** Notiere dir die **Network-URL** (z.B. `http://192.168.56.1:3000`)

---

### Schritt 2: IP-Adresse finden (falls nicht angezeigt)

Falls die Network-URL nicht angezeigt wird:

```powershell
ipconfig | Select-String "IPv4"
```

Du erhältst z.B.:
```
IPv4-Adresse  . . . . . . . . . . : 192.168.56.1
```

**Deine URL ist dann:** `http://192.168.56.1:3000`

---

### Schritt 3: Firewall erlauben (einmalig)

Falls das Handy nicht verbinden kann:

```powershell
New-NetFirewallRule -DisplayName "Node.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

---

### Schritt 4: Auf Handy öffnen

1. **Stelle sicher:** Handy ist im **gleichen WLAN** wie der PC
2. **Öffne Browser** auf dem Handy (Chrome, Safari, Firefox)
3. **Tippe ein:** `http://192.168.56.1:3000` (deine IP-Adresse)
4. **Fertig!** 🎉

---

## 🔧 Falls es nicht funktioniert:

### Problem: "Kann nicht verbinden" / "Seite lädt nicht"

**Lösung 1: Prüfe WLAN**
- Handy und PC müssen im **gleichen WLAN** sein
- Nicht: Handy im WLAN, PC per Kabel → funktioniert nicht
- Nicht: Handy im Mobilnetz, PC im WLAN → funktioniert nicht

**Lösung 2: Prüfe Firewall**
```powershell
# Erlaube Port 3000
New-NetFirewallRule -DisplayName "Node.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**Lösung 3: Dev-Server für Netzwerk öffnen**

Prüfe `package.json`:
```json
"dev": "next dev"
```

Falls Handy nicht verbinden kann, ändere zu:
```json
"dev": "next dev -H 0.0.0.0"
```

Dann neu starten:
```powershell
npm run dev
```

**Lösung 4: Prüfe ob App läuft**
- Läuft `npm run dev` noch?
- Siehst du "Local: http://localhost:3000"?
- Öffne auf PC: `http://localhost:3000` → Funktioniert das?

---

### Problem: "Seite zeigt Fehler"

**Lösung:**
- Prüfe Browser-Konsole (F12 auf PC)
- Prüfe ob Supabase konfiguriert ist (siehe `.env.local`)
- Falls Fehler: App funktioniert trotzdem mit localStorage

---

## 🌐 Alternative: Online-Zugriff (von überall)

Falls du die App von überall (nicht nur im WLAN) nutzen willst:

### Option 1: Vercel Deploy (kostenlos, empfohlen)

1. **Deploy auf Vercel:**
   - Siehe `QUICK_START.md`
   - Nach Deploy: URL wie `https://deine-app.vercel.app`

2. **Auf Handy öffnen:**
   - Öffne Browser
   - Gehe zu: `https://deine-app.vercel.app`
   - **Fertig!** Funktioniert überall (auch ohne WLAN)

### Option 2: ngrok (temporär, für Tests)

1. **Installiere ngrok:** https://ngrok.com
2. **Starte Tunnel:**
   ```powershell
   ngrok http 3000
   ```
3. **Du erhältst eine URL:** `https://xxxx.ngrok.io`
4. **Auf Handy öffnen:** Diese URL
5. **Hinweis:** URL ändert sich bei jedem Start (kostenlose Version)

---

## 💡 Tipps:

### App auf Startbildschirm hinzufügen (PWA)

**Android (Chrome):**
1. Öffne die App im Browser
2. Menü (3 Punkte) → "Zum Startbildschirm hinzufügen"
3. App erscheint wie eine echte App

**iOS (Safari):**
1. Öffne die App im Browser
2. Teilen-Button → "Zum Home-Bildschirm"
3. App erscheint wie eine echte App

### Lesezeichen speichern

- Füge die URL zu den Lesezeichen hinzu
- Für schnellen Zugriff

### IP-Adresse ändert sich?

- Wenn dein Router die IP ändert, finde sie neu mit `ipconfig`
- Oder: Nutze Vercel (URL bleibt gleich)

---

## ✅ Checkliste:

- [ ] App läuft auf PC (`npm run dev`)
- [ ] IP-Adresse bekannt (z.B. `192.168.56.1`)
- [ ] Handy im gleichen WLAN
- [ ] Firewall erlaubt Port 3000
- [ ] Browser auf Handy geöffnet
- [ ] URL eingegeben: `http://192.168.56.1:3000`
- [ ] App lädt! 🎉

---

## 🆘 Noch Probleme?

**Beschreibe:**
- Was genau passiert? (Fehlermeldung, Seite lädt nicht, etc.)
- Welche IP-Adresse verwendest du?
- Sind Handy und PC im gleichen WLAN?
- Läuft `npm run dev` noch?

**Dann schaue in:**
- `VERBINDUNG_CHECKLISTE.md` - Detaillierte Fehlerbehebung
- `WAS_FEHLT.md` - Schnellübersicht
