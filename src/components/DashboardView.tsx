import React, { useState } from 'react';
import {
  Boxes,
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  Layers,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  Plus,
  Clock,
  ReceiptText,
  CheckCircle2,
  Phone,
  MapPin,
  X
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
  const recentSales = salesOrders.slice(0, 5);

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

      {/* 6 Comprehensive KPI Cards Row: Production, Stock, Sales, Revenue, Dues, Profit */}
      <div className="dashboard-kpi-grid">
        {/* Card 1: Today's Output */}
        <KPICard
          title="Today's Production"
          value={latestEntry ? latestEntry.produced : 0}
          suffix=" pcs"
          theme="blue"
          subtitle={latestEntry ? `Logged on ${latestEntry.date}` : 'No entries yet'}
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
          subtitle={`Opening stock: ${settings.openingStock.toLocaleString('en-IN')}`}
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
          theme="blue"
          subtitle={`${salesOrders.length > 0 ? `${salesOrders.length} customer orders fulfilled` : 'Direct yard dispatches'}`}
          badge={{
            text: 'Volume Sold',
            type: 'primary'
          }}
          icon={<TrendingUp size={18} />}
        />

        {/* Card 4: Total Sales Revenue */}
        <KPICard
          title="Total Sales Revenue"
          value={displayRevenue}
          prefix="₹"
          decimals={0}
          theme="amber"
          subtitle={`Cash collected: ₹${totalCashCollected.toLocaleString('en-IN')}`}
          badge={{
            text: `₹${settings.defaultSalePrice.toFixed(2)}/brick`,
            type: 'warn'
          }}
          icon={<IndianRupee size={18} />}
        />

        {/* Card 5: Customer Outstanding Dues */}
        <KPICard
          title="Customer Outstanding Dues"
          value={totalOutstandingDues}
          prefix="₹"
          decimals={0}
          theme={totalOutstandingDues > 0 ? 'rose' : 'green'}
          isLoss={totalOutstandingDues > 0}
          subtitle={totalOutstandingDues > 0 ? 'Pending to be collected from customers' : 'All customer balances settled'}
          badge={{
            text: totalOutstandingDues > 0 ? 'Payment Due' : 'All Clear',
            type: totalOutstandingDues > 0 ? 'bad' : 'good'
          }}
          icon={<Clock size={18} />}
        />

        {/* Card 6: Net Plant Profit */}
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

      {/* Section 2: Real-time Unit Cost Breakdown & Morning vs Evening Target */}
      <div className="dashboard-lower-grid">
        {/* Dynamic Cost Per Brick Card */}
        <div className="hkb-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
              {latestEntry ? latestEntry.date : 'Today'}
            </span>
          </div>

          {latestCalc && latestEntry ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Unit price display */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: latestCalc.isLoss ? '#FEF2F2' : '#F8FAFC',
                  borderRadius: '12px',
                  border: `1px solid ${latestCalc.isLoss ? '#FCA5A5' : '#E2E8F0'}`
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                    MANUFACTURING COST / BRICK
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                    <span className="tabular-nums" style={{ fontSize: '30px', fontWeight: 800, color: latestCalc.isLoss ? '#DC2626' : '#0F172A', letterSpacing: '-0.02em' }}>
                      ₹{latestCalc.costPerBrick.toFixed(2)}
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
                      ₹{(latestEntry.salePrice || settings.defaultSalePrice).toFixed(2)}
                    </span>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: latestCalc.profitPerBrick >= 0 ? '#059669' : '#DC2626' }}>
                      {latestCalc.profitPerBrick >= 0 ? '+' : ''}₹{latestCalc.profitPerBrick.toFixed(2)} ({latestCalc.marginPercent.toFixed(1)}%)
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress stack bar */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#64748B', marginBottom: '6px', fontWeight: 600 }}>
                  <span>Cost Components Share</span>
                  <span>Target: ~₹3.50</span>
                </div>
                <div style={{ height: '8px', borderRadius: '4px', display: 'flex', overflow: 'hidden', background: '#E2E8F0' }}>
                  {latestEntry.produced > 0 && (
                    <>
                      <div
                        title={`Cement: ₹${((latestEntry.cementBags * latestEntry.cementRate) / latestEntry.produced).toFixed(2)}`}
                        style={{
                          width: `${(((latestEntry.cementBags * latestEntry.cementRate) / latestCalc.totalCost) * 100) || 0}%`,
                          background: '#2563EB'
                        }}
                      />
                      <div
                        title={`Dust: ₹${((latestEntry.dustTrucks * latestEntry.dustRate) / latestEntry.produced).toFixed(2)}`}
                        style={{
                          width: `${(((latestEntry.dustTrucks * latestEntry.dustRate) / latestCalc.totalCost) * 100) || 0}%`,
                          background: '#F59E0B'
                        }}
                      />
                      <div
                        title={`Fly Ash: ₹${((latestEntry.raakhQty * latestEntry.raakhRate) / latestEntry.produced).toFixed(2)}`}
                        style={{
                          width: `${(((latestEntry.raakhQty * latestEntry.raakhRate) / latestCalc.totalCost) * 100) || 0}%`,
                          background: '#64748B'
                        }}
                      />
                      <div
                        title={`Labor Payoff: ₹${(latestEntry.workerRate || settings.defaultWorkerRate).toFixed(2)}`}
                        style={{
                          width: `${((latestCalc.workerCost / latestCalc.totalCost) * 100) || 0}%`,
                          background: '#10B981'
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Detail list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563EB' }} />
                    Cement ({latestEntry.cementBags} bags @ ₹{latestEntry.cementRate})
                  </span>
                  <span className="tabular-nums" style={{ fontWeight: 700, color: '#0F172A' }}>
                    ₹{((latestEntry.cementBags * latestEntry.cementRate) / latestEntry.produced).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
                    Stone Dust ({latestEntry.dustTrucks} trucks @ ₹{latestEntry.dustRate})
                  </span>
                  <span className="tabular-nums" style={{ fontWeight: 700, color: '#0F172A' }}>
                    ₹{((latestEntry.dustTrucks * latestEntry.dustRate) / latestEntry.produced).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#64748B' }} />
                    Fly Ash ({latestEntry.raakhQty} {settings.unitRaakhLabel} @ ₹{latestEntry.raakhRate})
                  </span>
                  <span className="tabular-nums" style={{ fontWeight: 700, color: '#0F172A' }}>
                    ₹{((latestEntry.raakhQty * latestEntry.raakhRate) / latestEntry.produced).toFixed(2)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderTop: '1px solid #F1F5F9', paddingTop: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 600 }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
                    Worker Payoff (Direct Labor)
                  </span>
                  <span className="tabular-nums" style={{ fontWeight: 700, color: '#059669' }}>
                    ₹{(latestEntry.workerRate || settings.defaultWorkerRate).toFixed(2)} / brick
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94A3B8' }}>
              <p style={{ fontSize: '13px' }}>No production entries yet.</p>
              <button className="btn btn-secondary btn-sm" onClick={onNavigateToEntry} style={{ marginTop: '10px' }}>
                + Log First Production Entry
              </button>
            </div>
          )}
        </div>

        {/* Morning Target vs Evening Output Reconciliation */}
        <div className="hkb-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={17} />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  Yield & Breakage Reconciliation
                </h3>
                <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                  Morning target vs evening yard count
                </span>
              </div>
            </div>
            <span className="badge badge-good">
              Mode: {settings.productionEstimateMode.toUpperCase()}
            </span>
          </div>

          {latestEntry ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div
                style={{
                  padding: '14px 16px',
                  background: '#F8FAFC',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px'
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                    MORNING ESTIMATE
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', marginTop: '2px' }} className="tabular-nums">
                    {(latestEntry.estimatedTarget || 0).toLocaleString('en-IN')} pcs
                  </div>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    {latestEntry.cementBags} bags scheduled
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                    EVENING ACTUAL COUNT
                  </span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#2563EB', marginTop: '2px' }} className="tabular-nums">
                    {latestEntry.produced.toLocaleString('en-IN')} pcs
                  </div>
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>
                    Machine stroke tally
                  </span>
                </div>
              </div>

              {/* Yield analysis */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0'
                }}
              >
                <Sparkles size={16} color="#059669" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '12.5px' }}>
                  <strong>Yield Realized: </strong>
                  {latestEntry.cementBags > 0
                    ? Math.round(latestEntry.produced / latestEntry.cementBags)
                    : 0}{' '}
                  bricks per cement bag.
                  <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
                    {latestEntry.varianceNote || 'Optimal compaction and mix moisture.'}
                  </div>
                </div>
              </div>

              {/* Worker Daily Payoff Total */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: '#F1F5F9',
                  borderRadius: '10px',
                  fontSize: '12.5px'
                }}
              >
                <span style={{ color: '#475569', fontWeight: 500 }}>Worker Gang Daily Payoff (₹{latestEntry.workerRate}/brick):</span>
                <span className="tabular-nums" style={{ fontWeight: 800, color: '#0F172A', fontSize: '14px' }}>
                  ₹{(latestEntry.produced * (latestEntry.workerRate || settings.defaultWorkerRate)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '36px 16px', color: '#94A3B8' }}>
              <p style={{ fontSize: '13px' }}>No production entries available to reconcile.</p>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Production & Dispatches Trend */}
      {recentDays.length > 0 && (
        <div className="hkb-card" style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Production & Dispatches Trend</h3>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Comparison of daily units manufactured vs sold
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onNavigateToLedger}>
              <span>View Full Ledger</span>
              <ArrowUpRight size={13} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${recentDays.length || 1}, minmax(40px, 1fr))`, gap: '12px', alignItems: 'flex-end', minHeight: '140px', minWidth: `${recentDays.length * 48}px` }}>
            {recentDays.map(day => {
              const prodHeight = Math.max(Math.round((day.produced / maxProduced) * 110), 10);
              const soldHeight = Math.max(Math.round((day.sold / maxProduced) * 110), 6);

              return (
                <div key={day.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '110px' }}>
                    <div
                      title={`Produced: ${day.produced} pcs`}
                      style={{
                        width: '18px',
                        height: `${prodHeight}px`,
                        background: '#2563EB',
                        borderRadius: '4px 4px 0 0'
                      }}
                    />
                    <div
                      title={`Sold: ${day.sold} pcs`}
                      style={{
                        width: '18px',
                        height: `${soldHeight}px`,
                        background: '#10B981',
                        borderRadius: '4px 4px 0 0'
                      }}
                    />
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748B', whiteSpace: 'nowrap', fontWeight: 600 }}>
                    {day.date.slice(5)}
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px', fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#2563EB' }} />
              <span>Bricks Produced</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#10B981' }} />
              <span>Bricks Sold</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Customer Sales & Receivables Section */}
      <div className="hkb-card" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReceiptText size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Recent Customer Sales & Outstanding Balances
              </h3>
              <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Latest customer orders, delivery locations, and pending dues
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
              <span>+ Record Sale</span>
            </button>
          </div>
        </div>

        {salesOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8' }}>
            <p style={{ fontSize: '13px', color: '#64748B' }}>
              No customer sales recorded yet. Record your first sale order to track customer accounts directly on the dashboard.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={handleOpenSaleModal} style={{ marginTop: '10px' }}>
              + Record First Sale Order
            </button>
          </div>
        ) : (
          <div className="hkb-table-wrapper">
            <table className="hkb-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer Name</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Total Bill</th>
                  <th>Paid Amount</th>
                  <th>Outstanding Due</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map(order => {
                  const isDue = order.balanceDue > 0;
                  return (
                    <tr key={order.id} className={isDue ? 'row-loss' : ''}>
                      <td style={{ fontWeight: 600 }}>{order.date}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A' }}>{order.customerName}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '11px', color: '#64748B' }}>
                          {order.customerPhone && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <Phone size={10} color="#2563EB" />
                              {order.customerPhone}
                            </span>
                          )}
                          {order.siteLocation && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#EFF6FF', color: '#1D4ED8', padding: '1px 5px', borderRadius: '4px' }}>
                              <MapPin size={9} />
                              {order.siteLocation}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="tabular-nums" style={{ color: '#2563EB', fontWeight: 600 }}>
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
                          <span className="badge badge-good">PAID</span>
                        )}
                        {order.paymentStatus === 'partial' && (
                          <span className="badge badge-warn">PARTIAL</span>
                        )}
                        {order.paymentStatus === 'due' && (
                          <span className="badge badge-bad">DUE</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isDue ? (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '3px 8px', fontSize: '11.5px', color: '#2563EB' }}
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
