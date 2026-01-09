# PenAndPaperD6 Datenablage

Dieser Ordner enthält alle Daten für die PenAndPaperD6 Rollenspiel-App.

## Struktur

```
PenAndPaperD6_Data/
├── groups/                    # Gruppen-Daten (pro Gruppe ein Ordner)
│   └── {groupId}/
│       ├── tagebuch.json      # Journal-Einträge
│       ├── monster.json        # Alle Monster (isNPC: true, npcType: 'monster')
│       ├── spielerCharaktere.json  # Spieler-Charaktere (isNPC: false)
│       └── nichtSpielerCharactere.json  # NPCs (isNPC: true, npcType != 'monster')
└── README.md                  # Diese Datei
```

## Datenformat

Alle Dateien verwenden JSON-Format und sind kompatibel mit der bestehenden Character-Struktur.

## Wichtig

- Dieser Ordner liegt **im eigenen Projekt-Verzeichnis** (vollständig getrennt von GeoLogApp)
- Daten werden hier **lokal** gespeichert
- Für Synchronisation zwischen Geräten kann optional Supabase verwendet werden
- **Pfad**: `C:\DEV\PenAndPaperD6\PenAndPaperD6_Data`

