import React, { useState, useEffect } from 'react';
import { Menu, Boxes } from 'lucide-react';
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
  CustomerPayment
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

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline_cached'>('connected');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

  // Test Supabase connection and pull initial cloud data if available
  useEffect(() => {
    testSupabaseConnection().then(async ok => {
      setSyncStatus(ok ? 'connected' : 'offline_cached');
      if (ok) {
        const cloudData = await fetchAllFromCloud();
        if (cloudData) {
          if (cloudData.entries && cloudData.entries.length > 0) {
            setEntries(cloudData.entries);
            saveStoredEntries(cloudData.entries);
          }
          if (cloudData.expenses && cloudData.expenses.length > 0) {
            setExpenses(cloudData.expenses);
            saveStoredExpenses(cloudData.expenses);
          }
          if (cloudData.salesOrders && cloudData.salesOrders.length > 0) {
            setSalesOrders(cloudData.salesOrders);
            saveStoredSalesOrders(cloudData.salesOrders);
          }
          if (cloudData.customerPayments && cloudData.customerPayments.length > 0) {
            setCustomerPayments(cloudData.customerPayments);
            saveStoredCustomerPayments(cloudData.customerPayments);
          }
        }
      }
    });
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

  const handleSaveEntry = (entry: ProductionEntry) => {
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
    syncEntryToCloud(entry);
    setActiveTab('ledger');
  };

  const handleDeleteEntry = (id: string) => {
    const updated = entries.filter(e => e.id !== id);
    setEntries(updated);
    saveStoredEntries(updated);
    deleteEntryFromCloud(id);
  };

  const handleAddExpense = (expense: Expense) => {
    const updated = [...expenses, expense];
    setExpenses(updated);
    saveStoredExpenses(updated);
    syncExpenseToCloud(expense);
  };

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveStoredExpenses(updated);
    deleteExpenseFromCloud(id);
  };

  const handleAddSalesOrder = (order: SalesOrder) => {
    const updated = [order, ...salesOrders];
    setSalesOrders(updated);
    saveStoredSalesOrders(updated);
    syncSalesOrderToCloud(order);
  };

  const handleDeleteSalesOrder = (id: string) => {
    const updated = salesOrders.filter(o => o.id !== id);
    setSalesOrders(updated);
    saveStoredSalesOrders(updated);
    deleteSalesOrderFromCloud(id);
  };

  const handleRecordPayment = (payment: CustomerPayment) => {
    const updatedPayments = [payment, ...customerPayments];
    setCustomerPayments(updatedPayments);
    saveStoredCustomerPayments(updatedPayments);
    syncPaymentToCloud(payment);

    let updatedTargetOrder: SalesOrder | null = null;
    const updatedOrders = salesOrders.map(order => {
      if (order.id === payment.orderId) {
        const newPaid = order.paidAmount + payment.amount;
        const newDue = Math.max(order.totalAmount - newPaid, 0);
        const updated = {
          ...order,
          paidAmount: newPaid,
          balanceDue: newDue,
          paymentStatus: newDue <= 0 ? ('paid' as const) : ('partial' as const)
        };
        updatedTargetOrder = updated;
        return updated;
      }
      return order;
    });

    setSalesOrders(updatedOrders);
    saveStoredSalesOrders(updatedOrders);
    if (updatedTargetOrder) {
      syncSalesOrderToCloud(updatedTargetOrder);
    }
  };

  const handleSaveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    syncSettingsToCloud(newSettings);
  };

  const handleDataReload = () => {
    setSettings(getStoredSettings());
    setEntries(getStoredEntries());
    setExpenses(getStoredExpenses());
    setSalesOrders(getStoredSalesOrders());
    setCustomerPayments(getStoredCustomerPayments());
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
                width: '28px',
                height: '28px',
                borderRadius: '7px',
                background: '#0F172A',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Boxes size={16} color="#60A5FA" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '14.5px', color: '#0F172A', letterSpacing: '-0.02em' }}>
              HK Bricks
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, background: '#EFF6FF', color: '#2563EB', padding: '1px 5px', borderRadius: '4px', border: '1px solid #DBEAFE' }}>
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

        <div className="crm-main-inner">
          {activeTab === 'dashboard' && (
            <DashboardView
              entries={entries}
              expenses={expenses}
              settings={settings}
              salesOrders={salesOrders}
              onAddSalesOrder={handleAddSalesOrder}
              onRecordPayment={handleRecordPayment}
              onNavigateToEntry={() => setActiveTab('daily-entry')}
              onNavigateToLedger={() => setActiveTab('ledger')}
              onNavigateToSales={() => setActiveTab('sales')}
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
