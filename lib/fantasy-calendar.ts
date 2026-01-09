// Fantasie-Kalender: Der Zyklus der Prismen

export interface FantasyDate {
  year: number
  month: number // 1-12
  day: number // 1-30
  weekday: number // 0-6
}

export interface MonthInfo {
  number: number
  name: string
  meaning: string
  special: string
}

export interface WeekdayInfo {
  number: number
  name: string
  meaning: string
}

export const MONTHS: MonthInfo[] = [
  { number: 1, name: 'Frostglanz', meaning: 'Tiefer Winter, gefrorene Gischt.', special: 'Die Wasserfälle werden zu Eissäulen.' },
  { number: 2, name: 'Tauwacht', meaning: 'Das Eis bricht, der Fluss schwillt an.', special: 'Die unteren Docks sind oft überflutet.' },
  { number: 3, name: 'Sturmsiegel', meaning: 'Heftige Winde peitschen den Dunst auf.', special: 'Schutzzauber an den Brücken werden erneuert.' },
  { number: 4, name: 'Regenbogen-Gleis', meaning: 'Sanftes Licht bricht sich im Dunst.', special: 'Fest der Farben: Man tauscht Glas-Artefakte.' },
  { number: 5, name: 'Blütennebel', meaning: 'Pollen mischen sich unter die Feuchtigkeit.', special: 'Die Klippen von Fallcrest blühen tiefblau.' },
  { number: 6, name: 'Sonnenspiegel', meaning: 'Höchster Sonnenstand, gleißendes Licht.', special: 'Das Wasser wirkt wie flüssiges Gold.' },
  { number: 7, name: 'Gischtrausch', meaning: 'Heiße Tage, kühle Luft am Fluss.', special: 'Die Zeit der großen Flusshändler-Konvois.' },
  { number: 8, name: 'Erntequell', meaning: 'Feuchte, warme Luft; Zeit der Ernte.', special: 'Die Pilzgärten in den Klippenhöhlen gedeihen.' },
  { number: 9, name: 'Nebelwacht', meaning: 'Der Dunst wird dicker, Sichtweiten sinken.', special: 'Artefakt-Leuchten markiert die Wege.' },
  { number: 10, name: 'Blattfall', meaning: 'Nasses Laub auf den glatten Straßen.', special: 'Rutschgefahr! Die "Treppen" sind gefährlich.' },
  { number: 11, name: 'Dunkelstrom', meaning: 'Kurze Tage, mystische Stimmung.', special: 'Zeit der Geistergeschichten am Kamin.' },
  { number: 12, name: 'Sternenanker', meaning: 'Klare, kalte Nächte; Prismen-Sterne.', special: 'Die längste Nacht wird mit Lichtmagie gefeiert.' },
]

export const WEEKDAYS: WeekdayInfo[] = [
  { number: 0, name: 'Flusstag', meaning: 'Handelstag' },
  { number: 1, name: 'Felsentag', meaning: 'Tag der Arbeit/Handwerk' },
  { number: 2, name: 'Dunsttag', meaning: 'Tag der Ruhe/Besinnung' },
  { number: 3, name: 'Lichttag', meaning: 'Tag der Magie/Artefakte' },
  { number: 4, name: 'Gischttag', meaning: 'Markttag' },
  { number: 5, name: 'Kronentag', meaning: 'Tag des Lords/Rechtsprechung' },
  { number: 6, name: 'Prismentag', meaning: 'Feiertag' },
]

// Spezielle Feiertage
export const SPECIAL_EVENTS = {
  '6-15': { // Monat 6, Tag 15
    name: 'Die Nacht der tanzenden Lichter',
    description: 'Mitte des Jahres, im Monat Sonnenspiegel, bricht sich das Sonnenlicht so perfekt im aufsteigenden Dunst der großen Wasserfälle, dass die ganze Stadt in ein schimmerndes Regenbogen-Licht getaucht wird.',
    tradition: 'Die Bürger stellen ihre magischen Artefakte in die Fenster. Das Licht der Wasserfälle lädt die Steine symbolisch für das nächste Jahr auf.',
    visual: 'Die nassen Kopfsteinpflaster reflektieren alle Farben gleichzeitig.',
  },
}

/**
 * Konvertiert ein reales Datum in ein Fantasie-Datum basierend auf Start-Datum
 * @param realDate Reales Datum
 * @param startDate Start-Datum des Abenteuers (optional, Standard: 1. Frostglanz, Jahr 1)
 * @param realStartDate Reales Start-Datum (optional, Standard: heute)
 */
export function realDateToFantasyDate(
  realDate: Date, 
  startDate?: { year: number; month: number; day: number },
  realStartDate?: Date
): FantasyDate {
  // Wenn kein Start-Datum angegeben, verwende Standard
  const fantasyStart = startDate || { year: 1, month: 1, day: 1 }
  const realStart = realStartDate || new Date()
  
  // Berechne Tage seit Start
  const daysSinceStart = Math.floor((realDate.getTime() - realStart.getTime()) / (1000 * 60 * 60 * 24))
  
  // Starte vom Fantasie-Start-Datum
  let currentYear = fantasyStart.year
  let currentMonth = fantasyStart.month
  let currentDay = fantasyStart.day
  
  // Addiere Tage
  let remainingDays = daysSinceStart
  
  // Wenn negative Tage, gehe zurück
  if (remainingDays < 0) {
    while (remainingDays < 0) {
      currentDay--
      if (currentDay < 1) {
        currentMonth--
        if (currentMonth < 1) {
          currentYear--
          if (currentYear < 1) currentYear = 1
          currentMonth = 12
        }
        currentDay = 30
      }
      remainingDays++
    }
  } else {
    // Wenn positive Tage, gehe vorwärts
    while (remainingDays > 0) {
      currentDay++
      if (currentDay > 30) {
        currentMonth++
        if (currentMonth > 12) {
          currentYear++
          currentMonth = 1
        }
        currentDay = 1
      }
      remainingDays--
    }
  }
  
  // Berechne Wochentag basierend auf dem absoluten Tag seit Jahr 1, Tag 1
  const absoluteDay = (currentYear - 1) * 360 + (currentMonth - 1) * 30 + (currentDay - 1)
  const weekday = absoluteDay % 7
  
  return {
    year: currentYear,
    month: currentMonth,
    day: currentDay,
    weekday,
  }
}

/**
 * Formatiert ein Fantasie-Datum als String
 */
export function formatFantasyDate(date: FantasyDate, includeWeekday: boolean = true, timeOfDay?: string): string {
  const month = MONTHS.find(m => m.number === date.month)
  const weekday = WEEKDAYS.find(w => w.number === date.weekday)
  
  let result = `${date.day}. ${month?.name || `Monat ${date.month}`}, Jahr ${date.year}`
  
  if (includeWeekday && weekday) {
    result = `${weekday.name}, ${result}`
  }
  
  if (timeOfDay) {
    result = `${timeOfDay}, ${result}`
  }
  
  return result
}

/**
 * Tageszeiten
 */
export const TIMES_OF_DAY = [
  'Frühgischt',
  'Aufgang',
  'Früh',
  'Mittag',
  'Spät',
  'Untergang',
  'Gischt',
  'Nacht',
] as const

export type TimeOfDay = typeof TIMES_OF_DAY[number]

/**
 * Prüft ob ein spezielles Event an diesem Datum ist
 */
export function getSpecialEvent(date: FantasyDate): typeof SPECIAL_EVENTS[keyof typeof SPECIAL_EVENTS] | null {
  const key = `${date.month}-${date.day}` as keyof typeof SPECIAL_EVENTS
  return SPECIAL_EVENTS[key] || null
}

/**
 * Gibt Monats-Info zurück
 */
export function getMonthInfo(monthNumber: number): MonthInfo | null {
  return MONTHS.find(m => m.number === monthNumber) || null
}

/**
 * Gibt Wochentag-Info zurück
 */
export function getWeekdayInfo(weekdayNumber: number): WeekdayInfo | null {
  return WEEKDAYS.find(w => w.number === weekdayNumber) || null
}

/**
 * Erstellt ein Fantasie-Datum manuell
 */
export function createFantasyDate(year: number, month: number, day: number): FantasyDate {
  // Berechne Wochentag basierend auf dem Datum
  const daysSinceStart = (year - 1) * 360 + (month - 1) * 30 + (day - 1)
  const weekday = daysSinceStart % 7
  
  return {
    year,
    month: Math.max(1, Math.min(12, month)),
    day: Math.max(1, Math.min(30, day)),
    weekday,
  }
}

