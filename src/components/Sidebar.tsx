import React from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  BookOpen,
  ReceiptText,
  Settings as SettingsIcon,
  HelpCircle,
  LogOut,
  Database,
  CheckCircle2,
  Boxes,
  Languages,
  X,
  IndianRupee
} from 'lucide-react';
import { Language, translations } from '../lib/i18n';

export type ActiveTab = 'dashboard' | 'daily-entry' | 'ledger' | 'sales' | 'expenses' | 'guide' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  syncStatus: 'connected' | 'offline_cached';
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  dueCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  syncStatus,
  language,
  onLanguageChange,
  isMobileOpen = false,
  onCloseMobile,
  dueCount = 0
}) => {
  const t = translations[language].sidebar;

  const handleNavClick = (tab: ActiveTab) => {
    onSelectTab(tab);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const mainNav = [
    { id: 'dashboard' as ActiveTab, label: t.dashboard, sub: t.dashboardSub, icon: <LayoutDashboard size={17} /> },
    { id: 'daily-entry' as ActiveTab, label: t.dailyEntry, sub: t.dailyEntrySub, icon: <CalendarPlus size={17} /> },
    { id: 'ledger' as ActiveTab, label: t.ledger, sub: t.ledgerSub, icon: <BookOpen size={17} /> },
    {
      id: 'sales' as ActiveTab,
      label: t.sales,
      sub: t.salesSub,
      icon: <IndianRupee size={17} />,
      badge: dueCount > 0 ? `${dueCount} Due` : undefined
    }
  ];

  const financeNav = [
    { id: 'expenses' as ActiveTab, label: t.expenses, sub: t.expensesSub, icon: <ReceiptText size={17} /> }
  ];

  const systemNav = [
    { id: 'guide' as ActiveTab, label: t.guide, sub: t.guideSub, icon: <HelpCircle size={17} /> },
    { id: 'settings' as ActiveTab, label: t.settings, sub: t.settingsSub, icon: <SettingsIcon size={17} /> }
  ];

  return (
    <>
      {/* Backdrop for mobile drawer */}
      {isMobileOpen && (
        <div
          className="crm-sidebar-backdrop"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`crm-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Sleek Company Header */}
        <div style={{ padding: '22px 18px 16px', borderBottom: '1px solid var(--sidebar-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Refined emblem */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
                  flexShrink: 0
                }}
              >
                <Boxes size={20} color="#60A5FA" />
              </div>

              <div style={{ minWidth: 0 }}>
                <h1
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: '#F8FAFC',
                    letterSpacing: '-0.025em',
                    lineHeight: 1.2
                  }}
                >
                  Hare Krishna Bricks
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      background: 'rgba(59, 130, 246, 0.18)',
                      color: '#60A5FA',
                      padding: '1px 5px',
                      borderRadius: '4px',
                      border: '1px solid rgba(59, 130, 246, 0.32)',
                      letterSpacing: '0.04em'
                    }}
                  >
                    ADMIN
                  </span>
                  <span style={{ fontSize: '10.5px', color: '#64748B', fontWeight: 500 }}>
                    Plant ERP v2.4
                  </span>
                </div>
              </div>
            </div>

            {/* Close button for mobile drawer */}
            {onCloseMobile && (
              <button
                type="button"
                className="mobile-sidebar-close"
                onClick={onCloseMobile}
                title="Close Menu"
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94A3B8',
                  borderRadius: '7px'
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Yard / Shift Status Pill */}
          <div style={{ marginTop: '14px', display: 'flex', gap: '6px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 9px',
                background: 'rgba(16, 185, 129, 0.14)',
                border: '1px solid rgba(16, 185, 129, 0.28)',
                color: '#34D399',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 600
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }} />
              <span>Main Yard (Line 1)</span>
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '4px 9px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94A3B8',
                borderRadius: '6px',
                fontSize: '10.5px',
                fontWeight: 500
              }}
            >
              Press Unit A
            </div>
          </div>

          {/* Compact Language Toggle */}
          <div
            style={{
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '3px',
              borderRadius: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', paddingLeft: '8px', color: '#94A3B8', fontSize: '11px', fontWeight: 600 }}>
              <Languages size={12} />
              <span>Language</span>
            </div>
            <div style={{ display: 'flex', gap: '2px' }}>
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                style={{
                  padding: '3px 9px',
                  fontSize: '11px',
                  fontWeight: language === 'en' ? 700 : 500,
                  color: language === 'en' ? '#FFFFFF' : '#64748B',
                  background: language === 'en' ? '#1E293B' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: language === 'en' ? '0 2px 6px rgba(0, 0, 0, 0.35)' : 'none'
                }}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('hi')}
                style={{
                  padding: '3px 9px',
                  fontSize: '11px',
                  fontWeight: language === 'hi' ? 700 : 500,
                  color: language === 'hi' ? '#FFFFFF' : '#64748B',
                  background: language === 'hi' ? '#1E293B' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: language === 'hi' ? '0 2px 6px rgba(0, 0, 0, 0.35)' : 'none'
                }}
              >
                हिन्दी
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
          {/* Group 1: Operations */}
          <div>
            <div style={{ padding: '0 10px 6px', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Operations
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {mainNav.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent'
                    }}
                  >
                    <div style={{ color: isActive ? '#60A5FA' : '#64748B' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500, flex: 1, color: isActive ? '#FFFFFF' : '#94A3B8' }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '9999px',
                          background: isActive ? '#EF4444' : 'rgba(239, 68, 68, 0.22)',
                          color: isActive ? '#FFFFFF' : '#F87171'
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 2: Financials */}
          <div>
            <div style={{ padding: '0 10px 6px', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Financials
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {financeNav.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent'
                    }}
                  >
                    <div style={{ color: isActive ? '#60A5FA' : '#64748B' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500, color: isActive ? '#FFFFFF' : '#94A3B8' }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Group 3: System & Docs */}
          <div>
            <div style={{ padding: '0 10px 6px', fontSize: '10px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              System
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {systemNav.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    style={{
                      borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent'
                    }}
                  >
                    <div style={{ color: isActive ? '#60A5FA' : '#64748B' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: isActive ? 600 : 500, color: isActive ? '#FFFFFF' : '#94A3B8' }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Profile & DB Sync Card */}
        <div
          style={{
            padding: '14px 16px',
            borderTop: '1px solid var(--sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'rgba(0, 0, 0, 0.22)'
          }}
        >
          {/* Supabase status badge */}
          <div
            title={`Supabase Cloud Database (${syncStatus})`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '8px',
              fontSize: '11px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#CBD5E1', fontWeight: 500 }}>
              <Database size={13} color="#60A5FA" />
              <span>Supabase Cloud</span>
            </div>
            <CheckCircle2 size={13} color="#34D399" />
          </div>

          {/* User profile & exit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '7px',
                  background: 'linear-gradient(135deg, #1E293B, #334155)',
                  color: '#F8FAFC',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11.5px',
                  fontWeight: 700
                }}
              >
                MG
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>Maneesh Garg</div>
                <div style={{ fontSize: '10px', color: '#64748B' }}>Plant Owner</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              title="Log Out"
              style={{
                padding: '5px 8px',
                color: '#94A3B8',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
