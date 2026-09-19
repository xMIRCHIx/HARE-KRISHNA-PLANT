import React, { useState } from 'react';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface LoginGateProps {
  onLoginSuccess: () => void;
  correctPassword: string;
}

export const LoginGate: React.FC<LoginGateProps> = ({
  onLoginSuccess,
  correctPassword
}) => {
  const [inputPassword, setInputPassword] = useState('');
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

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '20px',
        transition: 'opacity var(--dur-slow) var(--ease-out-soft), transform var(--dur-slow) var(--ease-out-soft)',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateY(-12px)' : 'translateY(0)'
      }}
    >
      <div
        className="hkb-card"
        style={{
          width: '100%',
          maxWidth: '420px',
          padding: '36px 32px',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0 8px 32px rgba(47, 111, 237, 0.08)'
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              background: 'var(--primary-soft)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '4px'
            }}
          >
            <Lock size={22} />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)' }}>
            Hare Krishna Bricks
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--ink-muted)' }}>
            Authorized Plant Operation & Costing Portal
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="password-input">
              Admin Access Password
            </label>
            <input
              id="password-input"
              type="password"
              className="form-input"
              value={inputPassword}
              onChange={e => {
                setInputPassword(e.target.value);
                if (error) setError(false);
              }}
              placeholder="Enter plant password..."
              autoFocus
              style={{
                borderColor: error ? 'var(--bad)' : undefined,
                boxShadow: error ? '0 0 0 3px var(--bad-soft)' : undefined
              }}
            />
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--bad)', fontSize: '12.5px', marginTop: '2px' }}>
                <AlertCircle size={14} />
                <span>Incorrect password. Default is "admin" or your configured password.</span>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '11px' }}>
            <span>Enter Plant Portal</span>
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Security Notice (§6 of spec) */}
        <div
          style={{
            padding: '12px',
            background: 'var(--surface-sunken)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            fontSize: '11.5px',
            color: 'var(--ink-faint)',
            lineHeight: 1.4
          }}
        >
          <ShieldCheck size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Internal operational tool for owner & manager. Client-side access deterrent with local and cloud backup enabled.
          </span>
        </div>
      </div>
    </div>
  );
};
