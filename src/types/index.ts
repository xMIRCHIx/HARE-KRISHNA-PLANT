// Data models strictly implementing hare-krishna-bricks-spec.md

export type CostMode = 'ratio' | 'manual';
export type ExpenseFrequency = 'daily' | 'monthly';
export type ProductionEstimateMode = 'fixed' | 'auto';
export type OverheadSplitMode = 'split' | 'separate';

export type ExpenseCategory =
  | 'Electricity'
  | 'Diesel/Fuel'
  | 'Machine maintenance'
  | 'Rent'
  | 'Transport'
  | 'Fixed staff salary'
  | 'Other';

export interface ProductionRunLine {
  id: string;
  name: string; // e.g. "Shift 1 - Press A" or "Batch #1"
  produced: number;
  time?: string;
}

export interface ProductionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  produced: number; // total bricks produced
  sold: number; // bricks sold that day
  salePrice: number; // ₹ per brick
  costMode: CostMode;
  
  // Actual materials used that day (never assumed fixed)
  cementBags: number; // actual bags used that day (e.g. 12, 15.5)
  cementRate: number; // ₹ per bag
  dustTrucks: number; // actual trucks / CFT used that day (e.g. 1, 1.5)
  dustRate: number; // ₹ per truck
  raakhQty: number; // Fly ash quantity (e.g. tons or bori)
  raakhRate: number; // ₹ per unit of raakh
  
  manualMaterialCost?: number; // only when costMode = 'manual'
  
  workerRate: number; // ₹ per brick paid to labor (default 0.60)
  otherCost: number; // one-off cost tied to that day
  note?: string;

  // Optional multi-run batch lines (summed into produced)
  runLines?: ProductionRunLine[];
  
  // Morning estimation tracking
  estimatedTarget?: number; // Target computed in morning from materials
  varianceNote?: string;

  created_at?: string;
}

export type PaymentStatus = 'paid' | 'partial' | 'due';
export type PaymentMode = 'cash' | 'upi' | 'bank_transfer' | 'cheque';

export interface SalesOrder {
  id: string;
  date: string; // YYYY-MM-DD
  customerName: string;
  customerPhone?: string;
  siteLocation?: string;
  quantity: number; // Bricks quantity sold
  rate: number; // ₹ per brick
  totalAmount: number; // quantity * rate
  paidAmount: number; // Amount paid/received so far
  balanceDue: number; // totalAmount - paidAmount (outstanding udhaar)
  paymentStatus: PaymentStatus;
  paymentMode?: PaymentMode;
  note?: string;
  created_at?: string;
}

export interface CustomerPayment {
  id: string;
  orderId: string;
  date: string;
  customerName: string;
  amount: number;
  paymentMode: PaymentMode;
  note?: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  amount: number;
  frequency: ExpenseFrequency;
  otherDetail?: string; // What the "Other" expense is for
  note?: string;
  created_at?: string;
}

export interface Settings {
  productionEstimateMode: ProductionEstimateMode; // 'fixed' | 'auto'
  cementRatio: number; // bricks per cement bag (e.g. 120)
  dustRatio: number; // bricks per dust truck (e.g. 10000)
  raakhRatio: number; // bricks per raakh unit (e.g. 2500)
  defaultWorkerRate: number; // default 0.60
  defaultSalePrice: number; // default 4.00
  overheadSplitMode: OverheadSplitMode; // 'split' | 'separate'
  adminPassword: string; // default "hkb@2026"
  openingStock: number; // yard opening stock count
  openingStockDate: string;
  unitRaakhLabel: string; // "Tons" or "Bori" or "Kg"
  unitDustLabel: string; // "Trucks (800-900 cft)" or "CFT"
  allowUdhaarCredit: boolean; // udhaar / credit tracking toggle
}

export interface CalculationResult {
  materialCost: number;
  workerCost: number;
  otherCost: number;
  overheadShare: number;
  totalCost: number;
  costPerBrick: number;
  revenue: number;
  costOfSold: number;
  profit: number;
  profitPerBrick: number;
  marginPercent: number;
  stockDelta: number;
  isLoss: boolean;
}

export interface PlantSummary {
  totalProduced: number;
  totalSold: number;
  runningStock: number;
  totalRevenue: number;
  totalProductionCost: number;
  totalOverheadCost: number;
  totalNetProfit: number;
  averageCostPerBrick: number;
  lossDayCount: number;
  todayEntry: ProductionEntry | null;
  todayCalc: CalculationResult | null;
}
