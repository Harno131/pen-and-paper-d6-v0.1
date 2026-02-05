export type ShopItem = {
  id: string
  name: string
  category: 'weapon' | 'armor' | 'equipment'
  priceCopper: number
  slot?: string | string[]
  twoHanded?: boolean
  description?: string
  stats?: Record<string, number>
}

export const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'weapon-dolch',
    name: 'Dolch',
    category: 'weapon',
    priceCopper: 50,
    slot: ['main_hand', 'off_hand'],
    description: 'Schaden: 1D+1 (4 Blips). Leicht zu verbergen.',
  },
  {
    id: 'weapon-kurzschwert',
    name: 'Kurzschwert',
    category: 'weapon',
    priceCopper: 120,
    slot: 'main_hand',
    description: 'Schaden: 2D (6 Blips). Schnell.',
  },
  {
    id: 'weapon-langschwert',
    name: 'Langschwert',
    category: 'weapon',
    priceCopper: 200,
    slot: 'main_hand',
    description: 'Schaden: 2D+2 (8 Blips). Klassiker.',
  },
  {
    id: 'weapon-streitkolben',
    name: 'Streitkolben',
    category: 'weapon',
    priceCopper: 180,
    slot: 'main_hand',
    description: 'Schaden: 2D+1 (7 Blips). +1 gegen Rüstung.',
  },
  {
    id: 'weapon-kurzbogen',
    name: 'Kurzbogen',
    category: 'weapon',
    priceCopper: 150,
    slot: 'main_hand',
    twoHanded: true,
    description: 'Schaden: 2D (6 Blips). Fernkampf.',
  },
  {
    id: 'weapon-langbogen',
    name: 'Langbogen',
    category: 'weapon',
    priceCopper: 300,
    slot: 'main_hand',
    twoHanded: true,
    description: 'Schaden: 3D (9 Blips). Hohe Reichweite.',
  },
  {
    id: 'armor-lederwams',
    name: 'Lederwams',
    category: 'armor',
    priceCopper: 80,
    slot: 'torso',
    description: 'RS: 1 Blip.',
  },
  {
    id: 'armor-kettenhemd',
    name: 'Kettenhemd',
    category: 'armor',
    priceCopper: 400,
    slot: 'torso',
    description: 'RS: 3 Blips (1D). Malus: -1 Blip auf Ausweichen.',
  },
  {
    id: 'armor-plattenpanzer',
    name: 'Plattenpanzer',
    category: 'armor',
    priceCopper: 1500,
    slot: 'torso',
    description: 'RS: 6 Blips (2D). Malus: -3 Blips auf Heimlichkeit.',
  },
  {
    id: 'armor-lederhelm',
    name: 'Lederhelm',
    category: 'armor',
    priceCopper: 30,
    slot: 'head',
    description: 'RS: 1 Blip.',
  },
  {
    id: 'armor-eisenhelm',
    name: 'Eisenhelm',
    category: 'armor',
    priceCopper: 100,
    slot: 'head',
    description: 'RS: 2 Blips.',
  },
  {
    id: 'armor-holzschild',
    name: 'Holzschild',
    category: 'armor',
    priceCopper: 60,
    slot: 'off_hand',
    description: 'RS: 2 Blips.',
  },
  {
    id: 'equip-fackel',
    name: 'Fackel (3 Stk.)',
    category: 'equipment',
    priceCopper: 5,
    description: 'Licht für 1 Stunde.',
  },
  {
    id: 'equip-seil',
    name: 'Seil (10m)',
    category: 'equipment',
    priceCopper: 20,
    description: 'Reißfest.',
  },
  {
    id: 'equip-rationen',
    name: 'Rationen (1 Tag)',
    category: 'equipment',
    priceCopper: 2,
    description: 'Verhindert Hunger-Mali.',
  },
  {
    id: 'equip-heilsalbe',
    name: 'Heilsalbe',
    category: 'equipment',
    priceCopper: 50,
    description: 'Heilt 1 Kratzer sofort.',
  },
  {
    id: 'equip-dietrich',
    name: 'Dietrich-Set',
    category: 'equipment',
    priceCopper: 100,
    description: 'Nötig für Schlösserknacken.',
  },
]