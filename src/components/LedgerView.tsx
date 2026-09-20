import React, { useState } from 'react';
import {
  Trash2,
  FileSpreadsheet,
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ProductionEntry, Expense, Settings } from '../types';
import { calculateEntry } from '../lib/calculations';

interface LedgerViewProps {
  entries: ProductionEntry[];
  expenses: Expense[];
  settings: Settings;
  onDeleteEntry: (id: string) => void;
  onNavigateToEntry: () => void;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  entries,
  expenses,
  settings,
  onDeleteEntry,
  onNavigateToEntry
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const totalPeriodProduced = entries.reduce((s, e) => s + e.produced, 0);

  // Sort by date descending
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredEntries = sortedEntries.filter(entry => {
    const term = searchTerm.toLowerCase();
    return (
      entry.date.toLowerCase().includes(term) ||
      (entry.note && entry.note.toLowerCase().includes(term)) ||
      (entry.varianceNote && entry.varianceNote.toLowerCase().includes(term))
    );
  });

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Produced (pcs)',
      'Sold (pcs)',
      'Sale Price (₹)',
      'Cement Bags',
      'Cement Rate (₹)',
      'Dust Trucks',
      'Dust Rate (₹)',
      'Raakh Qty',
      'Raakh Rate (₹)',
      'Worker Rate (₹)',
      'Total Material Cost (₹)',
      'Total Labor Cost (₹)',
      'Total Daily Cost (₹)',
      'Cost Per Brick (₹)',
      'Revenue (₹)',
      'Realized Profit (₹)',
      'Loss Day',
      'Notes'
    ];

    const rows = sortedEntries.map(e => {
      const calc = calculateEntry(e, expenses, settings, totalPeriodProduced);
      return [
        e.date,
        e.produced,
        e.sold,
        e.salePrice || settings.defaultSalePrice,
        e.cementBags,
        e.cementRate,
        e.dustTrucks,
        e.dustRate,
        e.raakhQty,
        e.raakhRate,
        e.workerRate || settings.defaultWorkerRate,
        calc.materialCost.toFixed(2),
        calc.workerCost.toFixed(2),
        calc.totalCost.toFixed(2),
        calc.costPerBrick.toFixed(2),
        calc.revenue.toFixed(2),
        calc.profit.toFixed(2),
        calc.isLoss ? 'YES' : 'NO',
        `"${(e.note || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Hare_Krishna_Bricks_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-view-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)' }}>
            Plant Production Ledger
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '2px' }}>
            Historical record of every production run, actual material inputs, daily unit costs, and profit realization.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px', width: '100%', maxWidth: 'fit-content' }}>
          <div style={{ position: 'relative', flex: '1 1 180px' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '11px', color: 'var(--ink-faint)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '32px', width: '100%', minWidth: '180px', fontSize: '13px' }}
              placeholder="Search date or note..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn btn-secondary btn-sm" onClick={exportToCSV} title="Download CSV Spreadsheet">
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>

          <button className="btn btn-primary btn-sm" onClick={onNavigateToEntry}>
            <span>+ New Entry</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="hkb-table-wrapper">
        <table className="hkb-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Produced</th>
              <th>Sold</th>
              <th>Sale Rate</th>
              <th>Materials (₹)</th>
              <th>Labor (₹0.60)</th>
              <th>Total Cost</th>
              <th>Cost / Brick</th>
              <th>Daily Profit</th>
              <th>Yard Delta</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-muted)' }}>
                      <FileSpreadsheet size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                        No Manufacturing Shifts Logged Yet (कोई प्रोडक्शन एंट्री नहीं मिली)
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '4px', maxWidth: '460px', lineHeight: 1.5 }}>
                        Shift manufacturing output, cement/dust consumption, worker labor, and per-brick production costs will appear here date-wise once you record your first shift.
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={onNavigateToEntry}
                      style={{ marginTop: '10px' }}
                    >
                      + Log First Shift Output (नई प्रोडक्शन एंट्री दर्ज करें)
                    </button>
                  </div>
                </td>
              </tr>
            ) : filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={11} style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-faint)' }}>
                  No entries match "{searchTerm}". Try clearing your search.
                </td>
              </tr>
            ) : (
              filteredEntries.map(entry => {
                const calc = calculateEntry(entry, expenses, settings, totalPeriodProduced);
                const isExpanded = expandedRowId === entry.id;

                return (
                  <React.Fragment key={entry.id}>
                    <tr className={calc.isLoss ? 'row-loss' : ''}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            onClick={() => setExpandedRowId(isExpanded ? null : entry.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-faint)', padding: '2px' }}
                            title="Toggle material details"
                          >
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{entry.date}</span>
                        </div>
                      </td>

                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>
                        {entry.produced.toLocaleString('en-IN')}
                      </td>

                      <td>{entry.sold.toLocaleString('en-IN')}</td>

                      <td>₹{(entry.salePrice || settings.defaultSalePrice).toFixed(2)}</td>

                      <td>₹{Math.round(calc.materialCost).toLocaleString('en-IN')}</td>

                      <td>₹{Math.round(calc.workerCost).toLocaleString('en-IN')}</td>

                      <td>₹{Math.round(calc.totalCost).toLocaleString('en-IN')}</td>

                      {/* Cost per brick with loss alert */}
                      <td>
                        <span
                          className={`badge ${calc.isLoss ? 'badge-bad' : 'badge-primary'}`}
                          style={{ fontSize: '12.5px', fontWeight: 700 }}
                        >
                          ₹{calc.costPerBrick.toFixed(2)}
                        </span>
                      </td>

                      {/* Realized profit */}
                      <td>
                        <span
                          className={`badge ${calc.profit >= 0 ? 'badge-good' : 'badge-bad'}`}
                          style={{ fontSize: '12.5px', fontWeight: 600 }}
                        >
                          {calc.profit >= 0 ? '+' : ''}₹{Math.round(calc.profit).toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td>
                        <span style={{ color: calc.stockDelta >= 0 ? 'var(--good)' : 'var(--warn)' }}>
                          {calc.stockDelta >= 0 ? `+${calc.stockDelta}` : calc.stockDelta}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (window.confirm(`Delete entry for ${entry.date}?`)) {
                              onDeleteEntry(entry.id);
                            }
                          }}
                          title="Delete entry"
                          style={{ padding: '4px 8px', color: 'var(--bad)' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Material & Notes Row */}
                    {isExpanded && (
                      <tr style={{ background: 'var(--surface-sunken)' }}>
                        <td colSpan={11} style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '12.5px' }}>
                            <div>
                              <strong>Raw Materials Breakdown:</strong>
                              <ul style={{ listStyle: 'none', paddingLeft: 0, marginTop: '4px', color: 'var(--ink-muted)' }}>
                                <li>• Cement: {entry.cementBags} bags @ ₹{entry.cementRate} = ₹{entry.cementBags * entry.cementRate}</li>
                                <li>• Stone Dust: {entry.dustTrucks} {settings.unitDustLabel || 'Trucks'} @ ₹{entry.dustRate} = ₹{entry.dustTrucks * entry.dustRate}</li>
                                <li>• Fly Ash: {entry.raakhQty} {settings.unitRaakhLabel || 'Trucks'} @ ₹{entry.raakhRate} = ₹{entry.raakhQty * entry.raakhRate}</li>
                              </ul>
                            </div>

                            <div>
                              <strong>Yield & Target:</strong>
                              <div style={{ marginTop: '4px', color: 'var(--ink-muted)' }}>
                                Morning Target: {entry.estimatedTarget ? entry.estimatedTarget.toLocaleString('en-IN') : 'N/A'} pcs
                              </div>
                              <div style={{ color: 'var(--ink-muted)' }}>
                                Realized Yield: {entry.cementBags > 0 ? Math.round(entry.produced / entry.cementBags) : 0} bricks/bag
                              </div>
                              {entry.varianceNote && (
                                <div style={{ marginTop: '2px', color: 'var(--ink)' }}>
                                  <em>Note: {entry.varianceNote}</em>
                                </div>
                              )}
                            </div>

                            <div>
                              <strong>Operational Notes:</strong>
                              <div style={{ marginTop: '4px', color: 'var(--ink-muted)' }}>
                                {entry.note || 'No special remarks recorded.'}
                              </div>
                              {entry.runLines && entry.runLines.length > 0 && (
                                <div style={{ marginTop: '4px' }}>
                                  <strong>Batches:</strong> {entry.runLines.map(r => `${r.name} (${r.produced})`).join(', ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
