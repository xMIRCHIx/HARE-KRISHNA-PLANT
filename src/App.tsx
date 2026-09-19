import React, { useState, useEffect } from 'react';
import { Menu, Search, Calendar, Bell, Sparkles } from 'lucide-react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { LoginGate } from './components/LoginGate';
import { DashboardView } from './components/DashboardView';
import { DailyEntryView } from './components/DailyEntryView';
import { LedgerView } from './components/LedgerView';
import { ExpensesView } from './components/ExpensesView';
import { SettingsView } from './components/SettingsView';
import { GuideView } from './components/GuideView';
import {
  ProductionEntry,
  Expense,
  Settings,
  SalesOrder,
  CustomerPayment,
  PaymentStatus
} from './types';
import { Language } from './lib/i18n';
import {
  getStoredSettings,
  saveStoredSettings,
  getStoredEntries,
  saveStoredEntries,
  getStoredExpenses,
  saveStoredExpenses,
  getStoredSalesOrders,
  saveStoredSalesOrders,
  getStoredCustomerPayments,
  saveStoredCustomerPayments,
  getAuthSession,
  setAuthSession
} from './lib/storage';
import {
  testSupabaseConnection,
  syncEntryToCloud,
  deleteEntryFromCloud,
  syncExpenseToCloud,
  deleteExpenseFromCloud,
  syncSalesOrderToCloud,
  deleteSalesOrderFromCloud,
  syncPaymentToCloud,
  syncSettingsToCloud,
  fetchAllFromCloud
} from './lib/supabase';
import { SalesView } from './components/SalesView';
import { InvoicesView } from './components/InvoicesView';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline_cached'>('connected');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Default language is English ('en') as requested, with option to switch to Hindi
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('hkb_app_lang') as Language) || 'en';
  });

  // Core business state
  const [settings, setSettings] = useState<Settings>(getStoredSettings);
  const [entries, setEntries] = useState<ProductionEntry[]>(getStoredEntries);
  const [expenses, setExpenses] = useState<Expense[]>(getStoredExpenses);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(getStoredSalesOrders);
  const [customerPayments, setCustomerPayments] = useState<CustomerPayment[]>(getStoredCustomerPayments);

  // Initialize auth state
  useEffect(() => {
    setIsAuthenticated(getAuthSession());
  }, []);

  // Test Supabase connection and pull authoritative cloud data
  useEffect(() => {
    let isMounted = true;

    async function initializeCloudSync() {
      const ok = await testSupabaseConnection();
      if (!isMounted) return;
      setSyncStatus(ok ? 'connected' : 'offline_cached');

      if (ok) {
        try {
          // 1. Fetch initial cloud data
          const cloudData = await fetchAllFromCloud();
          if (!isMounted) return;

          // 2. Identify and push any local records that never synced to cloud
          const localOrders = getStoredSalesOrders();
          const localPayments = getStoredCustomerPayments();
          const cloudOrderIds = new Set(cloudData?.salesOrders?.map(o => o.id) || []);
          const cloudPaymentIds = new Set(cloudData?.customerPayments?.map(p => p.id) || []);

          const unsyncedOrders = localOrders.filter(o => !cloudOrderIds.has(o.id));
          for (const o of unsyncedOrders) {
            await syncSalesOrderToCloud(o);
          }

          const unsyncedPayments = localPayments.filter(p => !cloudPaymentIds.has(p.id));
          for (const p of unsyncedPayments) {
            await syncPaymentToCloud(p);
          }

          // 3. Load authoritative dataset straight from Supabase
          const freshCloud = (unsyncedOrders.length > 0 || unsyncedPayments.length > 0)
            ? await fetchAllFromCloud()
            : cloudData;

          if (!isMounted || !freshCloud) return;

          if (freshCloud.entries) {
            setEntries(freshCloud.entries);
            saveStoredEntries(freshCloud.entries);
          }
          if (freshCloud.expenses) {
            setExpenses(freshCloud.expenses);
            saveStoredExpenses(freshCloud.expenses);
          }
          if (freshCloud.salesOrders) {
            setSalesOrders(freshCloud.salesOrders);
            saveStoredSalesOrders(freshCloud.salesOrders);
          }
          if (freshCloud.customerPayments) {
            setCustomerPayments(freshCloud.customerPayments);
            saveStoredCustomerPayments(freshCloud.customerPayments);
          }
        } catch (err) {
          console.warn('Supabase initialization sync exception:', err);
        }
      }
    }

    initializeCloudSync();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('hkb_app_lang', lang);
  };

  const handleLoginSuccess = () => {
    setAuthSession(true);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setAuthSession(false);
    setIsAuthenticated(false);
  };

  const handleSaveEntry = async (entry: ProductionEntry) => {
    const existingIndex = entries.findIndex(e => e.date === entry.date);
    let updated: ProductionEntry[];
    if (existingIndex >= 0) {
      updated = [...entries];
      updated[existingIndex] = entry;
    } else {
      updated = [...entries, entry];
    }
    setEntries(updated);
    saveStoredEntries(updated);
    await syncEntryToCloud(entry);
    setActiveTab('ledger');
  };

  const handleDeleteEntry = async (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveStoredEntries(updated);
    await deleteEntryFromCloud(id);
  };

  const handleAddExpense = async (expense: Expense) => {
    const updated = [...expenses, expense];
    setExpenses(updated);
    saveStoredExpenses(updated);
    await syncExpenseToCloud(expense);
  };

  const handleDeleteExpense = async (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveStoredExpenses(updated);
    await deleteExpenseFromCloud(id);
  };

  const handleAddSalesOrder = async (order: SalesOrder, initialPayment?: CustomerPayment) => {
    // 1. Immediately persist order to Supabase
    await syncSalesOrderToCloud(order);

    // 2. If initial payment provided, persist payment to Supabase
    if (initialPayment) {
      await syncPaymentToCloud(initialPayment);
    }

    // 3. Update React state & offline cache
    setSalesOrders(prev => {
      const updated = [order, ...prev.filter(o => o.id !== order.id)];
      saveStoredSalesOrders(updated);
      return updated;
    });

    if (initialPayment) {
      setCustomerPayments(prev => {
        const updated = [initialPayment, ...prev.filter(p => p.id !== initialPayment.id)];
        saveStoredCustomerPayments(updated);
        return updated;
      });
    }
  };

  const handleDeleteSalesOrder = async (id: string) => {
    setSalesOrders(prev => {
      const updated = prev.filter(o => o.id !== id);
      saveStoredSalesOrders(updated);
      return updated;
    });
    await deleteSalesOrderFromCloud(id);
  };

  const handleRecordPayment = async (payment: CustomerPayment) => {
    // 1. Save payment in Supabase
    await syncPaymentToCloud(payment);

    // 2. Update order balance and status in Supabase
    let updatedTargetOrder: SalesOrder | null = null;
    const updatedOrders = salesOrders.map(order => {
      if (order.id === payment.orderId) {
        const newPaid = order.paidAmount + payment.amount;
        const newDue = Math.max(order.totalAmount - newPaid, 0);
        const updated = {
          ...order,
          paidAmount: newPaid,
          balanceDue: newDue,
          paymentStatus: (newDue <= 0 ? 'paid' : 'partial') as PaymentStatus
        };
        updatedTargetOrder = updated;
        return updated;
      }
      return order;
    });

    if (updatedTargetOrder) {
      await syncSalesOrderToCloud(updatedTargetOrder);
    }

    // 3. Update React state and offline cache
    setCustomerPayments(prev => {
      const updated = [payment, ...prev.filter(p => p.id !== payment.id)];
      saveStoredCustomerPayments(updated);
      return updated;
    });
    setSalesOrders(updatedOrders);
    saveStoredSalesOrders(updatedOrders);
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    await syncSettingsToCloud(newSettings);
  };

  const handleDataReload = async () => {
    setSettings(getStoredSettings());
    const cloud = await fetchAllFromCloud();
    if (cloud) {
      if (cloud.entries) setEntries(cloud.entries);
      if (cloud.expenses) setExpenses(cloud.expenses);
      if (cloud.salesOrders) setSalesOrders(cloud.salesOrders);
      if (cloud.customerPayments) setCustomerPayments(cloud.customerPayments);
    } else {
      setEntries(getStoredEntries());
      setExpenses(getStoredExpenses());
      setSalesOrders(getStoredSalesOrders());
      setCustomerPayments(getStoredCustomerPayments());
    }
  };

  if (!isAuthenticated) {
    return (
      <LoginGate
        correctPassword={settings.adminPassword}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  const dueOrdersCount = salesOrders.filter(o => o.balanceDue > 0).length;

  return (
    <div className="crm-layout">
      {/* Enterprise Left Sidebar (Slides in on mobile) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        syncStatus={syncStatus}
        language={language}
        onLanguageChange={handleLanguageChange}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        dueCount={dueOrdersCount}
      />

      {/* Main Workspace Screen */}
      <main className="crm-main-content">
        {/* Sticky Mobile Top Header */}
        <header className="crm-mobile-header">
          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Open Navigation Menu"
          >
            <Menu size={20} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '7px',
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                padding: '2px',
                flexShrink: 0
              }}
            >
              <img src="/logo.png" alt="HK" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A', letterSpacing: '-0.02em' }}>
              HK Bricks
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, background: '#F5F3FF', color: '#7C3AED', padding: '1px 5px', borderRadius: '4px', border: '1px solid #DDD6FE' }}>
              ADMIN
            </span>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            style={{ padding: '5px 12px', fontSize: '11.5px', borderRadius: '7px' }}
            onClick={() => setActiveTab('daily-entry')}
          >
            + Log
          </button>
        </header>

        {/* Desktop Top Navbar Bar (Hexabox Signature) */}
        <header className="crm-desktop-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div className="crm-search-bar">
              <Search size={14} color="#94A3B8" />
              <input
                type="text"
                placeholder="Search orders, buyers, inventory..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <span className="search-shortcut">⌘K</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)' }} />
              <span>Plant Line 1 Active</span>
              <span style={{ color: '#CBD5E1' }}>•</span>
              <span style={{ color: '#7C3AED', fontWeight: 700 }}>Fly Ash Compaction</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="crm-header-date">
              <Calendar size={13} color="#7C3AED" />
              <span>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </div>

            <div className="crm-header-icon-btn" title="Cloud Database Connected">
              <Sparkles size={15} color="#10B981" />
            </div>

            <div className="crm-header-icon-btn" title="Live System Notifications">
              <Bell size={15} />
              <span className="notification-dot" />
            </div>

            <div style={{ height: '24px', width: '1px', background: '#EEF2F6' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12.5px', boxShadow: '0 2px 8px rgba(124, 58, 237, 0.28)' }}>
                MG
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>Maneesh Garg</span>
                <span style={{ fontSize: '10.5px', color: '#7C3AED', fontWeight: 600 }}>Plant Owner</span>
              </div>
            </div>
          </div>
        </header>

        <div className="crm-main-inner">
          {activeTab === 'dashboard' && (
            <DashboardView
              entries={entries}
              expenses={expenses}
              settings={settings}
              salesOrders={salesOrders}
              customerPayments={customerPayments}
              onAddSalesOrder={handleAddSalesOrder}
              onRecordPayment={handleRecordPayment}
              onNavigateToEntry={() => setActiveTab('daily-entry')}
              onNavigateToLedger={() => setActiveTab('ledger')}
              onNavigateToSales={() => setActiveTab('sales')}
              onNavigateToInvoices={() => setActiveTab('invoices')}
            />
          )}

          {activeTab === 'daily-entry' && (
            <DailyEntryView
              entries={entries}
              expenses={expenses}
              settings={settings}
              onSaveEntry={handleSaveEntry}
              onCancel={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'ledger' && (
            <LedgerView
              entries={entries}
              expenses={expenses}
              settings={settings}
              onDeleteEntry={handleDeleteEntry}
              onNavigateToEntry={() => setActiveTab('daily-entry')}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              salesOrders={salesOrders}
              customerPayments={customerPayments}
              settings={settings}
              onAddSalesOrder={handleAddSalesOrder}
              onDeleteSalesOrder={handleDeleteSalesOrder}
              onRecordPayment={handleRecordPayment}
              onNavigateToInvoices={() => setActiveTab('invoices')}
            />
          )}

          {activeTab === 'invoices' && (
            <InvoicesView
              salesOrders={salesOrders}
              customerPayments={customerPayments}
              settings={settings}
              onNavigateToSales={() => setActiveTab('sales')}
              onRecordPayment={handleRecordPayment}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              settings={settings}
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          )}

          {activeTab === 'guide' && (
            <GuideView language={language} />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onDataReload={handleDataReload}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
