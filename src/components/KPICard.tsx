import React from 'react';
import { useAnimatedCount } from '../hooks/useAnimatedCount';

export type CardTheme = 'green' | 'blue' | 'amber' | 'rose' | 'purple' | 'default';

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  subtitle?: string;
  badge?: {
    text: string;
    type: 'good' | 'bad' | 'warn' | 'primary';
  };
  icon: React.ReactNode;
  theme?: CardTheme;
  isLoss?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  subtitle,
  badge,
  icon,
  theme = 'blue',
  isLoss
}) => {
  const { formatted } = useAnimatedCount(value, 750, decimals);

  const themeClass = isLoss
    ? 'kpi-card-rose'
    : theme === 'green'
    ? 'kpi-card-green'
    : theme === 'amber'
    ? 'kpi-card-amber'
    : theme === 'rose'
    ? 'kpi-card-rose'
    : theme === 'purple'
    ? 'kpi-card-purple'
    : 'kpi-card-blue';

  const iconBg = isLoss
    ? '#FEE2E2'
    : theme === 'green'
    ? '#D1FAE5'
    : theme === 'amber'
    ? '#FEF3C7'
    : theme === 'rose'
    ? '#FEE2E2'
    : theme === 'purple'
    ? '#EDE9FE'
    : '#DBEAFE';

  const iconColor = isLoss
    ? '#DC2626'
    : theme === 'green'
    ? '#059669'
    : theme === 'amber'
    ? '#D97706'
    : theme === 'rose'
    ? '#DC2626'
    : theme === 'purple'
    ? '#7C3AED'
    : '#2563EB';

  const accentLine = isLoss
    ? '#EF4444'
    : theme === 'green'
    ? '#10B981'
    : theme === 'amber'
    ? '#F59E0B'
    : '#3B82F6';

  return (
    <div
      className={`hkb-card ${themeClass}`}
      style={{
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top row: Icon + Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div
          className="kpi-icon-bubble"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: iconBg,
            color: iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            transition: 'transform 260ms cubic-bezier(0.175, 0.885, 0.32, 1.275)'
          }}
        >
          {icon}
        </div>

        {badge && (
          <span className={`badge badge-${badge.type}`}>
            {badge.text}
          </span>
        )}
      </div>

      {/* Middle: Title & Main Large Bold Numeral */}
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#64748B',
            marginBottom: '4px'
          }}
        >
          {title}
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span
            className="kpi-num tabular-nums"
            style={{
              fontSize: '28px',
              fontWeight: 800,
              lineHeight: 1.1,
              color: isLoss ? 'var(--bad)' : '#0F172A',
              letterSpacing: '-0.02em'
            }}
          >
            {prefix}
            {formatted}
            {suffix}
          </span>
        </div>
      </div>

      {/* Bottom Subtitle & Accent Progress Bar */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {subtitle && (
          <span style={{ fontSize: '11.5px', color: '#64748B', fontWeight: 500 }}>
            {subtitle}
          </span>
        )}
        <div style={{ height: '3px', width: '100%', background: 'rgba(226, 232, 240, 0.6)', borderRadius: '2px', overflow: 'hidden' }}>
          <div className="kpi-accent-bar" style={{ height: '100%', width: '38%', background: accentLine, borderRadius: '2px', transition: 'width 300ms ease, box-shadow 300ms ease' }} />
        </div>
      </div>
    </div>
  );
};
