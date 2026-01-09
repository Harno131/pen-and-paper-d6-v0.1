-- Migration: Fantasie-Kalender und Tageszeiten
-- Führe diese SQL-Befehle in Supabase SQL Editor aus

-- Erweitere journal_entries um Fantasie-Datum und Tageszeit
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS fantasy_date JSONB, -- { "year": 1, "month": 1, "day": 1, "weekday": 0 }
ADD COLUMN IF NOT EXISTS time_of_day TEXT CHECK (time_of_day IN ('Frühgischt', 'Aufgang', 'Früh', 'Mittag', 'Spät', 'Untergang', 'Gischt', 'Nacht'));

-- Erweitere groups.settings um Start-Datum
-- Das Start-Datum wird in settings gespeichert als:
-- { "fantasyCalendar": { "startDate": { "year": 1, "month": 1, "day": 1 } } }
-- Die settings-Spalte ist bereits JSONB, daher keine Änderung nötig

-- Index für bessere Performance bei Datums-Abfragen
CREATE INDEX IF NOT EXISTS idx_journal_entries_fantasy_date ON journal_entries USING GIN (fantasy_date);











