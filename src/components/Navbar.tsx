import React from 'react';
import {
  LayoutDashboard,
  CalendarPlus,
  BookOpen,
  ReceiptText,
  Settings as SettingsIcon,
  LogOut,
  Moon,
  Sun,
  Database,
  CheckCircle2
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'daily-entry' | 'ledger' | 'expenses' | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  syncStatus: 'connected' | 'offline_cached' | 'syncing';
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  isDarkMode,
  onToggleDarkMode,
  syncStatus
}) => {
  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={17} /> },
    { id: 'daily-entry', label: 'Daily Entry', icon: <CalendarPlus size={17} /> },
    { id: 'ledger', label: 'Production Ledger', icon: <BookOpen size={17} /> },
    { id: 'expenses', label: 'Overhead Expenses', icon: <ReceiptText size={17} /> },
    { id: 'settings', label: 'Plant Settings', icon: <SettingsIcon size={17} /> }
  ];

  return (
    <header
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 1px 3px rgba(22, 35, 59, 0.04)'
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #2F6FED 0%, #1E5AD6 100%)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(47, 111, 237, 0.25)'
            }}
          >
            <span style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.5px' }}>HK</span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '17px', fontWeight: 700, lineHeight: 1.2 }}>Hare Krishna Bricks</h1>
              <span className="badge badge-primary" style={{ fontSize: '11px', padding: '2px 6px' }}>
                Admin
              </span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '2px' }}>
              Plant Production & Costing System • Owner: Maneesh Garg
            </p>
          </div>
        </div>

        {/* Tab Navigation Pill */}
        <nav className="nav-tab-container">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => onSelectTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Actions & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Cloud sync indicator */}
          <div
            title="Connected to Supabase Project (uwfcngioytanhdtdsqyv)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              background: 'var(--surface-sunken)',
              border: '1px solid var(--line)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--ink-muted)'
            }}
          >
            <Database size={13} color="var(--primary)" />
            <span style={{ fontWeight: 500 }}>
              {syncStatus === 'connected' ? 'Supabase Sync' : 'Local + Cloud Ready'}
            </span>
            <CheckCircle2 size={12} color="var(--good)" />
          </div>

          {/* Dark mode toggle */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            style={{ width: '34px', height: '34px', padding: 0 }}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Logout */}
          <button
            className="btn btn-secondary btn-sm"
            onClick={onLogout}
            title="Log Out"
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <LogOut size={15} />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </header>
  );
};
