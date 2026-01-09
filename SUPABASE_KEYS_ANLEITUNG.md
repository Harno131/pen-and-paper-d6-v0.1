# Supabase API-Keys finden - Schritt für Schritt (NEUE VERSION)

## Wo finde ich die Keys?

### Schritt 1: Supabase Dashboard öffnen
1. Gehe zu https://supabase.com
2. Melde dich an
3. Wähle dein Projekt aus

### Schritt 2: Settings öffnen
1. Im linken Menü: Klicke auf **"Settings"** (Zahnrad-Symbol)
2. Dann klicke auf **"API"**

### Schritt 3: Keys finden

Du siehst jetzt mehrere Bereiche:

#### 1. Project URL (ganz oben)
```
Project URL
https://xxxxx.supabase.co
```
→ Das ist dein `NEXT_PUBLIC_SUPABASE_URL`

#### 2. Publishable key (im Abschnitt "Your new API keys are here")

```
Publishable key
Name: default
API Key: sb_publishable_BjWODH2zrJQsyGB2Ip92pg_ydiQTv5P
```
→ Das ist dein `NEXT_PUBLIC_SUPABASE_ANON_KEY`
→ Klicke auf das Kopier-Symbol neben dem Key

#### 3. Secret key (im Abschnitt "Secret keys")

```
Secret keys
Name: default
API Key: sb_secret_X5pRh••••••••••••••••
```
→ Der Key ist standardmäßig ausgeblendet (zeigt `••••••••`)
→ Klicke auf das **Augensymbol** 👁️ oder "Reveal" um ihn anzuzeigen
→ Das ist dein `SUPABASE_SERVICE_ROLE_KEY`
→ **WICHTIG: Dieser Key ist geheim!**

### Schritt 4: Keys kopieren

1. **Project URL:** Klicke auf das Kopier-Symbol oder markiere und kopiere
2. **Publishable key:** Klicke auf das Kopier-Symbol neben dem Key
3. **Secret key:** 
   - Klicke zuerst auf das Augensymbol 👁️ um den Key zu sehen
   - Dann klicke auf das Kopier-Symbol

## Beispiel .env.local

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_BjWODH2zrJQsyGB2Ip92pg_ydiQTv5P
SUPABASE_SERVICE_ROLE_KEY=sb_secret_X5pRh... (vollständiger Key nach Reveal)
```

## Wichtig: Sicherheit

⚠️ **Secret key ist GEHEIM!**
- Beginnt mit `sb_secret_`
- Niemals in öffentlichen Repositories committen
- Nur auf dem Server verwenden
- Nicht im Client-Code verwenden
- Die `.env.local` Datei ist bereits in `.gitignore` (sicher)

## Falls du den Key nicht findest

1. Stelle sicher, dass du im richtigen Projekt bist
2. Prüfe, ob du Admin-Rechte hast
3. Versuche die Seite neu zu laden
4. Falls der Secret key immer noch ausgeblendet ist: Klicke auf das Augensymbol 👁️ neben dem Key

## Unterschied zu alten Keys

- **Alt:** "anon public" → **Neu:** "Publishable key"
- **Alt:** "service_role" → **Neu:** "Secret key"
- Beide funktionieren gleich, nur die Bezeichnung hat sich geändert
