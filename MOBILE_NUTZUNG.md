# 📱 App auf dem Handy nutzen

## ✅ Ja, die App funktioniert auf dem Handy!

Die App ist **responsive** und funktioniert auf:
- 📱 Smartphones (iOS & Android)
- 💻 Tablets
- 🖥️ Desktop-PCs

## 🎮 Gleichzeitig auf mehreren Geräten?

**Ja!** Du kannst die App gleichzeitig auf mehreren Geräten nutzen:

- ✅ **Spielleiter auf PC + Handy gleichzeitig** - beide Geräte zeigen die gleichen Daten
- ✅ **Spieler auf Handy** - während Spielleiter auf PC ist
- ✅ **Alle Geräte synchronisieren sich automatisch** über Supabase

## 🚀 So nutzt du die App auf dem Handy

### Option 1: Lokales Netzwerk (für Entwicklung)

1. **Finde deine lokale IP-Adresse:**
   
   **Windows (PowerShell):**
   ```powershell
   ipconfig
   ```
   Suche nach "IPv4-Adresse" (z.B. `192.168.1.100`)

   **Oder einfacher:**
   ```powershell
   ipconfig | findstr "IPv4"
   ```

2. **Starte den Dev-Server:**
   ```powershell
   npm run dev
   ```

3. **Öffne auf dem Handy:**
   - Stelle sicher, dass Handy und PC im **gleichen WLAN** sind
   - Öffne Browser auf dem Handy
   - Gehe zu: `http://192.168.1.100:3000` (ersetze mit deiner IP)

### Option 2: Vercel (für Produktion) - EMPFOHLEN

1. **Deploy auf Vercel:**
   - Siehe `QUICK_START.md` für Anleitung
   - Nach dem Deploy hast du eine URL wie: `https://deine-app.vercel.app`

2. **Öffne auf dem Handy:**
   - Öffne Browser auf dem Handy
   - Gehe zu deiner Vercel-URL
   - **Fertig!** Funktioniert überall (nicht nur im WLAN)

## 📋 Schritt-für-Schritt: Lokale Nutzung

### Schritt 1: IP-Adresse finden

**Windows PowerShell:**
```powershell
# Öffne PowerShell und führe aus:
ipconfig | Select-String "IPv4"
```

Du siehst etwas wie:
```
IPv4-Adresse. . . . . . . . . . . : 192.168.1.100
```

### Schritt 2: Dev-Server starten

```powershell
npm run dev
```

Du siehst:
```
- Local:        http://localhost:3000
- Network:      http://192.168.1.100:3000
```

### Schritt 3: Auf Handy öffnen

1. **Stelle sicher:** Handy und PC sind im **gleichen WLAN**
2. **Öffne Browser** auf dem Handy (Chrome, Safari, etc.)
3. **Tippe ein:** `http://192.168.1.100:3000` (deine IP)
4. **Fertig!** 🎉

## 🔐 Anmeldung auf dem Handy

1. **Öffne die App** auf dem Handy (siehe oben)
2. **Klicke** auf "Gruppe erstellen oder beitreten"
3. **Als Spielleiter:**
   - Wähle "Gruppe erstellen"
   - Gib Gruppenname und deinen Namen ein
   - Notiere dir den Gruppen-Code
4. **Als Spieler:**
   - Wähle "Gruppe beitreten"
   - Gib den Gruppen-Code ein (vom Spielleiter)
   - Gib deinen Namen ein

## 💡 Tipps für Mobile-Nutzung

### Spielleiter auf PC + Handy

1. **PC:** Erstelle Gruppe, verwalte Charaktere
2. **Handy:** Gleiche Gruppe beitreten (mit gleichem Code)
3. **Beide Geräte:** Zeigen die gleichen Daten (synchronisiert über Supabase)

### Spieler auf Handy

- **Perfekt für:** Charaktere ansehen, Würfelwürfe machen
- **Einfach:** Gruppe beitreten mit Code vom Spielleiter

### Browser auf dem Handy

- **iOS:** Safari oder Chrome
- **Android:** Chrome oder Firefox
- **Tipp:** Füge die Seite zu den **Lesezeichen** hinzu für schnellen Zugriff

## 🐛 Probleme?

### "Kann nicht verbinden" auf dem Handy

1. **Prüfe WLAN:** Handy und PC müssen im gleichen Netzwerk sein
2. **Prüfe Firewall:** Windows Firewall blockiert möglicherweise Port 3000
   - Lösung: Erlaube Node.js in der Firewall
3. **Prüfe IP:** Verwende die richtige IP-Adresse (nicht localhost)

### "Seite lädt nicht"

1. **Prüfe:** Läuft `npm run dev` noch?
2. **Prüfe:** Ist die IP-Adresse korrekt?
3. **Alternative:** Nutze Vercel (funktioniert immer)

### Firewall öffnen (Windows)

```powershell
# Erlaube Node.js in der Firewall
New-NetFirewallRule -DisplayName "Node.js Dev Server" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

## 🎯 Beste Lösung: Vercel Deploy

Für die beste Erfahrung:

1. **Deploy auf Vercel** (siehe `QUICK_START.md`)
2. **Öffne die URL** auf jedem Gerät
3. **Fertig!** Funktioniert überall, nicht nur im WLAN

## 📱 Mobile-Optimierungen

Die App ist bereits optimiert für:
- ✅ Touch-Bedienung
- ✅ Kleine Bildschirme
- ✅ Responsive Layout
- ✅ Schnelle Ladezeiten

## 🔄 Synchronisation

- **Echtzeit:** Änderungen werden sofort synchronisiert (über Supabase)
- **Mehrere Geräte:** Alle Geräte sehen die gleichen Daten
- **Offline:** Funktioniert mit localStorage-Fallback













