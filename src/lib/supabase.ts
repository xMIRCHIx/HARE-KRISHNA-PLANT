import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = 'https://uwfcngioytanhdtdsqyv.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZmNuZ2lveXRhbmhkdGRzcXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjQzOTAsImV4cCI6MjEwMjcwMDM5MH0.0uJgkeLt4bpuDibLQMlk8S4s-ya2AHSndkEKcPSBitQ';

export const SUPABASE_SERVICE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZmNuZ2lveXRhbmhkdGRzcXl2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzEyNDM5MCwiZXhwIjoyMTAyNzAwMzkwfQ.5kgs2hZh1BDSTSXtl3NxQrDq76lR9N2gmUHBDhZPsKs';

// Client initialized with project credentials
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cloud sync status
export type SyncStatus = 'connected' | 'offline_cached' | 'syncing' | 'error';

/**
 * SQL Schema for Supabase PostgreSQL Database.
 * Can be run in Supabase SQL editor or automated.
 */
export const SUPABASE_SCHEMA_SQL = `-- Hare Krishna Bricks - PostgreSQL Database Schema for Supabase
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/uwfcngioytanhdtdsqyv/sql

-- 1. Production Entries Table
CREATE TABLE IF NOT EXISTS public.production_entries (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    produced INTEGER NOT NULL DEFAULT 0,
    sold INTEGER NOT NULL DEFAULT 0,
    sale_price NUMERIC(10, 2) NOT NULL DEFAULT 4.00,
    cost_mode TEXT NOT NULL DEFAULT 'ratio',
    cement_bags NUMERIC(10, 2) NOT NULL DEFAULT 0,
    cement_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    dust_trucks NUMERIC(10, 2) NOT NULL DEFAULT 0,
    dust_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    raakh_qty NUMERIC(10, 2) NOT NULL DEFAULT 0,
    raakh_rate NUMERIC(10, 2) NOT NULL DEFAULT 0,
    manual_material_cost NUMERIC(12, 2) DEFAULT NULL,
    worker_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.60,
    other_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
    note TEXT DEFAULT NULL,
    estimated_target INTEGER DEFAULT NULL,
    variance_note TEXT DEFAULT NULL,
    run_lines JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Overhead Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    frequency TEXT NOT NULL DEFAULT 'daily',
    note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Plant Settings Table
CREATE TABLE IF NOT EXISTS public.plant_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary',
    production_estimate_mode TEXT NOT NULL DEFAULT 'fixed',
    cement_ratio NUMERIC(10, 2) NOT NULL DEFAULT 120,
    dust_ratio NUMERIC(10, 2) NOT NULL DEFAULT 10000,
    raakh_ratio NUMERIC(10, 2) NOT NULL DEFAULT 2500,
    default_worker_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.60,
    default_sale_price NUMERIC(10, 2) NOT NULL DEFAULT 4.00,
    overhead_split_mode TEXT NOT NULL DEFAULT 'separate',
    admin_password TEXT NOT NULL DEFAULT 'hkb@2026',
    opening_stock INTEGER NOT NULL DEFAULT 15000,
    opening_stock_date DATE DEFAULT CURRENT_DATE,
    unit_raakh_label TEXT NOT NULL DEFAULT 'Tons',
    unit_dust_label TEXT NOT NULL DEFAULT 'Trucks (800-900 cft)',
    allow_udhaar_credit BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Customer Sales & Orders Table (ग्राहक बिक्री व आर्डर)
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT DEFAULT NULL,
    site_location TEXT DEFAULT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    rate NUMERIC(10, 2) NOT NULL DEFAULT 4.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'due', -- 'paid', 'partial', 'due'
    note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customer Payments / Jama Receipts (उधारी जमा / पेमेंट्स)
CREATE TABLE IF NOT EXISTS public.customer_payments (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_mode TEXT NOT NULL DEFAULT 'cash', -- 'cash', 'upi', 'bank_transfer', 'cheque'
    note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS & public access for app usage
ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on production_entries" ON public.production_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on plant_settings" ON public.plant_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sales_orders" ON public.sales_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customer_payments" ON public.customer_payments FOR ALL USING (true) WITH CHECK (true);
`;

/**
 * Isolated SQL query specifically for creating sales & outstanding tables
 */
export const SUPABASE_SALES_SCHEMA_SQL = `-- 1. Customer Sales & Orders Table
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id TEXT PRIMARY KEY,
    date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT DEFAULT NULL,
    site_location TEXT DEFAULT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    rate NUMERIC(10, 2) NOT NULL DEFAULT 4.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    balance_due NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'due', -- 'paid', 'partial', 'due'
    note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Payments / Jama Receipts
CREATE TABLE IF NOT EXISTS public.customer_payments (
    id TEXT PRIMARY KEY,
    order_id TEXT REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    customer_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_mode TEXT NOT NULL DEFAULT 'cash',
    note TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on sales_orders" ON public.sales_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on customer_payments" ON public.customer_payments FOR ALL USING (true) WITH CHECK (true);
`;

/**
 * Checks connection to Supabase
 */
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('production_entries').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, we catch it smoothly
      console.warn('Supabase table query notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase offline or unreachable:', err);
    return false;
  }
}
