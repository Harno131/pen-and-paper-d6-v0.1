# 🔧 Vercel 404-Fehler beheben

## ❌ Fehler: "404 not found ID fral fq2fl-..."

### Mögliche Ursachen:

1. **Supabase-Umgebungsvariablen fehlen oder sind falsch**
2. **Supabase-Tabellen existieren nicht**
3. **RLS (Row Level Security) blockiert Zugriff**
4. **Routing-Problem in Next.js**

---

## ✅ Lösung Schritt für Schritt:

### Schritt 1: Prüfe Vercel-Logs

1. Gehe zu https://vercel.com/dashboard
2. Wähle dein Projekt
3. Gehe zu "Deployments"
4. Klicke auf das letzte Deployment
5. Klicke auf "Functions" oder "Runtime Logs"
6. Suche nach Fehlermeldungen

**Was du sehen solltest:**
- Supabase-Verbindungsfehler?
- Fehlende Tabellen?
- RLS-Fehler?

---

### Schritt 2: Prüfe Umgebungsvariablen

1. Gehe zu **Settings** → **Environment Variables**
2. Prüfe ob diese 3 Variablen existieren:

   ✅ `NEXT_PUBLIC_SUPABASE_URL`
   ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   ✅ `SUPABASE_SERVICE_ROLE_KEY`

3. **WICHTIG:** Prüfe ob alle für **Production** aktiviert sind

4. Falls fehlend → hinzufügen (siehe `VERCEL_VERBINDEN.md`)

---

### Schritt 3: Prüfe Supabase-Tabellen

1. Gehe zu https://supabase.com/dashboard/project/vggbyiknwmxeyoglmfdt/editor
2. Prüfe ob diese Tabellen existieren:
   - ✅ `groups`
   - ✅ `group_members`
   - ✅ `characters`
   - ✅ `journal_entries`
   - ✅ `dice_rolls`

3. Falls Tabellen fehlen → SQL-Schema ausführen:
   - Gehe zu: SQL Editor
   - Führe aus: `supabase/migrations/001_initial_schema.sql`

---

### Schritt 4: Prüfe RLS (Row Level Security)

1. Gehe zu https://supabase.com/dashboard/project/vggbyiknwmxeyoglmfdt/auth/policies
2. Prüfe ob Policies existieren für:
   - `groups`
   - `group_members`
   - `characters`
   - `journal_entries`

3. Falls Policies fehlen → SQL ausführen:
   - `supabase/fix_rls_policies.sql`

---

### Schritt 5: Prüfe Browser-Konsole

1. Öffne deine Vercel-URL
2. Drücke F12 (Browser-Konsole öffnen)
3. Prüfe Fehlermeldungen:
   - Supabase-Verbindungsfehler?
   - 404-Fehler?
   - CORS-Fehler?

---

## 🆘 Häufige Probleme:

### Problem 1: "Supabase client not initialized"

**Lösung:**
- Prüfe ob `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel eingetragen sind
- Redeploy ausführen

### Problem 2: "relation does not exist"

**Lösung:**
- Tabellen fehlen in Supabase
- Führe `supabase/migrations/001_initial_schema.sql` aus

### Problem 3: "permission denied"

**Lösung:**
- RLS-Policies fehlen oder sind falsch
- Führe `supabase/fix_rls_policies.sql` aus

### Problem 4: "404 not found" auf allen Seiten

**Lösung:**
- Prüfe ob `next.config.js` korrekt ist
- Prüfe ob `app/page.tsx` existiert
- Prüfe Vercel Build-Logs

---

## 📋 Debug-Checkliste:

- [ ] Umgebungsvariablen in Vercel eingetragen?
- [ ] Alle Variablen für Production aktiviert?
- [ ] Redeploy ausgeführt?
- [ ] Supabase-Tabellen existieren?
- [ ] RLS-Policies existieren?
- [ ] Browser-Konsole zeigt Fehler?
- [ ] Vercel-Logs zeigen Fehler?

---

## 💡 Schnell-Fix:

**Falls nichts hilft:**

1. **Redeploy mit Cache-Clear:**
   - Vercel Dashboard → Deployments
   - Drei Punkte (⋯) → "Redeploy"
   - ✅ "Use existing Build Cache" **DEAKTIVIEREN**

2. **Supabase neu verbinden:**
   - Prüfe ob Keys korrekt sind
   - Prüfe ob Projekt aktiv ist

3. **Lokale Prüfung:**
   ```powershell
   npm run build
   npm run start
   ```
   - Funktioniert es lokal?
