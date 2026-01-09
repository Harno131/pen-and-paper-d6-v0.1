# 🔌 Verbindungs-Checkliste: Was fehlt zum Verbinden?

## ✅ Schnell-Check: Was ist bereits vorhanden?

### 1. Internet-Verbindung
- ✅ Internet ist vorhanden (bestätigt)

### 2. App läuft lokal
- [ ] Dev-Server läuft (`npm run dev`)
- [ ] App öffnet sich im Browser auf `http://localhost:3000`

### 3. Supabase-Konfiguration (für Online-Verbindung)
- [ ] `.env.local` Datei existiert
- [ ] `NEXT_PUBLIC_SUPABASE_URL` ist gesetzt
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ist gesetzt
- [ ] Supabase-Projekt ist erstellt
- [ ] Datenbank-Schema ist eingerichtet

### 4. Netzwerk-Zugriff (für Handy im WLAN)
- [ ] PC und Handy sind im gleichen WLAN
- [ ] Windows Firewall erlaubt Port 3000
- [ ] IP-Adresse des PCs ist bekannt
- [ ] Dev-Server ist für Netzwerk erreichbar

---

## 🎯 Was genau fehlt? Schritt-für-Schritt prüfen

### Schritt 1: Prüfe ob die App läuft

```powershell
# Im Projektordner:
npm run dev
```

**Erwartete Ausgabe:**
```
- Local:        http://localhost:3000
- Network:      http://192.168.x.x:3000
```

**Falls Fehler:**
- Prüfe ob Port 3000 frei ist
- Prüfe ob Node.js installiert ist (`node --version`)

---

### Schritt 2: Prüfe Supabase-Konfiguration

Öffne `.env.local` und prüfe:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

**Falls Datei fehlt oder leer:**
1. Erstelle `.env.local` im Projektordner
2. Folge der Anleitung in `SUPABASE_KEYS_ANLEITUNG.md`
3. Oder nutze die App ohne Supabase (nur lokal)

**Falls Werte fehlen:**
1. Gehe zu https://supabase.com
2. Erstelle ein Projekt (kostenlos)
3. Gehe zu Settings → API
4. Kopiere Project URL und Publishable key
5. Füge sie in `.env.local` ein

---

### Schritt 3: Prüfe Netzwerk-Zugriff (für Handy)

**A) IP-Adresse finden:**

```powershell
ipconfig | Select-String "IPv4"
```

**B) Firewall prüfen:**

```powershell
# Erlaube Node.js in der Firewall
New-NetFirewallRule -DisplayName "Node.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

**C) Dev-Server für Netzwerk öffnen:**

Prüfe `package.json`:
```json
"dev": "next dev"
```

Falls nötig, ändere zu:
```json
"dev": "next dev -H 0.0.0.0"
```

**D) Auf Handy öffnen:**
- Handy muss im **gleichen WLAN** sein wie der PC
- Öffne Browser auf Handy
- Gehe zu: `http://192.168.x.x:3000` (deine IP)

---

## 🚀 Lösung: Zwei Wege zur Verbindung

### Weg 1: Lokal (ohne Internet, nur WLAN) ⚡

**Vorteile:**
- ✅ Funktioniert sofort
- ✅ Keine Konfiguration nötig
- ✅ Daten bleiben lokal

**Nachteile:**
- ❌ Nur im gleichen WLAN
- ❌ Keine Synchronisation zwischen Geräten
- ❌ Jeder Spieler hat eigene Daten

**So geht's:**
1. Starte `npm run dev`
2. Finde deine IP: `ipconfig | Select-String "IPv4"`
3. Öffne auf Handy: `http://192.168.x.x:3000`
4. Fertig!

---

### Weg 2: Online (mit Supabase) 🌐

**Vorteile:**
- ✅ Funktioniert überall (auch ohne WLAN)
- ✅ Synchronisation zwischen allen Geräten
- ✅ Geteilte Daten für alle Spieler
- ✅ Persistente Speicherung

**Nachteile:**
- ❌ Benötigt Supabase-Setup (5-10 Minuten)
- ❌ Benötigt Internet-Verbindung

**So geht's:**
1. Erstelle Supabase-Projekt (kostenlos): https://supabase.com
2. Kopiere API-Keys (siehe `SUPABASE_KEYS_ANLEITUNG.md`)
3. Erstelle `.env.local` mit den Keys
4. Führe Datenbank-Schema aus (siehe `DATENBANK_SETUP.md`)
5. Starte `npm run dev`
6. Öffne auf Handy: `https://deine-app.vercel.app` (nach Deploy)
   Oder lokal: `http://192.168.x.x:3000` (im WLAN)

---

## 🔍 Diagnose: Was genau fehlt?

### Problem: "App lädt nicht auf Handy"

**Mögliche Ursachen:**
1. ❌ Dev-Server läuft nicht → Starte `npm run dev`
2. ❌ Falsche IP-Adresse → Prüfe mit `ipconfig`
3. ❌ Firewall blockiert → Erlaube Port 3000
4. ❌ Handy nicht im gleichen WLAN → Verbinde Handy mit WLAN
5. ❌ Dev-Server nicht für Netzwerk geöffnet → Ändere `package.json`

---

### Problem: "Daten werden nicht synchronisiert"

**Mögliche Ursachen:**
1. ❌ Supabase nicht konfiguriert → Erstelle `.env.local`
2. ❌ Falsche API-Keys → Prüfe Keys in Supabase Dashboard
3. ❌ Datenbank-Schema fehlt → Führe SQL-Schema aus
4. ❌ App nutzt localStorage → Prüfe Browser-Konsole

---

### Problem: "Gruppe kann nicht erstellt werden"

**Mögliche Ursachen:**
1. ❌ Supabase nicht konfiguriert → App nutzt localStorage (nur lokal)
2. ❌ Datenbank-Tabellen fehlen → Führe `supabase/migrations/001_initial_schema.sql` aus
3. ❌ RLS-Policies fehlen → Prüfe Supabase Dashboard → Authentication → Policies

---

## ✅ Schnell-Lösung: App sofort nutzbar machen

### Option A: Nur lokal (2 Minuten)

1. Starte App: `npm run dev`
2. Öffne auf PC: `http://localhost:3000`
3. Fertig! (Funktioniert nur auf diesem PC)

### Option B: Mit Handy im WLAN (5 Minuten)

1. Starte App: `npm run dev`
2. Finde IP: `ipconfig | Select-String "IPv4"`
3. Erlaube Firewall: Siehe Schritt 3B oben
4. Öffne auf Handy: `http://192.168.x.x:3000`
5. Fertig! (Funktioniert nur im WLAN)

### Option C: Online für alle (15 Minuten)

1. Erstelle Supabase-Projekt (siehe `QUICK_START.md`)
2. Konfiguriere `.env.local`
3. Führe Datenbank-Schema aus
4. Deploy auf Vercel (optional, aber empfohlen)
5. Fertig! (Funktioniert überall)

---

## 🆘 Hilfe: Was genau funktioniert nicht?

Beschreibe das Problem:
- [ ] App startet nicht
- [ ] App lädt nicht auf Handy
- [ ] Daten werden nicht gespeichert
- [ ] Gruppe kann nicht erstellt werden
- [ ] Spieler können nicht beitreten
- [ ] Sonstiges: _______________

**Dann prüfe die entsprechende Sektion oben!**


