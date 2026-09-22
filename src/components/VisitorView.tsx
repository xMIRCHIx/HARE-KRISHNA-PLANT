import React, { useState } from 'react';
import {
  ShieldCheck,
  Phone,
  MessageSquare,
  Calculator,
  Layers,
  Sparkles,
  Truck,
  Award,
  Clock,
  MapPin,
  Hammer,
  Lock
} from 'lucide-react';

interface VisitorViewProps {
  onOpenPortal: () => void;
  isAuthenticated?: boolean;
  plantSellingPrice?: number;
  contactPhone?: string;
  whatsappNumber?: string;
}

export const VisitorView: React.FC<VisitorViewProps> = ({
  onOpenPortal,
  isAuthenticated = false,
  plantSellingPrice = 4.00,
  contactPhone = '+91 93404 11838',
  whatsappNumber = '919340411838'
}) => {
  // Interactive Brick Estimator State
  const [wallLength, setWallLength] = useState<number>(50); // feet
  const [wallHeight, setWallHeight] = useState<number>(10); // feet
  const [wallThickness, setWallThickness] = useState<'single' | 'double'>('single'); // 4.5" vs 9"
  const [customerSite, setCustomerSite] = useState<string>('Ambikapur');

  // Math for brick requirement:
  // Single wall (4.5 inch): ~4.5 bricks per sq ft
  // Double wall (9 inch): ~9 bricks per sq ft
  const wallArea = wallLength * wallHeight;
  const factor = wallThickness === 'single' ? 4.5 : 9;
  const estimatedBricks = Math.round(wallArea * factor);
  const benchmarkRate = plantSellingPrice > 0 ? plantSellingPrice : 4.0;
  const estimatedTotalCost = Math.round(estimatedBricks * benchmarkRate);
  const estimatedMortarSavings = Math.round(estimatedBricks * 0.45); // ~₹0.45 per brick savings on plaster & cement

  const handleWhatsAppInquiry = () => {
    const text = encodeURIComponent(
      `Hello Maneesh ji! I am interested in purchasing Hare Krishna Fly Ash Bricks.\n\n` +
      `• Estimated Quantity: ~${estimatedBricks.toLocaleString('en-IN')} pcs\n` +
      `• Wall Area: ${wallArea} sq ft (${wallThickness === 'single' ? '4.5" Single' : '9" Double'})\n` +
      `• Delivery Location: ${customerSite || 'Ambikapur'}\n` +
      `• Estimated Budget: ₹${estimatedTotalCost.toLocaleString('en-IN')} (@ ₹${benchmarkRate.toFixed(2)}/pc)\n\n` +
      `Please let me know the current dispatch schedule and delivery terms.`
    );
    window.open(`https://wa.me/${whatsappNumber}?text=${text}`, '_blank');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif" }}>
      {/* ═════════════════════════════════════════════════════════════════
          TOP PUBLIC NAVIGATION BAR
         ═════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid #E2E8F0',
          padding: '12px 24px'
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Brand Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#FFFFFF',
                border: '1.5px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                overflow: 'hidden',
                padding: '3px'
              }}
            >
              <img src="/logo.png" alt="Hare Krishna Bricks" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '17px', fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                  HARE KRISHNA BRICKS
                </span>
                <span style={{ fontSize: '10px', fontWeight: 800, background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0', padding: '1px 6px', borderRadius: '4px' }}>
                  IS 12894:2002
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                High-Compaction Fly Ash Concrete Products Plant • Ambikapur
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href={`tel:${contactPhone.replace(/\s+/g, '')}`}
              className="btn btn-secondary btn-sm"
              style={{ padding: '7px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
            >
              <Phone size={13} color="#059669" />
              <span style={{ fontWeight: 600 }}>{contactPhone}</span>
            </a>

            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#FFFFFF',
                background: '#059669',
                border: '1px solid #047857',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
              }}
            >
              <MessageSquare size={13} />
              <span>WhatsApp Order</span>
            </button>

            <button
              type="button"
              onClick={onOpenPortal}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#6D28D9',
                background: '#F5F3FF',
                border: '1.5px solid #DDD6FE',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Access internal plant management software"
            >
              <Lock size={13} />
              <span>{isAuthenticated ? 'Open Plant ERP' : 'Staff Portal'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════
          HERO VALUE PROPOSITION BANNER
         ═════════════════════════════════════════════════════════════════ */}
      <section
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%)',
          padding: '60px 24px 50px',
          borderBottom: '1px solid #E2E8F0'
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#EDE9FE', color: '#6D28D9', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, marginBottom: '16px' }}>
            <Sparkles size={14} />
            <span>Modern Hydraulic Concrete Compaction Technology</span>
          </div>

          <h1
            style={{
              fontSize: '40px',
              fontWeight: 900,
              letterSpacing: '-0.035em',
              color: '#0F172A',
              lineHeight: 1.15,
              maxWidth: '850px',
              margin: '0 auto 16px'
            }}
          >
            High-Strength, Machine-Pressed Fly Ash Bricks for Heavy-Duty Construction
          </h1>

          <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.6, maxWidth: '720px', margin: '0 auto 28px' }}>
            Engineered at our dedicated Surguja plant using calibrated pan-mixer proportions and 100+ ton hydraulic compression.
            Uniform sharp edges, exceptional load-bearing strength, and up to <strong>30% savings on mortar and plaster</strong>.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '40px' }}>
            <button
              type="button"
              onClick={() => {
                document.getElementById('estimator-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 800,
                color: '#FFFFFF',
                background: '#7C3AED',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(124, 58, 237, 0.35)'
              }}
            >
              <Calculator size={16} />
              <span>Calculate Project Requirement</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppInquiry}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#0F172A',
                background: '#FFFFFF',
                border: '1.5px solid #CBD5E1',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.05)'
              }}
            >
              <MessageSquare size={16} color="#059669" />
              <span>Get Instant Factory Direct Quote</span>
            </button>
          </div>

          {/* 4 Pillars Trust Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', textAlign: 'left' }}>
            <div style={{ background: '#FFFFFF', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={18} />
                </div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>10.0+ N/mm² Strength</strong>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.45, margin: 0 }}>
                High compressive rating suitable for multi-story load-bearing and boundary structures.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={18} />
                </div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>&lt; 12% Low Absorption</strong>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.45, margin: 0 }}>
                Prevents dampness, efflorescence (white salt marks), and structural seepage.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={18} />
                </div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>15,000+ Daily Capacity</strong>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.45, margin: 0 }}>
                High-volume hydraulic production capacity guaranteeing zero site downtime.
              </p>
            </div>

            <div style={{ background: '#FFFFFF', padding: '16px 18px', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Award size={18} />
                </div>
                <strong style={{ fontSize: '13.5px', color: '#0F172A' }}>25-30% Mortar Savings</strong>
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', lineHeight: 1.45, margin: 0 }}>
                Sharp edges and uniform dimensions drastically reduce cement plaster consumption.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          COMPARISON: FLY ASH BRICKS VS TRADITIONAL RED CLAY BRICKS
         ═════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: '1100px', margin: '50px auto', padding: '0 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#7C3AED', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ENGINEERING SPECIFICATION BENCHMARK
          </span>
          <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
            Why Builders Choose Machine-Pressed Fly Ash Over Red Bricks
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px' }}>
            Comparative technical analysis showing structural, financial, and durability benefits:
          </p>
        </div>

        <div style={{ background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                  <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 700, color: '#475569' }}>Feature / Specification</th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 800, color: '#059669', background: '#ECFDF5' }}>
                    ✨ HARE KRISHNA FLY ASH BRICK
                  </th>
                  <th style={{ padding: '14px 18px', textAlign: 'left', fontWeight: 600, color: '#64748B' }}>
                    Conventional Red Clay Brick
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0F172A' }}>Standard Dimensions</td>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: '#059669', background: '#F0FDF4' }}>
                    230 × 110 × 75 mm (Zero variance)
                  </td>
                  <td style={{ padding: '12px 18px', color: '#64748B' }}>Irregular, high shrinkage variation</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0F172A' }}>Compressive Strength</td>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: '#059669', background: '#F0FDF4' }}>
                    7.5 to 10.0+ N/mm² (Hydraulic compacted)
                  </td>
                  <td style={{ padding: '12px 18px', color: '#64748B' }}>3.5 to 5.0 N/mm² (KILN burnt)</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0F172A' }}>Water Absorption</td>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: '#059669', background: '#F0FDF4' }}>
                    &lt; 10-12% (Resists dampness & seepage)
                  </td>
                  <td style={{ padding: '12px 18px', color: '#64748B' }}>20-25% (High water absorption)</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0F172A' }}>Plaster & Mortar Needed</td>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: '#059669', background: '#F0FDF4' }}>
                    Thin 10-12mm plaster (Saves ₹0.40/brick)
                  </td>
                  <td style={{ padding: '12px 18px', color: '#64748B' }}>Thick 18-25mm uneven plaster required</td>
                </tr>

                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0F172A' }}>Efflorescence / Salt Stains</td>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: '#059669', background: '#F0FDF4' }}>
                    Nil (Clean grey architectural face)
                  </td>
                  <td style={{ padding: '12px 18px', color: '#64748B' }}>High (Persistent white alkali patches)</td>
                </tr>

                <tr>
                  <td style={{ padding: '12px 18px', fontWeight: 600, color: '#0F172A' }}>Transit Breakage Rate</td>
                  <td style={{ padding: '12px 18px', fontWeight: 700, color: '#059669', background: '#F0FDF4' }}>
                    &lt; 1-2% (Extremely dense corners)
                  </td>
                  <td style={{ padding: '12px 18px', color: '#64748B' }}>8-12% (Significant truck loading loss)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          INTERACTIVE PROJECT BRICK & COST ESTIMATOR
         ═════════════════════════════════════════════════════════════════ */}
      <section id="estimator-section" style={{ background: '#FFFFFF', padding: '50px 24px', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              ONLINE COST & QUANTITY CALCULATOR
            </span>
            <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#0F172A', marginTop: '4px' }}>
              Estimate Your Site Brick Requirement & Budget
            </h2>
            <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
              Input your planned wall dimensions to instantly compute brick quantities, estimated factory cost, and plaster savings:
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'center' }}>
            {/* Input Form Card */}
            <div style={{ background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Hammer size={16} color="#7C3AED" />
                <span>Wall Specifications</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Wall Length (Running Feet)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={wallLength}
                    onChange={e => setWallLength(Math.max(Number(e.target.value) || 0, 1))}
                    style={{ background: '#FFFFFF' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Wall Height (Feet)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={wallHeight}
                    onChange={e => setWallHeight(Math.max(Number(e.target.value) || 0, 1))}
                    style={{ background: '#FFFFFF' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    Wall Construction Type
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setWallThickness('single')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: wallThickness === 'single' ? '2px solid #7C3AED' : '1px solid #CBD5E1',
                        background: wallThickness === 'single' ? '#F5F3FF' : '#FFFFFF',
                        color: wallThickness === 'single' ? '#7C3AED' : '#475569'
                      }}
                    >
                      4.5" Partition Wall (Single)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWallThickness('double')}
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: wallThickness === 'double' ? '2px solid #7C3AED' : '1px solid #CBD5E1',
                        background: wallThickness === 'double' ? '#F5F3FF' : '#FFFFFF',
                        color: wallThickness === 'double' ? '#7C3AED' : '#475569'
                      }}
                    >
                      9" Outer Wall (Double)
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Site / Town Location
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ambikapur, Surajpur, Ramanujganj..."
                    value={customerSite}
                    onChange={e => setCustomerSite(e.target.value)}
                    style={{ background: '#FFFFFF' }}
                  />
                </div>
              </div>
            </div>

            {/* Results & WhatsApp Callout */}
            <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFFFFF', padding: '30px', borderRadius: '20px', boxShadow: '0 12px 36px rgba(15, 23, 42, 0.25)', position: 'relative' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                ESTIMATED REQUIREMENTS SUMMARY
              </span>

              <div style={{ marginTop: '16px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span className="tabular-nums" style={{ fontSize: '42px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1 }}>
                  ~{estimatedBricks.toLocaleString('en-IN')}
                </span>
                <span style={{ fontSize: '16px', color: '#94A3B8', fontWeight: 600 }}>Finished Bricks</span>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #334155', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Total Wall Surface Area:</span>
                  <strong style={{ color: '#F8FAFC' }}>{wallArea} sq. ft.</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Approx. Factory Cost (@ ₹{benchmarkRate.toFixed(2)}/pc):</span>
                  <strong style={{ color: '#34D399', fontSize: '15px' }}>₹{estimatedTotalCost.toLocaleString('en-IN')}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#94A3B8' }}>Estimated Plaster/Mortar Savings:</span>
                  <strong style={{ color: '#FCD34D' }}>~₹{estimatedMortarSavings.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={handleWhatsAppInquiry}
                style={{
                  width: '100%',
                  marginTop: '24px',
                  padding: '14px',
                  background: '#059669',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(5, 150, 105, 0.4)'
                }}
              >
                <MessageSquare size={16} />
                <span>Send Quotation Request on WhatsApp</span>
              </button>

              <span style={{ display: 'block', textAlign: 'center', fontSize: '11px', color: '#94A3B8', marginTop: '8px' }}>
                Direct message to Plant Head: Maneesh Garg (+91 93404 11838)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═════════════════════════════════════════════════════════════════
          FACTORY LOCATION & CONTACT FOOTER
         ═════════════════════════════════════════════════════════════════ */}
      <footer style={{ background: '#0F172A', color: '#F8FAFC', padding: '48px 24px 30px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#FFFFFF', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/logo.png" alt="Hare Krishna Bricks" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>Hare Krishna Bricks</span>
            </div>
            <p style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.6 }}>
              Leading industrial manufacturer of high-pressure concrete fly ash bricks, structural blocks, and paving products serving Surguja, Chhattisgarh.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Plant & Yard Address
            </h4>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#94A3B8', fontSize: '12.5px', lineHeight: 1.5 }}>
              <MapPin size={16} color="#7C3AED" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                Main Plant & Stock Yard, Industrial Cluster, Ambikapur Road, Surguja District, Chhattisgarh — 497001
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '12.5px', marginTop: '10px' }}>
              <Clock size={14} color="#10B981" />
              <span>Yard Hours: Mon – Sat (6:00 AM – 7:00 PM)</span>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
              Commercial & Dispatches
            </h4>
            <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '0 0 8px' }}>
              Plant Head: <strong>Maneesh Garg</strong>
            </p>
            <p style={{ fontSize: '12.5px', color: '#94A3B8', margin: '0 0 14px' }}>
              Phone / WhatsApp: <strong style={{ color: '#34D399' }}>{contactPhone}</strong>
            </p>
            <button
              type="button"
              onClick={onOpenPortal}
              style={{
                background: '#1E293B',
                color: '#CBD5E1',
                border: '1px solid #334155',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Lock size={12} />
              <span>{isAuthenticated ? 'Return to Management ERP' : 'Authorized Staff Login'}</span>
            </button>
          </div>
        </div>

        <div style={{ maxWidth: '1100px', margin: '36px auto 0', paddingTop: '20px', borderTop: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', fontSize: '11.5px', color: '#64748B' }}>
          <span>© 2026 Hare Krishna Bricks. All rights reserved. IS 12894:2002 Standard.</span>
          <span>Prepared by Aryan Gupta • synchAD (synchad.online)</span>
        </div>
      </footer>
    </div>
  );
};
