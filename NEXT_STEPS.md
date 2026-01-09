# Nächste Schritte nach Datenbank-Setup

## ✅ Was bereits erledigt ist:

1. ✅ Supabase-Datenbank-Tabellen erstellt
2. ✅ Gruppen-System implementiert
3. ✅ Supabase-Integration vorbereitet
4. ✅ Fallback auf localStorage implementiert

## 🚀 Jetzt testen:

### 1. App starten

```powershell
npm run dev
```

### 2. App öffnen

Öffne http://localhost:3000 im Browser

### 3. Gruppe erstellen (als Spielleiter)

1. Klicke auf "Gruppe erstellen oder beitreten"
2. Wähle "Gruppe erstellen"
3. Gib einen Gruppenname ein (z.B. "Test-Abenteuer")
4. Gib deinen Namen ein (z.B. "Spielleiter")
5. Klicke "Gruppe erstellen"
6. **Wichtig:** Notiere dir den Gruppen-Code!

### 4. Als Spieler beitreten

1. Öffne die App in einem anderen Browser/Fenster (oder Incognito-Modus)
2. Klicke auf "Gruppe erstellen oder beitreten"
3. Wähle "Gruppe beitreten"
4. Gib den Gruppen-Code ein
5. Gib deinen Spielernamen ein
6. Klicke "Beitreten"

### 5. Charaktere erstellen

- **Spieler:** Erstelle einen Charakter in der Spieler-Ansicht
- **Spielleiter:** Sieh alle Charaktere in der Spielleiter-Ansicht

## 🔍 Was funktioniert jetzt:

- ✅ Gruppen erstellen und beitreten
- ✅ Charaktere in Supabase speichern (wenn Supabase konfiguriert)
- ✅ Fallback auf localStorage (wenn Supabase nicht verfügbar)
- ✅ Daten werden zwischen Spielern synchronisiert (wenn Supabase aktiv)

## ⚠️ Wichtige Hinweise:

### Supabase-Keys prüfen

Falls die App nicht funktioniert, prüfe deine `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-publishable-key
```

### Datenbank-Schema prüfen

Falls Fehler auftreten, prüfe ob alle Tabellen existieren:
- `groups`
- `group_members`
- `characters`
- `available_skills`
- `journal_entries`
- `shared_images`
- `dice_rolls`

## 🐛 Troubleshooting:

### "Supabase nicht konfiguriert" Warnung

→ Erstelle `.env.local` mit deinen Supabase-Keys (siehe `QUICK_START.md`)

### "Gruppe nicht gefunden"

→ Prüfe ob der Code korrekt eingegeben wurde (Groß-/Kleinschreibung beachten)

### Charaktere werden nicht gespeichert

→ Prüfe Browser-Konsole auf Fehler
→ Prüfe ob Supabase-Keys korrekt sind
→ Prüfe ob RLS-Policies korrekt gesetzt sind

## 📝 Nächste Features (optional):

- [ ] Echtzeit-Synchronisation (Supabase Realtime)
- [ ] Feinere Berechtigungen (nur eigene Charaktere bearbeiten)
- [ ] Gruppen-Verwaltung (Mitglieder verwalten)
- [ ] Chat-Funktion
- [ ] Würfelwürfe in Datenbank speichern













