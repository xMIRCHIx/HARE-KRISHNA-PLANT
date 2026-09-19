import { createClient } from '@supabase/supabase-js';
import { ProductionEntry, Expense, Settings, SalesOrder, CustomerPayment } from '../types';

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://uwfcngioytanhdtdsqyv.supabase.co';
export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3ZmNuZ2lveXRhbmhkdGRzcXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMjQzOTAsImV4cCI6MjEwMjcwMDM5MH0.0uJgkeLt4bpuDibLQMlk8S4s-ya2AHSndkEKcPSBitQ';

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
    payment_mode TEXT DEFAULT NULL, -- 'cash', 'upi', 'bank_transfer', 'cheque'
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
    payment_mode TEXT DEFAULT NULL, -- 'cash', 'upi', 'bank_transfer', 'cheque'
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

-- Migration helper if table already existed without payment_mode
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS payment_mode TEXT DEFAULT NULL;

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
      console.warn('Supabase table query notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase offline or unreachable:', err);
    return false;
  }
}

// ==========================================
// REAL-TIME TWO-WAY CLOUD SYNC METHODS
// ==========================================

export async function syncEntryToCloud(entry: ProductionEntry): Promise<boolean> {
  try {
    const row = {
      id: entry.id,
      date: entry.date,
      produced: entry.produced,
      sold: entry.sold,
      sale_price: entry.salePrice,
      cost_mode: entry.costMode,
      cement_bags: entry.cementBags,
      cement_rate: entry.cementRate,
      dust_trucks: entry.dustTrucks,
      dust_rate: entry.dustRate,
      raakh_qty: entry.raakhQty,
      raakh_rate: entry.raakhRate,
      manual_material_cost: entry.manualMaterialCost || null,
      worker_rate: entry.workerRate,
      other_cost: entry.otherCost,
      note: entry.note || null,
      estimated_target: entry.estimatedTarget || null,
      variance_note: entry.varianceNote || null,
      run_lines: entry.runLines || []
    };
    const { error } = await supabase.from('production_entries').upsert(row);
    if (error) {
      console.warn('Supabase syncEntry error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase syncEntry network exception:', err);
    return false;
  }
}

export async function deleteEntryFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('production_entries').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function syncExpenseToCloud(expense: Expense): Promise<boolean> {
  try {
    const row = {
      id: expense.id,
      date: expense.date,
      category: expense.category,
      amount: expense.amount,
      frequency: expense.frequency,
      note: expense.note || null
    };
    const { error } = await supabase.from('expenses').upsert(row);
    if (error) {
      console.warn('Supabase syncExpense error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase syncExpense network exception:', err);
    return false;
  }
}

export async function deleteExpenseFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function syncSalesOrderToCloud(order: SalesOrder): Promise<boolean> {
  try {
    const baseRow = {
      id: order.id,
      date: order.date,
      customer_name: order.customerName,
      customer_phone: order.customerPhone || null,
      site_location: order.siteLocation || null,
      quantity: order.quantity,
      rate: order.rate,
      total_amount: order.totalAmount,
      paid_amount: order.paidAmount,
      balance_due: order.balanceDue,
      payment_status: order.paymentStatus,
      note: order.note || null
    };

    // If order has a paymentMode, try sending it first; if PGRST204 occurs (column absent), cleanly fallback to baseRow
    if (order.paymentMode) {
      const rowWithMode = { ...baseRow, payment_mode: order.paymentMode };
      const { error: modeErr } = await supabase.from('sales_orders').upsert(rowWithMode);
      if (!modeErr) {
        return true;
      }
      // If error is other than missing column, log warning
      if (modeErr.code !== 'PGRST204') {
        console.warn('Supabase syncSalesOrder notice:', modeErr.message);
      }
    }

    const { error } = await supabase.from('sales_orders').upsert(baseRow);
    if (error) {
      console.warn('Supabase syncSalesOrder notice (ensure sales_orders table is created in Supabase SQL editor):', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase syncSalesOrder network exception:', err);
    return false;
  }
}

export async function deleteSalesOrderFromCloud(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('sales_orders').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

export async function syncPaymentToCloud(payment: CustomerPayment): Promise<boolean> {
  try {
    const row = {
      id: payment.id,
      order_id: payment.orderId,
      date: payment.date,
      customer_name: payment.customerName,
      amount: payment.amount,
      payment_mode: payment.paymentMode,
      note: payment.note || null
    };
    const { error } = await supabase.from('customer_payments').upsert(row);
    if (error) {
      console.warn('Supabase syncPayment notice:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase syncPayment network exception:', err);
    return false;
  }
}

export async function syncSettingsToCloud(settings: Settings): Promise<boolean> {
  try {
    const row = {
      id: 'default',
      default_sale_price: settings.defaultSalePrice,
      default_worker_rate: settings.defaultWorkerRate,
      target_cost_per_brick: 3.50,
      opening_stock: settings.openingStock,
      production_estimate_mode: settings.productionEstimateMode,
      cement_yield_ratio: settings.cementRatio,
      unit_raakh_label: settings.unitRaakhLabel,
      overhead_split_mode: settings.overheadSplitMode,
      allow_udhaar_credit: settings.allowUdhaarCredit
    };
    const { error } = await supabase.from('plant_settings').upsert(row);
    return !error;
  } catch {
    return false;
  }
}

export async function fetchAllFromCloud(): Promise<{
  entries?: ProductionEntry[];
  expenses?: Expense[];
  salesOrders?: SalesOrder[];
  customerPayments?: CustomerPayment[];
} | null> {
  try {
    const [entriesRes, expensesRes, salesRes, paymentsRes] = await Promise.allSettled([
      supabase.from('production_entries').select('*').order('date', { ascending: true }),
      supabase.from('expenses').select('*').order('date', { ascending: true }),
      supabase.from('sales_orders').select('*').order('date', { ascending: false }),
      supabase.from('customer_payments').select('*').order('date', { ascending: false })
    ]);

    const result: {
      entries?: ProductionEntry[];
      expenses?: Expense[];
      salesOrders?: SalesOrder[];
      customerPayments?: CustomerPayment[];
    } = {};

    if (entriesRes.status === 'fulfilled' && !entriesRes.value.error && entriesRes.value.data && entriesRes.value.data.length > 0) {
      result.entries = entriesRes.value.data.map((r: any) => ({
        id: r.id,
        date: r.date,
        produced: Number(r.produced) || 0,
        sold: Number(r.sold) || 0,
        salePrice: Number(r.sale_price) || 4.00,
        costMode: r.cost_mode || 'ratio',
        cementBags: Number(r.cement_bags) || 0,
        cementRate: Number(r.cement_rate) || 0,
        dustTrucks: Number(r.dust_trucks) || 0,
        dustRate: Number(r.dust_rate) || 0,
        raakhQty: Number(r.raakh_qty) || 0,
        raakhRate: Number(r.raakh_rate) || 0,
        manualMaterialCost: r.manual_material_cost ? Number(r.manual_material_cost) : undefined,
        workerRate: Number(r.worker_rate) || 0.60,
        otherCost: Number(r.other_cost) || 0,
        note: r.note || undefined,
        estimatedTarget: r.estimated_target ? Number(r.estimated_target) : undefined,
        varianceNote: r.variance_note || undefined,
        runLines: r.run_lines || []
      }));
    }

    if (expensesRes.status === 'fulfilled' && !expensesRes.value.error && expensesRes.value.data && expensesRes.value.data.length > 0) {
      result.expenses = expensesRes.value.data.map((r: any) => ({
        id: r.id,
        date: r.date,
        category: r.category,
        amount: Number(r.amount) || 0,
        frequency: r.frequency || 'daily',
        note: r.note || undefined
      }));
    }

    if (salesRes.status === 'fulfilled' && !salesRes.value.error && salesRes.value.data && salesRes.value.data.length > 0) {
      result.salesOrders = salesRes.value.data.map((r: any) => ({
        id: r.id,
        date: r.date,
        customerName: r.customer_name,
        customerPhone: r.customer_phone || undefined,
        siteLocation: r.site_location || undefined,
        quantity: Number(r.quantity) || 0,
        rate: Number(r.rate) || 4.00,
        totalAmount: Number(r.total_amount) || 0,
        paidAmount: Number(r.paid_amount) || 0,
        balanceDue: Number(r.balance_due) || 0,
        paymentStatus: r.payment_status || 'due',
        paymentMode: r.payment_mode || undefined,
        note: r.note || undefined
      }));
    }

    if (paymentsRes.status === 'fulfilled' && !paymentsRes.value.error && paymentsRes.value.data && paymentsRes.value.data.length > 0) {
      result.customerPayments = paymentsRes.value.data.map((r: any) => ({
        id: r.id,
        orderId: r.order_id,
        date: r.date,
        customerName: r.customer_name,
        amount: Number(r.amount) || 0,
        paymentMode: r.payment_mode || 'cash',
        note: r.note || undefined
      }));
    }

    // Attach paymentMode from customerPayments if not present on sales_orders
    if (result.salesOrders && result.customerPayments) {
      for (const order of result.salesOrders) {
        if (!order.paymentMode) {
          const matchingPayment = result.customerPayments.find(p => p.orderId === order.id);
          if (matchingPayment) {
            order.paymentMode = matchingPayment.paymentMode;
          }
        }
      }
    }

    return result;
  } catch (err) {
    console.warn('Error fetching all cloud data:', err);
    return null;
  }
}
