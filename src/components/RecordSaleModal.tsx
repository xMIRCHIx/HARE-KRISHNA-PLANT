import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  Banknote,
  Smartphone,
  Building,
  FileCheck,
  HelpCircle,
  AlertCircle,
  Truck,
  Bookmark
} from 'lucide-react';
import { SalesOrder, CustomerPayment, Settings, PaymentMode, PaymentStatus } from '../types';

interface RecordSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onAddSalesOrder: (order: SalesOrder, initialPayment?: CustomerPayment) => Promise<void> | void;
}

type PaymentPlan = 'full' | 'partial' | 'later';
type PaymentTiming = 'current' | 'advance';

export const RecordSaleModal: React.FC<RecordSaleModalProps> = ({
  isOpen,
  onClose,
  settings,
  onAddSalesOrder
}) => {
  // Order Form State (strings used so backspace cleanly deletes numbers with no stuck '0')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [siteLocation, setSiteLocation] = useState('');
  const [quantityStr, setQuantityStr] = useState('5000');
  const [rateStr, setRateStr] = useState(String(settings.defaultSalePrice || 4.0));

  // Payment State
  const [paymentPlan, setPaymentPlan] = useState<PaymentPlan>('later');
  const [paidAmountStr, setPaidAmountStr] = useState('0');
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>('current');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [otherModeDetails, setOtherModeDetails] = useState('');
  const [saleNote, setSaleNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Computations
  const quantity = Math.max(Number(quantityStr) || 0, 0);
  const rate = Math.max(Number(rateStr) || 0, 0);
  const totalBill = quantity * rate;
  const initialPaid = Math.max(Number(paidAmountStr) || 0, 0);
  const initialDue = Math.max(totalBill - initialPaid, 0);

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setDate(new Date().toISOString().split('T')[0]);
      setCustomerName('');
      setCustomerPhone('');
      setSiteLocation('');
      setQuantityStr('5000');
      setRateStr(String(settings.defaultSalePrice || 4.0));
      setPaymentPlan('later');
      setPaidAmountStr('0');
      setPaymentTiming('current');
      setPaymentMode('cash');
      setOtherModeDetails('');
      setSaleNote('');
      setIsSubmitting(false);
    }
  }, [isOpen, settings.defaultSalePrice]);

  if (!isOpen) return null;

  // Handle plan changes
  const handleSelectPlan = (plan: PaymentPlan) => {
    setPaymentPlan(plan);
    if (plan === 'full') {
      setPaidAmountStr(String(totalBill));
    } else if (plan === 'later') {
      setPaidAmountStr('0');
    } else {
      // Partial: if currently 0 or full, suggest a 50% advance
      if (initialPaid === 0 || initialPaid >= totalBill) {
        const half = Math.round(totalBill / 2);
        setPaidAmountStr(half > 0 ? String(half) : '');
      }
    }
  };

  // Handle typed amount with automatic plan sync
  const handleAmountChange = (val: string) => {
    setPaidAmountStr(val);
    const parsed = Number(val);
    if (val === '' || isNaN(parsed) || parsed === 0) {
      setPaymentPlan('later');
    } else if (parsed >= totalBill && totalBill > 0) {
      setPaymentPlan('full');
    } else {
      setPaymentPlan('partial');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || quantity <= 0 || rate <= 0) return;

    setIsSubmitting(true);
    const orderId = `sale-${Date.now()}`;
    const clampedPaid = Math.min(initialPaid, totalBill);
    const finalBalanceDue = Math.max(totalBill - clampedPaid, 0);

    const paymentStatus: PaymentStatus =
      clampedPaid >= totalBill ? 'paid' : clampedPaid > 0 ? 'partial' : 'due';

    // Build comprehensive note
    const noteParts: string[] = [];
    if (saleNote.trim()) noteParts.push(saleNote.trim());
    if (paymentTiming === 'advance') {
      noteParts.push('Advance Booking Order');
    } else {
      noteParts.push('Current Spot Delivery');
    }
    if (paymentMode === 'other' && otherModeDetails.trim()) {
      noteParts.push(`Paid via: ${otherModeDetails.trim()}`);
    }

    const order: SalesOrder = {
      id: orderId,
      date,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      siteLocation: siteLocation.trim() || undefined,
      quantity,
      rate,
      totalAmount: totalBill,
      paidAmount: clampedPaid,
      balanceDue: finalBalanceDue,
      paymentStatus,
      paymentMode: clampedPaid > 0 ? paymentMode : undefined,
      note: noteParts.join(' • ') || undefined
    };

    let initialPayment: CustomerPayment | undefined;
    if (clampedPaid > 0) {
      initialPayment = {
        id: `pay-${Date.now()}`,
        orderId,
        date,
        customerName: customerName.trim(),
        amount: clampedPaid,
        paymentMode,
        note:
          paymentTiming === 'advance'
            ? `Advance booking payment (${paymentMode.toUpperCase()}${
                otherModeDetails ? ` - ${otherModeDetails}` : ''
              })`
            : `Initial payment at order dispatch (${paymentMode.toUpperCase()}${
                otherModeDetails ? ` - ${otherModeDetails}` : ''
              })`
      };
    }

    try {
      await onAddSalesOrder(order, initialPayment);
      onClose();
    } catch (err) {
      console.error('Error saving sales order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const PAYMENT_OPTIONS = [
    { id: 'cash' as PaymentMode, label: 'Cash', sub: 'Plant Cash', icon: <Banknote size={17} />, color: '#059669', bg: '#ECFDF5' },
    { id: 'upi' as PaymentMode, label: 'Online / UPI', sub: 'GPay, PhonePe, QR', icon: <Smartphone size={17} />, color: '#7C3AED', bg: '#F5F3FF' },
    { id: 'bank_transfer' as PaymentMode, label: 'Net Banking', sub: 'NEFT, RTGS, IMPS', icon: <Building size={17} />, color: '#2563EB', bg: '#EFF6FF' },
    { id: 'cheque' as PaymentMode, label: 'Cheque', sub: 'Bank Clearing', icon: <FileCheck size={17} />, color: '#D97706', bg: '#FFFBEB' },
    { id: 'other' as PaymentMode, label: 'Other', sub: 'Custom mode', icon: <HelpCircle size={17} />, color: '#475569', bg: '#F1F5F9' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto'
      }}
      onClick={onClose}
    >
      <div
        className="hkb-card"
        style={{
          width: '100%',
          maxWidth: '560px',
          padding: '24px',
          background: '#FFFFFF',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.25)',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          maxHeight: '92vh',
          overflowY: 'auto'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
              Record Customer Brick Sale
            </h3>
            <p style={{ fontSize: '12px', color: '#64748B', marginTop: '3px', margin: 0 }}>
              Issue customer invoice, track advance payment or Udhaar balance
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              background: '#F1F5F9',
              cursor: 'pointer',
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Row 1: Date & Customer Name */}
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
              <label className="form-label">Customer / Contractor Name *</label>
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

          {/* Row 2: Customer Phone & Site Location */}
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

          {/* Row 3: Quantity & Rate (String state allows clean backspace delete) */}
          <div className="responsive-form-duo">
            <div className="form-group">
              <label className="form-label">Quantity (Bricks Sold)</label>
              <input
                type="text"
                inputMode="numeric"
                className="form-input tabular-nums"
                value={quantityStr}
                onChange={e => setQuantityStr(e.target.value)}
                placeholder="e.g. 5000"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rate (₹ / Brick)</label>
              <input
                type="text"
                inputMode="decimal"
                className="form-input tabular-nums"
                value={rateStr}
                onChange={e => setRateStr(e.target.value)}
                placeholder="e.g. 4.00"
                required
              />
            </div>
          </div>

          {/* Total Bill Box */}
          <div
            style={{
              padding: '12px 16px',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Bill Amount
              </span>
              <div className="tabular-nums" style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A' }}>
                ₹{totalBill.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  fontSize: '11px',
                  color: initialDue > 0 ? '#DC2626' : '#059669',
                  fontWeight: 700,
                  textTransform: 'uppercase'
                }}
              >
                {initialDue > 0 ? 'Balance Due (Udhaar)' : 'Settled Clean'}
              </span>
              <div
                className="tabular-nums"
                style={{ fontSize: '22px', fontWeight: 800, color: initialDue > 0 ? '#DC2626' : '#059669' }}
              >
                ₹{initialDue.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          {/* Feature 1: Payment Nature Toggle (Advance vs Current Payment) */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ margin: 0 }}>
              Payment Timing / Order Nature
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setPaymentTiming('current')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: paymentTiming === 'current' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  background: paymentTiming === 'current' ? '#EFF6FF' : '#FAFAFA',
                  color: paymentTiming === 'current' ? '#1D4ED8' : '#475569',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Truck size={16} color={paymentTiming === 'current' ? '#2563EB' : '#94A3B8'} />
                <div>
                  <div>Current Delivery</div>
                  <div style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>Spot delivery today</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentTiming('advance')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 12px',
                  borderRadius: '9px',
                  border: paymentTiming === 'advance' ? '2px solid #7C3AED' : '1px solid #E2E8F0',
                  background: paymentTiming === 'advance' ? '#F5F3FF' : '#FAFAFA',
                  color: paymentTiming === 'advance' ? '#6D28D9' : '#475569',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <Bookmark size={16} color={paymentTiming === 'advance' ? '#7C3AED' : '#94A3B8'} />
                <div>
                  <div>Advance Booking</div>
                  <div style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>Advance deposit for future</div>
                </div>
              </button>
            </div>
          </div>

          {/* Feature 2: Full Payment vs Partial vs Pay Later Selector */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label className="form-label" style={{ margin: 0 }}>
              Payment Structure
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {/* Full Payment Button */}
              <button
                type="button"
                onClick={() => handleSelectPlan('full')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '9px 8px',
                  borderRadius: '10px',
                  border: paymentPlan === 'full' ? '2px solid #059669' : '1px solid #E2E8F0',
                  background: paymentPlan === 'full' ? '#ECFDF5' : '#FAFAFA',
                  color: paymentPlan === 'full' ? '#047857' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  gap: '2px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} color={paymentPlan === 'full' ? '#059669' : '#94A3B8'} />
                  <span>Full Payment</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>
                  ₹{totalBill.toLocaleString('en-IN')} (Settled)
                </span>
              </button>

              {/* Partial Payment Button */}
              <button
                type="button"
                onClick={() => handleSelectPlan('partial')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '9px 8px',
                  borderRadius: '10px',
                  border: paymentPlan === 'partial' ? '2px solid #D97706' : '1px solid #E2E8F0',
                  background: paymentPlan === 'partial' ? '#FFFBEB' : '#FAFAFA',
                  color: paymentPlan === 'partial' ? '#B45309' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  gap: '2px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <AlertCircle size={13} color={paymentPlan === 'partial' ? '#D97706' : '#94A3B8'} />
                  <span>Partial Payment</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>
                  Custom advance
                </span>
              </button>

              {/* Pay Later / Credit Button */}
              <button
                type="button"
                onClick={() => handleSelectPlan('later')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '9px 8px',
                  borderRadius: '10px',
                  border: paymentPlan === 'later' ? '2px solid #64748B' : '1px solid #E2E8F0',
                  background: paymentPlan === 'later' ? '#F1F5F9' : '#FAFAFA',
                  color: paymentPlan === 'later' ? '#1E293B' : '#334155',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '12px',
                  gap: '2px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color={paymentPlan === 'later' ? '#475569' : '#94A3B8'} />
                  <span>Pay Later</span>
                </div>
                <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>
                  Full Udhaar
                </span>
              </button>
            </div>
          </div>

          {/* Amount Input with NO Backspace 0 Bug */}
          <div className="form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Advance / Payment Received (₹)
              </label>
              {/* Dynamic Status Mini Badge */}
              {paymentPlan === 'full' && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 7px', borderRadius: '4px' }}>
                  ✓ Settled in Full
                </span>
              )}
              {paymentPlan === 'partial' && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#D97706', background: '#FFFBEB', padding: '2px 7px', borderRadius: '4px' }}>
                  ⚠ Partial Advance • ₹{initialDue.toLocaleString('en-IN')} Due
                </span>
              )}
              {paymentPlan === 'later' && (
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', background: '#F1F5F9', padding: '2px 7px', borderRadius: '4px' }}>
                  🕒 Full Credit / Pay Later
                </span>
              )}
            </div>

            <input
              type="text"
              inputMode="decimal"
              className="form-input tabular-nums"
              value={paidAmountStr}
              onChange={e => handleAmountChange(e.target.value)}
              placeholder="0 (Enter 0 if on full credit / udhaar)"
              style={{ fontSize: '16px', fontWeight: 700 }}
            />
          </div>

          {/* Payment Mode Selector (Visible if any amount paid) */}
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label className="form-label" style={{ margin: 0 }}>
                Payment Method {initialPaid > 0 ? '(Received Via)' : '(If Advance Paid)'}
              </label>
              {initialPaid === 0 && (
                <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>
                  Logged as Credit until advance is entered
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
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
                      padding: '8px 2px',
                      borderRadius: '10px',
                      border: isSelected ? `2px solid ${opt.color}` : '1.5px solid #E2E8F0',
                      background: isSelected ? opt.bg : '#FAFAFA',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      gap: '3px'
                    }}
                  >
                    <div style={{ color: isSelected ? opt.color : '#64748B' }}>{opt.icon}</div>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: isSelected ? opt.color : '#334155',
                        textAlign: 'center'
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* If Other payment mode chosen */}
            {paymentMode === 'other' && (
              <input
                type="text"
                className="form-input"
                placeholder="Specify payment method (e.g. Barter, Third-party transfer, Cash voucher...)"
                value={otherModeDetails}
                onChange={e => setOtherModeDetails(e.target.value)}
                style={{ marginTop: '4px' }}
                autoFocus
              />
            )}
          </div>

          {/* Remarks / Vehicle */}
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

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !customerName.trim() || quantity <= 0}
              style={{ minWidth: '140px' }}
            >
              {isSubmitting ? 'Saving to Cloud...' : 'Save Sale Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
