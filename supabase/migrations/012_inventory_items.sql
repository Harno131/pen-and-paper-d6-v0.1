-- Shop-Inventar (Katalog) für Gegenstände

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price_copper INTEGER DEFAULT 0,
  slot TEXT,
  two_handed BOOLEAN DEFAULT FALSE,
  description TEXT,
  stats JSONB DEFAULT '{}'::jsonb,
  created_by TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_group_id ON inventory_items(group_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_items_unique ON inventory_items(name, category, group_id);

ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Inventory items are public" ON inventory_items;
CREATE POLICY "Inventory items are public"
  ON inventory_items
  FOR ALL
  USING (true)
  WITH CHECK (true);
