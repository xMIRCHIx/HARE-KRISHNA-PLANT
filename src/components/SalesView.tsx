import React, { useState } from 'react';
import {
  Boxes,
  IndianRupee,
  CheckCircle2,
  Clock,
  Plus,
  Search,
  Trash2,
  FileSpreadsheet,
  Phone,
  MapPin,
  X,
  Banknote,
  Smartphone,
  Landmark,
  FileText,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { SalesOrder, CustomerPayment, Settings, PaymentMode } from '../types';
import { KPICard } from './KPICard';
import { InvoiceModal } from './InvoiceModal';
import { RecordSaleModal } from './RecordSaleModal';

interface SalesViewProps {
  salesOrders: SalesOrder[];
  customerPayments: CustomerPayment[];
  settings: Settings;
  onAddSalesOrder: (order: SalesOrder, initialPayment?: CustomerPayment) => void;
  onDeleteSalesOrder: (id: string) => void;
  onRecordPayment: (payment: CustomerPayment) => void;
  onNavigateToInvoices?: () => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  salesOrders,
  customerPayments = [],
  settings,
  onAddSalesOrder,
  onDeleteSalesOrder,
  onRecordPayment,
  onNavigateToInvoices
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [modeFilter, setModeFilter] = useState<'all' | PaymentMode | 'credit'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [paymentModalOrder, setPaymentModalOrder] = useState<SalesOrder | null>(null);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<SalesOrder | null>(null);
  const [drilldownModal, setDrilldownModal] = useState<'volume' | 'billed' | 'cash' | 'dues' | null>(null);
  const [drilldownSearch, setDrilldownSearch] = useState('');

  // Helper to determine the payment mode for an order
  const getOrderPaymentMode = (order: SalesOrder): PaymentMode | 'credit' => {
    if (order.paymentMode) return order.paymentMode;
    const payment = customerPayments.find(p => p.orderId === order.id);
    if (payment) return payment.paymentMode;
    if (order.paidAmount > 0) return 'cash';
    return 'credit';
  };

  const PAYMENT_OPTIONS: { id: PaymentMode; label: string; sub: string; icon: React.ReactNode; color: string; bg: string; border: string }[] = [
    { id: 'cash', label: 'Cash', sub: 'Plant Cash / Naya', icon: <Banknote size={16} />, color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
    { id: 'upi', label: 'Online / UPI', sub: 'GPay, PhonePe, QR', icon: <Smartphone size={16} />, color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
    { id: 'bank_transfer', label: 'Net Banking', sub: 'NEFT, RTGS, IMPS', icon: <Landmark size={16} />, color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    { id: 'cheque', label: 'Cheque', sub: 'Bank Cheque Clearing', icon: <FileText size={16} />, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' }
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
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            <Banknote size={12} />
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
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            <Smartphone size={12} />
            <span>Online / UPI</span>
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
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            <Landmark size={12} />
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
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            <FileText size={12} />
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
              padding: '3px 8px',
              borderRadius: '6px'
            }}
          >
            <Clock size={11} />
            <span>Credit Balance</span>
          </span>
        );
    }
  };

  // Receive Payment Form State
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<PaymentMode>('cash');
  const [payNote, setPayNote] = useState('');

  // Totals across all orders
  const totalBricksSold = salesOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalBilledRevenue = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOutstandingDues = salesOrders.reduce((sum, o) => sum + o.balanceDue, 0);

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
          paymentMode: o.paymentMode || 'cash',
          note: o.note ? `Order advance: ${o.note}` : 'Initial payment at order booking'
        });
      }
    }
  });

  allReceiptsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalReceiptsInflow = allReceiptsList.reduce((sum, r) => sum + r.amount, 0);
  const totalPaidReceived = Math.max(totalReceiptsInflow, salesOrders.reduce((sum, o) => sum + o.paidAmount, 0));

  // Aggregate cash collected by mode
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

  // Filtered orders
  const filteredOrders = salesOrders
    .filter(order => {
      const matchesSearch =
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm)) ||
        (order.siteLocation && order.siteLocation.toLowerCase().includes(searchTerm.toLowerCase()));
      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === 'due' && order.balanceDue <= 0) return false;
      if (statusFilter === 'paid' && order.balanceDue > 0) return false;

      // Mode filter
      if (modeFilter !== 'all') {
        const relatedPayments = customerPayments.filter(p => p.orderId === order.id);
        const hasMatchingPayment = relatedPayments.some(p => p.paymentMode === modeFilter);
        const orderMode = getOrderPaymentMode(order);
        if (orderMode !== modeFilter && !hasMatchingPayment) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenPaymentModal = (order: SalesOrder) => {
    setPaymentModalOrder(order);
    setPayAmount(order.balanceDue);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayNote('');
    setPayMode('cash');
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalOrder) return;
    if (payAmount <= 0) {
      alert('Please enter a valid payment amount greater than 0');
      return;
    }
    if (payAmount > paymentModalOrder.balanceDue) {
      alert(`Amount exceeds outstanding due of ₹${paymentModalOrder.balanceDue.toLocaleString('en-IN')}`);
      return;
    }

    const newPayment: CustomerPayment = {
      id: `pay-${Date.now()}`,
      orderId: paymentModalOrder.id,
      date: payDate,
      customerName: paymentModalOrder.customerName,
      amount: Number(payAmount),
      paymentMode: payMode,
      note: payNote.trim() || undefined
    };

    onRecordPayment(newPayment);
    setPaymentModalOrder(null);
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Customer Name',
      'Phone',
      'Site Location',
      'Quantity (Bricks)',
      'Rate (₹)',
      'Total Bill (₹)',
      'Paid Amount (₹)',
      'Balance Due (₹)',
      'Payment Mode',
      'Status',
      'Notes'
    ];

    const rows = salesOrders.map(o => {
      const mode = getOrderPaymentMode(o);
      const modeLabel =
        mode === 'cash'
          ? 'Cash'
          : mode === 'upi'
          ? 'Online / UPI'
          : mode === 'bank_transfer'
          ? 'Net Banking'
          : mode === 'cheque'
          ? 'Cheque'
          : 'Credit / Due';

      return [
        o.date,
        `"${o.customerName.replace(/"/g, '""')}"`,
        o.customerPhone || '',
        `"${(o.siteLocation || '').replace(/"/g, '""')}"`,
        o.quantity,
        o.rate,
        o.totalAmount,
        o.paidAmount,
        o.balanceDue,
        `"${modeLabel}"`,
        o.paymentStatus.toUpperCase(),
        `"${(o.note || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hare_Krishna_Bricks_Sales_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-view-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em' }}>
            Customer Sales & Receivables Ledger
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>
            Track brick orders, dispatches, payments received, and customer outstanding balances.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {onNavigateToInvoices && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onNavigateToInvoices}
              title="View and print official tax invoices and dispatch challans"
              style={{ color: '#7C3AED', borderColor: '#DDD6FE', background: '#F5F3FF' }}
            >
              <FileText size={15} />
              <span>Invoices & Bills</span>
            </button>
          )}

          <button className="btn btn-secondary btn-sm" onClick={exportToCSV} title="Download Sales CSV">
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>Record New Sale</span>
          </button>
        </div>
      </div>

      {/* 4 KPI Row: Soft Pastel Gradient Cards matching UI System */}
      <div className="dashboard-kpi-grid">
        <KPICard
          title="Total Bricks Sold"
          value={totalBricksSold}
          suffix=" pcs"
          theme="blue"
          subtitle={`Across ${salesOrders.length} customer order${salesOrders.length === 1 ? '' : 's'}`}
          badge={{
            text: 'Volume Sold',
            type: 'primary'
          }}
          icon={<Boxes size={18} />}
          onClick={() => {
            setDrilldownModal('volume');
            setDrilldownSearch('');
          }}
        />

        <KPICard
          title="Current Realized Revenue"
          value={totalPaidReceived}
          prefix="₹"
          decimals={0}
          theme="green"
          subtitle={`Actual collected in hand (${totalBilledRevenue > 0 ? Math.round((totalPaidReceived / totalBilledRevenue) * 100) : 100}% of gross)`}
          badge={{
            text: 'Cash & Online Inflow',
            type: 'good'
          }}
          icon={<CheckCircle2 size={18} />}
          onClick={() => {
            setDrilldownModal('cash');
            setDrilldownSearch('');
          }}
        />

        <KPICard
          title="Gross Sales Billed"
          value={totalBilledRevenue}
          prefix="₹"
          decimals={0}
          theme="amber"
          subtitle="Total invoiced (includes pending dues)"
          badge={{
            text: 'Gross Invoiced',
            type: 'warn'
          }}
          icon={<IndianRupee size={18} />}
          onClick={() => {
            setDrilldownModal('billed');
            setDrilldownSearch('');
          }}
        />

        <KPICard
          title="Total Outstanding Dues"
          value={totalOutstandingDues}
          prefix="₹"
          decimals={0}
          theme={totalOutstandingDues > 0 ? 'rose' : 'green'}
          isLoss={totalOutstandingDues > 0}
          subtitle={totalOutstandingDues > 0 ? 'Pending to be collected from customers' : 'All accounts settled clean!'}
          badge={{
            text: totalOutstandingDues > 0 ? 'Pending Dues' : 'All Settled',
            type: totalOutstandingDues > 0 ? 'bad' : 'good'
          }}
          icon={<Clock size={18} />}
          onClick={() => {
            setDrilldownModal('dues');
            setDrilldownSearch('');
          }}
        />
      </div>

      {/* Payment Collections Inflow by Mode Strip */}
      <div
        className="hkb-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(15, 23, 42, 0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={16} />
            </div>
            <div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                Payment Inflow by Method (Current Realized Collections)
              </span>
              <span style={{ fontSize: '11.5px', color: '#64748B', marginLeft: '8px' }}>
                Total Collected: <strong style={{ color: '#059669' }}>₹{totalPaidReceived.toLocaleString('en-IN')}</strong> ({allReceiptsList.length} receipt{allReceiptsList.length === 1 ? '' : 's'})
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setDrilldownModal('cash');
              setDrilldownSearch('');
            }}
            style={{ fontSize: '11.5px', padding: '4px 10px', color: '#7C3AED', background: '#F5F3FF', borderColor: '#DDD6FE' }}
          >
            <span>View All Receipts Audit</span>
            <ArrowUpRight size={12} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          {/* Cash */}
          <div
            onClick={() => setModeFilter(modeFilter === 'cash' ? 'all' : 'cash')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: modeFilter === 'cash' ? '#ECFDF5' : '#FAFAFA',
              border: modeFilter === 'cash' ? '2px solid #059669' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to filter ledger by Cash orders"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Banknote size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>CASH RECEIVED</div>
                <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: '#059669' }}>
                  ₹{modeTotals.cash.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                {totalPaidReceived > 0 ? `${Math.round((modeTotals.cash / totalPaidReceived) * 100)}%` : '0%'}
              </span>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>{modeCounts.cash} receipts</div>
            </div>
          </div>

          {/* Online / UPI */}
          <div
            onClick={() => setModeFilter(modeFilter === 'upi' ? 'all' : 'upi')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: modeFilter === 'upi' ? '#F5F3FF' : '#FAFAFA',
              border: modeFilter === 'upi' ? '2px solid #7C3AED' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to filter ledger by Online / UPI orders"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>ONLINE / UPI</div>
                <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: '#7C3AED' }}>
                  ₹{modeTotals.upi.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                {totalPaidReceived > 0 ? `${Math.round((modeTotals.upi / totalPaidReceived) * 100)}%` : '0%'}
              </span>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>{modeCounts.upi} receipts</div>
            </div>
          </div>

          {/* Net Banking */}
          <div
            onClick={() => setModeFilter(modeFilter === 'bank_transfer' ? 'all' : 'bank_transfer')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: modeFilter === 'bank_transfer' ? '#EFF6FF' : '#FAFAFA',
              border: modeFilter === 'bank_transfer' ? '2px solid #2563EB' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to filter ledger by Net Banking orders"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Landmark size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>NET BANKING</div>
                <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: '#2563EB' }}>
                  ₹{modeTotals.bank_transfer.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                {totalPaidReceived > 0 ? `${Math.round((modeTotals.bank_transfer / totalPaidReceived) * 100)}%` : '0%'}
              </span>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>{modeCounts.bank_transfer} receipts</div>
            </div>
          </div>

          {/* Cheque */}
          <div
            onClick={() => setModeFilter(modeFilter === 'cheque' ? 'all' : 'cheque')}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: modeFilter === 'cheque' ? '#FFFBEB' : '#FAFAFA',
              border: modeFilter === 'cheque' ? '2px solid #D97706' : '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            title="Click to filter ledger by Cheque orders"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>CHEQUE CLEARING</div>
                <div className="tabular-nums" style={{ fontSize: '16px', fontWeight: 800, color: '#D97706' }}>
                  ₹{modeTotals.cheque.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>
                {totalPaidReceived > 0 ? `${Math.round((modeTotals.cheque / totalPaidReceived) * 100)}%` : '0%'}
              </span>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>{modeCounts.cheque} receipts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="hkb-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '12px', color: '#94A3B8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '34px', fontSize: '13px' }}
            placeholder="Search by customer name, phone, or site location..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status filters */}
          <div className="segmented-control" style={{ flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              All Orders ({salesOrders.length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'due' ? 'active' : ''}`}
              onClick={() => setStatusFilter('due')}
            >
              Pending Dues ({salesOrders.filter(o => o.balanceDue > 0).length})
            </button>
            <button
              type="button"
              className={`segmented-btn ${statusFilter === 'paid' ? 'active' : ''}`}
              onClick={() => setStatusFilter('paid')}
            >
              Settled / Paid ({salesOrders.filter(o => o.balanceDue <= 0).length})
            </button>
          </div>

          {/* Mode filter dropdown or badge */}
          {modeFilter !== 'all' && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setModeFilter('all')}
              style={{ fontSize: '11px', padding: '4px 8px', color: '#7C3AED', background: '#F5F3FF', borderColor: '#DDD6FE' }}
              title="Clear mode filter"
            >
              <span>Mode: {modeFilter.toUpperCase()}</span>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Customer Ledger Table */}
      <div className="hkb-table-wrapper">
        <table className="hkb-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer & Site</th>
              <th>Bricks Sold</th>
              <th>Rate</th>
              <th>Total Bill</th>
              <th>Paid Amount</th>
              <th>Outstanding Due</th>
              <th>Payment Mode</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: '42px 16px', color: '#94A3B8' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <Clock size={28} color="#CBD5E1" />
                    <p style={{ fontSize: '13.5px', color: '#64748B' }}>
                      {salesOrders.length === 0
                        ? 'No sales orders logged yet. Record your first sale to start tracking customer orders and receivables.'
                        : 'No sales match your search filter.'}
                    </p>
                    {salesOrders.length === 0 && (
                      <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)} style={{ marginTop: '6px' }}>
                        + Record First Sale
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const isDue = order.balanceDue > 0;

                return (
                  <tr key={order.id} className={isDue ? 'row-loss' : ''}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{order.date}</td>

                    <td>
                      <div>
                        <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '13.5px' }}>
                          {order.customerName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '11px', color: '#64748B' }}>
                          {order.customerPhone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Phone size={11} color="#7C3AED" />
                              {order.customerPhone}
                            </span>
                          )}
                          {order.siteLocation && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px', background: '#F5F3FF', color: '#7C3AED', padding: '1px 5px', borderRadius: '4px' }}>
                              <MapPin size={10} />
                              {order.siteLocation}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ fontWeight: 700, color: '#7C3AED' }} className="tabular-nums">
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
                          fontSize: '13.5px',
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
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{
                            padding: '4px 9px',
                            fontSize: '11.5px',
                            borderRadius: '6px',
                            color: '#1E293B',
                            background: '#F8FAFC',
                            borderColor: '#CBD5E1',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onClick={() => setSelectedInvoiceOrder(order)}
                          title="View & Print Official Sales Invoice / Dispatch Challan"
                        >
                          <FileText size={12} color="#7C3AED" />
                          <span>Invoice</span>
                        </button>

                        {isDue && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 10px', fontSize: '11.5px', borderRadius: '6px' }}
                            onClick={() => handleOpenPaymentModal(order)}
                            title="Record payment received from this customer"
                          >
                            <IndianRupee size={12} />
                            <span>Record Payment</span>
                          </button>
                        )}

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (window.confirm(`Delete sale order for ${order.customerName}?`)) {
                              onDeleteSalesOrder(order.id);
                            }
                          }}
                          style={{ padding: '5px 8px', color: '#EF4444' }}
                          title="Delete Order"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL 1: Record Customer Brick Sale */}
      <RecordSaleModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        settings={settings}
        onAddSalesOrder={onAddSalesOrder}
      />

      {/* MODAL 2: Receive Payment / Jama Dues */}
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

      {/* MODAL 3: Drilldown Detail Modal for KPI Cards (Detailed Audit List) */}
      {drilldownModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setDrilldownModal(null)}
        >
          <div
            className="hkb-card"
            style={{
              width: '100%',
              maxWidth: '860px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              overflow: 'hidden',
              background: '#FFFFFF',
              boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
              borderRadius: '16px'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px 14px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                background: '#FAFAFD'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {drilldownModal === 'volume' && <Boxes size={20} color="#7C3AED" />}
                  {drilldownModal === 'billed' && <IndianRupee size={20} color="#D97706" />}
                  {drilldownModal === 'cash' && <CheckCircle2 size={20} color="#059669" />}
                  {drilldownModal === 'dues' && <Clock size={20} color="#DC2626" />}

                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
                    {drilldownModal === 'volume' && 'Total Bricks Sold — Dispatch Fulfillment Log'}
                    {drilldownModal === 'billed' && 'Gross Invoicing & Sales Ledger Audit'}
                    {drilldownModal === 'cash' && 'Realized Revenue & Payment Inflow Audit'}
                    {drilldownModal === 'dues' && 'Customer Outstanding Dues & Recovery List'}
                  </h3>
                </div>
                <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '3px' }}>
                  {drilldownModal === 'volume' && 'Complete breakdown of all brick order dispatches, customers, and delivery sites.'}
                  {drilldownModal === 'billed' && 'All issued customer bills, invoicing values, and payment realization status.'}
                  {drilldownModal === 'cash' && 'Chronological audit of every payment received with mode (Cash, UPI, Net Banking, Cheque).'}
                  {drilldownModal === 'dues' && 'List of all customer accounts with unpaid balance due and immediate payment settlement.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDrilldownModal(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '4px' }}
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Switch Tabs */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '8px' }}>
              <div className="segmented-control">
                <button
                  type="button"
                  className={`segmented-btn ${drilldownModal === 'volume' ? 'active' : ''}`}
                  onClick={() => setDrilldownModal('volume')}
                >
                  Bricks Sold ({salesOrders.length})
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${drilldownModal === 'billed' ? 'active' : ''}`}
                  onClick={() => setDrilldownModal('billed')}
                >
                  Gross Billed (₹{totalBilledRevenue.toLocaleString('en-IN')})
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${drilldownModal === 'cash' ? 'active' : ''}`}
                  onClick={() => setDrilldownModal('cash')}
                >
                  Cash & UPI Inflow (₹{totalPaidReceived.toLocaleString('en-IN')})
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${drilldownModal === 'dues' ? 'active' : ''}`}
                  onClick={() => setDrilldownModal('dues')}
                >
                  Pending Dues ({salesOrders.filter(o => o.balanceDue > 0).length})
                </button>
              </div>

              <div style={{ position: 'relative', width: '220px' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94A3B8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '28px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px', fontSize: '12px' }}
                  placeholder="Filter list..."
                  value={drilldownSearch}
                  onChange={e => setDrilldownSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Modal Body with scroll */}
            <div style={{ padding: '18px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* TAB 1: CASH & PAYMENT INFLOW AUDIT */}
              {drilldownModal === 'cash' && (
                <>
                  {/* 4 Mode summary pills */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                      <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>💵 CASH</span>
                      <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#059669' }}>
                        ₹{modeTotals.cash.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>{modeCounts.cash} payments</span>
                    </div>

                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#F5F3FF', border: '1px solid #DDD6FE' }}>
                      <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 700 }}>📱 ONLINE / UPI</span>
                      <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#7C3AED' }}>
                        ₹{modeTotals.upi.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>{modeCounts.upi} payments</span>
                    </div>

                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#EFF6FF', border: '1px solid #BFDBFE' }}>
                      <span style={{ fontSize: '11px', color: '#2563EB', fontWeight: 700 }}>🏛️ NET BANKING</span>
                      <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#2563EB' }}>
                        ₹{modeTotals.bank_transfer.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>{modeCounts.bank_transfer} payments</span>
                    </div>

                    <div style={{ padding: '10px 14px', borderRadius: '10px', background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                      <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700 }}>📝 CHEQUE</span>
                      <div className="tabular-nums" style={{ fontSize: '17px', fontWeight: 800, color: '#D97706' }}>
                        ₹{modeTotals.cheque.toLocaleString('en-IN')}
                      </div>
                      <span style={{ fontSize: '10.5px', color: '#64748B' }}>{modeCounts.cheque} payments</span>
                    </div>
                  </div>

                  {/* Detailed Receipts Table */}
                  <div className="hkb-table-wrapper" style={{ maxHeight: '380px' }}>
                    <table className="hkb-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Amount Received</th>
                          <th>Payment Mode</th>
                          <th>Remarks / Reference</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allReceiptsList
                          .filter(r =>
                            !drilldownSearch ||
                            r.customerName.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                            (r.note && r.note.toLowerCase().includes(drilldownSearch.toLowerCase())) ||
                            r.paymentMode.toLowerCase().includes(drilldownSearch.toLowerCase())
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
                              No payments recorded yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* TAB 2: PENDING DUES / UDHARI LIST */}
              {drilldownModal === 'dues' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: 700, textTransform: 'uppercase' }}>
                        TOTAL OUTSTANDING RECOVERY
                      </span>
                      <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: '#DC2626' }}>
                        ₹{totalOutstandingDues.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="badge badge-bad">
                      {salesOrders.filter(o => o.balanceDue > 0).length} Customers Pending
                    </span>
                  </div>

                  <div className="hkb-table-wrapper" style={{ maxHeight: '380px' }}>
                    <table className="hkb-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Contact</th>
                          <th>Site</th>
                          <th>Total Bill</th>
                          <th>Paid</th>
                          <th>Outstanding Due</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesOrders
                          .filter(o => o.balanceDue > 0)
                          .filter(o =>
                            !drilldownSearch ||
                            o.customerName.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                            (o.customerPhone && o.customerPhone.includes(drilldownSearch)) ||
                            (o.siteLocation && o.siteLocation.toLowerCase().includes(drilldownSearch.toLowerCase()))
                          )
                          .map(order => (
                            <tr key={order.id} className="row-loss">
                              <td style={{ fontWeight: 600 }}>{order.date}</td>
                              <td style={{ fontWeight: 700, color: '#0F172A' }}>{order.customerName}</td>
                              <td style={{ fontSize: '11.5px', color: '#64748B' }}>{order.customerPhone || '—'}</td>
                              <td style={{ fontSize: '11.5px', color: '#64748B' }}>{order.siteLocation || '—'}</td>
                              <td className="tabular-nums">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                              <td className="tabular-nums" style={{ color: '#059669', fontWeight: 600 }}>
                                ₹{order.paidAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="tabular-nums" style={{ fontWeight: 800, color: '#DC2626', fontSize: '13.5px' }}>
                                ₹{order.balanceDue.toLocaleString('en-IN')}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '3px 9px', fontSize: '11.5px' }}
                                  onClick={() => {
                                    setDrilldownModal(null);
                                    handleOpenPaymentModal(order);
                                  }}
                                >
                                  <IndianRupee size={12} />
                                  <span>Record Payment</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        {salesOrders.filter(o => o.balanceDue > 0).length === 0 && (
                          <tr>
                            <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#059669', fontWeight: 600 }}>
                              🎉 All customer accounts are completely settled clean!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* TAB 3: VOLUME SOLD BREAKDOWN */}
              {drilldownModal === 'volume' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#F5F3FF', border: '1px solid #DDD6FE', borderRadius: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#7C3AED', fontWeight: 700, textTransform: 'uppercase' }}>
                        TOTAL VOLUME DISPATCHED
                      </span>
                      <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: '#7C3AED' }}>
                        {totalBricksSold.toLocaleString('en-IN')} pcs
                      </div>
                    </div>
                    <span className="badge badge-primary">
                      {salesOrders.length} Orders Fulfilled
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
                        </tr>
                      </thead>
                      <tbody>
                        {salesOrders
                          .filter(o =>
                            !drilldownSearch ||
                            o.customerName.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                            (o.siteLocation && o.siteLocation.toLowerCase().includes(drilldownSearch.toLowerCase()))
                          )
                          .map(order => (
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
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* TAB 4: BILLED REVENUE BREAKDOWN */}
              {drilldownModal === 'billed' && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px' }}>
                    <div>
                      <span style={{ fontSize: '11px', color: '#D97706', fontWeight: 700, textTransform: 'uppercase' }}>
                        GROSS BILLED REVENUE
                      </span>
                      <div className="tabular-nums" style={{ fontSize: '24px', fontWeight: 800, color: '#D97706' }}>
                        ₹{totalBilledRevenue.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <span className="badge badge-warn">
                      Realization: {totalBilledRevenue > 0 ? Math.round((totalPaidReceived / totalBilledRevenue) * 100) : 100}%
                    </span>
                  </div>

                  <div className="hkb-table-wrapper" style={{ maxHeight: '380px' }}>
                    <table className="hkb-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Customer</th>
                          <th>Quantity</th>
                          <th>Rate</th>
                          <th>Total Bill</th>
                          <th>Paid Amount</th>
                          <th>Balance Due</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesOrders
                          .filter(o =>
                            !drilldownSearch ||
                            o.customerName.toLowerCase().includes(drilldownSearch.toLowerCase()) ||
                            (o.siteLocation && o.siteLocation.toLowerCase().includes(drilldownSearch.toLowerCase()))
                          )
                          .map(order => (
                            <tr key={order.id}>
                              <td style={{ fontWeight: 600 }}>{order.date}</td>
                              <td style={{ fontWeight: 700, color: '#0F172A' }}>{order.customerName}</td>
                              <td className="tabular-nums">{order.quantity.toLocaleString('en-IN')} pcs</td>
                              <td className="tabular-nums">₹{order.rate.toFixed(2)}</td>
                              <td className="tabular-nums" style={{ fontWeight: 800 }}>
                                ₹{order.totalAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="tabular-nums" style={{ color: '#059669', fontWeight: 600 }}>
                                ₹{order.paidAmount.toLocaleString('en-IN')}
                              </td>
                              <td className="tabular-nums" style={{ color: order.balanceDue > 0 ? '#DC2626' : '#64748B', fontWeight: 700 }}>
                                ₹{order.balanceDue.toLocaleString('en-IN')}
                              </td>
                              <td>
                                {order.paymentStatus === 'paid' && <span className="badge badge-good">PAID</span>}
                                {order.paymentStatus === 'partial' && <span className="badge badge-warn">PARTIAL</span>}
                                {order.paymentStatus === 'due' && <span className="badge badge-bad">DUE</span>}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '12px 24px', borderTop: '1px solid #E2E8F0', background: '#FAFAFD', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDrilldownModal(null)}>
                Close Audit Window
              </button>
            </div>
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

export default SalesView;
