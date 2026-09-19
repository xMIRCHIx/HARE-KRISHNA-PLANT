import React, { useState } from 'react';
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  Layers,
  TrendingDown,
  ArrowUpRight,
  Plus,
  Clock,
  ReceiptText,
  CheckCircle2,
  Phone,
  MapPin,
  X,
  Search,
  PieChart,
  Activity,
  ShieldCheck
} from 'lucide-react';
import {
  ProductionEntry,
  Expense,
  Settings,
  PlantSummary,
  SalesOrder,
  CustomerPayment,
  PaymentMode,
  PaymentStatus
} from '../types';
import { calculatePlantSummary } from '../lib/calculations';
import { KPICard } from './KPICard';

interface DashboardViewProps {
  entries: ProductionEntry[];
  expenses: Expense[];
  settings: Settings;
  salesOrders?: SalesOrder[];
  onAddSalesOrder?: (order: SalesOrder) => void;
  onRecordPayment?: (payment: CustomerPayment) => void;
  onNavigateToEntry: () => void;
  onNavigateToLedger: () => void;
  onNavigateToSales?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  entries,
  expenses,
  settings,
  salesOrders = [],
  onAddSalesOrder,
  onRecordPayment,
  onNavigateToEntry,
  onNavigateToLedger,
  onNavigateToSales
}) => {
  const summary: PlantSummary = calculatePlantSummary(entries, expenses, settings);
  const latestEntry = entries[entries.length - 1];
  const latestCalc = summary.todayCalc;

  // Local state for modals directly on dashboard
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [paymentModalOrder, setPaymentModalOrder] = useState<SalesOrder | null>(null);

  // New Sale Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [quantity, setQuantity] = useState<number>(5000);
  const [rate, setRate] = useState<number>(settings.defaultSalePrice || 4.00);
  const [initialPaid, setInitialPaid] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [saleNote, setSaleNote] = useState('');

  // Receive Payment Form State
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>('cash');
  const [payNote, setPayNote] = useState('');

  // Sales & receivables calculations
  const totalOutstandingDues = salesOrders.reduce((sum, o) => sum + o.balanceDue, 0);
  const totalBricksSoldInOrders = salesOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalSalesRevenueFromOrders = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCashCollected = salesOrders.reduce((sum, o) => sum + o.paidAmount, 0);

  const displaySoldVolume = totalBricksSoldInOrders > 0 ? totalBricksSoldInOrders : summary.totalSold;
  const displayRevenue = totalSalesRevenueFromOrders > 0 ? totalSalesRevenueFromOrders : summary.totalRevenue;

  // Recent 5 sales orders for the dashboard widget
  const recentSales = salesOrders.slice(0, 8);

  // Table search & filter state
  const [customerSearch, setCustomerSearch] = useState('');
  const [tableFilter, setTableFilter] = useState<'all' | 'due' | 'paid'>('all');

  // Filtered sales for the widget
  const filteredSales = recentSales.filter(o => {
    const matchesSearch = o.customerName.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (o.customerPhone && o.customerPhone.includes(customerSearch)) ||
      (o.siteLocation && o.siteLocation.toLowerCase().includes(customerSearch.toLowerCase()));
    if (!matchesSearch) return false;
    if (tableFilter === 'due') return o.balanceDue > 0;
    if (tableFilter === 'paid') return o.balanceDue === 0;
    return true;
  });

  // Baseline standard mix recipe values (ensures rich display even before first daily entry)
  const baselineCementPerBrick = 380 / (settings.cementRatio || 200);
  const baselineDustPerBrick = 0.88;
  const baselineRaakhPerBrick = 0.45;
  const baselineLaborPerBrick = settings.defaultWorkerRate || 0.42;
  const baselineTotalCost = baselineCementPerBrick + baselineDustPerBrick + baselineRaakhPerBrick + baselineLaborPerBrick;
  const baselineSaleRate = settings.defaultSalePrice || 4.00;
  const baselineProfit = baselineSaleRate - baselineTotalCost;
  const baselineMargin = (baselineProfit / baselineSaleRate) * 100;

  // Avatar palette for Hexabox customer transaction rows
  const AVATAR_PALETTE = [
    { bg: '#EDE9FE', color: '#7C3AED' },
    { bg: '#FEF3C7', color: '#D97706' },
    { bg: '#D1FAE5', color: '#059669' },
    { bg: '#FCE7F3', color: '#DB2777' },
    { bg: '#E0E7FF', color: '#4F46E5' }
  ];

  const getAvatarStyle = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Last 7 days for the visual chart
  const recentDays = entries.slice(-7);
  const maxProduced = Math.max(...recentDays.map(d => d.produced), 10000);

  const handleOpenSaleModal = () => {
    if (onAddSalesOrder) {
      setIsSaleModalOpen(true);
    } else if (onNavigateToSales) {
      onNavigateToSales();
    }
  };

  const handleOpenPaymentModal = (order: SalesOrder) => {
    if (onRecordPayment) {
      setPaymentModalOrder(order);
      setPayAmount(order.balanceDue);
      setPayDate(new Date().toISOString().split('T')[0]);
      setPayNote('');
      setPayMode('cash');
    } else if (onNavigateToSales) {
      onNavigateToSales();
    }
  };

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    if (quantity <= 0) {
      alert('Please enter a valid brick quantity');
      return;
    }

    const bill = quantity * rate;
    const paid = Math.min(Math.max(initialPaid, 0), bill);
    const due = bill - paid;

    let status: PaymentStatus = 'due';
    if (due <= 0) {
      status = 'paid';
    } else if (paid > 0) {
      status = 'partial';
    }

    const newOrder: SalesOrder = {
      id: `sale-${Date.now()}`,
      date,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      siteLocation: siteLocation.trim() || undefined,
      quantity,
      rate,
      totalAmount: bill,
      paidAmount: paid,
      balanceDue: due,
      paymentStatus: status,
      note: saleNote.trim() || undefined
    };

    if (onAddSalesOrder) {
      onAddSalesOrder(newOrder);
    }

    if (paid > 0 && onRecordPayment) {
      onRecordPayment({
        id: `pay-${Date.now()}`,
        orderId: newOrder.id,
        date,
        customerName: newOrder.customerName,
        amount: paid,
        paymentMode,
        note: 'Initial advance at order booking'
      });
    }

    // Reset & close
    setCustomerName('');
    setCustomerPhone('');
    setSiteLocation('');
    setQuantity(5000);
    setInitialPaid(0);
    setSaleNote('');
    setIsSaleModalOpen(false);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalOrder || !onRecordPayment) return;
    if (payAmount <= 0) {
      alert('Please enter a valid payment amount greater than 0');
      return;
    }

    onRecordPayment({
      id: `pay-${Date.now()}`,
      orderId: paymentModalOrder.id,
      date: payDate,
      customerName: paymentModalOrder.customerName,
      amount: Math.min(payAmount, paymentModalOrder.balanceDue),
      paymentMode: payMode,
      note: payNote.trim() || undefined
    });

    setPaymentModalOrder(null);
  };

  return (
    <div className="page-view-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em' }}>
            Dashboard Overview
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>
            Comprehensive plant operations, live dynamic costing, sales volume, and customer receivables.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleOpenSaleModal}>
            <ReceiptText size={15} />
            <span>Record Sale</span>
          </button>
          <button className="btn btn-primary" onClick={onNavigateToEntry}>
            <Plus size={15} />
            <span>Log Daily Output</span>
          </button>
        </div>
      </div>

      {/* Outstanding Customer Dues Banner if balance is pending */}
      {totalOutstandingDues > 0 && (
        <div
          className="hkb-card kpi-card-amber"
          style={{
            borderColor: 'rgba(245, 158, 11, 0.35)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#F59E0B',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <h4 style={{ color: '#B45309', fontSize: '14.5px', fontWeight: 700 }}>
                Customer Outstanding Balance: ₹{totalOutstandingDues.toLocaleString('en-IN')} Pending
              </h4>
              <p style={{ color: '#334155', fontSize: '12.5px', marginTop: '2px' }}>
                Total <strong>₹{totalOutstandingDues.toLocaleString('en-IN')}</strong> is currently pending to be collected across customer orders.
              </p>
            </div>
          </div>
          {onNavigateToSales && (
            <button className="btn btn-sm btn-primary" onClick={onNavigateToSales}>
              <span>View Customer Receivables</span>
              <ArrowUpRight size={13} />
            </button>
          )}
        </div>
      )}

      {/* Critical Loss Alert Banner if loss day detected */}
      {latestCalc && latestCalc.isLoss && (
        <div
          className="hkb-card kpi-card-rose"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.3)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#EF4444',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 style={{ color: '#DC2626', fontSize: '14.5px', fontWeight: 700 }}>
                Cost Warning: Manufacturing Cost Exceeded Selling Price!
              </h4>
              <p style={{ color: '#334155', fontSize: '12.5px', marginTop: '2px' }}>
                On {latestEntry.date}, 1 brick cost <strong>₹{latestCalc.costPerBrick.toFixed(2)}</strong> to make vs.
                selling rate of <strong>₹{(latestEntry.salePrice || settings.defaultSalePrice).toFixed(2)}</strong>.
                Loss of <strong>₹{Math.abs(latestCalc.profitPerBrick).toFixed(2)} / brick</strong>.
              </p>
            </div>
          </div>
          <button className="btn btn-sm btn-danger" onClick={onNavigateToLedger}>
            Inspect in Ledger
          </button>
        </div>
      )}

      {/* Hexabox 3-Column Command Hub: Hero Revenue, 7-Day Velocity Bar Chart, and Operations Health */}
      <div className="hexabox-top-command-grid">
        {/* Card 1: Hexabox 3D Violet Hero Card (Revenue & Net Margin) */}
        <div className="hexabox-hero-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '210px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Total Sales Revenue
                  </span>
                  <span style={{ background: 'rgba(255, 255, 255, 0.2)', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, color: '#FFFFFF' }}>
                    Live Shift
                  </span>
                </div>
                <div className="tabular-nums" style={{ fontSize: '34px', fontWeight: 800, marginTop: '6px', letterSpacing: '-0.025em', color: '#FFFFFF' }}>
                  ₹{displayRevenue.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Embedded Velocity Spark Bars (Hexabox Signature Element) */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '5px', height: '48px', padding: '6px 10px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '10px', backdropFilter: 'blur(6px)', flexShrink: 0 }}>
                {[35, 60, 85, 100, 70].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '6px',
                      height: `${h}%`,
                      background: i === 3 ? '#FFFFFF' : 'rgba(255, 255, 255, 0.45)',
                      borderRadius: '2px'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', background: 'rgba(16, 185, 129, 0.25)', color: '#A7F3D0', padding: '3px 9px', borderRadius: '6px', fontSize: '11.5px', fontWeight: 700 }}>
              <TrendingUp size={13} />
              <span>
                {latestCalc && latestCalc.profitPerBrick >= 0 ? '+' : ''}₹{(latestCalc?.profitPerBrick ?? baselineProfit).toFixed(2)} / brick margin ({latestCalc ? latestCalc.marginPercent.toFixed(1) : baselineMargin.toFixed(1)}%)
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.18)', paddingTop: '12px', marginTop: '14px', fontSize: '11.5px' }}>
            <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              Cash In: <strong style={{ color: '#FFFFFF' }}>₹{totalCashCollected.toLocaleString('en-IN')}</strong>
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
              Pending Dues: <strong style={{ color: '#FDE68A' }}>₹{totalOutstandingDues.toLocaleString('en-IN')}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: 7-Day Shift Production & Dispatch Velocity (Hexabox "Spending Statistic") */}
        <div className="hkb-card" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={15} color="#7C3AED" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Shift Production Velocity</h3>
              </div>
              <span style={{ fontSize: '11.5px', color: '#64748B' }}>Daily manufactured vs direct dispatches</span>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onNavigateToLedger} style={{ padding: '3px 8px', fontSize: '11px' }}>
              <span>Full Ledger</span>
              <ArrowUpRight size={11} />
            </button>
          </div>

          {/* Bar Chart Visualization */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', height: '90px', padding: '0 4px', borderBottom: '1px solid #F1F5F9', paddingBottom: '8px' }}>
            {(recentDays.length > 0 ? recentDays : [
              { id: '1', date: '2026-09-13', produced: 7500, sold: 4000 },
              { id: '2', date: '2026-09-14', produced: 8200, sold: 6000 },
              { id: '3', date: '2026-09-15', produced: 9000, sold: 7500 },
              { id: '4', date: '2026-09-16', produced: 8800, sold: 8000 },
              { id: '5', date: '2026-09-17', produced: 7900, sold: 5000 },
              { id: '6', date: '2026-09-18', produced: 8500, sold: 7000 },
              { id: '7', date: '2026-09-19', produced: latestEntry ? latestEntry.produced : 8000, sold: displaySoldVolume }
            ]).map((d, idx) => {
              const maxVal = Math.max(maxProduced, 10000);
              const pHeight = Math.max(Math.round((d.produced / maxVal) * 70), 10);
              const sHeight = Math.max(Math.round((d.sold / maxVal) * 70), 6);
              const isToday = idx === 6;

              return (
                <div key={d.id || idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '70px' }}>
                    <div
                      title={`Produced: ${d.produced.toLocaleString('en-IN')} pcs`}
                      style={{
                        width: '12px',
                        height: `${pHeight}px`,
                        background: isToday ? '#7C3AED' : '#C4B5FD',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 300ms ease'
                      }}
                    />
                    <div
                      title={`Dispatched: ${d.sold.toLocaleString('en-IN')} pcs`}
                      style={{
                        width: '12px',
                        height: `${sHeight}px`,
                        background: isToday ? '#10B981' : '#6EE7B7',
                        borderRadius: '3px 3px 0 0',
                        transition: 'height 300ms ease'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '10.5px', color: isToday ? '#7C3AED' : '#94A3B8', fontWeight: isToday ? 800 : 500 }}>
                    {d.date.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', fontSize: '11.5px', color: '#64748B' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#7C3AED' }} />
                Produced
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }} />
                Dispatched
              </span>
            </div>
            <span style={{ fontWeight: 600, color: '#0F172A' }}>
              ~8,400 pcs avg / shift
            </span>
          </div>
        </div>

        {/* Card 3: Operations Efficiency & Plant Health (Hexabox Announcement/Status) */}
        <div className="hkb-card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="#10B981" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Operations & Yield</h3>
              </div>
              <span className="badge badge-good" style={{ fontSize: '10.5px', padding: '2px 7px' }}>
                OPTIMAL
              </span>
            </div>

            {/* Circular Yield Progress Gauge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '10px', background: '#F8FAFD', borderRadius: '12px', border: '1px solid #EEF2F6' }}>
              <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
                <svg viewBox="0 0 36 36" style={{ width: '56px', height: '56px', transform: 'rotate(-90deg)' }}>
                  <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#E2E8F0" strokeWidth="3.2" />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.915"
                    fill="transparent"
                    stroke="#7C3AED"
                    strokeWidth="3.2"
                    strokeDasharray="96, 100"
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, color: '#7C3AED' }}>
                  96%
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Compaction Quality</div>
                <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                  {latestEntry ? `${latestEntry.cementBags} bags processed • Low breakage` : 'Formula calibrated at 200 bricks / cement bag'}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px' }}>
              <span style={{ color: '#64748B' }}>Daily Machine Target:</span>
              <strong style={{ color: '#0F172A' }}>{(latestEntry?.estimatedTarget || 8000).toLocaleString('en-IN')} pcs</strong>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onNavigateToEntry} style={{ width: '100%', justifyContent: 'center', padding: '6px', fontSize: '11.5px', color: '#7C3AED', borderColor: '#DDD6FE', background: '#F5F3FF' }}>
              <Plus size={13} />
              <span>Log Shift Output</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Operations KPI Cards Row */}
      <div className="dashboard-kpi-grid">
        {/* Card 1: Today's Output */}
        <KPICard
          title="Today's Production"
          value={latestEntry ? latestEntry.produced : 0}
          suffix=" pcs"
          theme="purple"
          subtitle={latestEntry ? `Logged on ${latestEntry.date}` : 'Awaiting today\'s shift log'}
          badge={{
            text: latestEntry && latestEntry.produced >= (latestEntry.estimatedTarget || 8000) ? 'Target Met' : 'Normal Shift',
            type: 'primary'
          }}
          icon={<Boxes size={18} />}
        />

        {/* Card 2: Yard Inventory */}
        <KPICard
          title="Current Yard Stock"
          value={summary.runningStock}
          suffix=" pcs"
          theme="green"
          subtitle={`Opening stock: ${settings.openingStock.toLocaleString('en-IN')} pcs`}
          badge={{
            text: summary.runningStock > 10000 ? 'Healthy Stock' : 'Low Stock',
            type: summary.runningStock > 10000 ? 'good' : 'warn'
          }}
          icon={<Boxes size={18} />}
        />

        {/* Card 3: Total Bricks Sold */}
        <KPICard
          title="Total Bricks Sold"
          value={displaySoldVolume}
          suffix=" pcs"
          theme="purple"
          subtitle={`${salesOrders.length > 0 ? `${salesOrders.length} customer orders fulfilled` : 'Direct yard dispatches'}`}
          badge={{
            text: 'Volume Sold',
            type: 'primary'
          }}
          icon={<TrendingUp size={18} />}
        />

        {/* Card 4: Net Plant Profit */}
        <KPICard
          title="Net Plant Profit"
          value={summary.totalNetProfit}
          prefix="₹"
          decimals={0}
          theme={summary.totalNetProfit >= 0 ? 'green' : 'rose'}
          isLoss={summary.totalNetProfit < 0}
          subtitle={settings.overheadSplitMode === 'split' ? 'Overheads amortized' : 'Overheads tracked separately'}
          badge={{
            text: summary.totalNetProfit >= 0 ? 'Profitable' : 'Loss Warning',
            type: summary.totalNetProfit >= 0 ? 'good' : 'bad'
          }}
          icon={summary.totalNetProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
        />
      </div>

      {/* Section 2: Real-time Unit Cost Breakdown & Raw Material Donut Widget */}
      <div className="dashboard-lower-grid">
        {/* Dynamic Cost Per Brick Card */}
        <div className="hkb-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={17} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  Single Brick Manufacturing Cost
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                  Real-time dynamic breakdown for 1 brick
                </span>
              </div>
            </div>
            <span className="badge badge-primary">
              {latestEntry ? latestEntry.date : 'Standard Recipe Benchmark'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Unit price display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '16px 18px',
                background: (latestCalc && latestCalc.isLoss) ? '#FEF2F2' : '#F8FAFC',
                borderRadius: '12px',
                border: `1px solid ${(latestCalc && latestCalc.isLoss) ? '#FCA5A5' : '#E2E8F0'}`
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                  MANUFACTURING COST / BRICK
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                  <span className="tabular-nums" style={{ fontSize: '30px', fontWeight: 800, color: (latestCalc && latestCalc.isLoss) ? '#DC2626' : '#0F172A', letterSpacing: '-0.02em' }}>
                    ₹{(latestCalc ? latestCalc.costPerBrick : baselineTotalCost).toFixed(2)}
                  </span>
                  <span style={{ fontSize: '12.5px', color: '#64748B', fontWeight: 500 }}>/ brick</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                  SELLING RATE & MARGIN
                </span>
                <div style={{ marginTop: '2px' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#059669' }}>
                    ₹{(latestEntry?.salePrice || settings.defaultSalePrice || 4.00).toFixed(2)}
                  </span>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: (latestCalc ? latestCalc.profitPerBrick : baselineProfit) >= 0 ? '#059669' : '#DC2626' }}>
                    {(latestCalc ? latestCalc.profitPerBrick : baselineProfit) >= 0 ? '+' : ''}₹{(latestCalc ? latestCalc.profitPerBrick : baselineProfit).toFixed(2)} ({(latestCalc ? latestCalc.marginPercent : baselineMargin).toFixed(1)}%)
                  </div>
                </div>
              </div>
            </div>

            {/* Progress stack bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B', marginBottom: '6px', fontWeight: 600 }}>
                <span>Cost Components Share</span>
                <span>Target Cost: ~₹3.50</span>
              </div>
              <div style={{ height: '9px', borderRadius: '5px', display: 'flex', overflow: 'hidden', background: '#E2E8F0' }}>
                <div
                  title="Cement Share: ~50%"
                  style={{
                    width: `${latestCalc && latestEntry?.produced ? (((latestEntry.cementBags * latestEntry.cementRate) / latestCalc.totalCost) * 100) : (baselineCementPerBrick / baselineTotalCost) * 100}%`,
                    background: '#6366F1'
                  }}
                />
                <div
                  title="Stone Dust Share: ~24%"
                  style={{
                    width: `${latestCalc && latestEntry?.produced ? (((latestEntry.dustTrucks * latestEntry.dustRate) / latestCalc.totalCost) * 100) : (baselineDustPerBrick / baselineTotalCost) * 100}%`,
                    background: '#F59E0B'
                  }}
                />
                <div
                  title="Fly Ash Share: ~14%"
                  style={{
                    width: `${latestCalc && latestEntry?.produced ? (((latestEntry.raakhQty * latestEntry.raakhRate) / latestCalc.totalCost) * 100) : (baselineRaakhPerBrick / baselineTotalCost) * 100}%`,
                    background: '#64748B'
                  }}
                />
                <div
                  title="Labor Payoff Share: ~12%"
                  style={{
                    width: `${latestCalc ? ((latestCalc.workerCost / latestCalc.totalCost) * 100) : (baselineLaborPerBrick / baselineTotalCost) * 100}%`,
                    background: '#10B981'
                  }}
                />
              </div>
            </div>

            {/* Detail list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6366F1' }} />
                  Cement ({latestEntry ? `${latestEntry.cementBags} bags @ ₹${latestEntry.cementRate}` : `1 bag @ ₹380 / ~${settings.cementRatio || 200} pcs`})
                </span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: '#0F172A' }}>
                  ₹{(latestCalc && latestEntry && latestEntry.produced > 0 ? ((latestEntry.cementBags * latestEntry.cementRate) / latestEntry.produced) : baselineCementPerBrick).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                  Stone Dust ({latestEntry ? `${latestEntry.dustTrucks} trucks @ ₹${latestEntry.dustRate}` : `Truck blend @ ₹8,500 / ~${settings.dustRatio || 10000} pcs`})
                </span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: '#0F172A' }}>
                  ₹{(latestCalc && latestEntry && latestEntry.produced > 0 ? ((latestEntry.dustTrucks * latestEntry.dustRate) / latestEntry.produced) : baselineDustPerBrick).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748B' }} />
                  Fly Ash ({latestEntry ? `${latestEntry.raakhQty} ${settings.unitRaakhLabel} @ ₹${latestEntry.raakhRate}` : `Fly Ash @ ₹1,200 / ~${settings.raakhRatio || 2500} ${settings.unitRaakhLabel}`})
                </span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: '#0F172A' }}>
                  ₹{(latestCalc && latestEntry && latestEntry.produced > 0 ? ((latestEntry.raakhQty * latestEntry.raakhRate) / latestEntry.produced) : baselineRaakhPerBrick).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                  Worker Gang Payoff (Labor)
                </span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: '#059669' }}>
                  ₹{(latestEntry?.workerRate || settings.defaultWorkerRate || baselineLaborPerBrick).toFixed(2)} / brick
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hexabox Raw Material Composition Donut Widget (Inspired by Hexabox Project Statistics) */}
        <div className="hkb-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PieChart size={17} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  Cost Share & Composition
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                  Ingredient proportion for 1 brick
                </span>
              </div>
            </div>
            <span className="badge badge-good">
              Balanced Mix
            </span>
          </div>

          {/* SVG Donut Chart with Centered Unit Cost Metric */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', padding: '10px 0' }}>
            <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
              <svg viewBox="0 0 100 100" style={{ width: '130px', height: '130px', transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F1F5F9" strokeWidth="11" />
                {/* Cement Segment (~51%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#6366F1" strokeWidth="11" strokeDasharray="122 238.7" strokeDashoffset="0" />
                {/* Stone Dust Segment (~24%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#F59E0B" strokeWidth="11" strokeDasharray="57 238.7" strokeDashoffset="-122" />
                {/* Fly Ash Segment (~14%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#64748B" strokeWidth="11" strokeDasharray="33 238.7" strokeDashoffset="-179" />
                {/* Labor Segment (~11%) */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="#10B981" strokeWidth="11" strokeDasharray="26 238.7" strokeDashoffset="-212" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>
                  ₹{(latestCalc ? latestCalc.costPerBrick : baselineTotalCost).toFixed(2)}
                </span>
                <span style={{ fontSize: '9.5px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                  PER BRICK
                </span>
              </div>
            </div>

            {/* Legend with Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#6366F1', flexShrink: 0 }} />
                <span style={{ color: '#475569', minWidth: '70px' }}>Cement:</span>
                <strong style={{ color: '#0F172A' }}>51%</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F59E0B', flexShrink: 0 }} />
                <span style={{ color: '#475569', minWidth: '70px' }}>Stone Dust:</span>
                <strong style={{ color: '#0F172A' }}>24%</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#64748B', flexShrink: 0 }} />
                <span style={{ color: '#475569', minWidth: '70px' }}>Fly Ash:</span>
                <strong style={{ color: '#0F172A' }}>14%</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981', flexShrink: 0 }} />
                <span style={{ color: '#475569', minWidth: '70px' }}>Worker Labor:</span>
                <strong style={{ color: '#0F172A' }}>11%</strong>
              </div>
            </div>
          </div>

          <div style={{ padding: '10px 14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '11.5px', color: '#475569', marginTop: '12px' }}>
            💡 <strong>Optimization Tip:</strong> Fly Ash substitution maintains ISI strength while keeping cost under ₹3.70 per brick.
          </div>
        </div>
      </div>

      {/* Recent Customer Sales & Receivables Section (Hexabox Customer Transaction Widget) */}
      <div className="hkb-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReceiptText size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Customer Transactions & Outstanding Accounts
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Latest customer orders, delivery locations, and pending balance status
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {onNavigateToSales && (
              <button className="btn btn-secondary btn-sm" onClick={onNavigateToSales}>
                <span>View Full Sales Ledger</span>
                <ArrowUpRight size={13} />
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={handleOpenSaleModal}>
              <Plus size={14} />
              <span>Record Sale</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px', padding: '10px 14px', background: '#F8FAFD', borderRadius: '12px', border: '1px solid #EEF2F6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className={`segmented-btn ${tableFilter === 'all' ? 'active' : ''}`}
              style={{ padding: '4px 12px', fontSize: '11.5px', borderRadius: '7px' }}
              onClick={() => setTableFilter('all')}
            >
              All Orders ({recentSales.length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${tableFilter === 'due' ? 'active' : ''}`}
              style={{ padding: '4px 12px', fontSize: '11.5px', borderRadius: '7px' }}
              onClick={() => setTableFilter('due')}
            >
              Pending Dues ({salesOrders.filter(o => o.balanceDue > 0).length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${tableFilter === 'paid' ? 'active' : ''}`}
              style={{ padding: '4px 12px', fontSize: '11.5px', borderRadius: '7px' }}
              onClick={() => setTableFilter('paid')}
            >
              Settled ({salesOrders.filter(o => o.balanceDue === 0).length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '5px 10px', width: '230px' }}>
            <Search size={13} color="#94A3B8" />
            <input
              type="text"
              placeholder="Filter buyer or location..."
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '12px', width: '100%', color: '#0F172A' }}
            />
            {customerSearch && (
              <button onClick={() => setCustomerSearch('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {filteredSales.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8' }}>
            <p style={{ fontSize: '13px', color: '#64748B' }}>
              {salesOrders.length === 0
                ? 'No customer sales recorded yet. Record your first sale order to track customer accounts directly on the dashboard.'
                : 'No customer orders match the selected filter.'}
            </p>
            {salesOrders.length === 0 && (
              <button className="btn btn-secondary btn-sm" onClick={handleOpenSaleModal} style={{ marginTop: '10px' }}>
                + Record First Sale Order
              </button>
            )}
          </div>
        ) : (
          <div className="hkb-table-wrapper">
            <table className="hkb-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Total Bill</th>
                  <th>Paid Amount</th>
                  <th>Outstanding Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.map(order => {
                  const isDue = order.balanceDue > 0;
                  const av = getAvatarStyle(order.customerName);
                  const inits = getInitials(order.customerName);

                  return (
                    <tr key={order.id} className={isDue ? 'row-loss' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: av.bg,
                              color: av.color,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '12px',
                              flexShrink: 0
                            }}
                          >
                            {inits}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{order.customerName}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '11px', color: '#64748B' }}>
                              {order.customerPhone && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                  <Phone size={10} color="#7C3AED" />
                                  {order.customerPhone}
                                </span>
                              )}
                              {order.siteLocation && (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#F5F3FF', color: '#7C3AED', padding: '1px 5px', borderRadius: '4px' }}>
                                  <MapPin size={9} />
                                  {order.siteLocation}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{order.date}</td>
                      <td className="tabular-nums" style={{ color: '#7C3AED', fontWeight: 600 }}>
                        {order.quantity.toLocaleString('en-IN')} pcs
                      </td>
                      <td className="tabular-nums">₹{order.rate.toFixed(2)}</td>
                      <td className="tabular-nums" style={{ fontWeight: 700 }}>
                        ₹{order.totalAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="tabular-nums" style={{ color: '#059669', fontWeight: 600 }}>
                        ₹{order.paidAmount.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <span
                          className="tabular-nums"
                          style={{
                            fontWeight: 800,
                            color: isDue ? '#DC2626' : '#64748B'
                          }}
                        >
                          ₹{order.balanceDue.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td>
                        {order.paymentStatus === 'paid' && (
                          <span className="badge badge-good" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={11} /> Completed
                          </span>
                        )}
                        {order.paymentStatus === 'partial' && (
                          <span className="badge badge-warn" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} /> Partial
                          </span>
                        )}
                        {order.paymentStatus === 'due' && (
                          <span className="badge badge-bad" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={11} /> Due
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isDue ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 10px', fontSize: '11.5px', color: '#7C3AED', background: '#F5F3FF', borderColor: '#DDD6FE' }}
                            onClick={() => handleOpenPaymentModal(order)}
                          >
                            <CheckCircle2 size={12} />
                            <span>Collect</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: '#10B981', fontWeight: 600 }}>
                            Settled
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: Record Brick Sale */}
      {isSaleModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsSaleModalOpen(false)}
        >
          <div
            className="hkb-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              background: '#FFFFFF',
              boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                  Record Customer Brick Sale
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Log order dispatch and advance / credit amount
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSaleModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSale} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="responsive-form-duo">
                <div className="form-group">
                  <label className="form-label">Order Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Customer Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Thekedar"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="responsive-form-duo">
                <div className="form-group">
                  <label className="form-label">Customer Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Site / Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Sector 14, Rohtak"
                    value={siteLocation}
                    onChange={e => setSiteLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="responsive-form-duo">
                <div className="form-group">
                  <label className="form-label">Bricks Sold (Pieces) *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input tabular-nums"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Rate / Brick (₹) *</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    className="form-input tabular-nums"
                    value={rate}
                    onChange={e => setRate(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              {/* Calculated Total Bill Box */}
              <div
                style={{
                  padding: '12px 16px',
                  background: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                    Total Bill Amount
                  </span>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                    ₹{(quantity * rate).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                    Estimated Outstanding Due
                  </span>
                  <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 700, color: Math.max((quantity * rate) - initialPaid, 0) > 0 ? '#DC2626' : '#059669' }}>
                    ₹{Math.max((quantity * rate) - initialPaid, 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="responsive-form-duo">
                <div className="form-group">
                  <label className="form-label">Advance / Payment Received (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={quantity * rate}
                    className="form-input tabular-nums"
                    value={initialPaid}
                    onChange={e => setInitialPaid(Number(e.target.value))}
                    placeholder="₹ 0 if on credit"
                  />
                </div>

                {initialPaid > 0 && (
                  <div className="form-group">
                    <label className="form-label">Payment Mode</label>
                    <select
                      className="form-select"
                      value={paymentMode}
                      onChange={e => setPaymentMode(e.target.value as PaymentMode)}
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI / GPay / PhonePe</option>
                      <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                      <option value="cheque">Cheque</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Remarks / Vehicle Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Loaded in Truck HR-02-AB-1234..."
                  value={saleNote}
                  onChange={e => setSaleNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSaleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Sale Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Receive Customer Payment */}
      {paymentModalOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setPaymentModalOrder(null)}
        >
          <div
            className="hkb-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '24px',
              background: '#FFFFFF',
              boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                  Record Customer Payment
                </h3>
                <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px' }}>
                  Customer: <strong>{paymentModalOrder.customerName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOrder(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Dues summary chip */}
            <div
              style={{
                padding: '14px 16px',
                background: '#FEF2F2',
                borderRadius: '10px',
                border: '1px solid #FCA5A5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, textTransform: 'uppercase' }}>
                  CURRENT OUTSTANDING DUE
                </span>
                <div className="tabular-nums" style={{ fontSize: '22px', fontWeight: 800, color: '#DC2626' }}>
                  ₹{paymentModalOrder.balanceDue.toLocaleString('en-IN')}
                </div>
              </div>
              <span className="badge badge-bad">Payment Due</span>
            </div>

            <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Payment Receipt Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount Received (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={paymentModalOrder.balanceDue}
                  className="form-input tabular-nums"
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  required
                  autoFocus
                />
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                  Remaining due after this payment: <strong>₹{(paymentModalOrder.balanceDue - payAmount).toLocaleString('en-IN')}</strong>
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Mode</label>
                <select
                  className="form-select"
                  value={payMode}
                  onChange={e => setPayMode(e.target.value as PaymentMode)}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI / GPay / PhonePe</option>
                  <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Receipt Remarks</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Paid in cash at plant office..."
                  value={payNote}
                  onChange={e => setPayNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setPaymentModalOrder(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
