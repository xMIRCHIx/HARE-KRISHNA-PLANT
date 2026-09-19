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

    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      date,
      category,
      amount: Number(amount),
      frequency,
      note
    };

    onAddExpense(newExpense);
    setShowAddForm(false);
    setAmount(0);
    setNote('');
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
        {categoryTotals.map(cat => (
          <div key={cat.name} className="hkb-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)' }}>
              {cat.icon}
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>{cat.name}</span>
            </div>
            <span className="tabular-nums" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>
              ₹{cat.total.toLocaleString('en-IN')}
            </span>
          </div>
        ))}
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
              placeholder="e.g. 80 Liters diesel for generator, technician visit fee"
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
                      <span className="badge badge-primary">{exp.category}</span>
                    </td>
                    <td>
                      <span className="badge badge-warn">{exp.frequency}</span>
                    </td>
                    <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td>{exp.note || '—'}</td>
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
