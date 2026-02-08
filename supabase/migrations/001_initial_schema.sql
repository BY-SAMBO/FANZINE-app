-- FANZINE App - Initial Database Schema
-- Run this in Supabase SQL Editor

-- ============================================================
-- EXTENSION
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  fudo_category_id TEXT,
  orden INTEGER NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id TEXT PRIMARY KEY, -- e.g. "TA001"
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  categoria_id UUID NOT NULL REFERENCES categories(id),

  -- Precios
  precio_venta NUMERIC(10,0) NOT NULL DEFAULT 0,
  precio_delivery NUMERIC(10,0),
  precio_costo_receta NUMERIC(10,0),
  precio_costo_real NUMERIC(10,0),

  -- Estado
  activo BOOLEAN NOT NULL DEFAULT true,
  visible_menu BOOLEAN NOT NULL DEFAULT true,
  disponible_local BOOLEAN NOT NULL DEFAULT true,
  disponible_delivery BOOLEAN NOT NULL DEFAULT false,
  favorito BOOLEAN NOT NULL DEFAULT false,

  -- Contenido
  descripcion_corta TEXT,
  descripcion_delivery TEXT,
  descripcion_larga TEXT,
  prompt_ia TEXT,

  -- Media
  foto_principal TEXT,
  galeria TEXT[] DEFAULT '{}',

  -- Fudo sync
  fudo_id TEXT,
  fudo_synced_at TIMESTAMPTZ,
  fudo_sync_status TEXT NOT NULL DEFAULT 'local_only'
    CHECK (fudo_sync_status IN ('synced', 'pending', 'conflict', 'local_only', 'fudo_only')),

  -- Checklist
  checklist_status TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (checklist_status IN ('completo', 'incompleto', 'pendiente')),
  checklist_precio_delivery BOOLEAN NOT NULL DEFAULT false,
  checklist_descripcion_delivery BOOLEAN NOT NULL DEFAULT false,
  checklist_foto_principal BOOLEAN NOT NULL DEFAULT false,

  -- Delivery config (overrides por producto)
  delivery_config JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_categoria ON products(categoria_id);
CREATE INDEX idx_products_fudo_id ON products(fudo_id);
CREATE INDEX idx_products_sync_status ON products(fudo_sync_status);
CREATE INDEX idx_products_checklist ON products(checklist_status);

-- ============================================================
-- DELIVERY MODULES
-- ============================================================
CREATE TABLE delivery_modules (
  id TEXT PRIMARY KEY,
  titulo TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('multiple', 'single')),
  max_items INTEGER,
  catalogo JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- DELIVERY CATEGORY TEMPLATES
-- ============================================================
CREATE TABLE delivery_category_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  categoria_id UUID NOT NULL UNIQUE REFERENCES categories(id),
  modulos_orden TEXT[] NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- USER PROFILES
-- ============================================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'mesero'
    CHECK (rol IN ('administrador', 'mesero', 'cajero')),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- FUDO SYNC LOG
-- ============================================================
CREATE TABLE fudo_sync_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT REFERENCES products(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'price_sync')),
  direction TEXT NOT NULL CHECK (direction IN ('push', 'pull')),
  details JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'skipped')),
  error_message TEXT,
  performed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sync_log_product ON fudo_sync_log(product_id);
CREATE INDEX idx_sync_log_created ON fudo_sync_log(created_at DESC);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- 1. Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_categories
  BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_delivery_modules
  BEFORE UPDATE ON delivery_modules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_delivery_category_templates
  BEFORE UPDATE ON delivery_category_templates
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- 2. Auto-calculate delivery price if NULL
CREATE OR REPLACE FUNCTION trigger_calculate_delivery_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.precio_delivery IS NULL AND NEW.precio_venta > 0 THEN
    NEW.precio_delivery = ROUND(NEW.precio_venta * 1.35 / 100) * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_delivery_price
  BEFORE INSERT OR UPDATE OF precio_venta, precio_delivery ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_calculate_delivery_price();

-- 3. Auto-calculate checklist status
CREATE OR REPLACE FUNCTION trigger_update_checklist_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checklist_precio_delivery AND NEW.checklist_descripcion_delivery AND NEW.checklist_foto_principal THEN
    NEW.checklist_status = 'completo';
  ELSIF NEW.checklist_precio_delivery OR NEW.checklist_descripcion_delivery OR NEW.checklist_foto_principal THEN
    NEW.checklist_status = 'incompleto';
  ELSE
    NEW.checklist_status = 'pendiente';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_checklist_status
  BEFORE INSERT OR UPDATE OF checklist_precio_delivery, checklist_descripcion_delivery, checklist_foto_principal ON products
  FOR EACH ROW EXECUTE FUNCTION trigger_update_checklist_status();

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_category_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fudo_sync_log ENABLE ROW LEVEL SECURITY;

-- Helper: get user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT rol FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- CATEGORIES: all authenticated can read, only admin can write
CREATE POLICY "categories_select" ON categories
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "categories_insert" ON categories
  FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "categories_update" ON categories
  FOR UPDATE TO authenticated USING (get_user_role() = 'administrador');
CREATE POLICY "categories_delete" ON categories
  FOR DELETE TO authenticated USING (get_user_role() = 'administrador');

-- PRODUCTS: all authenticated can read, only admin can write
CREATE POLICY "products_select" ON products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "products_insert" ON products
  FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "products_update_admin" ON products
  FOR UPDATE TO authenticated USING (get_user_role() = 'administrador');
-- Mesero can update checklist fields only (handled at app level, RLS allows update)
CREATE POLICY "products_update_mesero" ON products
  FOR UPDATE TO authenticated USING (get_user_role() = 'mesero');
CREATE POLICY "products_delete" ON products
  FOR DELETE TO authenticated USING (get_user_role() = 'administrador');

-- DELIVERY MODULES: all read, admin write
CREATE POLICY "delivery_modules_select" ON delivery_modules
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "delivery_modules_insert" ON delivery_modules
  FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "delivery_modules_update" ON delivery_modules
  FOR UPDATE TO authenticated USING (get_user_role() = 'administrador');
CREATE POLICY "delivery_modules_delete" ON delivery_modules
  FOR DELETE TO authenticated USING (get_user_role() = 'administrador');

-- DELIVERY CATEGORY TEMPLATES: all read, admin write
CREATE POLICY "delivery_templates_select" ON delivery_category_templates
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "delivery_templates_insert" ON delivery_category_templates
  FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "delivery_templates_update" ON delivery_category_templates
  FOR UPDATE TO authenticated USING (get_user_role() = 'administrador');
CREATE POLICY "delivery_templates_delete" ON delivery_category_templates
  FOR DELETE TO authenticated USING (get_user_role() = 'administrador');

-- USER PROFILES: admin sees all, others see own
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR get_user_role() = 'administrador');
CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE TO authenticated USING (get_user_role() = 'administrador');
CREATE POLICY "user_profiles_delete" ON user_profiles
  FOR DELETE TO authenticated USING (get_user_role() = 'administrador');

-- FUDO SYNC LOG: all read, admin write
CREATE POLICY "sync_log_select" ON fudo_sync_log
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "sync_log_insert" ON fudo_sync_log
  FOR INSERT TO authenticated WITH CHECK (get_user_role() = 'administrador');

-- ============================================================
-- STORAGE BUCKET
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "product_images_select" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');
CREATE POLICY "product_images_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT get_user_role()) = 'administrador'
  );
CREATE POLICY "product_images_update" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'product-images'
    AND (SELECT get_user_role()) = 'administrador'
  );
CREATE POLICY "product_images_delete" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'product-images'
    AND (SELECT get_user_role()) = 'administrador'
  );
