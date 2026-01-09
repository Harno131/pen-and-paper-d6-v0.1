# 🔧 404-Fehler beheben - Schnell-Anleitung

## ❌ Fehler: "404 not found ID fral fq2fl-..."

**Das ist ein Supabase-Fehler!** Die ID ist eine Supabase-Error-ID.

---

## ✅ Sofort-Checkliste:

### 1. Debug-Seite aufrufen (nach nächstem Deploy)

Nach dem nächsten Vercel-Deploy:
1. Öffne: `https://deine-app.vercel.app/debug`
2. Prüfe die Fehlermeldungen
3. Siehst du:
   - ❌ "Umgebungsvariablen NICHT GESETZT" → **Problem gefunden!**
   - ❌ "Verbindungsfehler" → **Problem gefunden!**
   - ❌ "Fehlende Tabellen" → **Problem gefunden!**

---

### 2. Prüfe Vercel-Logs

1. Gehe zu https://vercel.com/dashboard
2. Wähle dein Projekt
3. Gehe zu "Deployments"
4. Klicke auf das letzte Deployment
5. Klicke auf "Runtime Logs" oder "Functions"
6. Suche nach:
   - `Supabase`
   - `404`
   - `not found`
   - `PGRST116` (Tabelle existiert nicht)
   - `42501` (Berechtigungsfehler)

---

### 3. Prüfe Umgebungsvariablen in Vercel

1. Gehe zu **Settings** → **Environment Variables**
2. Prüfe ob diese 3 Variablen existieren:

   ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://vggbyiknwmxeyoglmfdt.supabase.co`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `sb_publishable_dtCyr3ZRSamoBLK-zPqiMg_OJ9TKVXH`
   - Environment: ✅ Production, ✅ Preview, ✅ Development

   ✅ `SUPABASE_SERVICE_ROLE_KEY`
   - Value: (dein Service Role Key)
   - Environment: ✅ Production, ✅ Preview, ✅ Development

3. **Falls fehlend → hinzufügen!**

4. **Redeploy ausführen:**
   - Deployments → Drei Punkte (⋯) → "Redeploy"
   - ✅ "Use existing Build Cache" **DEAKTIVIEREN**

---

### 4. Prüfe Supabase-Tabellen

1. Gehe zu https://supabase.com/dashboard/project/vggbyiknwmxeyoglmfdt/editor
2. Prüfe ob diese Tabellen existieren:
   - ✅ `groups`
   - ✅ `group_members`
   - ✅ `characters`
   - ✅ `journal_entries`
   - ✅ `dice_rolls`

3. **Falls Tabellen fehlen:**
   - Gehe zu: SQL Editor
   - Führe aus: `supabase/migrations/001_initial_schema.sql`
   - Klicke "Run"

---

### 5. Prüfe RLS-Policies

1. Gehe zu https://supabase.com/dashboard/project/vggbyiknwmxeyoglmfdt/auth/policies
2. Prüfe ob Policies existieren für:
   - `groups`
   - `group_members`
   - `characters`
   - `journal_entries`

3. **Falls Policies fehlen:**
   - Gehe zu: SQL Editor
   - Führe aus: `supabase/fix_rls_policies.sql`
   - Klicke "Run"

---

## 🆘 Häufige Probleme:

### Problem 1: Umgebungsvariablen fehlen

**Symptom:** Debug-Seite zeigt "NICHT GESETZT"

**Lösung:**
- Umgebungsvariablen in Vercel eintragen (siehe Schritt 3)
- Redeploy ausführen

---

### Problem 2: Tabellen existieren nicht

**Symptom:** Fehler "PGRST116" oder "relation does not exist"

**Lösung:**
- SQL-Schema ausführen (siehe Schritt 4)

---

### Problem 3: RLS blockiert Zugriff

**Symptom:** Fehler "42501" oder "permission denied"

**Lösung:**
- RLS-Policies ausführen (siehe Schritt 5)

---

### Problem 4: Falsche Supabase-URL oder Keys

**Symptom:** Verbindungsfehler

**Lösung:**
- Prüfe ob URL korrekt ist: `https://vggbyiknwmxeyoglmfdt.supabase.co`
- Prüfe ob Keys korrekt sind
- Prüfe ob Projekt aktiv ist in Supabase

---

## 📋 Schnell-Fix (alles auf einmal):

1. ✅ Umgebungsvariablen in Vercel prüfen/hinzufügen
2. ✅ SQL-Schema in Supabase ausführen
3. ✅ RLS-Policies in Supabase ausführen
4. ✅ Redeploy in Vercel (ohne Cache)
5. ✅ Debug-Seite aufrufen: `/debug`

---

## 💡 Nach dem Fix:

Die App sollte funktionieren:
- Startbildschirm zeigt: "Spielleiter" / "Spieler"
- Keine Fehler in Browser-Konsole
- Supabase-Verbindung funktioniert
