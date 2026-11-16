-- ============================================================================
-- VELVET CAFE & GRILL — SUPABASE / POSTGRESQL PRODUCTION SCHEMA
-- Covers: Tables (1-15), Staff RBAC, Menu, Orders, Pakistani Payments,
--         Inventory (with Low Stock Alerts), and Daily Expenses.
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STAFF USERS (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS staff_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'CASHIER', 'KITCHEN', 'WAITER')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RESTAURANT TABLES (15 Tables for Velvet Cafe & Grill)
CREATE TABLE IF NOT EXISTS cafe_tables (
  table_number INTEGER PRIMARY KEY CHECK (table_number >= 1 AND table_number <= 15),
  label TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 4,
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'BILL_PENDING', 'PAID')),
  active_order_id TEXT,
  last_payment_method TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MENU ITEMS
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price INTEGER NOT NULL,
  tag TEXT,
  prep_minutes INTEGER NOT NULL DEFAULT 15,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  packaging_type TEXT, -- 'burger' | 'fries' | 'drink' | 'none'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDERS
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  table_number INTEGER NOT NULL REFERENCES cafe_tables(table_number),
  customer_name TEXT DEFAULT 'Valued Guest',
  customer_phone TEXT,
  order_type TEXT NOT NULL DEFAULT 'DINE_IN' CHECK (order_type IN ('DINE_IN', 'TAKEAWAY')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED')),
  subtotal INTEGER NOT NULL,
  tax INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PENDING_VERIFICATION', 'PAID')),
  payment_method TEXT CHECK (payment_method IN ('CASH', 'EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER')),
  payment_reference TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  notes TEXT
);

-- 6. PAYMENTS (Easypaisa, JazzCash, Raast/Bank Transfer, Cash on Counter)
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('CASH', 'EASYPAISA', 'JAZZCASH', 'BANK_TRANSFER')),
  amount INTEGER NOT NULL,
  reference_id TEXT NOT NULL,
  account_or_phone TEXT,
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED')),
  gateway_mode TEXT NOT NULL DEFAULT 'SANDBOX',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Packaging',
  quantity INTEGER NOT NULL DEFAULT 100,
  unit TEXT NOT NULL DEFAULT 'pieces',
  min_threshold INTEGER NOT NULL DEFAULT 25,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. EXPENSES
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  amount INTEGER NOT NULL,
  notes TEXT,
  recorded_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SEED 15 TABLES
INSERT INTO cafe_tables (table_number, label, capacity, status)
SELECT n, 'Table ' || n, CASE WHEN n <= 5 THEN 2 WHEN n <= 12 THEN 4 ELSE 6 END, 'AVAILABLE'
FROM generate_series(1, 15) AS n
ON CONFLICT (table_number) DO NOTHING;

-- SEED INITIAL INVENTORY (EXACT STOCK & THRESHOLDS)
INSERT INTO inventory_items (id, name, category, quantity, unit, min_threshold) VALUES
  ('inv-1', 'Burger boxes', 'Packaging', 100, 'pieces', 25),
  ('inv-2', 'Fries cups/boxes', 'Packaging', 100, 'pieces', 25),
  ('inv-3', 'Cold drink cups', 'Packaging', 100, 'pieces', 25),
  ('inv-4', 'Cup lids', 'Packaging', 100, 'pieces', 25),
  ('inv-5', 'Straws', 'Packaging', 100, 'pieces', 25),
  ('inv-6', 'Takeaway bags', 'Packaging', 100, 'pieces', 25),
  ('inv-7', 'Tissues', 'Packaging', 100, 'pieces', 25)
ON CONFLICT (id) DO NOTHING;

-- ENABLE SUPABASE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE cafe_tables;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE payments;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_items;
