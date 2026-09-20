import {
  ProductionEntry,
  Expense,
  Settings,
  CalculationResult,
  PlantSummary,
  SalesOrder
} from '../types';

/**
 * Computes exact daily unit costs, revenue, profit, and stock change for a single entry.
 * Follows Hare Krishna Bricks Spec §4 strictly.
 */
export function calculateEntry(
  entry: ProductionEntry,
  allExpenses: Expense[],
  settings: Settings,
  totalProducedInPeriod: number
): CalculationResult {
  // 1. Raw Material Cost
  let materialCost = 0;
  if (entry.costMode === 'manual' && typeof entry.manualMaterialCost === 'number') {
    materialCost = entry.manualMaterialCost;
  } else {
    const cement = (entry.cementBags || 0) * (entry.cementRate || 0);
    const dust = (entry.dustTrucks || 0) * (entry.dustRate || 0);
    const raakh = (entry.raakhQty || 0) * (entry.raakhRate || 0);
    materialCost = cement + dust + raakh;
  }

  // 2. Direct Worker Labor Cost (Default ₹0.60/brick)
  const workerRate = entry.workerRate ?? settings.defaultWorkerRate ?? 0.60;
  const workerCost = (entry.produced || 0) * workerRate;

  // 3. Other Cost
  const otherCost = entry.otherCost || 0;

  // 4. Overhead Share (Only if split mode is enabled)
  let overheadShare = 0;
  if (settings.overheadSplitMode === 'split' && totalProducedInPeriod > 0 && entry.produced > 0) {
    // Sum total expenses in the system
    const totalExpenses = allExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    overheadShare = (entry.produced / totalProducedInPeriod) * totalExpenses;
  }

  // 5. Total Daily Cost
  const totalCost = materialCost + workerCost + otherCost + overheadShare;

  // 6. Cost Per Brick (Recalculated fresh every single day, never fixed)
  const costPerBrick = entry.produced > 0 ? totalCost / entry.produced : 0;

  // 7. Revenue from bricks sold
  const effectiveSalePrice = entry.salePrice || settings.defaultSalePrice || 4.0;
  const revenue = (entry.sold || 0) * effectiveSalePrice;

  // 8. Cost of Goods Sold & Profit
  const costOfSold = (entry.sold || 0) * costPerBrick;
  const profit = revenue - costOfSold;
  const profitPerBrick = effectiveSalePrice - costPerBrick;
  const marginPercent = effectiveSalePrice > 0 ? (profitPerBrick / effectiveSalePrice) * 100 : 0;

  // 9. Stock movement
  const stockDelta = (entry.produced || 0) - (entry.sold || 0);

  // 10. Loss flag (If cost crosses sale price)
  const isLoss = entry.produced > 0 && costPerBrick > effectiveSalePrice;

  return {
    materialCost,
    workerCost,
    otherCost,
    overheadShare,
    totalCost,
    costPerBrick,
    revenue,
    costOfSold,
    profit,
    profitPerBrick,
    marginPercent,
    stockDelta,
    isLoss
  };
}

/**
 * Computes estimated morning target based on raw materials planned or entered.
 * Supports Fixed Ratio or Auto Rolling Historical Average per §5.1.
 */
export function estimateMorningTarget(
  cementBags: number,
  dustTrucks: number,
  raakhQty: number,
  settings: Settings,
  history: ProductionEntry[]
): {
  targetFromCement: number;
  targetFromDust: number;
  targetFromRaakh: number;
  recommendedTarget: number;
  method: 'fixed' | 'auto';
  autoCementRatio?: number;
} {
  if (settings.productionEstimateMode === 'auto' && history.length >= 3) {
    // Calculate rolling average ratio from valid previous entries
    const recent = history.slice(-5).filter(e => e.produced > 0 && e.cementBags > 0);
    if (recent.length > 0) {
      const avgCementRatio =
        recent.reduce((sum, e) => sum + e.produced / e.cementBags, 0) / recent.length;
      
      const targetFromCement = Math.round(cementBags * avgCementRatio);
      return {
        targetFromCement,
        targetFromDust: Math.round(dustTrucks * (settings.dustRatio || 10000)),
        targetFromRaakh: Math.round(raakhQty * (settings.raakhRatio || 2500)),
        recommendedTarget: targetFromCement,
        method: 'auto',
        autoCementRatio: Math.round(avgCementRatio)
      };
    }
  }

  // Fixed ratio mode
  const cementRatio = settings.cementRatio || 120; // standard bricks per 50kg bag
  const dustRatio = settings.dustRatio || 10000;
  const raakhRatio = settings.raakhRatio || 2500;

  const targetFromCement = Math.round(cementBags * cementRatio);
  const targetFromDust = Math.round(dustTrucks * dustRatio);
  const targetFromRaakh = Math.round(raakhQty * raakhRatio);

  // In fly ash plants, cement is the binding limiter that dictates exact stroke yield
  const recommendedTarget = targetFromCement > 0 ? targetFromCement : targetFromDust;

  return {
    targetFromCement,
    targetFromDust,
    targetFromRaakh,
    recommendedTarget,
    method: 'fixed'
  };
}

/**
 * Rolls up all historical entries and expenses into the overall Plant Summary KPIs.
 * Accurately calculates Realized Profit based on ACTUAL bricks sold (COGS method).
 */
export function calculatePlantSummary(
  entries: ProductionEntry[],
  expenses: Expense[],
  settings: Settings,
  salesOrders: SalesOrder[] = []
): PlantSummary {
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const totalPeriodProduced = sortedEntries.reduce((sum, e) => sum + (e.produced || 0), 0);

  // Authoritative Sales & Revenue rollup:
  // If dedicated customer sales orders exist, use them; otherwise fallback to daily entry sold
  const hasOrders = salesOrders && salesOrders.length > 0;
  const totalOrdersSold = hasOrders ? salesOrders.reduce((sum, o) => sum + (o.quantity || 0), 0) : 0;
  const totalOrdersRevenue = hasOrders ? salesOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0) : 0;

  const entriesSold = sortedEntries.reduce((sum, e) => sum + (e.sold || 0), 0);
  const entriesRevenue = sortedEntries.reduce((sum, e) => {
    const price = e.salePrice || settings.defaultSalePrice || 4.0;
    return sum + (e.sold || 0) * price;
  }, 0);

  const totalSold = hasOrders ? totalOrdersSold : entriesSold;
  const totalRevenue = hasOrders ? totalOrdersRevenue : entriesRevenue;

  const totalOverheadCost = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  let totalProductionCost = 0;
  let lossDayCount = 0;

  sortedEntries.forEach(entry => {
    const calc = calculateEntry(entry, expenses, settings, totalPeriodProduced);
    totalProductionCost += calc.totalCost;
    if (calc.isLoss) {
      lossDayCount++;
    }
  });

  // Calculate manufacturing cost per brick:
  // 1. If production entries exist with output, use actual average production cost
  // 2. Otherwise (before entries logged), compute standard recipe benchmark cost
  const cementCostPerBrick = 380 / (settings.cementRatio || 120);
  const dustCostPerBrick = (settings.dustRatio && settings.dustRatio > 0) ? (4500 / settings.dustRatio) : 0.88;
  const raakhCostPerBrick = (settings.raakhRatio && settings.raakhRatio > 0) ? (600 / settings.raakhRatio) : 0.45;
  const laborCostPerBrick = settings.defaultWorkerRate || 0.60;
  const baselineCostPerBrick = cementCostPerBrick + dustCostPerBrick + raakhCostPerBrick + laborCostPerBrick;

  const averageCostPerBrick = totalPeriodProduced > 0
    ? totalProductionCost / totalPeriodProduced
    : baselineCostPerBrick;

  // Realized Cost of Goods Sold (COGS) on ACTUAL bricks sold
  const totalCostOfSold = totalSold * averageCostPerBrick;

  // Gross Realized Profit on sold bricks
  const grossProfit = totalRevenue - totalCostOfSold;

  // Net Plant Operating Profit = Gross Profit - Overhead Expenses
  let totalNetProfit = grossProfit;
  if (settings.overheadSplitMode === 'separate') {
    totalNetProfit -= totalOverheadCost;
  }

  // Running stock: Opening stock + Total produced - Total sold
  const runningStock = (settings.openingStock || 0) + (totalPeriodProduced - totalSold);

  // Today's entry
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntry = sortedEntries.find(e => e.date === todayStr) || sortedEntries[sortedEntries.length - 1] || null;
  const todayCalc = todayEntry ? calculateEntry(todayEntry, expenses, settings, totalPeriodProduced) : null;

  return {
    totalProduced: totalPeriodProduced,
    totalSold,
    runningStock,
    totalRevenue,
    totalProductionCost,
    totalOverheadCost,
    totalCostOfSold,
    grossProfit,
    totalNetProfit,
    averageCostPerBrick,
    lossDayCount,
    todayEntry,
    todayCalc
  };
}
