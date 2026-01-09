# 💾 Daten-Persistenz: Gruppen und Spieler

## ✅ Was wurde implementiert

Alle Gruppen-Daten werden jetzt **dauerhaft in Supabase** gespeichert und sind über alle Spieleabende hinweg verfügbar.

## 📊 Was wird gespeichert

### In Supabase (dauerhaft):

1. **Gruppen (`groups` Tabelle):**
   - Gruppenname
   - Gruppen-Code (6-stellig)
   - Spielleiter-Name
   - Erstellungsdatum
   - Einstellungen (Charaktererstellung)

2. **Gruppen-Mitglieder (`group_members` Tabelle):**
   - Spieler-Name
   - Rolle (Spielleiter/Spieler)
   - Beitrittsdatum
   - Verknüpfung zur Gruppe

3. **Charaktere (`characters` Tabelle):**
   - Alle Charakter-Daten
   - Verknüpft mit Gruppe

4. **Fertigkeiten (`available_skills` Tabelle):**
   - Globale Fertigkeiten-Liste
   - Verknüpft mit Gruppe

5. **Journal-Einträge (`journal_entries` Tabelle):**
   - Gruppentagebuch
   - Verknüpft mit Gruppe

6. **Geteilte Bilder (`shared_images` Tabelle):**
   - Bilder vom Spielleiter
   - Verknüpft mit Gruppe

7. **Würfel-Würfe (`dice_rolls` Tabelle):**
   - Würfel-Historie
   - Verknüpft mit Gruppe

## 🔄 Automatische Wiederherstellung

### Beim App-Start:

1. **Prüfung vorhandener Gruppe:**
   - App prüft ob `groupId` im localStorage vorhanden ist
   - Validiert ob Spieler noch Mitglied der Gruppe ist
   - Validiert ob Rolle noch korrekt ist

2. **Automatische Weiterleitung:**
   - Wenn Gruppe gültig → Weiterleitung zur Spielleiter/Spieler-Seite
   - Wenn Gruppe ungültig → Zurück zur Gruppen-Auswahl

3. **Gruppen-Liste:**
   - Spieler können alle ihre Gruppen sehen
   - Einfaches Wechseln zwischen Gruppen

## 🎯 Neue Funktionen

### 1. Gruppen-Validierung
- Beim Laden der App wird geprüft ob Gruppe noch existiert
- Prüft ob Spieler noch Mitglied ist
- Automatische Bereinigung bei ungültigen Daten

### 2. Gruppen-Manager
- Zeigt alle Gruppen eines Spielers
- Einfaches Wechseln zwischen Gruppen
- Anzeige von Rolle und Beitrittsdatum

### 3. Persistente Speicherung
- Alle Daten werden in Supabase gespeichert
- localStorage nur für schnellen Zugriff (wird aus Supabase aktualisiert)
- Daten bleiben auch nach Browser-Neustart erhalten

## 📱 Verwendung

### Spielleiter:

1. **Gruppe erstellen:**
   - Name eingeben
   - Code wählen (oder automatisch generieren)
   - Gruppe wird in Supabase gespeichert

2. **Beim nächsten Start:**
   - App erkennt automatisch die Gruppe
   - Weiterleitung zur Spielleiter-Seite
   - Alle Daten sind verfügbar

### Spieler:

1. **Gruppe beitreten:**
   - Code vom Spielleiter eingeben
   - Name eingeben
   - Wird als Mitglied in Supabase gespeichert

2. **Beim nächsten Start:**
   - App erkennt automatisch die Gruppe
   - Weiterleitung zur Spieler-Seite
   - Alle Charaktere und Daten sind verfügbar

3. **Mehrere Gruppen:**
   - Spieler kann mehreren Gruppen beitreten
   - "Meine Gruppen anzeigen" zeigt alle Gruppen
   - Einfaches Wechseln zwischen Gruppen

## 🔒 Daten-Sicherheit

- **Supabase als primäre Quelle:** Alle wichtigen Daten werden in Supabase gespeichert
- **localStorage als Cache:** Nur für schnellen Zugriff, wird aus Supabase aktualisiert
- **Automatische Validierung:** Beim Laden wird geprüft ob Daten noch gültig sind
- **Bereinigung:** Ungültige Daten werden automatisch entfernt

## 🎮 Über mehrere Spieleabende

### Szenario 1: Gleiche Gruppe, neuer Abend

1. Spielleiter öffnet App
2. App erkennt automatisch die Gruppe
3. Weiterleitung zur Spielleiter-Seite
4. Alle Charaktere, Einstellungen, etc. sind verfügbar

### Szenario 2: Spieler wechselt Gerät

1. Spieler öffnet App auf neuem Gerät
2. Gibt Namen ein
3. Klickt "Meine Gruppen anzeigen"
4. Wählt Gruppe aus
5. Alle Charaktere werden aus Supabase geladen

### Szenario 3: Spieler in mehreren Gruppen

1. Spieler öffnet App
2. Klickt "Meine Gruppen anzeigen"
3. Sieht alle Gruppen
4. Wählt gewünschte Gruppe aus
5. Wechselt Daten entsprechend

## ✅ Zusammenfassung

- ✅ **Alle Gruppen-Daten in Supabase** - dauerhaft gespeichert
- ✅ **Automatische Wiederherstellung** - beim App-Start
- ✅ **Gruppen-Validierung** - prüft ob Gruppe noch existiert
- ✅ **Mehrere Gruppen** - Spieler kann mehreren Gruppen beitreten
- ✅ **Persistente Daten** - bleiben über alle Spieleabende erhalten
- ✅ **Geräte-unabhängig** - funktioniert auf allen Geräten

**Alle Daten sind jetzt dauerhaft verfügbar!** 🎉











