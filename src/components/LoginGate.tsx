import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Activity,
  ReceiptText
} from 'lucide-react';

interface LoginGateProps {
  onLoginSuccess: () => void;
  correctPassword: string;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  onLoginSuccess,
  correctPassword
}) => {
  const [inputPassword, setInputPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === correctPassword || inputPassword === 'admin') {
      setError(false);
      setIsExiting(true);
      setTimeout(() => {
        onLoginSuccess();
      }, 300);
    } else {
      setError(true);
    }
  };

  const handleUseDemo = () => {
    setInputPassword('admin');
    setError(false);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #F3F4F8 0%, #EEF2F6 100%)',
        padding: '24px 16px',
        transition: 'opacity 300ms ease, transform 300ms ease',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'scale(0.98)' : 'scale(1)'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          background: '#FFFFFF',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px -12px rgba(99, 102, 241, 0.16), 0 8px 24px -4px rgba(15, 23, 42, 0.04)',
          border: '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))'
        }}
      >
        {/* Left Side: Branded Visual Showcase */}
        <div
          style={{
            background: 'linear-gradient(145deg, #312E81 0%, #4338CA 35%, #6366F1 75%, #7C3AED 100%)',
            color: '#FFFFFF',
            padding: '44px 36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Ambient Glow Circles */}
          <div
            style={{
              position: 'absolute',
              top: '-40px',
              right: '-40px',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%)',
              pointerEvents: 'none'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-60px',
              left: '-40px',
              width: '220px',
              height: '220px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(167, 139, 250, 0.25) 0%, rgba(167, 139, 250, 0) 70%)',
              pointerEvents: 'none'
            }}
          />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                  flexShrink: 0,
                  overflow: 'hidden',
                  padding: '4px'
                }}
              >
                <img
                  src="/logo.png"
                  alt="Hare Krishna Bricks Logo"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
                  Hare Krishna Bricks
                </h3>
                <span style={{ fontSize: '11px', color: '#DDD6FE', fontWeight: 500 }}>
                  Plant Management ERP v2.4
                </span>
              </div>
            </div>

            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.25, letterSpacing: '-0.025em', marginBottom: '12px' }}>
              Intelligent Costing & Daily Plant Operations
            </h2>
            <p style={{ fontSize: '13.5px', color: '#E0E7FF', lineHeight: 1.5, marginBottom: '28px' }}>
              Precision manufacturing control: track raw materials yield, calculate real-time single-brick cost, and manage customer khata accounts.
            </p>

            {/* Feature Pills */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '12.5px'
                }}
              >
                <Activity size={16} color="#A78BFA" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Dynamic Cost Engine: </strong>Live ₹/brick cost based on daily cement & dust rates
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '12.5px'
                }}
              >
                <TrendingUp size={16} color="#34D399" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Yield Reconciliation: </strong>Compare morning target vs evening actual stroke tally
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '12.5px'
                }}
              >
                <ReceiptText size={16} color="#FBBF24" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Customer Receivables: </strong>Record brick dispatches and collect payments
                </span>
              </div>
            </div>
          </div>

          {/* Plant Stats Teaser Bar */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              marginTop: '32px',
              paddingTop: '18px',
              borderTop: '1px solid rgba(255, 255, 255, 0.16)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11.5px',
              color: '#C7D2FE'
            }}
          >
            <span>Target Cost: <strong>₹3.50/brick</strong></span>
            <span>•</span>
            <span>Market Rate: <strong>₹4.00/brick</strong></span>
            <span>•</span>
            <span>Labor: <strong>₹0.60/brick</strong></span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div
          style={{
            padding: '44px 38px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#FFFFFF'
          }}
        >
          <div style={{ marginBottom: '24px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                background: '#F5F3FF',
                color: '#7C3AED',
                padding: '3px 9px',
                borderRadius: '9999px',
                border: '1px solid #DDD6FE',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
            >
              Manager Portal
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em', marginTop: '10px' }}>
              Sign In to Plant System
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Enter authorized administrator password to access live dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="password-input">
                Plant Admin Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={inputPassword}
                  onChange={e => {
                    setInputPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Enter access password..."
                  autoFocus
                  style={{
                    paddingRight: '40px',
                    borderColor: error ? '#EF4444' : undefined,
                    boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : undefined
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
                  <AlertCircle size={14} />
                  <span>Incorrect password. Default access code is "admin".</span>
                </div>
              )}
            </div>

            {/* Quick Helper Button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleUseDemo}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7C3AED',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                <Sparkles size={12} />
                <span>Quick Fill: Use Default ("admin")</span>
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                borderRadius: '10px'
              }}
            >
              <span>Unlock Plant Dashboard</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Security Notice */}
          <div
            style={{
              marginTop: '28px',
              padding: '12px 14px',
              background: '#F8FAFC',
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '11.5px',
              color: '#64748B'
            }}
          >
            <ShieldCheck size={16} color="#7C3AED" style={{ flexShrink: 0 }} />
            <span>
              Connected to <strong>Supabase Cloud Database</strong> with encrypted local session storage.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
