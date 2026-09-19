import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Zap,
  Fuel,
  Wrench,
  Home,
  Truck,
  Users,
  CircleDollarSign
} from 'lucide-react';
import { Expense, ExpenseCategory, ExpenseFrequency, Settings } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  settings: Settings;
  onAddExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

const CATEGORIES: { name: ExpenseCategory; icon: React.ReactNode }[] = [
  { name: 'Electricity', icon: <Zap size={16} /> },
  { name: 'Diesel/Fuel', icon: <Fuel size={16} /> },
  { name: 'Machine maintenance', icon: <Wrench size={16} /> },
  { name: 'Rent', icon: <Home size={16} /> },
  { name: 'Transport', icon: <Truck size={16} /> },
  { name: 'Fixed staff salary', icon: <Users size={16} /> },
  { name: 'Other', icon: <CircleDollarSign size={16} /> }
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  settings,
  onAddExpense,
  onDeleteExpense
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Electricity');
  const [otherDetail, setOtherDetail] = useState<string>('');
  const [amount, setAmount] = useState<number>(5000);
  const [frequency, setFrequency] = useState<ExpenseFrequency>('monthly');
  const [note, setNote] = useState<string>('');

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  // Group by category
  const categoryTotals = CATEGORIES.map(cat => {
    const total = expenses
      .filter(e => e.category === cat.name)
      .reduce((sum, e) => sum + (e.amount || 0), 0);
    return { ...cat, total };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    if (category === 'Other' && !otherDetail.trim()) {
      alert('Please specify what the "Other" expense is for (Other me kya kharcha hua h).');
      return;
    }

    const fullNote = category === 'Other' && otherDetail.trim()
      ? (note.trim() ? `${otherDetail.trim()} — ${note.trim()}` : otherDetail.trim())
      : (note.trim() || undefined);

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date,
      category,
      amount: Number(amount),
      frequency,
      otherDetail: category === 'Other' ? otherDetail.trim() : undefined,
      note: fullNote
    };

    onAddExpense(newExpense);
    setShowAddForm(false);
    setAmount(0);
    setNote('');
    setOtherDetail('');
  };

  return (
    <div className="page-view-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)' }}>
            Plant Overhead Expenses
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '2px' }}>
            Fixed and operational overheads (electricity, genset diesel, plant repairs, supervisor salaries).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>TOTAL RECORDED OVERHEAD</span>
            <div className="tabular-nums" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)' }}>
              ₹{totalExpenses.toLocaleString('en-IN')}
            </div>
          </div>

          <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={15} />
            <span>{showAddForm ? 'Close Form' : 'Log New Expense'}</span>
          </button>
        </div>
      </div>

      {/* Settings mode info alert */}
      <div
        style={{
          padding: '12px 16px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '8px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}
      >
        <span>
          <strong>Accounting Mode: </strong>
          {settings.overheadSplitMode === 'split' ? (
            <span style={{ color: 'var(--good)' }}>
              "Split Mode" — These overheads are evenly amortized into each brick's unit cost.
            </span>
          ) : (
            <span style={{ color: 'var(--primary)' }}>
              "Separate Mode" — Overheads are kept as an independent monthly running total without inflating per-brick piece cost.
            </span>
          )}
        </span>
        <span className="badge badge-primary">Mode: {settings.overheadSplitMode.toUpperCase()}</span>
      </div>

      {/* Category breakdown cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px'
        }}
      >
        {categoryTotals.map(cat => {
          const isSelected = showAddForm && category === cat.name;
          return (
            <div
              key={cat.name}
              className="hkb-card"
              onClick={() => {
                setCategory(cat.name);
                setShowAddForm(true);
              }}
              style={{
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                border: isSelected ? '2px solid #7C3AED' : '1px solid var(--line)',
                background: isSelected ? '#F5F3FF' : '#FFFFFF'
              }}
              title={`Click to log ${cat.name} expense`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isSelected ? '#7C3AED' : 'var(--primary)' }}>
                {cat.icon}
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>{cat.name}</span>
              </div>
              <span className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
                ₹{cat.total.toLocaleString('en-IN')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Add Expense Drawer / Form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="hkb-card" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--surface-alt)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Log Overhead Expense Entry</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label">Expense Date</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={e => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
              >
                {CATEGORIES.map(c => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* When 'Other' category is chosen, show a clear dedicated input box asking what is in Other */}
            {category === 'Other' && (
              <div
                className="form-group"
                style={{
                  gridColumn: '1 / -1',
                  background: '#F5F3FF',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1.5px solid #DDD6FE'
                }}
              >
                <label className="form-label" style={{ color: '#7C3AED', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <CircleDollarSign size={16} />
                  <span>Specify Other Expense (Other me kya kharcha hua h?) *</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  style={{ background: '#FFFFFF', borderColor: '#C4B5FD', fontSize: '13.5px', fontWeight: 600 }}
                  placeholder="e.g. Chai-Nashta, Office Stationery, Municipal Tax, Hardware store tools, Challan, Office repair..."
                  value={otherDetail}
                  onChange={e => setOtherDetail(e.target.value)}
                  required
                  autoFocus
                />
                <span style={{ fontSize: '11.5px', color: '#6D28D9', marginTop: '4px', display: 'block' }}>
                  Yahan likhein ki ye other kharcha kis cheez ke liye kiya gaya hai.
                </span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input
                type="number"
                min="1"
                className="form-input tabular-nums"
                value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                placeholder="₹ Amount"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Billing Frequency</label>
              <div className="segmented-control" style={{ width: '100%' }}>
                <button
                  type="button"
                  className={`segmented-btn ${frequency === 'daily' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => setFrequency('daily')}
                >
                  Daily
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${frequency === 'monthly' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => setFrequency('monthly')}
                >
                  Monthly Bill
                </button>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Remarks / Invoice Description</label>
            <input
              type="text"
              className="form-input"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Bill #123, vendor details, technician visit fee..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm">
              Save Expense
            </button>
          </div>
        </form>
      )}

      {/* Expenses Table */}
      <div className="hkb-table-wrapper">
        <table className="hkb-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Frequency</th>
              <th>Amount</th>
              <th>Description / Remarks</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-faint)' }}>
                  No overhead expenses logged yet.
                </td>
              </tr>
            ) : (
              expenses
                .slice()
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(exp => (
                  <tr key={exp.id}>
                    <td style={{ fontWeight: 600 }}>{exp.date}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                        <span className="badge badge-primary">{exp.category}</span>
                        {exp.category === 'Other' && (exp.otherDetail || (exp.note && exp.note.includes(' — '))) && (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '1px 6px', borderRadius: '4px' }}>
                            {exp.otherDetail || exp.note?.split(' — ')[0]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-warn">{exp.frequency}</span>
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td>
                      {exp.category === 'Other' && exp.otherDetail && exp.note && exp.note.includes(' — ')
                        ? exp.note.split(' — ').slice(1).join(' — ') || '—'
                        : (exp.note || '—')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (window.confirm('Delete this expense entry?')) {
                            onDeleteExpense(exp.id);
                          }
                        }}
                        style={{ padding: '4px 8px', color: 'var(--bad)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
