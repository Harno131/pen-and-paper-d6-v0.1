# 🔄 Daten-Synchronisation zwischen Spielern

## ⚠️ Aktuelle Situation

### Wie funktioniert es aktuell?

1. **Beim Speichern:**
   - Daten werden **sofort** in `localStorage` gespeichert (lokal im Browser)
   - Daten werden **im Hintergrund** in Supabase gespeichert (async, nicht blockierend)
   - ⚠️ **ABER:** Andere Geräte/Spieler sehen die Änderung **nicht automatisch**

2. **Beim Laden:**
   - Daten werden aus Supabase geladen (wenn verfügbar)
   - Fallback auf localStorage, wenn Supabase nicht verfügbar ist
   - ⚠️ **ABER:** Daten werden nur beim **Seitenaufruf** oder **manuellen Neuladen** geladen

### Beispiel: Spieler erhält Schaden

1. **Spieler klickt auf "-1 HP"** → `currentHP` wird geändert
2. **Daten werden gespeichert:**
   - ✅ Sofort in localStorage (Spieler sieht Änderung sofort)
   - ✅ Im Hintergrund in Supabase (nach ~100-500ms)
3. **Spielleiter sieht Änderung:**
   - ❌ **NICHT automatisch** - muss Seite neu laden
   - ✅ **JETZT:** Automatisch nach **5 Sekunden** (Polling)

## ✅ Implementierte Lösung: Polling

### Was wurde implementiert?

**Automatisches Neuladen alle 5 Sekunden:**
- Spielleiter-Seite lädt Daten automatisch alle 5 Sekunden
- Spieler-Seite lädt Daten automatisch alle 5 Sekunden
- Änderungen erscheinen **spätestens nach 5 Sekunden** bei allen

### Geschwindigkeit der Synchronisation

| Aktion | Lokal (Spieler) | Supabase | Andere Geräte |
|--------|----------------|----------|---------------|
| **Speichern** | ✅ Sofort (< 1ms) | ✅ ~100-500ms | ⏱️ **5 Sekunden** (Polling) |
| **Schaden erhalten** | ✅ Sofort sichtbar | ✅ ~100-500ms | ⏱️ **5 Sekunden** (Polling) |
| **Charakter ändern** | ✅ Sofort sichtbar | ✅ ~100-500ms | ⏱️ **5 Sekunden** (Polling) |
| **Tagebuch-Eintrag** | ✅ Sofort sichtbar | ✅ ~100-500ms | ⏱️ **5 Sekunden** (Polling) |

### Beispiel-Timeline

```
00:00 - Spieler erhält Schaden (klickt "-1 HP")
00:00 - ✅ Spieler sieht: HP = 9/10 (sofort)
00:00.2 - ✅ Daten in Supabase gespeichert
00:05 - ✅ Spielleiter sieht: HP = 9/10 (automatisch)
```

## 🚀 Alternative: Supabase Realtime (Zukunft)

### Was wäre noch besser?

**Supabase Realtime Subscriptions:**
- ⚡ **Echtzeit-Updates** (< 1 Sekunde)
- 🔔 **Push-Benachrichtigungen** bei Änderungen
- 📡 **WebSocket-Verbindung** für sofortige Synchronisation

### Vorteile:
- ✅ Änderungen erscheinen **sofort** (< 1 Sekunde)
- ✅ Keine unnötigen Server-Anfragen (nur bei Änderungen)
- ✅ Bessere Performance

### Nachteile:
- ⚠️ Komplexere Implementierung
- ⚠️ Benötigt WebSocket-Support
- ⚠️ Mehr Code-Wartung

## 📊 Vergleich

| Feature | Aktuell (Polling) | Realtime (Zukunft) |
|---------|-------------------|---------------------|
| **Geschwindigkeit** | 5 Sekunden | < 1 Sekunde |
| **Implementierung** | ✅ Einfach | ⚠️ Komplex |
| **Server-Last** | ⚠️ Höher (ständige Anfragen) | ✅ Niedriger (nur bei Änderungen) |
| **Zuverlässigkeit** | ✅ Sehr gut | ✅ Sehr gut |

## 💡 Empfehlung

**Für den aktuellen Stand:**
- ✅ **Polling (5 Sekunden)** ist ausreichend für Pen&Paper
- ✅ Einfach zu verstehen und zu warten
- ✅ Funktioniert zuverlässig

**Für die Zukunft:**
- 🚀 **Realtime** wäre eine schöne Verbesserung
- 🚀 Könnte bei Bedarf implementiert werden
- 🚀 Für kritische Updates (z.B. Kampf) sinnvoll

## 🔧 Technische Details

### Polling-Implementierung

```typescript
// Automatisches Neuladen alle 5 Sekunden
useEffect(() => {
  const interval = setInterval(() => {
    loadData() // Lädt Daten aus Supabase
  }, 5000) // Alle 5 Sekunden

  return () => clearInterval(interval) // Cleanup beim Unmount
}, [groupId])
```

### Speicher-Flow

```typescript
// 1. Spieler ändert HP
saveCharacters(updatedCharacters)

// 2. Sofort in localStorage
localStorage.setItem('characters', JSON.stringify(characters))

// 3. Im Hintergrund in Supabase
saveCharacterToSupabase(groupId, character) // async, nicht blockierend

// 4. Andere Geräte laden nach 5 Sekunden
loadData() // Lädt aus Supabase
```

## ❓ FAQ

**Q: Warum nicht sofort?**
A: Polling alle 5 Sekunden ist ein guter Kompromiss zwischen Geschwindigkeit und Server-Last. Für Pen&Paper ist das ausreichend.

**Q: Kann ich das ändern?**
A: Ja, die Polling-Intervalle können in `app/spielleiter/page.tsx` und `app/spieler/page.tsx` angepasst werden (aktuell: 5000ms = 5 Sekunden).

**Q: Was passiert bei schlechter Internet-Verbindung?**
A: Die App fällt automatisch auf localStorage zurück. Daten werden lokal gespeichert und später synchronisiert.

**Q: Werden alle Daten synchronisiert?**
A: Ja, alle Charakter-Daten (HP, Attribute, Skills, Inventar) werden synchronisiert. Geheim-Attribute von NPCs werden NICHT ins Tagebuch übertragen.
