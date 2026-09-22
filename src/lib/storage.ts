import { ProductionEntry, Expense, Settings, SalesOrder, CustomerPayment } from '../types';

const STORAGE_KEYS = {
  ENTRIES: 'hkb_production_entries_v2', // v2 clears previous dummy data
  EXPENSES: 'hkb_expenses_v2',
  SETTINGS: 'hkb_settings_v2',
  SALES_ORDERS: 'hkb_sales_orders_v1',
  CUSTOMER_PAYMENTS: 'hkb_customer_payments_v1',
  AUTH_SESSION: 'hkb_session_v1'
};

export const DEFAULT_SETTINGS: Settings = {
  productionEstimateMode: 'fixed',
  cementRatio: 300, // 300 bricks per 50kg bag (Plant confirmed: ~33 bags = 10,000 bricks)
  dustRatio: 10000, // 10,000 bricks per 800-900 CFT truck
  raakhRatio: 2500, // 2,500 bricks per Ton of fly ash
  defaultWorkerRate: 0.60, // ₹0.60 per brick payoff
  defaultSalePrice: 4.00, // ₹4.00 benchmark selling price
  overheadSplitMode: 'separate',
  adminPassword: 'admin',
  openingStock: 0, // Fresh yard balance to be configured by owner
  openingStockDate: new Date().toISOString().split('T')[0],
  unitRaakhLabel: 'Tons',
  unitDustLabel: 'Trucks (800-900 CFT)',
  allowUdhaarCredit: true,
  batchCementBags: 1,
  batchDustQty: 0.03, // ~0.03 truck (300 bricks)
  batchFlyAshQty: 0.12, // ~0.12 Ton (120 kg raakh for 300 bricks)
  bricksPerBatch: 300,
  isRatioConfirmed: true
};

// Clean initial state (no fake dummy data)
export const INITIAL_ENTRIES: ProductionEntry[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
export const INITIAL_SALES_ORDERS: SalesOrder[] = [];
export const INITIAL_CUSTOMER_PAYMENTS: CustomerPayment[] = [];

export function getStoredSettings(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    // Auto-migrate any legacy Ton labels back to Trucks/CFT for stone dust
    if (parsed.unitDustLabel && parsed.unitDustLabel.toLowerCase().includes('ton')) {
      parsed.unitDustLabel = 'Trucks (800-900 CFT)';
      if (parsed.dustRatio === 600) parsed.dustRatio = 10000;
      if (parsed.batchDustQty === 0.18) parsed.batchDustQty = 0.03;
    }
    // Fly ash stays in Metric Tons as plant measures raakh in Tons
    if (!parsed.unitRaakhLabel || parsed.unitRaakhLabel.toLowerCase().includes('truck')) {
      parsed.unitRaakhLabel = 'Tons';
      if (!parsed.batchFlyAshQty || parsed.batchFlyAshQty === 0.04) parsed.batchFlyAshQty = 0.12;
    }
    // Auto-calibrate uncalibrated default ratio (120 or 140) to confirmed 300 bricks/bag (33 bags = 10,000 bricks)
    if (parsed.cementRatio === 120 || parsed.cementRatio === 140 || !parsed.cementRatio) {
      parsed.cementRatio = 300;
      parsed.bricksPerBatch = 300;
      parsed.batchDustQty = 0.03;
      parsed.batchFlyAshQty = 0.12;
      parsed.isRatioConfirmed = true;
    }
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveStoredSettings(settings: Settings): void {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
}

export function getStoredEntries(): ProductionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(INITIAL_ENTRIES));
      return INITIAL_ENTRIES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ENTRIES;
  }
}

export function saveStoredEntries(entries: ProductionEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
}

export function getStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
      return INITIAL_EXPENSES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSES;
  }
}

export function saveStoredExpenses(expenses: Expense[]): void {
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
}

export function getStoredSalesOrders(): SalesOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SALES_ORDERS);
    let orders: SalesOrder[] = raw ? JSON.parse(raw) : INITIAL_SALES_ORDERS;

    // Self-healing: recover any sales order created with a customer payment that was dropped
    const rawPayments = localStorage.getItem(STORAGE_KEYS.CUSTOMER_PAYMENTS);
    if (rawPayments) {
      try {
        const payments: CustomerPayment[] = JSON.parse(rawPayments);
        const recovered: SalesOrder[] = [];
        payments.forEach(p => {
          if (p.orderId && !orders.some(o => o.id === p.orderId)) {
            const rate = 4.0;
            const qty = Math.max(Math.round(p.amount / rate), 500);
            recovered.push({
              id: p.orderId,
              date: p.date,
              customerName: p.customerName,
              quantity: qty,
              rate: rate,
              totalAmount: p.amount,
              paidAmount: p.amount,
              balanceDue: 0,
              paymentStatus: 'paid',
              paymentMode: p.paymentMode || 'cash',
              note: p.note || 'Advance order booking'
            });
          }
        });
        if (recovered.length > 0) {
          orders = [...recovered, ...orders];
          localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(orders));
        }
      } catch {
        // ignore JSON parse error in payments
      }
    }

    return orders;
  } catch {
    return INITIAL_SALES_ORDERS;
  }
}

export function saveStoredSalesOrders(orders: SalesOrder[]): void {
  localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(orders));
}

export function getStoredCustomerPayments(): CustomerPayment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMER_PAYMENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, JSON.stringify(INITIAL_CUSTOMER_PAYMENTS));
      return INITIAL_CUSTOMER_PAYMENTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CUSTOMER_PAYMENTS;
  }
}

export function saveStoredCustomerPayments(payments: CustomerPayment[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, JSON.stringify(payments));
}

export function clearAllPlantData(): void {
  localStorage.removeItem(STORAGE_KEYS.ENTRIES);
  localStorage.removeItem(STORAGE_KEYS.EXPENSES);
  localStorage.removeItem(STORAGE_KEYS.SALES_ORDERS);
  localStorage.removeItem(STORAGE_KEYS.CUSTOMER_PAYMENTS);
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, JSON.stringify([]));
}

export function getAuthSession(): boolean {
  return localStorage.getItem(STORAGE_KEYS.AUTH_SESSION) === 'true';
}

export function setAuthSession(auth: boolean): void {
  if (auth) {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
  } else {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  }
}

export function exportBackupJSON(): string {
  const data = {
    exportedAt: new Date().toISOString(),
    plant: 'Hare Krishna Bricks',
    settings: getStoredSettings(),
    entries: getStoredEntries(),
    expenses: getStoredExpenses(),
    salesOrders: getStoredSalesOrders(),
    customerPayments: getStoredCustomerPayments()
  };
  return JSON.stringify(data, null, 2);
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.settings) saveStoredSettings(parsed.settings);
    if (Array.isArray(parsed.entries)) saveStoredEntries(parsed.entries);
    if (Array.isArray(parsed.expenses)) saveStoredExpenses(parsed.expenses);
    if (Array.isArray(parsed.salesOrders)) saveStoredSalesOrders(parsed.salesOrders);
    if (Array.isArray(parsed.customerPayments)) saveStoredCustomerPayments(parsed.customerPayments);
    return true;
  } catch (e) {
    console.error('Failed to import backup:', e);
    return false;
  }
}

/**
 * Resets local storage operational data (sales, payments, production entries, expenses).
 * Preserves plant settings and auth session.
 */
export function clearAllStoredOperationalData(): void {
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(INITIAL_ENTRIES));
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(INITIAL_EXPENSES));
  localStorage.setItem(STORAGE_KEYS.SALES_ORDERS, JSON.stringify(INITIAL_SALES_ORDERS));
  localStorage.setItem(STORAGE_KEYS.CUSTOMER_PAYMENTS, JSON.stringify(INITIAL_CUSTOMER_PAYMENTS));
}
