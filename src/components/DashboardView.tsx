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
  ShieldCheck,
  Banknote,
  Smartphone,
  Landmark,
  FileText,
  IndianRupee
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
import { calculatePlantSummary, calculateEntry } from '../lib/calculations';
import { KPICard } from './KPICard';
import { InvoiceModal } from './InvoiceModal';

interface DashboardViewProps {
  entries: ProductionEntry[];
  expenses: Expense[];
  settings: Settings;
  salesOrders?: SalesOrder[];
  customerPayments?: CustomerPayment[];
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
  customerPayments = [],
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
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<SalesOrder | null>(null);

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

  // Dashboard KPI Drilldown Modal State
  const [dashboardModal, setDashboardModal] = useState<'production' | 'stock' | 'revenue' | 'volume' | 'profit' | null>(null);
  const [dashModalSearch, setDashModalSearch] = useState('');
  const [dashModeFilter, setDashModeFilter] = useState<PaymentMode | 'all'>('all');

  // Sales & receivables calculations
  const totalOutstandingDues = salesOrders.reduce((sum, o) => sum + o.balanceDue, 0);
  const totalBricksSoldInOrders = salesOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalSalesRevenueFromOrders = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalCashCollected = salesOrders.reduce((sum, o) => sum + o.paidAmount, 0);

  const displaySoldVolume = totalBricksSoldInOrders > 0 ? totalBricksSoldInOrders : summary.totalSold;
  const displayRevenue = totalSalesRevenueFromOrders > 0 ? totalSalesRevenueFromOrders : summary.totalRevenue;

  // Mode-wise collection breakdown & all receipts list
  const paymentsByOrder = new Map<string, CustomerPayment[]>();
  customerPayments.forEach(p => {
    const list = paymentsByOrder.get(p.orderId) || [];
    list.push(p);
    paymentsByOrder.set(p.orderId, list);
  });

  const allReceiptsList: {
    id: string;
    orderId: string;
    date: string;
    customerName: string;
    amount: number;
    paymentMode: PaymentMode;
    note?: string;
  }[] = [];

  // 1. Recorded customerPayments
  customerPayments.forEach(p => {
    allReceiptsList.push({
      id: p.id,
      orderId: p.orderId,
      date: p.date,
      customerName: p.customerName,
      amount: p.amount,
      paymentMode: p.paymentMode || 'cash',
      note: p.note
    });
  });

  // 2. Initial advance payments on sales orders not yet captured in customerPayments
  salesOrders.forEach(o => {
    if (o.paidAmount > 0) {
      const existing = paymentsByOrder.get(o.id);
      const totalInPayments = existing ? existing.reduce((sum, p) => sum + p.amount, 0) : 0;
      if (totalInPayments < o.paidAmount) {
        allReceiptsList.push({
          id: `init-${o.id}`,
          orderId: o.id,
          date: o.date,
          customerName: o.customerName,
          amount: o.paidAmount - totalInPayments,
          paymentMode: (o.paymentMode as PaymentMode) || 'cash',
          note: o.note ? `Order advance: ${o.note}` : 'Advance paid at booking'
        });
      }
    }
  });

  allReceiptsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const modeTotals = {
    cash: allReceiptsList.filter(r => r.paymentMode === 'cash').reduce((sum, r) => sum + r.amount, 0),
    upi: allReceiptsList.filter(r => r.paymentMode === 'upi').reduce((sum, r) => sum + r.amount, 0),
    bank_transfer: allReceiptsList.filter(r => r.paymentMode === 'bank_transfer').reduce((sum, r) => sum + r.amount, 0),
    cheque: allReceiptsList.filter(r => r.paymentMode === 'cheque').reduce((sum, r) => sum + r.amount, 0)
  };

  const modeCounts = {
    cash: allReceiptsList.filter(r => r.paymentMode === 'cash').length,
    upi: allReceiptsList.filter(r => r.paymentMode === 'upi').length,
    bank_transfer: allReceiptsList.filter(r => r.paymentMode === 'bank_transfer').length,
    cheque: allReceiptsList.filter(r => r.paymentMode === 'cheque').length
  };

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

  // Helper to determine the payment mode for an order
  const getOrderPaymentMode = (order: SalesOrder): PaymentMode | 'credit' => {
    if (order.paymentMode) return order.paymentMode;
    const payment = customerPayments.find(p => p.orderId === order.id);
    if (payment) return payment.paymentMode;
    if (order.paidAmount > 0) return 'cash';
    return 'credit';
  };

  const PAYMENT_OPTIONS: { id: PaymentMode; label: string; sub: string; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
    { id: 'cash', label: 'Cash', sub: 'Plant Cash / Naya', icon: <Banknote size={15} />, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    { id: 'upi', label: 'Online / UPI', sub: 'GPay, PhonePe, QR', icon: <Smartphone size={15} />, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { id: 'bank_transfer', label: 'Net Banking', sub: 'NEFT, RTGS, IMPS', icon: <Landmark size={15} />, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    { id: 'cheque', label: 'Cheque', sub: 'Bank Cheque Clearing', icon: <FileText size={15} />, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' }
  ];

  const renderPaymentModeBadge = (mode: PaymentMode | 'credit') => {
    switch (mode) {
      case 'cash':
        return (
          <span
            style={{
              background: '#ECFDF5',
              color: '#059669',
              border: '1px solid #A7F3D0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '6px'
            }}
          >
            <Banknote size={11} />
            <span>Cash</span>
          </span>
        );
      case 'upi':
        return (
          <span
            style={{
              background: '#F5F3FF',
              color: '#7C3AED',
              border: '1px solid #DDD6FE',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '6px'
            }}
          >
            <Smartphone size={11} />
            <span>Online/UPI</span>
          </span>
        );
      case 'bank_transfer':
        return (
          <span
            style={{
              background: '#EFF6FF',
              color: '#2563EB',
              border: '1px solid #BFDBFE',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '6px'
            }}
          >
            <Landmark size={11} />
            <span>Net Banking</span>
          </span>
        );
      case 'cheque':
        return (
          <span
            style={{
              background: '#FFFBEB',
              color: '#D97706',
              border: '1px solid #FDE68A',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 7px',
              borderRadius: '6px'
            }}
          >
            <FileText size={11} />
            <span>Cheque</span>
          </span>
        );
      case 'credit':
      default:
        return (
          <span
            style={{
              background: '#F1F5F9',
              color: '#64748B',
              border: '1px solid #E2E8F0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 7px',
              borderRadius: '6px'
            }}
          >
            <Clock size={10} />
            <span>Credit</span>
          </span>
        );
    }
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
      paymentMode: paid > 0 ? paymentMode : undefined,
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
        note: `Initial advance payment at order booking (${paymentMode.toUpperCase()})`
      });
    }

    // Reset & close
    setCustomerName('');
    setCustomerPhone('');
    setSiteLocation('');
    setQuantity(5000);
    setInitialPaid(0);
    setPaymentMode('cash');
    setSaleNote('');
    setIsSaleModalOpen(false);
    setSelectedInvoiceOrder(newOrder);
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
        <div
          className="hexabox-hero-card"
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '210px',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}
          onClick={() => {
            setDashModeFilter('all');
            setDashboardModal('revenue');
            setDashModalSearch('');
          }}
          title="Click to view full Revenue & Inflows Breakdown (कहाँ से कितना पैसा आया)"
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255, 255, 255, 0.85)' }}>
                    Total Sales Revenue
                  </span>
                  <span style={{ background: 'rgba(255, 255, 255, 0.2)', fontSize: '10px', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <span>Audit Inflow</span>
                    <ArrowUpRight size={10} />
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

      {/* Payment Inflow Breakdown Strip by Method (कहाँ-कहाँ से कितना पैसा आया) */}
      <div
        className="hkb-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Banknote size={16} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                Payment Inflow by Method
              </span>
              <span style={{ fontSize: '12px', color: '#64748B', marginLeft: '6px' }}>
                (कहाँ-कहाँ से कितना पैसा आया)
              </span>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ padding: '3px 9px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={() => {
              setDashModeFilter('all');
              setDashboardModal('revenue');
              setDashModalSearch('');
            }}
          >
            <span>View All Receipts Audit</span>
            <ArrowUpRight size={12} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          {/* Cash */}
          <div
            onClick={() => {
              setDashModeFilter('cash');
              setDashboardModal('revenue');
              setDashModalSearch('');
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#ECFDF5',
              border: '1.5px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            title="Click to view Cash payments"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#10B981',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Banknote size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cash / नकद
                </div>
                <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#065F46', marginTop: '1px' }}>
                  ₹{modeTotals.cash.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>
                {totalCashCollected > 0 ? Math.round((modeTotals.cash / totalCashCollected) * 100) : 0}%
              </span>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                {modeCounts.cash} receipts
              </div>
            </div>
          </div>

          {/* UPI */}
          <div
            onClick={() => {
              setDashModeFilter('upi');
              setDashboardModal('revenue');
              setDashModalSearch('');
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#F5F3FF',
              border: '1.5px solid #DDD6FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            title="Click to view Online/UPI payments"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#7C3AED',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Smartphone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Online / UPI
                </div>
                <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#5B21B6', marginTop: '1px' }}>
                  ₹{modeTotals.upi.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#6D28D9' }}>
                {totalCashCollected > 0 ? Math.round((modeTotals.upi / totalCashCollected) * 100) : 0}%
              </span>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                {modeCounts.upi} receipts
              </div>
            </div>
          </div>

          {/* Net Banking */}
          <div
            onClick={() => {
              setDashModeFilter('bank_transfer');
              setDashboardModal('revenue');
              setDashModalSearch('');
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            title="Click to view Net Banking payments"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#2563EB',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Landmark size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Net Banking
                </div>
                <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#1E40AF', marginTop: '1px' }}>
                  ₹{modeTotals.bank_transfer.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8' }}>
                {totalCashCollected > 0 ? Math.round((modeTotals.bank_transfer / totalCashCollected) * 100) : 0}%
              </span>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                {modeCounts.bank_transfer} receipts
              </div>
            </div>
          </div>

          {/* Cheque */}
          <div
            onClick={() => {
              setDashModeFilter('cheque');
              setDashboardModal('revenue');
              setDashModalSearch('');
            }}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#FFFBEB',
              border: '1.5px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease'
            }}
            title="Click to view Cheque payments"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: '#D97706',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Cheque
                </div>
                <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#92400E', marginTop: '1px' }}>
                  ₹{modeTotals.cheque.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#B45309' }}>
                {totalCashCollected > 0 ? Math.round((modeTotals.cheque / totalCashCollected) * 100) : 0}%
              </span>
              <div style={{ fontSize: '10px', color: '#64748B' }}>
                {modeCounts.cheque} receipts
              </div>
            </div>
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
          onClick={() => {
            setDashboardModal('production');
            setDashModalSearch('');
          }}
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
          onClick={() => {
            setDashboardModal('stock');
            setDashModalSearch('');
          }}
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
          onClick={() => {
            setDashboardModal('volume');
            setDashModalSearch('');
          }}
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
          onClick={() => {
            setDashboardModal('profit');
            setDashModalSearch('');
          }}
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
                  <th>Mode</th>
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
                        {renderPaymentModeBadge(getOrderPaymentMode(order))}
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
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              color: '#1E293B',
                              background: '#F8FAFC',
                              borderColor: '#CBD5E1',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                            onClick={() => setSelectedInvoiceOrder(order)}
                            title="View & Print Official Sales Invoice"
                          >
                            <FileText size={11} color="#7C3AED" />
                            <span>Invoice</span>
                          </button>

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
                        </div>
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

              <div className="form-group">
                <label className="form-label">Advance / Payment Received (₹)</label>
                <input
                  type="number"
                  min="0"
                  max={quantity * rate}
                  className="form-input tabular-nums"
                  value={initialPaid}
                  onChange={e => setInitialPaid(Number(e.target.value))}
                  placeholder="₹ 0 if on full credit / udhaar"
                />
              </div>

              {/* Payment Mode Selector */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label className="form-label" style={{ margin: 0 }}>
                    Payment Mode {initialPaid > 0 ? '(Received Via)' : '(If Advance Paid)'}
                  </label>
                  {initialPaid === 0 && (
                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                      Logged as Credit until advance is entered
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {PAYMENT_OPTIONS.map(opt => {
                    const isSelected = paymentMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPaymentMode(opt.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 4px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${opt.color}` : '1.5px solid #E2E8F0',
                          background: isSelected ? opt.bg : '#FAFAFA',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          gap: '4px',
                          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        <div style={{ color: isSelected ? opt.color : '#64748B' }}>
                          {opt.icon}
                        </div>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: isSelected ? opt.color : '#334155' }}>
                          {opt.label}
                        </span>
                        <span style={{ fontSize: '9.5px', color: isSelected ? opt.color : '#94A3B8', opacity: isSelected ? 0.95 : 0.8 }}>
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Remarks / Vehicle Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Loaded in Truck HR-02-AB-1234, UTR / Cheque Ref..."
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
              maxWidth: '480px',
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

              {/* Payment Mode Selector */}
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  {PAYMENT_OPTIONS.map(opt => {
                    const isSelected = payMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setPayMode(opt.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 4px',
                          borderRadius: '10px',
                          border: isSelected ? `2px solid ${opt.color}` : '1.5px solid #E2E8F0',
                          background: isSelected ? opt.bg : '#FAFAFA',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          gap: '4px',
                          boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        <div style={{ color: isSelected ? opt.color : '#64748B' }}>
                          {opt.icon}
                        </div>
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: isSelected ? opt.color : '#334155' }}>
                          {opt.label}
                        </span>
                        <span style={{ fontSize: '9.5px', color: isSelected ? opt.color : '#94A3B8', opacity: isSelected ? 0.95 : 0.8 }}>
                          {opt.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
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

      {/* MODAL 3: Comprehensive Dashboard Drilldown Audit Modal */}
      {dashboardModal && (
        <div
          className="modal-overlay"
          onClick={e => {
            if (e.target === e.currentTarget) setDashboardModal(null);
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '920px',
              width: '95%',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '8px',
                      background:
                        dashboardModal === 'revenue'
                          ? '#ECFDF5'
                          : dashboardModal === 'production'
                          ? '#F5F3FF'
                          : dashboardModal === 'stock'
                          ? '#EFF6FF'
                          : dashboardModal === 'volume'
                          ? '#F5F3FF'
                          : '#ECFDF5',
                      color:
                        dashboardModal === 'revenue'
                          ? '#059669'
                          : dashboardModal === 'production'
                          ? '#7C3AED'
                          : dashboardModal === 'stock'
                          ? '#2563EB'
                          : dashboardModal === 'volume'
                          ? '#7C3AED'
                          : '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {dashboardModal === 'revenue' && <Banknote size={17} />}
                    {dashboardModal === 'production' && <Boxes size={17} />}
                    {dashboardModal === 'stock' && <Layers size={17} />}
                    {dashboardModal === 'volume' && <TrendingUp size={17} />}
                    {dashboardModal === 'profit' && <IndianRupee size={17} />}
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                    {dashboardModal === 'revenue' && 'Cash Inflows & Payment Audit (कहाँ से कितना पैसा आया)'}
                    {dashboardModal === 'production' && 'Daily Shift Production Ledger Log'}
                    {dashboardModal === 'stock' && 'Live Yard Inventory & Stock Balance'}
                    {dashboardModal === 'volume' && 'Customer Sales Orders & Dispatch Log'}
                    {dashboardModal === 'profit' && 'Plant Net Profit & Operational Cost Breakdown'}
                  </h3>
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>
                  {dashboardModal === 'revenue' && 'Complete audit list of all payments received from customers, payment modes, and balance reconciliation.'}
                  {dashboardModal === 'production' && 'Shift manufacturing log with brick counts, raw materials consumed (cement, stone dust, fly ash), and labor costs.'}
                  {dashboardModal === 'stock' && 'Real-time brick inventory reconciliation between opening stock, manufacturing output, and customer dispatches.'}
                  {dashboardModal === 'volume' && 'Dispatched orders, buyer contact details, delivery sites, quantities, and payment status.'}
                  {dashboardModal === 'profit' && 'Financial breakdown of gross revenue, raw materials & labor costs, overhead expenses, and bottom-line margin.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDashboardModal(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#64748B',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* TAB 1: REVENUE & CASH INFLOWS */}
            {dashboardModal === 'revenue' && (
              <>
                {/* 4 Mode Breakdown Boxes */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
                  <div
                    onClick={() => setDashModeFilter('cash')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#ECFDF5',
                      border: dashModeFilter === 'cash' ? '2px solid #059669' : '1px solid #A7F3D0',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>💵 CASH / नकद</span>
                    <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#059669' }}>
                      ₹{modeTotals.cash.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>{modeCounts.cash} payments</span>
                  </div>

                  <div
                    onClick={() => setDashModeFilter('upi')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#F5F3FF',
                      border: dashModeFilter === 'upi' ? '2px solid #7C3AED' : '1px solid #DDD6FE',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 700 }}>📱 ONLINE / UPI</span>
                    <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#7C3AED' }}>
                      ₹{modeTotals.upi.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>{modeCounts.upi} payments</span>
                  </div>

                  <div
                    onClick={() => setDashModeFilter('bank_transfer')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#EFF6FF',
                      border: dashModeFilter === 'bank_transfer' ? '2px solid #2563EB' : '1px solid #BFDBFE',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700 }}>🏛️ NET BANKING</span>
                    <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#2563EB' }}>
                      ₹{modeTotals.bank_transfer.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>{modeCounts.bank_transfer} payments</span>
                  </div>

                  <div
                    onClick={() => setDashModeFilter('cheque')}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#FFFBEB',
                      border: dashModeFilter === 'cheque' ? '2px solid #D97706' : '1px solid #FDE68A',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700 }}>📝 CHEQUE</span>
                    <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#D97706' }}>
                      ₹{modeTotals.cheque.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>{modeCounts.cheque} payments</span>
                  </div>
                </div>

                {/* Filter / Search Bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Search payer, remarks, or amount..."
                      value={dashModalSearch}
                      onChange={e => setDashModalSearch(e.target.value)}
                      style={{ paddingLeft: '32px', height: '36px', fontSize: '12.5px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setDashModeFilter('all')}
                      className={`btn btn-sm ${dashModeFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 9px', fontSize: '11.5px' }}
                    >
                      All ({allReceiptsList.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDashModeFilter('cash')}
                      className={`btn btn-sm ${dashModeFilter === 'cash' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 9px', fontSize: '11.5px' }}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setDashModeFilter('upi')}
                      className={`btn btn-sm ${dashModeFilter === 'upi' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 9px', fontSize: '11.5px' }}
                    >
                      UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setDashModeFilter('bank_transfer')}
                      className={`btn btn-sm ${dashModeFilter === 'bank_transfer' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 9px', fontSize: '11.5px' }}
                    >
                      Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => setDashModeFilter('cheque')}
                      className={`btn btn-sm ${dashModeFilter === 'cheque' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ padding: '4px 9px', fontSize: '11.5px' }}
                    >
                      Cheque
                    </button>
                  </div>
                </div>

                {/* Receipts Table */}
                <div className="hkb-table-wrapper" style={{ maxHeight: '380px' }}>
                  <table className="hkb-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer / Source</th>
                        <th>Amount Received</th>
                        <th>Payment Mode</th>
                        <th>Remarks / Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allReceiptsList
                        .filter(r => dashModeFilter === 'all' || r.paymentMode === dashModeFilter)
                        .filter(r =>
                          !dashModalSearch ||
                          r.customerName.toLowerCase().includes(dashModalSearch.toLowerCase()) ||
                          (r.note && r.note.toLowerCase().includes(dashModalSearch.toLowerCase())) ||
                          r.paymentMode.toLowerCase().includes(dashModalSearch.toLowerCase())
                        )
                        .map((r, i) => (
                          <tr key={`${r.id}-${i}`}>
                            <td style={{ fontWeight: 600 }}>{r.date}</td>
                            <td style={{ fontWeight: 700, color: '#0F172A' }}>{r.customerName}</td>
                            <td className="tabular-nums" style={{ fontWeight: 800, color: '#059669', fontSize: '13.5px' }}>
                              ₹{r.amount.toLocaleString('en-IN')}
                            </td>
                            <td>{renderPaymentModeBadge(r.paymentMode)}</td>
                            <td style={{ color: '#64748B', fontSize: '12px' }}>{r.note || '—'}</td>
                          </tr>
                        ))}
                      {allReceiptsList.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                            No customer receipts logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  {onNavigateToSales && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setDashboardModal(null);
                        onNavigateToSales();
                      }}
                    >
                      <span>Open Full Sales Ledger</span>
                      <ArrowUpRight size={12} />
                    </button>
                  )}
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setDashboardModal(null)}>
                    Done
                  </button>
                </div>
              </>
            )}

            {/* TAB 2: PRODUCTION LOG */}
            {dashboardModal === 'production' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                    <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 700, textTransform: 'uppercase' }}>
                      TOTAL BRICKS PRODUCED
                    </span>
                    <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#7C3AED' }}>
                      {summary.totalProduced.toLocaleString('en-IN')} pcs
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Across {entries.length} recorded shift entries</span>
                  </div>

                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                    <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                      AVERAGE UNIT COST
                    </span>
                    <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#059669' }}>
                      ₹{summary.averageCostPerBrick.toFixed(2)} / pc
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Raw materials + Worker labor</span>
                  </div>

                  <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, textTransform: 'uppercase' }}>
                      CEMENT CONSUMPTION
                    </span>
                    <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#D97706' }}>
                      {entries.reduce((sum, e) => sum + e.cementBags, 0)} bags
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Avg {(settings.cementRatio || 200)} bricks / bag</span>
                  </div>
                </div>

                {/* Production Entries Table */}
                <div className="hkb-table-wrapper" style={{ maxHeight: '380px' }}>
                  <table className="hkb-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Produced (pcs)</th>
                        <th>Cement (Bags)</th>
                        <th>Stone Dust ({settings.unitDustLabel || 'Trucks'})</th>
                        <th>Fly Ash ({settings.unitRaakhLabel || 'Tons'})</th>
                        <th>Labor (₹/pc)</th>
                        <th>Cost / Brick</th>
                        <th>Shift Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.slice().reverse().map(e => {
                        const calc = calculateEntry(e, expenses, settings, summary.totalProduced);
                        const costPerBrick = calc.costPerBrick;
                        const profitPerBrick = calc.profitPerBrick;
                        const isLoss = calc.isLoss;

                        return (
                          <tr key={e.id} className={isLoss ? 'row-loss' : undefined}>
                            <td style={{ fontWeight: 600 }}>{e.date}</td>
                            <td className="tabular-nums" style={{ fontWeight: 800, color: '#7C3AED' }}>
                              {e.produced.toLocaleString('en-IN')}
                            </td>
                            <td className="tabular-nums">{e.cementBags}</td>
                            <td className="tabular-nums">{e.dustTrucks.toFixed(1)}</td>
                            <td className="tabular-nums">{e.raakhQty.toFixed(1)}</td>
                            <td className="tabular-nums">₹{e.workerRate.toFixed(2)}</td>
                            <td className="tabular-nums" style={{ fontWeight: 800, color: isLoss ? '#DC2626' : '#059669' }}>
                              ₹{costPerBrick.toFixed(2)}
                            </td>
                            <td>
                              {isLoss ? (
                                <span className="badge badge-bad">-₹{Math.abs(profitPerBrick).toFixed(2)}</span>
                              ) : (
                                <span className="badge badge-good">+₹{profitPerBrick.toFixed(2)}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {entries.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                            No daily shift production logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDashboardModal(null);
                      onNavigateToLedger();
                    }}
                  >
                    <span>Full Production Ledger</span>
                    <ArrowUpRight size={12} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setDashboardModal(null);
                      onNavigateToEntry();
                    }}
                  >
                    <Plus size={13} />
                    <span>Log Shift Output</span>
                  </button>
                </div>
              </>
            )}

            {/* TAB 3: YARD INVENTORY & STOCK */}
            {dashboardModal === 'stock' && (
              <>
                <div style={{ padding: '16px', background: '#F8FAFD', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', marginBottom: '10px' }}>
                    Live Inventory Reconciliation
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                    <div style={{ padding: '10px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>Opening Yard Stock</span>
                      <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                        {settings.openingStock.toLocaleString('en-IN')} pcs
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '11px', color: '#7C3AED' }}>+ Total Produced</span>
                      <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#7C3AED' }}>
                        +{summary.totalProduced.toLocaleString('en-IN')} pcs
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: '11px', color: '#D97706' }}>- Total Dispatched</span>
                      <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#D97706' }}>
                        -{displaySoldVolume.toLocaleString('en-IN')} pcs
                      </div>
                    </div>
                    <div style={{ padding: '10px', background: '#ECFDF5', borderRadius: '8px', border: '1.5px solid #A7F3D0' }}>
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>= Current Available Stock</span>
                      <div className="tabular-nums" style={{ fontSize: '19px', fontWeight: 800, color: '#059669' }}>
                        {summary.runningStock.toLocaleString('en-IN')} pcs
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hkb-table-wrapper" style={{ maxHeight: '340px' }}>
                  <table className="hkb-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Manufactured (+)</th>
                        <th>Dispatched (-)</th>
                        <th>Shift Net Delta</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.slice().reverse().map(e => {
                        const netDelta = e.produced - e.sold;
                        return (
                          <tr key={e.id}>
                            <td style={{ fontWeight: 600 }}>{e.date}</td>
                            <td className="tabular-nums" style={{ color: '#7C3AED', fontWeight: 700 }}>
                              +{e.produced.toLocaleString('en-IN')} pcs
                            </td>
                            <td className="tabular-nums" style={{ color: '#D97706', fontWeight: 700 }}>
                              -{e.sold.toLocaleString('en-IN')} pcs
                            </td>
                            <td className="tabular-nums" style={{ fontWeight: 800, color: netDelta >= 0 ? '#059669' : '#DC2626' }}>
                              {netDelta >= 0 ? `+${netDelta.toLocaleString('en-IN')}` : netDelta.toLocaleString('en-IN')} pcs
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDashboardModal(null);
                      onNavigateToLedger();
                    }}
                  >
                    <span>Full Ledger</span>
                    <ArrowUpRight size={12} />
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setDashboardModal(null)}>
                    Done
                  </button>
                </div>
              </>
            )}

            {/* TAB 4: VOLUME SOLD DISPATCHES */}
            {dashboardModal === 'volume' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '10px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 700, textTransform: 'uppercase' }}>
                      TOTAL BRICKS SOLD
                    </span>
                    <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: '#7C3AED' }}>
                      {displaySoldVolume.toLocaleString('en-IN')} pcs
                    </div>
                  </div>
                  <span className="badge badge-primary">
                    {salesOrders.length > 0 ? `${salesOrders.length} Orders Fulfilled` : 'Direct Dispatches'}
                  </span>
                </div>

                <div className="hkb-table-wrapper" style={{ maxHeight: '380px' }}>
                  <table className="hkb-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Delivery Site</th>
                        <th>Bricks Quantity</th>
                        <th>Rate / Brick</th>
                        <th>Total Bill</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesOrders.map(order => (
                        <tr key={order.id}>
                          <td style={{ fontWeight: 600 }}>{order.date}</td>
                          <td style={{ fontWeight: 700, color: '#0F172A' }}>{order.customerName}</td>
                          <td style={{ fontSize: '12px', color: '#64748B' }}>{order.siteLocation || 'Yard'}</td>
                          <td className="tabular-nums" style={{ fontWeight: 800, color: '#7C3AED' }}>
                            {order.quantity.toLocaleString('en-IN')} pcs
                          </td>
                          <td className="tabular-nums">₹{order.rate.toFixed(2)}</td>
                          <td className="tabular-nums" style={{ fontWeight: 700 }}>
                            ₹{order.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td>
                            {order.paymentStatus === 'paid' && <span className="badge badge-good">PAID</span>}
                            {order.paymentStatus === 'partial' && <span className="badge badge-warn">PARTIAL</span>}
                            {order.paymentStatus === 'due' && <span className="badge badge-bad">DUE</span>}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              onClick={() => {
                                setDashboardModal(null);
                                setSelectedInvoiceOrder(order);
                              }}
                            >
                              <FileText size={11} color="#7C3AED" />
                              <span>Invoice</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                      {salesOrders.length === 0 && (
                        <tr>
                          <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                            No customer sales orders logged yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDashboardModal(null);
                      handleOpenSaleModal();
                    }}
                  >
                    <Plus size={12} />
                    <span>Record New Sale</span>
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setDashboardModal(null)}>
                    Done
                  </button>
                </div>
              </>
            )}

            {/* TAB 5: NET PROFIT & OPERATIONAL COST BREAKDOWN */}
            {dashboardModal === 'profit' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>GROSS REVENUE</span>
                    <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                      ₹{displayRevenue.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Total billed brick sales</span>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                    <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700 }}>MANUFACTURING COSTS</span>
                    <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#D97706' }}>
                      ₹{summary.totalProductionCost.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Cement, dust, ash, worker labor</span>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                    <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700 }}>FIXED OVERHEADS</span>
                    <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626' }}>
                      ₹{summary.totalOverheadCost.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '10.5px', color: '#64748B' }}>Electricity, diesel, repairs, food</span>
                  </div>

                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: summary.totalNetProfit >= 0 ? '#ECFDF5' : '#FEF2F2', border: summary.totalNetProfit >= 0 ? '1.5px solid #A7F3D0' : '1.5px solid #FCA5A5' }}>
                    <span style={{ fontSize: '11px', color: summary.totalNetProfit >= 0 ? '#059669' : '#DC2626', fontWeight: 700 }}>NET OPERATING PROFIT</span>
                    <div className="tabular-nums" style={{ fontSize: '22px', fontWeight: 800, color: summary.totalNetProfit >= 0 ? '#059669' : '#DC2626' }}>
                      ₹{summary.totalNetProfit.toLocaleString('en-IN')}
                    </div>
                    <span style={{ fontSize: '10.5px', color: summary.totalNetProfit >= 0 ? '#059669' : '#DC2626', fontWeight: 600 }}>
                      {summary.totalNetProfit >= 0 ? 'Profitable Plant Operation' : 'Operating Loss'}
                    </span>
                  </div>
                </div>

                {/* Per-Brick Economics Banner */}
                <div style={{ padding: '14px 18px', background: '#F5F3FF', borderRadius: '10px', border: '1px solid #DDD6FE', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#7C3AED' }}>Unit Economics per Fly Ash Brick</h4>
                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      Selling price: <strong>₹{(settings.defaultSalePrice || 4.0).toFixed(2)}</strong> vs. Avg manufacturing cost: <strong>₹{summary.averageCostPerBrick.toFixed(2)}</strong>
                    </p>
                  </div>
                  <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800, color: ((settings.defaultSalePrice || 4.0) - summary.averageCostPerBrick) >= 0 ? '#059669' : '#DC2626' }}>
                    {((settings.defaultSalePrice || 4.0) - summary.averageCostPerBrick) >= 0 ? '+' : ''}₹{((settings.defaultSalePrice || 4.0) - summary.averageCostPerBrick).toFixed(2)} / brick margin
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDashboardModal(null);
                      onNavigateToLedger();
                    }}
                  >
                    <span>View Cost Ledger</span>
                    <ArrowUpRight size={12} />
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => setDashboardModal(null)}>
                    Done
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Official Sales Invoice & Dispatch Receipt Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          customerPayments={customerPayments}
          settings={settings}
          onClose={() => setSelectedInvoiceOrder(null)}
          onRecordPayment={handleOpenPaymentModal}
        />
      )}
    </div>
  );
};
