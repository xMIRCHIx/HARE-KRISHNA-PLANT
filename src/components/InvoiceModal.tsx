import React, { useState, useRef } from 'react';
import {
  Printer,
  X,
  Share2,
  CheckCircle2,
  Clock,
  Phone,
  MapPin,
  Banknote,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react';
import { SalesOrder, CustomerPayment, Settings, PaymentMode } from '../types';

interface InvoiceModalProps {
  order: SalesOrder | null;
  customerPayments?: CustomerPayment[];
  settings?: Settings;
  onClose: () => void;
  onRecordPayment?: (order: SalesOrder) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  order,
  customerPayments = [],
  settings: _settings,
  onClose,
  onRecordPayment
}) => {
  const [copied, setCopied] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  // Filter payments belonging to this order
  const orderPayments = customerPayments.filter(p => p.orderId === order.id);

  // Generate formal invoice / challan number
  const invoiceNumber = `INV-${order.id.replace(/^sale-/, '').slice(-6).toUpperCase() || '874715'}`;
  const challanNumber = `HKB-${order.date.replace(/-/g, '')}-${order.id.slice(-4).toUpperCase()}`;

  // Formatted date
  const formattedDate = new Date(order.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Calculate settlement status
  const isSettled = order.balanceDue <= 0;
  const isPartial = order.balanceDue > 0 && order.paidAmount > 0;

  // Primary payment mode label
  const paymentModeLabel = (mode?: PaymentMode) => {
    switch (mode) {
      case 'upi':
        return 'Online / UPI';
      case 'bank_transfer':
        return 'Net Banking (NEFT/RTGS)';
      case 'cheque':
        return 'Bank Cheque';
      case 'cash':
      default:
        return 'Cash';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `*HARE KRISHNA BRICKS — SALES INVOICE*\n` +
      `Invoice No: ${invoiceNumber}\n` +
      `Date: ${order.date}\n` +
      `Customer: ${order.customerName}\n` +
      `Quantity: ${order.quantity.toLocaleString('en-IN')} Fly Ash Bricks\n` +
      `Rate: ₹${order.rate.toFixed(2)}/brick\n` +
      `Total Bill: ₹${order.totalAmount.toLocaleString('en-IN')}\n` +
      `Paid Amount: ₹${order.paidAmount.toLocaleString('en-IN')}\n` +
      `Balance Due: ₹${order.balanceDue.toLocaleString('en-IN')}\n` +
      `Status: ${isSettled ? 'FULLY SETTLED' : isPartial ? 'PARTIAL PAYMENT' : 'PAYMENT DUE'}\n` +
      `Site: ${order.siteLocation || 'Plant Yard'}\n` +
      `Plant Contact: +91 93404 11838 | Ambikapur, C.G.`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*HARE KRISHNA BRICKS — SALES INVOICE & DISPATCH RECEIPT*\n\n` +
      `📄 *Invoice No:* ${invoiceNumber}\n` +
      `📅 *Date:* ${order.date}\n` +
      `👤 *Customer:* ${order.customerName}\n` +
      `🧱 *Product:* High-Strength Fly Ash Bricks (9" x 4" x 3")\n` +
      `📦 *Quantity:* ${order.quantity.toLocaleString('en-IN')} pcs\n` +
      `💰 *Rate:* ₹${order.rate.toFixed(2)} / brick\n` +
      `--------------------------------\n` +
      `💵 *Gross Total:* ₹${order.totalAmount.toLocaleString('en-IN')}\n` +
      `✅ *Paid Amount:* ₹${order.paidAmount.toLocaleString('en-IN')}\n` +
      `⚠️ *Balance Due:* ₹${order.balanceDue.toLocaleString('en-IN')}\n` +
      `📌 *Status:* ${isSettled ? 'FULLY SETTLED' : isPartial ? 'PARTIAL PAYMENT' : 'PAYMENT DUE'}\n` +
      `📍 *Delivery Site:* ${order.siteLocation || 'Plant Yard Direct Loading'}\n\n` +
      `_Official invoice issued by Hare Krishna Bricks._\n` +
      `_Contact: +91 93404 11838 | Ambikapur, Chhattisgarh_`
    );
    const phone = order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  return (
    <div
      className="standalone-invoice-page no-print-bg"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        backgroundColor: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden'
      }}
    >
      {/* Standalone Full-Width Sticky Top Header Bar */}
      <div
        className="invoice-actions-bar no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#1E293B',
          borderBottom: '1px solid #334155',
          padding: '12px 24px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
          width: '100%',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              background: '#334155',
              border: '1px solid #475569',
              color: '#F8FAFC',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'background 0.15s ease'
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Plant ERP</span>
          </button>

          <div style={{ height: '24px', width: '1px', background: '#334155' }} />

          <div>
            <h4 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
              Sales Invoice & Dispatch Challan
            </h4>
            <span style={{ fontSize: '11.5px', color: '#94A3B8' }}>
              Invoice {invoiceNumber} • {order.customerName}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {onRecordPayment && order.balanceDue > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                onClose();
                onRecordPayment(order);
              }}
              style={{ padding: '7px 14px', fontSize: '12px' }}
            >
              <Banknote size={14} />
              <span>Record Payment</span>
            </button>
          )}

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleCopySummary}
            title="Copy invoice summary to clipboard"
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              background: '#334155',
              color: '#F8FAFC',
              borderColor: '#475569'
            }}
          >
            {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy Bill'}</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handleWhatsAppShare}
            title="Share invoice via WhatsApp"
            style={{
              padding: '7px 14px',
              fontSize: '12px',
              color: '#FFFFFF',
              borderColor: '#059669',
              background: '#059669'
            }}
          >
            <Share2 size={14} />
            <span>Share WhatsApp</span>
          </button>

          <button
            type="button"
            className="btn btn-sm"
            onClick={handlePrint}
            title="Print or Save as PDF"
            style={{
              padding: '7px 16px',
              fontSize: '12px',
              background: '#6366F1',
              color: '#FFFFFF',
              borderColor: '#6366F1',
              fontWeight: 700
            }}
          >
            <Printer size={14} />
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: 'none',
              background: '#334155',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Close Invoice View"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div
        className="invoice-container-wrapper"
        style={{
          width: '100%',
          maxWidth: '860px',
          margin: '28px auto 60px',
          padding: '0 16px'
        }}
      >
        {/* Printable Official Tax Invoice Document Card */}
        <div
          ref={invoiceRef}
          className="official-invoice-document"
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '40px 44px',
            boxShadow: '0 8px 32px rgba(15, 23, 42, 0.12)',
            color: '#0F172A',
            fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
            position: 'relative'
          }}
        >
          {/* HEADER ROW */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              paddingBottom: '24px',
              borderBottom: '1.5px solid #F1F5F9',
              gap: '16px'
            }}
          >
            {/* Left: Plant Brand & Address */}
            <div style={{ maxWidth: '360px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '10px',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
                    flexShrink: 0,
                    overflow: 'hidden',
                    padding: '3px'
                  }}
                >
                  <img
                    src="/logo.png"
                    alt="Hare Krishna Bricks"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      letterSpacing: '-0.02em',
                      color: '#0F172A',
                      lineHeight: 1.15,
                      textTransform: 'uppercase'
                    }}
                  >
                    Hare Krishna Bricks
                  </h1>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      color: '#7C3AED',
                      textTransform: 'uppercase'
                    }}
                  >
                    Fly Ash Concrete Products Plant
                  </span>
                </div>
              </div>

              <p style={{ fontSize: '11px', color: '#64748B', lineHeight: '1.45', marginTop: '4px' }}>
                Main Plant & Yard, Industrial Cluster, Ambikapur Road,
                <br />
                Surguja District, Chhattisgarh — 497001
              </p>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px', fontWeight: 600 }}>
                Phone: +91 93404 11838 • Plant Head: Maneesh Garg
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8', marginTop: '2px' }}>
                GSTIN: 22AAAPL1234F1Z9 • IS 12894:2002 Certified
              </div>
            </div>

            {/* Center: Styled Pill Box for Challan No */}
            <div
              style={{
                background: '#F5F3FF',
                border: '1.5px solid #DDD6FE',
                borderRadius: '12px',
                padding: '12px 18px',
                textAlign: 'center',
                minWidth: '180px'
              }}
            >
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#7C3AED',
                  display: 'block',
                  marginBottom: '2px'
                }}
              >
                DISPATCH / CHALLAN NO.
              </span>
              <div
                className="tabular-nums"
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '0.02em'
                }}
              >
                {challanNumber}
              </div>
            </div>

            {/* Right: Invoice Title & Meta */}
            <div style={{ textAlign: 'right', minWidth: '180px' }}>
              <h2
                style={{
                  fontSize: '22px',
                  fontWeight: 900,
                  color: '#0F172A',
                  letterSpacing: '-0.025em',
                  textTransform: 'uppercase'
                }}
              >
                SALES INVOICE
              </h2>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                DISPATCH RECEIPT & CHALLAN
              </span>

              <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11.5px' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>RECEIPT NO:</span>
                  <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{invoiceNumber}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>DATE ISSUED:</span>
                  <strong style={{ color: '#0F172A' }}>{formattedDate}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                  <span style={{ color: '#64748B', fontWeight: 500 }}>STATUS:</span>
                  {isSettled ? (
                    <span
                      style={{
                        background: '#ECFDF5',
                        color: '#059669',
                        border: '1px solid #A7F3D0',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      FULLY SETTLED
                    </span>
                  ) : isPartial ? (
                    <span
                      style={{
                        background: '#FFFBEB',
                        color: '#D97706',
                        border: '1px solid #FDE68A',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      PARTIAL PAYMENT
                    </span>
                  ) : (
                    <span
                      style={{
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        letterSpacing: '0.04em'
                      }}
                    >
                      PAYMENT DUE
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN DETAILS SECTION */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '24px',
              padding: '20px 0',
              borderBottom: '1.5px solid #F1F5F9'
            }}
          >
            {/* Left: Billed To Customer */}
            <div>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#64748B',
                  display: 'block',
                  marginBottom: '6px'
                }}
              >
                BILLED TO / CUSTOMER DETAILS
              </span>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>
                {order.customerName}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', fontSize: '12px', color: '#475569' }}>
                {order.customerPhone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Phone size={12} color="#7C3AED" />
                    <span>Phone: <strong>{order.customerPhone}</strong></span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <MapPin size={12} color="#7C3AED" />
                  <span>Site / Delivery: <strong>{order.siteLocation || 'Direct Yard Pickup'}</strong></span>
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
                  Customer Reference: #{order.id}
                </div>
              </div>
            </div>

            {/* Right: Dispatch Specifications */}
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#64748B',
                  display: 'block',
                  marginBottom: '6px'
                }}
              >
                DISPATCH & ORDER DETAILS
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: '#334155' }}>
                <div>
                  <span style={{ color: '#64748B' }}>Product Type: </span>
                  <strong style={{ color: '#7C3AED' }}>Fly Ash Compaction Bricks</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Specification: </span>
                  <strong>Class 100 High-Strength (9"×4"×3")</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Plant Dispatch Yard: </span>
                  <strong>Press Line 1 Active</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Booking Date: </span>
                  <strong>{order.date}</strong>
                </div>
                <div>
                  <span style={{ color: '#64748B' }}>Dispatch Mode: </span>
                  <strong>Yard Loaded / Dispatched</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ITEM DESCRIPTION TABLE (Dark Bar Style from Image) */}
          <div style={{ margin: '22px 0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ background: '#0F172A', color: '#FFFFFF' }}>
                  <th
                    style={{
                      padding: '11px 16px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textAlign: 'left'
                    }}
                  >
                    DESCRIPTION
                  </th>
                  <th
                    style={{
                      padding: '11px 16px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textAlign: 'center'
                    }}
                  >
                    SPEC / UNIT
                  </th>
                  <th
                    style={{
                      padding: '11px 16px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textAlign: 'right'
                    }}
                  >
                    QUANTITY
                  </th>
                  <th
                    style={{
                      padding: '11px 16px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textAlign: 'right'
                    }}
                  >
                    RATE (₹)
                  </th>
                  <th
                    style={{
                      padding: '11px 16px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      textAlign: 'right'
                    }}
                  >
                    AMOUNT (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #E2E8F0', background: '#FAFAFA' }}>
                  <td style={{ padding: '16px', verticalAlign: 'top' }}>
                    <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#0F172A' }}>
                      High-Density Fly Ash Cement Bricks
                    </div>
                    <p style={{ fontSize: '11.5px', color: '#64748B', marginTop: '3px', lineHeight: 1.4 }}>
                      Hydraulically compacted cement, fly ash, and stone dust composite bricks.
                      Superior compressive strength with uniform sharp edges and low water absorption.
                    </p>
                  </td>
                  <td
                    style={{
                      padding: '16px',
                      fontSize: '12px',
                      color: '#475569',
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      fontWeight: 600
                    }}
                  >
                    230 × 110 × 75 mm
                    <br />
                    <span style={{ fontSize: '10.5px', color: '#94A3B8' }}>(9" × 4" × 3")</span>
                  </td>
                  <td
                    className="tabular-nums"
                    style={{
                      padding: '16px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      textAlign: 'right',
                      verticalAlign: 'middle',
                      color: '#7C3AED'
                    }}
                  >
                    {order.quantity.toLocaleString('en-IN')} pcs
                  </td>
                  <td
                    className="tabular-nums"
                    style={{
                      padding: '16px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      textAlign: 'right',
                      verticalAlign: 'middle'
                    }}
                  >
                    ₹{order.rate.toFixed(2)}
                  </td>
                  <td
                    className="tabular-nums"
                    style={{
                      padding: '16px',
                      fontSize: '14.5px',
                      fontWeight: 800,
                      textAlign: 'right',
                      verticalAlign: 'middle',
                      color: '#0F172A'
                    }}
                  >
                    ₹{order.totalAmount.toLocaleString('en-IN')}.00
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TRANSACTION PAYMENT DETAILS STRIP (Just like image) */}
          <div
            style={{
              background: '#F8FAFC',
              border: '1.5px solid #E2E8F0',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '22px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Payment Mode:</span>
                <span
                  style={{
                    background:
                      order.paymentMode === 'cash'
                        ? '#ECFDF5'
                        : order.paymentMode === 'upi'
                        ? '#F5F3FF'
                        : order.paymentMode === 'bank_transfer'
                        ? '#EFF6FF'
                        : '#FFFBEB',
                    color:
                      order.paymentMode === 'cash'
                        ? '#059669'
                        : order.paymentMode === 'upi'
                        ? '#7C3AED'
                        : order.paymentMode === 'bank_transfer'
                        ? '#2563EB'
                        : '#D97706',
                    border: '1px solid currentColor',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700
                  }}
                >
                  {paymentModeLabel(order.paymentMode)}
                </span>
              </div>

              <div className="tabular-nums" style={{ fontSize: '15px', fontWeight: 800, color: '#059669' }}>
                ₹{order.paidAmount.toLocaleString('en-IN')}.00 Collected
              </div>
            </div>

            <p style={{ fontSize: '11.5px', color: '#475569', marginTop: '6px', lineHeight: 1.45 }}>
              Payment recorded on <strong>{formattedDate}</strong>.
              {order.paidAmount > 0 ? (
                <>
                  {' '}Advance / payment received: <strong>₹{order.paidAmount.toLocaleString('en-IN')}</strong>.
                  {order.balanceDue > 0
                    ? ` Remaining balance to be cleared: ₹${order.balanceDue.toLocaleString('en-IN')}.`
                    : ' Entire order balance has been fully settled.'}
                </>
              ) : (
                ' No initial payment recorded; entire order billed on credit/udhaar.'
              )}
            </p>

            {order.note && (
              <div style={{ fontSize: '11px', color: '#64748B', fontStyle: 'italic', marginTop: '4px' }}>
                Note: {order.note}
              </div>
            )}

            {/* If there are multiple individual payment receipts logged */}
            {orderPayments.length > 0 && (
              <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Recorded Payment Receipts:
                </span>
                {orderPayments.map((p, i) => (
                  <div key={p.id || i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#334155' }}>
                    <span>• {p.date} via {paymentModeLabel(p.paymentMode)} {p.note ? `(${p.note})` : ''}</span>
                    <strong style={{ color: '#059669' }}>₹{p.amount.toLocaleString('en-IN')}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SETTLEMENT & SUMMARY GRID (Bottom Section) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              gap: '24px',
              alignItems: 'start',
              paddingBottom: '20px'
            }}
          >
            {/* Left: Settlement Status Card & Terms */}
            <div>
              <div
                style={{
                  background: isSettled ? '#ECFDF5' : isPartial ? '#FFFBEB' : '#FEF2F2',
                  border: isSettled ? '1.5px solid #A7F3D0' : isPartial ? '1.5px solid #FDE68A' : '1.5px solid #FCA5A5',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: isSettled ? '#10B981' : isPartial ? '#F59E0B' : '#EF4444',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {isSettled ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                </div>

                <div>
                  <h4
                    style={{
                      fontSize: '13px',
                      fontWeight: 800,
                      color: isSettled ? '#065F46' : isPartial ? '#92400E' : '#991B1B',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {isSettled ? 'FULLY SETTLED' : isPartial ? 'PARTIAL BALANCE PENDING' : 'PAYMENT DUE'}
                  </h4>
                  <p
                    style={{
                      fontSize: '11px',
                      color: isSettled ? '#047857' : isPartial ? '#B45309' : '#B91C1C',
                      marginTop: '2px'
                    }}
                  >
                    {isSettled
                      ? 'All dues for this dispatch order have been fully cleared. No balance remaining.'
                      : `An outstanding balance of ₹${order.balanceDue.toLocaleString('en-IN')} remains pending from ${order.customerName}.`}
                  </p>
                </div>
              </div>

              {/* Plant Terms */}
              <div style={{ marginTop: '16px', fontSize: '10px', color: '#64748B', lineHeight: '1.45' }}>
                <strong>Terms & Conditions:</strong>
                <ol style={{ paddingLeft: '14px', marginTop: '3px' }}>
                  <li>Bricks once dispatched in sound condition will not be returned or exchanged.</li>
                  <li>Unloading at delivery site is buyer's responsibility unless specified in writing.</li>
                  <li>Breakage allowance up to 1-2% during transport is acceptable under IS standards.</li>
                </ol>
              </div>
            </div>

            {/* Right: Calculations Breakdown & Grand Total */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Base Brick Value:</span>
                  <span className="tabular-nums" style={{ fontWeight: 600 }}>₹{order.totalAmount.toLocaleString('en-IN')}.00</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Yard Loading Charges:</span>
                  <span className="tabular-nums" style={{ fontWeight: 600 }}>Included (₹0.00)</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                  <span>Total Order Bill:</span>
                  <span className="tabular-nums" style={{ fontWeight: 700, color: '#0F172A' }}>₹{order.totalAmount.toLocaleString('en-IN')}.00</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669', paddingTop: '4px', borderTop: '1px dashed #E2E8F0' }}>
                  <span style={{ fontWeight: 600 }}>Amount Paid in this Receipt:</span>
                  <span className="tabular-nums" style={{ fontWeight: 800 }}>₹{order.paidAmount.toLocaleString('en-IN')}.00</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: order.balanceDue > 0 ? '#DC2626' : '#64748B' }}>
                  <span style={{ fontWeight: 600 }}>Remaining Dues:</span>
                  <span className="tabular-nums" style={{ fontWeight: 800 }}>
                    ₹{order.balanceDue.toLocaleString('en-IN')}.00 {isSettled ? '(Fully Settled)' : ''}
                  </span>
                </div>

                {/* Grand Total Bar */}
                <div
                  style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    background: '#0F172A',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    GRAND TOTAL (NET ORDER)
                  </span>
                  <span className="tabular-nums" style={{ fontSize: '18px', fontWeight: 900 }}>
                    ₹{order.totalAmount.toLocaleString('en-IN')}.00
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SIGNATURES & WATERMARK */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingTop: '28px',
              marginTop: '10px',
              borderTop: '1px solid #E2E8F0'
            }}
          >
            <div style={{ textAlign: 'center', minWidth: '150px' }}>
              <div style={{ height: '36px', borderBottom: '1px dashed #CBD5E1', marginBottom: '4px' }}></div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                Customer / Receiver Signature
              </span>
            </div>

            <div style={{ textAlign: 'center', maxWidth: '320px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0F172A' }}>
                Thank you for choosing Hare Krishna Bricks!
              </div>
              <div style={{ fontSize: '9.5px', color: '#94A3B8', marginTop: '2px' }}>
                This is an official computer-generated receipt & challan requiring no physical signature.
              </div>
            </div>

            <div style={{ textAlign: 'center', minWidth: '150px' }}>
              <div style={{ height: '36px', borderBottom: '1px dashed #CBD5E1', marginBottom: '4px' }}></div>
              <span style={{ fontSize: '10px', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>
                For Hare Krishna Bricks
                <br />
                (Authorized Signatory)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
