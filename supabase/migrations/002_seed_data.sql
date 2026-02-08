-- FANZINE App - Seed Data
-- Categories, Delivery Modules, Delivery Templates

-- ============================================================
-- SEED: CATEGORIES
-- ============================================================
INSERT INTO categories (nombre, slug, orden, activa) VALUES
  ('Tacos', 'tacos', 1, true),
  ('Nachos', 'nachos', 2, true),
  ('Perros', 'perros', 3, true),
  ('Chicanitas', 'chicanitas', 4, true),
  ('Crispetas', 'crispetas', 5, true),
  ('Helados', 'helados', 6, true),
  ('Milkshakes', 'milkshakes', 7, true),
  ('Bebidas', 'bebidas', 8, true),
  ('Tex-Mex', 'tex-mex', 9, true),
  ('Postres', 'postres', 10, true),
  ('Toppings', 'toppings', 11, true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED: DELIVERY MODULES
-- ============================================================
INSERT INTO delivery_modules (id, titulo, tipo, max_items, catalogo) VALUES
  ('toppings', 'Toppings Extra', 'multiple', 5, '[
    {"nombre": "Guacamole", "precio": 3500, "activo": true},
    {"nombre": "Queso cheddar extra", "precio": 3000, "activo": true},
    {"nombre": "Crema agria", "precio": 2500, "activo": true},
    {"nombre": "Jalapeños", "precio": 2000, "activo": true},
    {"nombre": "Pico de gallo", "precio": 2500, "activo": true},
    {"nombre": "Frijoles refritos", "precio": 3000, "activo": true},
    {"nombre": "Chorizo", "precio": 4000, "activo": true},
    {"nombre": "Maiz tierno", "precio": 2500, "activo": true}
  ]'::jsonb),
  ('extras', 'Extras', 'multiple', 3, '[
    {"nombre": "Porcion de nachos", "precio": 5000, "activo": true},
    {"nombre": "Porcion de papas", "precio": 4500, "activo": true},
    {"nombre": "Arroz mexicano", "precio": 4000, "activo": true},
    {"nombre": "Ensalada", "precio": 3500, "activo": true}
  ]'::jsonb),
  ('bebidas', 'Bebidas', 'single', 1, '[
    {"nombre": "Coca-Cola 400ml", "precio": 4500, "activo": true},
    {"nombre": "Sprite 400ml", "precio": 4500, "activo": true},
    {"nombre": "Agua 600ml", "precio": 3000, "activo": true},
    {"nombre": "Limonada natural", "precio": 5000, "activo": true},
    {"nombre": "Cerveza Aguila", "precio": 5000, "activo": true},
    {"nombre": "Cerveza Club Colombia", "precio": 6000, "activo": true}
  ]'::jsonb),
  ('postres', 'Postres', 'single', 1, '[
    {"nombre": "Churros con chocolate", "precio": 8000, "activo": true},
    {"nombre": "Helado artesanal", "precio": 6000, "activo": true},
    {"nombre": "Brownie", "precio": 7000, "activo": true}
  ]'::jsonb),
  ('quitar', 'Quitar Ingredientes', 'multiple', null, '[
    {"nombre": "Sin cebolla", "precio": 0, "activo": true},
    {"nombre": "Sin tomate", "precio": 0, "activo": true},
    {"nombre": "Sin jalapeño", "precio": 0, "activo": true},
    {"nombre": "Sin crema", "precio": 0, "activo": true},
    {"nombre": "Sin guacamole", "precio": 0, "activo": true},
    {"nombre": "Sin queso", "precio": 0, "activo": true},
    {"nombre": "Sin lechuga", "precio": 0, "activo": true},
    {"nombre": "Sin salsa picante", "precio": 0, "activo": true}
  ]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED: DELIVERY CATEGORY TEMPLATES
-- ============================================================
-- Templates define which modules appear for each category and in what order

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY['quitar', 'toppings', 'extras', 'bebidas', 'postres'],
  '{
    "quitar": {"habilitado": true},
    "toppings": {"habilitado": true, "max_items": 5},
    "extras": {"habilitado": true, "max_items": 3},
    "bebidas": {"habilitado": true},
    "postres": {"habilitado": true}
  }'::jsonb
FROM categories c WHERE c.slug = 'tacos'
ON CONFLICT (categoria_id) DO NOTHING;

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY['toppings', 'extras', 'bebidas', 'postres'],
  '{
    "toppings": {"habilitado": true, "max_items": 5},
    "extras": {"habilitado": true, "max_items": 3},
    "bebidas": {"habilitado": true},
    "postres": {"habilitado": true}
  }'::jsonb
FROM categories c WHERE c.slug = 'nachos'
ON CONFLICT (categoria_id) DO NOTHING;

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY['quitar', 'toppings', 'extras', 'bebidas', 'postres'],
  '{
    "quitar": {"habilitado": true},
    "toppings": {"habilitado": true, "max_items": 3},
    "extras": {"habilitado": true, "max_items": 2},
    "bebidas": {"habilitado": true},
    "postres": {"habilitado": true}
  }'::jsonb
FROM categories c WHERE c.slug = 'perros'
ON CONFLICT (categoria_id) DO NOTHING;

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY['toppings', 'bebidas'],
  '{
    "toppings": {"habilitado": true, "max_items": 3},
    "bebidas": {"habilitado": true}
  }'::jsonb
FROM categories c WHERE c.slug = 'chicanitas'
ON CONFLICT (categoria_id) DO NOTHING;

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY['toppings', 'bebidas'],
  '{
    "toppings": {"habilitado": true, "max_items": 3},
    "bebidas": {"habilitado": true}
  }'::jsonb
FROM categories c WHERE c.slug = 'crispetas'
ON CONFLICT (categoria_id) DO NOTHING;

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY['bebidas'],
  '{
    "bebidas": {"habilitado": false}
  }'::jsonb
FROM categories c WHERE c.slug = 'helados'
ON CONFLICT (categoria_id) DO NOTHING;

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY['bebidas'],
  '{
    "bebidas": {"habilitado": false}
  }'::jsonb
FROM categories c WHERE c.slug = 'milkshakes'
ON CONFLICT (categoria_id) DO NOTHING;

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY[]::text[],
  '{}'::jsonb
FROM categories c WHERE c.slug = 'bebidas'
ON CONFLICT (categoria_id) DO NOTHING;

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY['quitar', 'toppings', 'extras', 'bebidas', 'postres'],
  '{
    "quitar": {"habilitado": true},
    "toppings": {"habilitado": true, "max_items": 5},
    "extras": {"habilitado": true, "max_items": 3},
    "bebidas": {"habilitado": true},
    "postres": {"habilitado": true}
  }'::jsonb
FROM categories c WHERE c.slug = 'tex-mex'
ON CONFLICT (categoria_id) DO NOTHING;

INSERT INTO delivery_category_templates (categoria_id, modulos_orden, config)
SELECT c.id,
  ARRAY['bebidas'],
  '{
    "bebidas": {"habilitado": true}
  }'::jsonb
FROM categories c WHERE c.slug = 'postres'
ON CONFLICT (categoria_id) DO NOTHING;
