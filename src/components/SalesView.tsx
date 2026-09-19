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
  X
} from 'lucide-react';
import { SalesOrder, CustomerPayment, Settings, PaymentMode, PaymentStatus } from '../types';
import { KPICard } from './KPICard';

interface SalesViewProps {
  salesOrders: SalesOrder[];
  customerPayments: CustomerPayment[];
  settings: Settings;
  onAddSalesOrder: (order: SalesOrder) => void;
  onDeleteSalesOrder: (id: string) => void;
  onRecordPayment: (payment: CustomerPayment) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({
  salesOrders,
  settings,
  onAddSalesOrder,
  onDeleteSalesOrder,
  onRecordPayment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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

  // Computations
  const totalBill = quantity * rate;
  const initialDue = Math.max(totalBill - initialPaid, 0);

  // Totals across all orders
  const totalBricksSold = salesOrders.reduce((sum, o) => sum + o.quantity, 0);
  const totalBilledRevenue = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaidReceived = salesOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalOutstandingDues = salesOrders.reduce((sum, o) => sum + o.balanceDue, 0);

  // Filtered orders
  const filteredOrders = salesOrders
    .filter(order => {
      const matchesSearch =
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm)) ||
        (order.siteLocation && order.siteLocation.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      if (statusFilter === 'due') {
        return order.balanceDue > 0;
      }
      if (statusFilter === 'paid') {
        return order.balanceDue <= 0;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

    onAddSalesOrder(newOrder);

    // If initial payment was made, record payment receipt
    if (paid > 0) {
      onRecordPayment({
        id: `pay-${Date.now()}`,
        orderId: newOrder.id,
        date,
        customerName: newOrder.customerName,
        amount: paid,
        paymentMode,
        note: `Initial payment at order booking`
      });
    }

    // Reset & close
    setCustomerName('');
    setCustomerPhone('');
    setSiteLocation('');
    setQuantity(5000);
    setInitialPaid(0);
    setSaleNote('');
    setIsAddModalOpen(false);
  };

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
      'Status',
      'Notes'
    ];

    const rows = salesOrders.map(o => [
      o.date,
      `"${o.customerName.replace(/"/g, '""')}"`,
      o.customerPhone || '',
      `"${(o.siteLocation || '').replace(/"/g, '""')}"`,
      o.quantity,
      o.rate,
      o.totalAmount,
      o.paidAmount,
      o.balanceDue,
      o.paymentStatus.toUpperCase(),
      `"${(o.note || '').replace(/"/g, '""')}"`
    ]);

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
          <button className="btn btn-secondary btn-sm" onClick={exportToCSV} title="Download Sales CSV">
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} />
            <span>+ Record New Sale</span>
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
        />

        <KPICard
          title="Total Sales Billed"
          value={totalBilledRevenue}
          prefix="₹"
          decimals={0}
          theme="amber"
          subtitle={`Average rate: ₹${settings.defaultSalePrice.toFixed(2)}/brick`}
          badge={{
            text: 'Gross Billed',
            type: 'warn'
          }}
          icon={<IndianRupee size={18} />}
        />

        <KPICard
          title="Total Cash Received"
          value={totalPaidReceived}
          prefix="₹"
          decimals={0}
          theme="green"
          subtitle={`Collection rate: ${totalBilledRevenue > 0 ? Math.round((totalPaidReceived / totalBilledRevenue) * 100) : 100}%`}
          badge={{
            text: 'Cash Collected',
            type: 'good'
          }}
          icon={<CheckCircle2 size={18} />}
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
        />
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
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '42px 16px', color: '#94A3B8' }}>
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

      {/* MODAL 1: Record New Sale */}
      {isAddModalOpen && (
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
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="hkb-card"
            style={{
              width: '100%',
              maxWidth: '520px',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              boxShadow: '0 20px 48px rgba(15, 23, 42, 0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A' }}>
                  Record Customer Brick Sale
                </h3>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  Issue bill and track customer advance or balance due.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
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
                  <label className="form-label">Customer / Contractor Name</label>
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
                  <label className="form-label">Customer Mobile Phone</label>
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
                    placeholder="e.g. Sector 14 Site"
                    value={siteLocation}
                    onChange={e => setSiteLocation(e.target.value)}
                  />
                </div>
              </div>

              <div className="responsive-form-duo">
                <div className="form-group">
                  <label className="form-label">Quantity (Bricks Sold)</label>
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
                  <label className="form-label">Rate (₹ / Brick)</label>
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

              {/* Total Calculation Strip */}
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
                    TOTAL BILL AMOUNT
                  </span>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: '#0F172A' }}>
                    ₹{totalBill.toLocaleString('en-IN')}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: initialDue > 0 ? '#DC2626' : '#059669', fontWeight: 600, textTransform: 'uppercase' }}>
                    {initialDue > 0 ? 'BALANCE DUE' : 'SETTLED CLEAN'}
                  </span>
                  <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 800, color: initialDue > 0 ? '#DC2626' : '#059669' }}>
                    ₹{initialDue.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="responsive-form-duo">
                <div className="form-group">
                  <label className="form-label">Advance / Payment Received (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={totalBill}
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
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
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

export default SalesView;
