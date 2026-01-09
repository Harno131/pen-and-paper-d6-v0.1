# RLS-Policy Fehler beheben - Schritt für Schritt

## ❌ Fehler: "policy already exists"

Dieser Fehler tritt auf, wenn Policies bereits existieren, aber nicht die richtigen sind.

## ✅ Lösung: Verwende die einfache Version

### Option 1: Einfache Version (EMPFOHLEN)

1. Öffne `supabase/fix_rls_policies_simple.sql`
2. Kopiere den gesamten Inhalt
3. Füge ihn in Supabase SQL Editor ein
4. Führe aus (Run oder Strg+Enter)

Diese Version:
- ✅ Löscht nur die spezifischen Policies die wir brauchen
- ✅ Erstellt sie neu mit korrekten Einstellungen
- ✅ Keine komplexen DO-Blöcke

### Option 2: Alle Policies löschen (falls Option 1 nicht funktioniert)

Falls die einfache Version nicht funktioniert, verwende die vollständige Version:

1. Öffne `supabase/fix_rls_policies.sql` (die aktualisierte Version)
2. Diese Version löscht ALLE Policies automatisch
3. Dann erstellt sie neue

### Option 3: Manuell in Supabase

Falls beide nicht funktioniert, führe diese Befehle **einzeln** aus:

```sql
-- 1. Prüfe welche Policies existieren
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('groups', 'group_members', 'characters')
ORDER BY tablename, policyname;

-- 2. Lösche die Policies die du siehst (einzeln)
DROP POLICY IF EXISTS "Groups are viewable by group members" ON groups;
DROP POLICY IF EXISTS "Groups are public" ON groups;
-- ... usw. für alle die du in Schritt 1 siehst

-- 3. Erstelle neue Policies (aus fix_rls_policies_simple.sql)
```

## 🎯 Schnellste Lösung

**Verwende `supabase/fix_rls_policies_simple.sql`** - das sollte in den meisten Fällen funktionieren!













