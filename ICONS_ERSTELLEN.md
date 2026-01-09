# 🎨 App-Icons erstellen

## Schnellste Lösung: Online-Tool verwenden

### Option 1: PWA Asset Generator (empfohlen)

1. Gehe zu: https://www.pwabuilder.com/imageGenerator
2. Lade ein Bild hoch (mindestens 512x512 Pixel)
   - Oder verwende ein Emoji: 🎲
3. Klicke "Generate"
4. Lade die generierten Icons herunter
5. Kopiere `icon-192.png` und `icon-512.png` in den `public` Ordner

### Option 2: Einfaches Icon selbst erstellen

Falls du kein Bild hast, erstelle ein einfaches Icon:

1. Öffne ein Bildbearbeitungsprogramm (Paint, GIMP, etc.)
2. Erstelle ein quadratisches Bild (512x512 Pixel)
3. Fülle es mit einer Farbe (z.B. #0284c7 - blau)
4. Füge Text hinzu: "🎲 P&P" oder "D6"
5. Speichere als PNG
6. Erstelle 2 Versionen:
   - `icon-192.png` (192x192)
   - `icon-512.png` (512x512)

### Option 3: Emoji als Icon (schnellste Lösung)

1. Öffne: https://favicon.io/emoji-favicons/game-die/
2. Lade das Favicon-Paket herunter
3. Kopiere `android-chrome-192x192.png` → `public/icon-192.png`
4. Kopiere `android-chrome-512x512.png` → `public/icon-512.png`

## ⚠️ Wichtig

- **Dateinamen müssen genau sein:** `icon-192.png` und `icon-512.png`
- **Müssen im `public` Ordner liegen**
- **Format:** PNG
- **Größe:** 192x192 und 512x512 Pixel

## ✅ Prüfen ob es funktioniert

1. Starte die App: `npm run dev`
2. Öffne: http://localhost:3000/manifest.json
3. Du solltest die Manifest-Datei sehen
4. Öffne DevTools (F12) → Application → Manifest
5. Icons sollten angezeigt werden

## 🎯 Falls keine Icons vorhanden

Die App funktioniert trotzdem! Sie zeigt nur ein Standard-Icon. Icons sind optional, aber machen die App schöner.













