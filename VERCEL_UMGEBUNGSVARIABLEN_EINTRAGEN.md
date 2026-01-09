# 🔐 Umgebungsvariablen in Vercel eintragen - Schritt für Schritt

## ❌ Problem: "Supabase nicht konfiguriert"

**Das bedeutet:** Die Umgebungsvariablen fehlen in Vercel.

**Lösung:** Du musst sie in Vercel eintragen (nicht lokal in `.env.local` - das funktioniert nur lokal!)

---

## ✅ Lösung: Umgebungsvariablen in Vercel eintragen

### Schritt 1: Gehe zu Vercel Settings

1. **Gehe zu:** https://vercel.com/dashboard
2. **Klicke** auf dein Projekt (`pen-and-paper-d6-v0-1` oder ähnlich)
3. **Klicke:** "Settings" (oben in der Navigation)
4. **Klicke:** "Environment Variables" (links im Menü)

---

### Schritt 2: Erste Variable hinzufügen

**Variable 1: NEXT_PUBLIC_SUPABASE_URL**

1. **Klicke:** "Add New" (rechts oben)
2. **Name:** `NEXT_PUBLIC_SUPABASE_URL`
3. **Value:** `https://vggbyiknwmxeyoglmfdt.supabase.co`
4. **Environment:** Aktiviere alle drei:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Klicke:** "Save"

---

### Schritt 3: Zweite Variable hinzufügen

**Variable 2: NEXT_PUBLIC_SUPABASE_ANON_KEY**

1. **Klicke:** "Add New" (rechts oben)
2. **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Value:** `sb_publishable_dtCyr3ZRSamoBLK-zPqiMg_OJ9TKVXH`
4. **Environment:** Aktiviere alle drei:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Klicke:** "Save"

---

### Schritt 4: Dritte Variable hinzufügen

**Variable 3: SUPABASE_SERVICE_ROLE_KEY**

1. **Klicke:** "Add New" (rechts oben)
2. **Name:** `SUPABASE_SERVICE_ROLE_KEY`
3. **Value:** (dein Service Role Key - siehe unten wo du ihn findest)
4. **Environment:** Aktiviere alle drei:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
5. **Klicke:** "Save"

---

### Schritt 5: Service Role Key finden

**Wo findest du den Service Role Key?**

1. **Gehe zu:** https://supabase.com/dashboard/project/vggbyiknwmxeyoglmfdt/settings/api
2. **Scrolle** zu "Project API keys"
3. **Suche** nach "service_role" (Secret key)
4. **Klicke** auf das Auge-Symbol (👁️) um den Key anzuzeigen
5. **Kopiere** den Key (beginnt mit `eyJ...`)
6. **Füge** ihn in Vercel ein (Schritt 4)

**⚠️ WICHTIG:** Der Service Role Key ist geheim! Teile ihn nicht!

---

### Schritt 6: Redeploy ausführen

**Nachdem alle 3 Variablen eingetragen sind:**

1. **Gehe zu:** "Deployments" (oben in der Navigation)
2. **Klicke** auf die **drei Punkte (⋯)** beim letzten Deployment
3. **Klicke:** "Redeploy"
4. **WICHTIG:** Aktiviere **NICHT** "Use existing Build Cache"
5. **Klicke:** "Redeploy"

**Warte** 2-3 Minuten bis der Deploy fertig ist.

---

### Schritt 7: Prüfen ob es funktioniert

**Nach dem Redeploy:**

1. **Öffne** deine App-URL (z.B. `https://pen-and-paper-d6-v0-1.vercel.app`)
2. **Prüfe** ob die Fehlermeldung weg ist
3. **Prüfe** Debug-Seite: `/debug`
   - Sollte zeigen: ✅ Umgebungsvariablen gesetzt
   - Sollte zeigen: ✅ Supabase-Verbindung erfolgreich

---

## 📋 Checkliste:

- [ ] Variable 1: `NEXT_PUBLIC_SUPABASE_URL` eingetragen
- [ ] Variable 2: `NEXT_PUBLIC_SUPABASE_ANON_KEY` eingetragen
- [ ] Variable 3: `SUPABASE_SERVICE_ROLE_KEY` eingetragen
- [ ] Alle 3 Variablen für Production, Preview, Development aktiviert
- [ ] Redeploy ausgeführt
- [ ] App funktioniert (keine Fehlermeldung mehr)

---

## 🆘 Häufige Probleme:

### Problem 1: "Variable not found" nach Redeploy

**Lösung:**
- Prüfe ob alle 3 Variablen eingetragen sind
- Prüfe ob sie für "Production" aktiviert sind
- Prüfe ob Redeploy ausgeführt wurde

---

### Problem 2: "Supabase connection failed"

**Lösung:**
1. Prüfe ob Keys korrekt sind (keine Leerzeichen, vollständig kopiert)
2. Prüfe ob Supabase-Projekt aktiv ist
3. Prüfe Debug-Seite: `/debug` für genaue Fehlermeldung

---

### Problem 3: "Service Role Key fehlt"

**Lösung:**
- Gehe zu Supabase Dashboard → Settings → API
- Kopiere den "service_role" Key
- Füge ihn in Vercel ein

---

## 💡 Wichtig:

**Die `.env.local` Datei funktioniert nur lokal!**

**Für Vercel musst du die Variablen in Vercel eintragen:**
- Settings → Environment Variables
- Dort hinzufügen
- Redeploy ausführen

**Nach dem Redeploy sollten die Variablen verfügbar sein!**

---

## ✅ Nach dem Setup:

Die App sollte funktionieren:
- ✅ Keine "Supabase nicht konfiguriert" Fehlermeldung
- ✅ Startbildschirm zeigt: "Spielleiter" / "Spieler"
- ✅ Debug-Seite zeigt: ✅ Verbindung erfolgreich
