// 1. Supabase Client initialisieren
// (Stelle sicher, dass du im Terminal 'npm install @supabase/supabase-js' gemacht hast)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'DEINE_SUPABASE_URL' // Ersetze dies
const supabaseKey = 'DEIN_ANON_KEY'     // Ersetze dies (dein Publishable Key)

const supabase = createClient(supabaseUrl, supabaseKey)

// 2. Die Funktion zum Speichern
// Diese Funktion kannst du später an einen Button in deinem UI binden
export async function createNewCharacter() {
    const charData = {
        name: "Neuer Held aus Fallcrest",
        class: "Artefakt-Sucher",
        level: 1,
        stats: { staerke: 10, magie: 14 },
        inventory: ["Nasser Umhang", "Glimmender Runenstein"]
    };

    console.log("Sende Daten an Supabase...");

    const { data, error } = await supabase
        .from('characters') // Das ist der Name der Tabelle, die wir in Schritt 2 erstellt haben
        .insert([charData])
        .select();

    if (error) {
        console.error('Fehler beim Speichern:', error.message);
        alert('Fehler: ' + error.message);
    } else {
        console.log('Erfolg! Gespeichert:', data);
        alert('Charakter erfolgreich in der Cloud gespeichert!');
    }
}