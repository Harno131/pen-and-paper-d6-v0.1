# 🔍 Was genau fehlt zum Verbinden?

## ✅ Was bereits vorhanden ist:

1. ✅ **Internet-Verbindung** - vorhanden
2. ✅ **Supabase-Konfiguration** - `.env.local` mit Keys vorhanden
3. ✅ **Node.js & npm** - installiert

---

## ❓ Was könnte fehlen:

### 1. App läuft nicht lokal
**Prüfen:**
```powershell
npm run dev
```
**Falls Fehler:** Siehe `SETUP.md`

---

### 2. Netzwerk-Zugriff für Handy

**A) IP-Adresse finden:**
```powershell
ipconfig | Select-String "IPv4"
```
Du erhältst z.B.: `192.168.1.100`

**B) Dev-Server für Netzwerk öffnen:**

Prüfe `package.json` - sollte sein:
```json
"dev": "next dev"
```

Falls Handy nicht verbinden kann, ändere zu:
```json
"dev": "next dev -H 0.0.0.0"
```

**C) Firewall erlauben:**
```powershell
New-NetFirewallRule -DisplayName "Node.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**D) Auf Handy öffnen:**
- Handy muss im **gleichen WLAN** sein
- Browser öffnen
- URL eingeben: `http://192.168.1.100:3000` (deine IP)

---

### 3. Supabase-Datenbank nicht eingerichtet

**Prüfen:**
1. Gehe zu https://supabase.com
2. Öffne dein Projekt
3. Gehe zu SQL Editor
4. Prüfe ob Tabellen existieren: `groups`, `characters`, `group_members`

**Falls Tabellen fehlen:**
- Führe `supabase/migrations/001_initial_schema.sql` aus
- Siehe `DATENBANK_SETUP.md`

---

### 4. Online-Hosting fehlt (für Zugriff außerhalb WLAN)

**Für Zugriff von überall (nicht nur WLAN):**

1. **Deploy auf Vercel** (kostenlos):
   - Siehe `QUICK_START.md`
   - Nach Deploy: URL wie `https://deine-app.vercel.app`
   - Diese URL funktioniert überall (auch ohne WLAN)

2. **Oder: Lokal mit ngrok** (für temporären Zugriff):
   ```powershell
   # Installiere ngrok: https://ngrok.com
   ngrok http 3000
   # Du erhältst eine URL wie: https://xxxx.ngrok.io
   ```

---

## 🎯 Schnell-Lösung: Was genau willst du erreichen?

### Szenario A: "App auf meinem Handy öffnen (im WLAN)"
**Lösung:**
1. Starte: `npm run dev`
2. Finde IP: `ipconfig | Select-String "IPv4"`
3. Öffne auf Handy: `http://192.168.x.x:3000`
4. **Fertig!**

---

### Szenario B: "Spieler sollen von überall beitreten können"
**Lösung:**
1. Deploy auf Vercel (siehe `QUICK_START.md`)
2. Teile die Vercel-URL mit Spielern
3. **Fertig!**

---

### Szenario C: "Daten sollen zwischen Geräten synchronisiert werden"
**Lösung:**
1. ✅ Supabase ist bereits konfiguriert
2. Prüfe ob Datenbank-Schema eingerichtet ist (siehe Punkt 3 oben)
3. Starte App: `npm run dev`
4. **Fertig!**

---

## 🆘 Was genau funktioniert nicht?

**Beschreibe das Problem:**
- [ ] App startet nicht (`npm run dev` gibt Fehler)
- [ ] App lädt nicht auf Handy (404 oder Timeout)
- [ ] Gruppe kann nicht erstellt werden
- [ ] Daten werden nicht gespeichert
- [ ] Sonstiges: _______________

**Dann schaue in `VERBINDUNG_CHECKLISTE.md` für detaillierte Hilfe!**


