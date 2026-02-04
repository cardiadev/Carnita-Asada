-- =============================================
-- CARNITA ASADA - Schema de Base de Datos
-- Creado por @cardiadev (Carlos Díaz)
-- =============================================

-- Tabla: events (Eventos de carnita asada)
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nano_id VARCHAR(10) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  event_date TIMESTAMPTZ NOT NULL,
  people_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_nano_id ON events(nano_id);

-- Tabla: attendees (Asistentes al evento)
CREATE TABLE attendees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  exclude_from_split BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendees_event_id ON attendees(event_id);

-- Tabla: categories (Categorías de compras)
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT TRUE
);

-- Insertar categorías predefinidas
INSERT INTO categories (name, icon, sort_order) VALUES
  ('Carnicería', 'beef', 1),
  ('Verduras', 'carrot', 2),
  ('Botanas', 'cookie', 3),
  ('Bebidas', 'beer', 4),
  ('Desechables', 'utensils', 5),
  ('Carbón y Encendido', 'flame', 6),
  ('Extras', 'plus', 7);

-- Tabla: suggested_items (Sugerencias predefinidas)
CREATE TABLE suggested_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  default_unit VARCHAR(20) DEFAULT 'piezas'
);

-- Insertar sugerencias por categoría
-- Carnicería
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Arrachera', 'kg' FROM categories WHERE name = 'Carnicería';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Costilla', 'kg' FROM categories WHERE name = 'Carnicería';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Chorizo', 'kg' FROM categories WHERE name = 'Carnicería';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Pollo', 'kg' FROM categories WHERE name = 'Carnicería';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Salchichas', 'paquetes' FROM categories WHERE name = 'Carnicería';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Bistec', 'kg' FROM categories WHERE name = 'Carnicería';

-- Verduras
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Cebolla', 'piezas' FROM categories WHERE name = 'Verduras';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Chile serrano', 'piezas' FROM categories WHERE name = 'Verduras';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Limón', 'kg' FROM categories WHERE name = 'Verduras';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Cilantro', 'manojos' FROM categories WHERE name = 'Verduras';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Aguacate', 'piezas' FROM categories WHERE name = 'Verduras';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Tomate', 'kg' FROM categories WHERE name = 'Verduras';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Nopales', 'piezas' FROM categories WHERE name = 'Verduras';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Cebollitas cambray', 'manojos' FROM categories WHERE name = 'Verduras';

-- Botanas
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Totopos', 'bolsas' FROM categories WHERE name = 'Botanas';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Cacahuates', 'bolsas' FROM categories WHERE name = 'Botanas';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Guacamole', 'porciones' FROM categories WHERE name = 'Botanas';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Salsa', 'frascos' FROM categories WHERE name = 'Botanas';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Chicharrón', 'bolsas' FROM categories WHERE name = 'Botanas';

-- Bebidas
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Cerveza', 'six' FROM categories WHERE name = 'Bebidas';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Refresco', 'litros' FROM categories WHERE name = 'Bebidas';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Agua', 'litros' FROM categories WHERE name = 'Bebidas';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Hielo', 'bolsas' FROM categories WHERE name = 'Bebidas';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Jugo', 'litros' FROM categories WHERE name = 'Bebidas';

-- Desechables
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Platos', 'paquetes' FROM categories WHERE name = 'Desechables';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Vasos', 'paquetes' FROM categories WHERE name = 'Desechables';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Servilletas', 'paquetes' FROM categories WHERE name = 'Desechables';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Cubiertos', 'paquetes' FROM categories WHERE name = 'Desechables';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Tortillas', 'kg' FROM categories WHERE name = 'Desechables';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Papel aluminio', 'rollos' FROM categories WHERE name = 'Desechables';

-- Carbón y Encendido
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Carbón', 'kg' FROM categories WHERE name = 'Carbón y Encendido';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Encendedor', 'piezas' FROM categories WHERE name = 'Carbón y Encendido';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Ocote', 'paquetes' FROM categories WHERE name = 'Carbón y Encendido';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Cerillos', 'cajas' FROM categories WHERE name = 'Carbón y Encendido';

-- Extras
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Sal', 'paquetes' FROM categories WHERE name = 'Extras';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Pimienta', 'frascos' FROM categories WHERE name = 'Extras';
INSERT INTO suggested_items (category_id, name, default_unit)
SELECT id, 'Aceite', 'litros' FROM categories WHERE name = 'Extras';

-- Tabla: shopping_items (Items de la lista de compras)
CREATE TABLE shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id),
  name VARCHAR(100) NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit VARCHAR(20) DEFAULT 'piezas',
  is_purchased BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shopping_items_event_id ON shopping_items(event_id);

-- Tabla: expenses (Gastos registrados)
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES attendees(id) ON DELETE SET NULL,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  receipt_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenses_event_id ON expenses(event_id);

-- Tabla: expense_exclusions (Exclusiones de gastos específicos)
CREATE TABLE expense_exclusions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
  UNIQUE(expense_id, attendee_id)
);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar people_count automáticamente
CREATE OR REPLACE FUNCTION update_people_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'DELETE' THEN
    UPDATE events
    SET people_count = (
      SELECT COUNT(*) FROM attendees WHERE event_id = COALESCE(NEW.event_id, OLD.event_id)
    )
    WHERE id = COALESCE(NEW.event_id, OLD.event_id);
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_people_count
  AFTER INSERT OR DELETE ON attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_people_count();
