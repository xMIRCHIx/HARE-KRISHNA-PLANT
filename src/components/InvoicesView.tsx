import React, { useState } from 'react';
import {
  FileText,
  Search,
  Printer,
  Share2,
  Phone,
  MapPin,
  CheckCircle2,
  Clock,
  IndianRupee,
  Eye,
  Plus
} from 'lucide-react';
import { SalesOrder, CustomerPayment, Settings } from '../types';
import { InvoiceModal } from './InvoiceModal';

interface InvoicesViewProps {
  salesOrders: SalesOrder[];
  customerPayments: CustomerPayment[];
  settings: Settings;
  onNavigateToSales: () => void;
  onRecordPayment?: (payment: CustomerPayment) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  salesOrders,
  customerPayments,
  settings,
  onNavigateToSales
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'due' | 'paid'>('all');
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<SalesOrder | null>(null);

  // Financial summary metrics
  const totalInvoices = salesOrders.length;
  const totalGrossBilled = salesOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalPaidReceived = salesOrders.reduce((sum, o) => sum + o.paidAmount, 0);
  const totalOutstandingDues = salesOrders.reduce((sum, o) => sum + o.balanceDue, 0);
  const settledCount = salesOrders.filter(o => o.balanceDue <= 0).length;
  const dueCount = salesOrders.filter(o => o.balanceDue > 0).length;

  // Filtered invoices
  const filteredOrders = salesOrders
    .filter(order => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        order.customerName.toLowerCase().includes(q) ||
        (order.customerPhone && order.customerPhone.includes(q)) ||
        (order.siteLocation && order.siteLocation.toLowerCase().includes(q)) ||
        order.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (statusFilter === 'due') return order.balanceDue > 0;
      if (statusFilter === 'paid') return order.balanceDue <= 0;
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleWhatsAppShare = (order: SalesOrder) => {
    const isSettled = order.balanceDue <= 0;
    const isPartial = order.paidAmount > 0 && order.balanceDue > 0;
    const invNumber = `HKB-${order.date.replace(/-/g, '')}-${order.id.slice(-4).toUpperCase()}`;

    const text = encodeURIComponent(
      `🏛️ *HARE KRISHNA BRICKS — OFFICIAL INVOICE*\n` +
      `🧾 *Invoice No:* ${invNumber}\n` +
      `📅 *Date:* ${order.date}\n` +
      `--------------------------------\n` +
      `👤 *Billed To:* ${order.customerName}\n` +
      `📦 *Item:* High-Strength Fly Ash Bricks\n` +
      `🧱 *Quantity:* ${order.quantity.toLocaleString('en-IN')} pcs\n` +
      `💰 *Rate:* ₹${order.rate.toFixed(2)} / brick\n` +
      `--------------------------------\n` +
      `💵 *Gross Bill:* ₹${order.totalAmount.toLocaleString('en-IN')}\n` +
      `✅ *Amount Paid:* ₹${order.paidAmount.toLocaleString('en-IN')}\n` +
      `⚠️ *Balance Due:* ₹${order.balanceDue.toLocaleString('en-IN')}\n` +
      `📌 *Status:* ${isSettled ? 'FULLY SETTLED' : isPartial ? 'PARTIALLY PAID' : 'PAYMENT DUE'}\n` +
      `📍 *Delivery Site:* ${order.siteLocation || 'Direct Yard Dispatch'}\n\n` +
      `_Thank you for doing business with Hare Krishna Bricks!_\n` +
      `_Plant Contact: +91 93404 11838 | Ambikapur, CG_`
    );

    const phone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#F5F3FF',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em' }}>
                Customer Invoices & Dispatch Challans
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>
                Inspect, print/save PDF bills, and forward invoices directly to customer WhatsApp
              </p>
            </div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={onNavigateToSales}>
          <Plus size={16} />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* KPI Stats Strip */}
      <div className="dashboard-kpi-grid">
        {/* Total Invoices */}
        <div
          className="hkb-card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            border: '1px solid #E2E8F0'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Total Invoices Issued
            </span>
            <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
              {totalInvoices}
            </div>
            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
              {settledCount} settled • {dueCount} pending
            </span>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} />
          </div>
        </div>

        {/* Current Realized Collections */}
        <div
          className="hkb-card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #ECFDF5 100%)',
            border: '1px solid #A7F3D0'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Realized Cash & Online
            </span>
            <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 800, color: '#059669', marginTop: '4px' }}>
              ₹{totalPaidReceived.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11.5px', color: '#047857' }}>
              Actual money received in hand
            </span>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Gross Sales Invoiced */}
        <div
          className="hkb-card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)',
            border: '1px solid #FDE68A'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Gross Sales Invoiced
            </span>
            <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 800, color: '#B45309', marginTop: '4px' }}>
              ₹{totalGrossBilled.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11.5px', color: '#92400E' }}>
              Total bill across all dispatches
            </span>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IndianRupee size={20} />
          </div>
        </div>

        {/* Customer Balance Due */}
        <div
          className="hkb-card"
          style={{
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: totalOutstandingDues > 0 ? 'linear-gradient(135deg, #FFFFFF 0%, #FEF2F2 100%)' : '#FFFFFF',
            border: totalOutstandingDues > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0'
          }}
        >
          <div>
            <span style={{ fontSize: '11px', fontWeight: 700, color: totalOutstandingDues > 0 ? '#DC2626' : '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Outstanding Balance
            </span>
            <div className="tabular-nums" style={{ fontSize: '26px', fontWeight: 800, color: totalOutstandingDues > 0 ? '#DC2626' : '#0F172A', marginTop: '4px' }}>
              ₹{totalOutstandingDues.toLocaleString('en-IN')}
            </div>
            <span style={{ fontSize: '11.5px', color: totalOutstandingDues > 0 ? '#B91C1C' : '#64748B' }}>
              {dueCount > 0 ? `${dueCount} customer accounts pending` : 'All invoices settled'}
            </span>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: totalOutstandingDues > 0 ? '#FEF2F2' : '#F1F5F9', color: totalOutstandingDues > 0 ? '#DC2626' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
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
        <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
          <Search size={15} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search by customer name, phone, site, or invoice ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '13px',
              background: '#F8FAFC'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('all')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            All Invoices ({salesOrders.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'due' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('due')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Pending Dues ({dueCount})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'paid' ? 'btn-good' : 'btn-secondary'}`}
            onClick={() => setStatusFilter('paid')}
            style={{ fontSize: '12px', padding: '6px 12px' }}
          >
            Settled ({settledCount})
          </button>
        </div>
      </div>

      {/* Invoices Table Card */}
      <div className="hkb-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="hkb-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  INVOICE # & DATE
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  CUSTOMER & SITE
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  BRICKS & RATE
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  TOTAL BILL
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  PAID AMOUNT
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>
                  OUTSTANDING DUE
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  STATUS
                </th>
                <th style={{ padding: '12px 16px', fontSize: '11px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '48px 16px', color: '#64748B' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <FileText size={36} color="#CBD5E1" />
                      <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>
                        No invoices found
                      </span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {searchTerm ? 'Try adjusting your search criteria' : 'Create a sales order to generate your first invoice'}
                      </span>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={onNavigateToSales}
                        style={{ marginTop: '8px' }}
                      >
                        <Plus size={14} />
                        <span>Record Sale & Generate Invoice</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const invNumber = `HKB-${order.date.replace(/-/g, '')}-${order.id.slice(-4).toUpperCase()}`;
                  const isSettled = order.balanceDue <= 0;
                  const isPartial = order.paidAmount > 0 && order.balanceDue > 0;

                  return (
                    <tr
                      key={order.id}
                      style={{
                        borderBottom: '1px solid #F1F5F9',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Invoice ID & Date */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0F172A', fontFamily: 'monospace' }}>
                            {invNumber}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>
                            {order.date}
                          </span>
                        </div>
                      </td>

                      {/* Customer & Site */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            {order.customerName}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', fontSize: '11px', color: '#64748B' }}>
                            {order.customerPhone && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Phone size={10} color="#7C3AED" />
                                {order.customerPhone}
                              </span>
                            )}
                            {order.siteLocation && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={10} color="#64748B" />
                                {order.siteLocation}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Bricks & Rate */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span className="tabular-nums" style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                            {order.quantity.toLocaleString('en-IN')} pcs
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748B', marginTop: '1px' }}>
                            @ ₹{order.rate.toFixed(2)}/brick
                          </span>
                        </div>
                      </td>

                      {/* Total Bill */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <span className="tabular-nums" style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A' }}>
                          ₹{order.totalAmount.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Paid Amount */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span className="tabular-nums" style={{ fontSize: '13.5px', fontWeight: 800, color: '#059669' }}>
                            ₹{order.paidAmount.toLocaleString('en-IN')}
                          </span>
                          {order.paymentMode && (
                            <span style={{ fontSize: '10px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                              via {order.paymentMode}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Outstanding Due */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <span
                          className="tabular-nums"
                          style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: order.balanceDue > 0 ? '#DC2626' : '#059669'
                          }}
                        >
                          {order.balanceDue > 0 ? `₹${order.balanceDue.toLocaleString('en-IN')}` : '₹0 (Settled)'}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        {isSettled ? (
                          <span
                            style={{
                              background: '#ECFDF5',
                              color: '#059669',
                              border: '1px solid #A7F3D0',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <CheckCircle2 size={11} />
                            <span>SETTLED</span>
                          </span>
                        ) : isPartial ? (
                          <span
                            style={{
                              background: '#FFFBEB',
                              color: '#D97706',
                              border: '1px solid #FDE68A',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Clock size={11} />
                            <span>PARTIAL</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              background: '#FEF2F2',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Clock size={11} />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {/* View Button */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedInvoiceOrder(order)}
                            title="View Official Invoice / Challan"
                            style={{
                              padding: '5px 9px',
                              fontSize: '11.5px',
                              color: '#7C3AED',
                              borderColor: '#DDD6FE',
                              background: '#F5F3FF'
                            }}
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>

                          {/* Print / Download Button */}
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedInvoiceOrder(order)}
                            title="Print / Save PDF"
                            style={{
                              padding: '5px 9px',
                              fontSize: '11.5px',
                              color: '#0F172A',
                              borderColor: '#CBD5E1'
                            }}
                          >
                            <Printer size={12} />
                            <span>PDF</span>
                          </button>

                          {/* WhatsApp Button */}
                          <button
                            type="button"
                            className="btn btn-sm"
                            onClick={() => handleWhatsAppShare(order)}
                            title="Forward Bill to Customer WhatsApp"
                            style={{
                              padding: '5px 9px',
                              fontSize: '11.5px',
                              color: '#059669',
                              borderColor: '#A7F3D0',
                              background: '#ECFDF5',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Share2 size={12} />
                            <span>WhatsApp</span>
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
      </div>

      {/* Official Printable Invoice Modal */}
      {selectedInvoiceOrder && (
        <InvoiceModal
          order={selectedInvoiceOrder}
          customerPayments={customerPayments}
          settings={settings}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      )}
    </div>
  );
};
