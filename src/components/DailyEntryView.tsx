import React, { useState } from 'react';
import {
  Save,
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import {
  ProductionEntry,
  Expense,
  Settings,
  CostMode,
  ProductionRunLine
} from '../types';
import { calculateEntry, estimateMorningTarget } from '../lib/calculations';

interface DailyEntryViewProps {
  entries: ProductionEntry[];
  expenses: Expense[];
  settings: Settings;
  onSaveEntry: (entry: ProductionEntry) => void;
  onCancel: () => void;
}

export const DailyEntryView: React.FC<DailyEntryViewProps> = ({
  entries,
  expenses,
  settings,
  onSaveEntry,
  onCancel
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [date, setDate] = useState(today);
  const [costMode, setCostMode] = useState<CostMode>('ratio');

  // Multi-run lines or single count
  const [isMultiRun, setIsMultiRun] = useState(false);
  const [singleProduced, setSingleProduced] = useState<number>(8500);
  const [runLines, setRunLines] = useState<ProductionRunLine[]>([
    { id: '1', name: 'Shift 1 (Morning)', produced: 4500 },
    { id: '2', name: 'Shift 2 (Afternoon)', produced: 4000 }
  ]);

  // Sales
  const [sold, setSold] = useState<number>(5000);
  const [salePrice, setSalePrice] = useState<number>(settings.defaultSalePrice || 4.0);

  // Materials (actual used today)
  const [cementBags, setCementBags] = useState<number>(70);
  const [cementRate, setCementRate] = useState<number>(380);

  const [dustTrucks, setDustTrucks] = useState<number>(0.85);
  const [dustRate, setDustRate] = useState<number>(8500);

  const [raakhQty, setRaakhQty] = useState<number>(3.4);
  const [raakhRate, setRaakhRate] = useState<number>(450);

  const [manualMaterialCost, setManualMaterialCost] = useState<number>(35000);

  // Labor & other
  const [workerRate, setWorkerRate] = useState<number>(settings.defaultWorkerRate || 0.60);
  const [otherCost, setOtherCost] = useState<number>(400);
  const [note, setNote] = useState<string>('');
  const [varianceNote, setVarianceNote] = useState<string>('');

  const totalProduced = isMultiRun
    ? runLines.reduce((sum, r) => sum + (Number(r.produced) || 0), 0)
    : Number(singleProduced) || 0;

  const morningEst = estimateMorningTarget(
    cementBags,
    dustTrucks,
    raakhQty,
    settings,
    entries
  );

  const previewEntry: ProductionEntry = {
    id: 'preview',
    date,
    produced: totalProduced,
    sold: Number(sold) || 0,
    salePrice: Number(salePrice) || 4.0,
    costMode,
    cementBags: Number(cementBags) || 0,
    cementRate: Number(cementRate) || 0,
    dustTrucks: Number(dustTrucks) || 0,
    dustRate: Number(dustRate) || 0,
    raakhQty: Number(raakhQty) || 0,
    raakhRate: Number(raakhRate) || 0,
    manualMaterialCost: Number(manualMaterialCost) || 0,
    workerRate: Number(workerRate) || 0.60,
    otherCost: Number(otherCost) || 0,
    estimatedTarget: morningEst.recommendedTarget,
    varianceNote,
    note,
    runLines: isMultiRun ? runLines : undefined
  };

  const totalPeriodProduced = entries.reduce((s, e) => s + e.produced, 0) + totalProduced;
  const liveCalc = calculateEntry(previewEntry, expenses, settings, totalPeriodProduced);

  const handleAddRunLine = () => {
    const nextNum = runLines.length + 1;
    setRunLines([
      ...runLines,
      { id: Date.now().toString(), name: `Batch #${nextNum}`, produced: 2000 }
    ]);
  };

  const handleRemoveRunLine = (id: string) => {
    setRunLines(runLines.filter(r => r.id !== id));
  };

  const handleUpdateRunLine = (id: string, field: 'name' | 'produced', val: any) => {
    setRunLines(
      runLines.map(r => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalProduced <= 0) {
      alert('Please enter a valid production count greater than 0.');
      return;
    }

    const finalEntry: ProductionEntry = {
      ...previewEntry,
      id: `entry-${Date.now()}`
    };

    onSaveEntry(finalEntry);
  };

  return (
    <div className="page-view-enter" style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.025em' }}>
            Daily Production & Costing Entry
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', fontWeight: 500 }}>
            Input actual materials consumed, machines stroke counts, and daily sales.
          </p>
        </div>

        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
          <ArrowLeft size={14} />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="entry-form-grid">
        {/* Left Column: Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Card 1: Date & Count */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px' }}>
                  STEP 1
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                  Production Date & Quantity Count
                </h3>
              </div>

              <div className="segmented-control">
                <button
                  type="button"
                  className={`segmented-btn ${!isMultiRun ? 'active' : ''}`}
                  onClick={() => setIsMultiRun(false)}
                >
                  Single Shift
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${isMultiRun ? 'active' : ''}`}
                  onClick={() => setIsMultiRun(true)}
                >
                  Multi-Batch
                </button>
              </div>
            </div>

            <div className="responsive-form-duo">
              <div className="form-group">
                <label className="form-label" htmlFor="entry-date">Date of Production</label>
                <input
                  id="entry-date"
                  type="date"
                  className="form-input"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                />
              </div>

              {!isMultiRun ? (
                <div className="form-group">
                  <label className="form-label" htmlFor="single-produced">
                    Actual Bricks Pressed Today
                  </label>
                  <input
                    id="single-produced"
                    type="number"
                    min="1"
                    className="form-input tabular-nums"
                    value={singleProduced}
                    onChange={e => setSingleProduced(Number(e.target.value))}
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Total Produced (All Batches)</label>
                  <div
                    className="form-input tabular-nums"
                    style={{ background: '#F8FAFC', fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center' }}
                  >
                    {totalProduced.toLocaleString('en-IN')} pcs
                  </div>
                </div>
              )}
            </div>

            {/* Multi-run line items */}
            {isMultiRun && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 600 }}>
                  <span style={{ color: '#475569' }}>Shift Lines</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddRunLine} style={{ padding: '3px 8px', fontSize: '11px' }}>
                    <Plus size={12} />
                    <span>Add Shift Line</span>
                  </button>
                </div>

                {runLines.map((line, idx) => (
                  <div key={line.id} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={line.name}
                      placeholder={`Shift ${idx + 1}`}
                      onChange={e => handleUpdateRunLine(line.id, 'name', e.target.value)}
                    />
                    <input
                      type="number"
                      className="form-input tabular-nums"
                      value={line.produced}
                      placeholder="Count"
                      onChange={e => handleUpdateRunLine(line.id, 'produced', Number(e.target.value))}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRemoveRunLine(line.id)}
                      disabled={runLines.length <= 1}
                      style={{ color: '#EF4444', padding: '6px 8px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 2: Actual Raw Materials (Clean 3-column layout) */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px' }}>
                  STEP 2
                </span>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                    Actual Raw Materials Used Today
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Enter today's real consumption & purchase rates
                  </span>
                </div>
              </div>

              <div className="segmented-control">
                <button
                  type="button"
                  className={`segmented-btn ${costMode === 'ratio' ? 'active' : ''}`}
                  onClick={() => setCostMode('ratio')}
                >
                  Recipe / Actual
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${costMode === 'manual' ? 'active' : ''}`}
                  onClick={() => setCostMode('manual')}
                >
                  Manual Total ₹
                </button>
              </div>
            </div>

            {costMode === 'ratio' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Cement Row */}
                <div className="material-row-grid">
                  <div className="form-group">
                    <label className="form-label">Cement (Bags)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-input tabular-nums"
                      value={cementBags}
                      onChange={e => setCementBags(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rate (₹ / Bag)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input tabular-nums"
                      value={cementRate}
                      onChange={e => setCementRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="material-total-block">
                    <div className="material-total-label">CEMENT TOTAL</div>
                    <div className="tabular-nums material-total-val">
                      ₹{(cementBags * cementRate).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Stone Dust Row */}
                <div className="material-row-grid">
                  <div className="form-group">
                    <label className="form-label">Stone Dust ({settings.unitDustLabel})</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      className="form-input tabular-nums"
                      value={dustTrucks}
                      onChange={e => setDustTrucks(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rate (₹ / Truck)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input tabular-nums"
                      value={dustRate}
                      onChange={e => setDustRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="material-total-block">
                    <div className="material-total-label">DUST TOTAL</div>
                    <div className="tabular-nums material-total-val">
                      ₹{(dustTrucks * dustRate).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Fly Ash / Raakh Row */}
                <div className="material-row-grid">
                  <div className="form-group">
                    <label className="form-label">Fly Ash / Raakh ({settings.unitRaakhLabel})</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      className="form-input tabular-nums"
                      value={raakhQty}
                      onChange={e => setRaakhQty(Number(e.target.value))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rate (₹ / {settings.unitRaakhLabel})</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input tabular-nums"
                      value={raakhRate}
                      onChange={e => setRaakhRate(Number(e.target.value))}
                    />
                  </div>
                  <div className="material-total-block">
                    <div className="material-total-label">RAAKH TOTAL</div>
                    <div className="tabular-nums material-total-val">
                      ₹{(raakhQty * raakhRate).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="manual-material-cost">
                  Total Material Cost for Today (₹ Direct Entry)
                </label>
                <input
                  id="manual-material-cost"
                  type="number"
                  min="0"
                  className="form-input tabular-nums"
                  value={manualMaterialCost}
                  onChange={e => setManualMaterialCost(Number(e.target.value))}
                  placeholder="Total ₹ spent on materials today"
                />
              </div>
            )}
          </div>

          {/* Card 3: Labor Payoff & Sales */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px' }}>
                STEP 3
              </span>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Labor Payoff, Extra Expenses & Dispatches
              </h3>
            </div>

            <div className="responsive-form-duo">
              <div className="form-group">
                <label className="form-label" htmlFor="worker-rate">
                  Worker Labor Payoff (₹ / brick)
                </label>
                <input
                  id="worker-rate"
                  type="number"
                  step="0.05"
                  className="form-input tabular-nums"
                  value={workerRate}
                  onChange={e => setWorkerRate(Number(e.target.value))}
                />
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
                  Labor bill: ₹{(totalProduced * workerRate).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="other-cost">
                  Other Direct Costs (₹)
                </label>
                <input
                  id="other-cost"
                  type="number"
                  min="0"
                  className="form-input tabular-nums"
                  value={otherCost}
                  onChange={e => setOtherCost(Number(e.target.value))}
                  placeholder="e.g. 400"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sold-count">
                  Bricks Sold / Dispatched Today
                </label>
                <input
                  id="sold-count"
                  type="number"
                  min="0"
                  className="form-input tabular-nums"
                  value={sold}
                  onChange={e => setSold(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sale-price">
                  Selling Rate (₹ / brick)
                </label>
                <input
                  id="sale-price"
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-input tabular-nums"
                  value={salePrice}
                  onChange={e => setSalePrice(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="responsive-form-duo" style={{ marginTop: '14px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="entry-notes">Daily Shift Remarks</label>
                <input
                  id="entry-notes"
                  type="text"
                  className="form-input"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Shift 1 moisture level good..."
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="variance-notes">Yield / Breakage Remark</label>
                <input
                  id="variance-notes"
                  type="text"
                  className="form-input"
                  value={varianceNote}
                  onChange={e => setVarianceNote(e.target.value)}
                  placeholder="Pallet stacking breakage..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Dynamic Costing Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            className={`hkb-card ${liveCalc.isLoss ? 'kpi-card-rose' : 'kpi-card-blue'}`}
            style={{
              padding: '24px',
              position: 'sticky',
              top: '24px',
              border: liveCalc.isLoss ? '1.5px solid #FCA5A5' : '1px solid #E2E8F0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: liveCalc.isLoss ? '#FEE2E2' : '#F5F3FF', color: liveCalc.isLoss ? '#DC2626' : '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calculator size={17} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Live Dynamic Costing</h3>
              </div>
              <span className={`badge ${liveCalc.isLoss ? 'badge-bad' : 'badge-good'}`}>
                {liveCalc.isLoss ? 'LOSS ALERT' : 'PROFITABLE'}
              </span>
            </div>

            {/* Core Unit Cost Numeral */}
            <div
              style={{
                padding: '16px',
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                marginBottom: '16px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748B' }}>
                DYNAMIC MANUFACTURING COST
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span
                  className="tabular-nums"
                  style={{
                    fontSize: '34px',
                    fontWeight: 800,
                    color: liveCalc.isLoss ? '#DC2626' : '#0F172A',
                    letterSpacing: '-0.02em'
                  }}
                >
                  ₹{liveCalc.costPerBrick.toFixed(2)}
                </span>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>/ brick</span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '6px', color: '#475569', fontWeight: 500 }}>
                Target Cost: <strong>~₹3.50</strong> | Selling Rate: <strong>₹{Number(salePrice).toFixed(2)}</strong>
              </div>
            </div>

            {/* Profit Margin */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0', fontSize: '13px' }}>
              <span style={{ color: '#475569', fontWeight: 500 }}>Profit Margin / Brick:</span>
              <span className="tabular-nums" style={{ fontWeight: 800, color: liveCalc.profitPerBrick >= 0 ? '#059669' : '#DC2626' }}>
                {liveCalc.profitPerBrick >= 0 ? '+' : ''}₹{liveCalc.profitPerBrick.toFixed(2)} ({liveCalc.marginPercent.toFixed(1)}%)
              </span>
            </div>

            {/* Production Subtotals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0', borderBottom: '1px solid #E2E8F0', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Raw Material Total:</span>
                <span className="tabular-nums" style={{ fontWeight: 700 }}>₹{liveCalc.materialCost.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Labor Payoff (₹{workerRate}/brick):</span>
                <span className="tabular-nums" style={{ fontWeight: 700 }}>₹{liveCalc.workerCost.toLocaleString('en-IN')}</span>
              </div>
              {liveCalc.otherCost > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Other Direct Costs:</span>
                  <span className="tabular-nums" style={{ fontWeight: 600 }}>₹{liveCalc.otherCost.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '6px', fontWeight: 800, color: '#0F172A' }}>
                <span>Total Daily Manufacturing:</span>
                <span className="tabular-nums">₹{Math.round(liveCalc.totalCost).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Sales realization */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px 0', borderBottom: '1px solid #E2E8F0', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Sales Revenue ({sold} sold):</span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: '#059669' }}>₹{liveCalc.revenue.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Net Realized Profit:</span>
                <span className="tabular-nums" style={{ fontWeight: 800, color: liveCalc.profit >= 0 ? '#059669' : '#DC2626' }}>
                  ₹{Math.round(liveCalc.profit).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Yard Stock Change:</span>
                <span className="tabular-nums" style={{ fontWeight: 700 }}>
                  {liveCalc.stockDelta >= 0 ? `+${liveCalc.stockDelta}` : liveCalc.stockDelta} pcs
                </span>
              </div>
            </div>

            {/* Yield Check */}
            <div
              style={{
                marginTop: '14px',
                padding: '12px',
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                fontSize: '11.5px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#7C3AED' }}>
                <Sparkles size={13} />
                <span>Estimated Target: ~{morningEst.recommendedTarget.toLocaleString('en-IN')} pcs</span>
              </div>
              <div style={{ marginTop: '3px', color: '#64748B' }}>
                {totalProduced >= morningEst.recommendedTarget ? (
                  <span style={{ color: '#059669', fontWeight: 600 }}>✓ Output meets/exceeds recipe batch yield!</span>
                ) : (
                  <span style={{ color: '#D97706', fontWeight: 600 }}>
                    ⚠ Variance of {morningEst.recommendedTarget - totalProduced} bricks vs. theoretical yield.
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '18px' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '11px', fontSize: '13.5px' }}>
                <Save size={16} />
                <span>Save Entry to Ledger</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
