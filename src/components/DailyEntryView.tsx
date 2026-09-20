import React, { useState, useEffect } from 'react';
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

  const [entryMode, setEntryMode] = useState<'closing' | 'planning'>('closing');

  // Production count and dispatches (strings so backspace cleanly clears 0)
  const [singleProducedStr, setSingleProducedStr] = useState('8400');
  const [soldStr, setSoldStr] = useState('0');
  const [salePriceStr, setSalePriceStr] = useState(String(settings.defaultSalePrice || 4.5));

  // Multi-run lines or single count
  const [isMultiRun, setIsMultiRun] = useState(false);
  const [runLines, setRunLines] = useState<ProductionRunLine[]>([
    { id: '1', name: 'Shift 1 (Morning)', produced: 4200 },
    { id: '2', name: 'Shift 2 (Afternoon)', produced: 4200 }
  ]);

  // Materials string states (allows clean backspacing with no stuck 0)
  const [cementBagsStr, setCementBagsStr] = useState('70');
  const [cementRateStr, setCementRateStr] = useState('380');
  const [dustTrucksStr, setDustTrucksStr] = useState('0.85');
  const [dustRateStr, setDustRateStr] = useState('8500');
  const [raakhQtyStr, setRaakhQtyStr] = useState('3.4');
  const [raakhRateStr, setRaakhRateStr] = useState('450');
  const [manualMaterialCostStr, setManualMaterialCostStr] = useState('35000');
  const [workerRateStr, setWorkerRateStr] = useState(String(settings.defaultWorkerRate || 0.60));
  const [otherCostStr, setOtherCostStr] = useState('400');
  const [note, setNote] = useState<string>('');
  const [varianceNote, setVarianceNote] = useState<string>('');

  // Numerical conversions
  const singleProduced = Math.max(Number(singleProducedStr) || 0, 0);
  const sold = Math.max(Number(soldStr) || 0, 0);
  const salePrice = Number(salePriceStr) || (settings.defaultSalePrice || 4.0);
  const cementBags = Math.max(Number(cementBagsStr) || 0, 0);
  const cementRate = Math.max(Number(cementRateStr) || 0, 0);
  const dustTrucks = Math.max(Number(dustTrucksStr) || 0, 0);
  const dustRate = Math.max(Number(dustRateStr) || 0, 0);
  const raakhQty = Math.max(Number(raakhQtyStr) || 0, 0);
  const raakhRate = Math.max(Number(raakhRateStr) || 0, 0);
  const manualMaterialCost = Math.max(Number(manualMaterialCostStr) || 0, 0);
  const workerRate = Number(workerRateStr) || (settings.defaultWorkerRate || 0.60);
  const otherCost = Math.max(Number(otherCostStr) || 0, 0);

  const totalProduced = isMultiRun
    ? runLines.reduce((sum, r) => sum + (Number(r.produced) || 0), 0)
    : singleProduced;

  // Prediction uses cement as the baseline only. Dust/fly ash quantities are shown for recipe reference but do not affect this calculation.
  const batchCement = settings.batchCementBags || 1;
  const bricksPerBatch = settings.bricksPerBatch || settings.cementRatio || 120;
  const predictedBricks = cementBags > 0 ? Math.round((cementBags / batchCement) * bricksPerBatch) : 0;

  // In Morning Planner mode, auto-fill production from cement-based prediction.
  // This makes the planner "enter materials → see production" instead of manual entry.
  useEffect(() => {
    if (entryMode === 'planning' && predictedBricks > 0) {
      setSingleProducedStr(String(predictedBricks));
    }
  }, [entryMode, predictedBricks]);

  // Live Variance Banding:
  // variance >= -5% && <= +5% -> Green (on target / normal)
  // variance < -5% && >= -15% -> Amber (moderate shortfall)
  // variance < -15%           -> Red (severe shortfall / leakage)
  // variance > +5%            -> Amber (exceeding recipe ratio, needs reconfirming in Settings)
  const variance = totalProduced - predictedBricks;
  const variancePercent = predictedBricks > 0 ? (variance / predictedBricks) * 100 : 0;
  const isVarianceGreen = variancePercent >= -5 && variancePercent <= 5;
  const isVarianceRed = variancePercent < -15;
  const varianceBadgeClass = isVarianceGreen ? 'badge-good' : isVarianceRed ? 'badge-bad' : 'badge-warn';

  const morningEst = estimateMorningTarget(
    cementBags,
    dustTrucks,
    raakhQty,
    settings,
    entries
  );

  const estimatedMatCost = (cementBags * cementRate) + (dustTrucks * dustRate) + (raakhQty * raakhRate);
  const estimatedLaborCost = predictedBricks * workerRate;
  const estimatedTotalCost = estimatedMatCost + estimatedLaborCost;
  const estimatedCostPerBrick = predictedBricks > 0 ? estimatedTotalCost / predictedBricks : 0;

  // Note: previewEntry strictly uses actual produced (totalProduced) for all financial calculations.
  // predictedBricks is strictly a UI reference and comparison value.
  const previewEntry: ProductionEntry = {
    id: 'preview',
    date,
    produced: totalProduced,
    sold,
    salePrice,
    costMode,
    cementBags,
    cementRate,
    dustTrucks,
    dustRate,
    raakhQty,
    raakhRate,
    manualMaterialCost,
    workerRate,
    otherCost,
    estimatedTarget: predictedBricks > 0 ? predictedBricks : morningEst.recommendedTarget,
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
            {entryMode === 'planning'
              ? '🌅 Morning Planner: Raw materials daalkar dekhein kitni eent banegi aur kitna kharcha aayega.'
              : '🌇 Evening Shift Closing: Machine counter se actual output daalein aur Ledger me save karein.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div className="segmented-control">
            <button
              type="button"
              className={`segmented-btn ${entryMode === 'planning' ? 'active' : ''}`}
              onClick={() => setEntryMode('planning')}
            >
              🌅 Morning Planner (सुबहा का अंदाज़ा)
            </button>
            <button
              type="button"
              className={`segmented-btn ${entryMode === 'closing' ? 'active' : ''}`}
              onClick={() => setEntryMode('closing')}
            >
              🌇 Evening Shift Log (शाम का हिसाब)
            </button>
          </div>

          <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="entry-form-grid">
        {/* Left Column: Form Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

          {/* ═══════════════════════════════════════════════════════════════
              MORNING PLANNER MODE — Materials first, auto-predicted output
             ═══════════════════════════════════════════════════════════════ */}
          {entryMode === 'planning' && (
            <>
              {/* Date Card (compact) */}
              <div className="hkb-card" style={{ padding: '16px 22px' }}>
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
                </div>
              </div>
            </>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              EVENING CLOSING MODE — Manual production entry first
             ═══════════════════════════════════════════════════════════════ */}
          {entryMode === 'closing' && (
            <div className="hkb-card" style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px' }}>
                    STEP 1
                  </span>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                    Production Date & Actual Count
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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                      <label className="form-label" htmlFor="single-produced" style={{ marginBottom: 0 }}>
                        Actual Bricks Pressed Today
                      </label>
                      {predictedBricks > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#6D28D9', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #DDD6FE' }}>
                            Estimated: ~{predictedBricks.toLocaleString('en-IN')} pcs
                          </span>
                          {!settings.isRatioConfirmed && (
                            <span
                              title="Go to Settings to confirm your plant's exact batch recipe"
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 600,
                                color: '#B45309',
                                background: '#FEF3C7',
                                padding: '2px 7px',
                                borderRadius: '4px',
                                border: '1px solid #FDE68A'
                              }}
                            >
                              ⚠️ Unconfirmed Ratio (Default 1:120)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <input
                      id="single-produced"
                      type="number"
                      min="0"
                      placeholder="0"
                      className="form-input tabular-nums"
                      value={singleProducedStr}
                      onChange={e => setSingleProducedStr(e.target.value)}
                      required
                    />

                    {/* Live Variance Comparison Display */}
                    {predictedBricks > 0 && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        background: isVarianceGreen ? '#F0FDF4' : isVarianceRed ? '#FEF2F2' : '#FFFBEB',
                        border: `1px solid ${isVarianceGreen ? '#BBF7D0' : isVarianceRed ? '#FECACA' : '#FDE68A'}`,
                        color: isVarianceGreen ? '#166534' : isVarianceRed ? '#991B1B' : '#92400E'
                      }}>
                        <div style={{ fontWeight: 600 }}>
                          <span>Estimate: <strong>{predictedBricks.toLocaleString('en-IN')}</strong></span>
                          <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>
                          <span>Actual: <strong>{totalProduced.toLocaleString('en-IN')}</strong></span>
                          <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>
                          <span>
                            Variance: <strong>{variance > 0 ? `+${variance.toLocaleString('en-IN')}` : variance.toLocaleString('en-IN')}</strong> ({variancePercent > 0 ? `+${variancePercent.toFixed(1)}%` : `${variancePercent.toFixed(1)}%`})
                          </span>
                        </div>
                        <span className={`badge ${varianceBadgeClass}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                          {variancePercent >= -5 && variancePercent <= 5 && '✓ Normal / On Target'}
                          {variancePercent < -5 && variancePercent >= -15 && '⚠ Slight Shortfall — check mix/waste'}
                          {variancePercent < -15 && '🚨 Significant Shortfall — check leakage/breakage'}
                          {variancePercent > 5 && 'ℹ Exceeding estimate — check cement count/recipe'}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '6px' }}>
                      <label className="form-label" style={{ marginBottom: 0 }}>Total Produced (All Batches)</label>
                      {predictedBricks > 0 && (
                        <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#6D28D9', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #DDD6FE' }}>
                          Estimated: ~{predictedBricks.toLocaleString('en-IN')} pcs
                        </span>
                      )}
                    </div>
                    <div
                      className="form-input tabular-nums"
                      style={{ background: '#F8FAFC', fontWeight: 800, color: '#7C3AED', display: 'flex', alignItems: 'center' }}
                    >
                      {totalProduced.toLocaleString('en-IN')} pcs
                    </div>

                    {/* Multi-batch variance display */}
                    {predictedBricks > 0 && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '8px',
                        background: isVarianceGreen ? '#F0FDF4' : isVarianceRed ? '#FEF2F2' : '#FFFBEB',
                        border: `1px solid ${isVarianceGreen ? '#BBF7D0' : isVarianceRed ? '#FECACA' : '#FDE68A'}`,
                        color: isVarianceGreen ? '#166534' : isVarianceRed ? '#991B1B' : '#92400E'
                      }}>
                        <div style={{ fontWeight: 600 }}>
                          <span>Est: <strong>{predictedBricks.toLocaleString('en-IN')}</strong></span>
                          <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>
                          <span>Act: <strong>{totalProduced.toLocaleString('en-IN')}</strong></span>
                          <span style={{ margin: '0 6px', opacity: 0.5 }}>|</span>
                          <span>Var: <strong>{variance > 0 ? `+${variance.toLocaleString('en-IN')}` : variance.toLocaleString('en-IN')}</strong> ({variancePercent.toFixed(1)}%)</span>
                        </div>
                        <span className={`badge ${varianceBadgeClass}`} style={{ fontSize: '11px', fontWeight: 700 }}>
                          {variancePercent >= -5 && variancePercent <= 5 && '✓ Normal / On Target'}
                          {variancePercent < -5 && variancePercent >= -15 && '⚠ Slight Shortfall'}
                          {variancePercent < -15 && '🚨 Significant Shortfall'}
                          {variancePercent > 5 && 'ℹ Exceeding estimate'}
                        </span>
                      </div>
                    )}
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
          )}

          {/* Card 2: Raw Materials — In planning mode this is STEP 1, in closing STEP 2 */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px' }}>
                  {entryMode === 'planning' ? 'STEP 1' : 'STEP 2'}
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
                      placeholder="0"
                      className="form-input tabular-nums"
                      value={cementBagsStr}
                      onChange={e => setCementBagsStr(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rate (₹ / Bag)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="form-input tabular-nums"
                      value={cementRateStr}
                      onChange={e => setCementRateStr(e.target.value)}
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
                      placeholder="0"
                      className="form-input tabular-nums"
                      value={dustTrucksStr}
                      onChange={e => setDustTrucksStr(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rate (₹ / Truck)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="form-input tabular-nums"
                      value={dustRateStr}
                      onChange={e => setDustRateStr(e.target.value)}
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
                      placeholder="0"
                      className="form-input tabular-nums"
                      value={raakhQtyStr}
                      onChange={e => setRaakhQtyStr(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rate (₹ / {settings.unitRaakhLabel})</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="form-input tabular-nums"
                      value={raakhRateStr}
                      onChange={e => setRaakhRateStr(e.target.value)}
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
                  placeholder="0"
                  className="form-input tabular-nums"
                  value={manualMaterialCostStr}
                  onChange={e => setManualMaterialCostStr(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              MORNING PLANNER: Auto-Predicted Production Result Card (STEP 2)
              Shows AFTER materials — no manual input needed, auto-calculated
             ═══════════════════════════════════════════════════════════════ */}
          {entryMode === 'planning' && (
            <div className="hkb-card" style={{
              padding: '24px',
              background: predictedBricks > 0
                ? 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)'
                : '#F8FAFC',
              border: predictedBricks > 0 ? '1.5px solid #86EFAC' : '1.5px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px' }}>
                  STEP 2
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#059669" />
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                    Predicted Production Output
                  </h3>
                </div>
                {!settings.isRatioConfirmed && (
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#B45309', background: '#FEF3C7', padding: '2px 7px', borderRadius: '4px', border: '1px solid #FDE68A' }}>
                    ⚠️ Default Ratio — Confirm in Settings
                  </span>
                )}
              </div>

              {predictedBricks > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '4px' }}>
                      Itne Maal Se Itni Eent Banegi
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '36px', fontWeight: 900, color: '#059669', lineHeight: 1 }}>
                      ~{predictedBricks.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '13px', color: '#065F46', fontWeight: 600, marginTop: '4px' }}>
                      bricks ({cementBags} bags × {bricksPerBatch} per batch)
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase' }}>Material Cost</div>
                      <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800, color: '#4C1D95' }}>
                        ₹{Math.round(estimatedMatCost).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#6D28D9', textTransform: 'uppercase' }}>+ Labor</div>
                      <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800, color: '#4C1D95' }}>
                        ₹{Math.round(estimatedLaborCost).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>Est. Cost/Brick</div>
                      <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800, color: '#047857' }}>
                        ₹{estimatedCostPerBrick.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '14px' }}>
                  ↑ Upar Step 1 me Cement Bags daalein — production auto-calculate hoga
                </div>
              )}

              {predictedBricks > 0 && (
                <div style={{ marginTop: '16px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSingleProducedStr(String(predictedBricks));
                      setEntryMode('closing');
                    }}
                    style={{ background: '#059669', borderColor: '#047857' }}
                  >
                    ✓ Set ~{predictedBricks.toLocaleString('en-IN')} as Today's Target & Switch to Evening Log
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Card 3: Labor Payoff & Sales */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#7C3AED', background: '#F5F3FF', padding: '2px 8px', borderRadius: '6px' }}>
                {entryMode === 'planning' ? 'STEP 3' : 'STEP 3'}
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
                  placeholder="0"
                  className="form-input tabular-nums"
                  value={workerRateStr}
                  onChange={e => setWorkerRateStr(e.target.value)}
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
                  placeholder="0"
                  className="form-input tabular-nums"
                  value={otherCostStr}
                  onChange={e => setOtherCostStr(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sold-count">
                  Direct Yard Dispatches Today (Optional)
                </label>
                <input
                  id="sold-count"
                  type="number"
                  min="0"
                  placeholder="0"
                  className="form-input tabular-nums"
                  value={soldStr}
                  onChange={e => setSoldStr(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Agar factory press se direct gaadi load hui ho. (Aamtaur par 0, bikri Sales tab me hoti hai).
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="sale-price">
                  Benchmark Selling Rate (₹ / brick)
                </label>
                <input
                  id="sale-price"
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  className="form-input tabular-nums"
                  value={salePriceStr}
                  onChange={e => setSalePriceStr(e.target.value)}
                />
                <span style={{ fontSize: '11px', color: '#64748B' }}>
                  Margin compare karne ke liye selling rate (e.g. ₹4.50 ya ₹5.00)
                </span>
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
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: liveCalc.profitPerBrick >= 0 ? '#F5F3FF' : '#FEE2E2', color: liveCalc.profitPerBrick >= 0 ? '#7C3AED' : '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calculator size={17} />
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>Live Dynamic Costing</h3>
              </div>
              <span className={`badge ${liveCalc.profitPerBrick >= 0 ? 'badge-good' : 'badge-bad'}`}>
                {liveCalc.profitPerBrick >= 0 ? 'PROFITABLE MARGIN' : 'HIGH PRODUCTION COST'}
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
                    color: liveCalc.profitPerBrick >= 0 ? '#0F172A' : '#DC2626',
                    letterSpacing: '-0.02em'
                  }}
                >
                  ₹{liveCalc.costPerBrick.toFixed(2)}
                </span>
                <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>/ brick</span>
              </div>
              <div style={{ fontSize: '12px', marginTop: '6px', color: '#475569', fontWeight: 500 }}>
                Benchmark Sale Rate: <strong>₹{Number(salePrice).toFixed(2)}</strong>
              </div>
            </div>

            {/* Profit Margin */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E2E8F0', fontSize: '13px' }}>
              <span style={{ color: '#475569', fontWeight: 500 }}>Expected Unit Margin:</span>
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
              {sold > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Direct Dispatches ({sold} sold):</span>
                    <span className="tabular-nums" style={{ fontWeight: 700, color: '#059669' }}>₹{liveCalc.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Net Realized Profit:</span>
                    <span className="tabular-nums" style={{ fontWeight: 800, color: liveCalc.profit >= 0 ? '#059669' : '#DC2626' }}>
                      ₹{Math.round(liveCalc.profit).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              ) : (
                <div style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0F172A', fontWeight: 600 }}>
                    <span>Shift Production:</span>
                    <span className="tabular-nums">{totalProduced.toLocaleString('en-IN')} pcs</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', marginTop: '3px' }}>
                    All bricks added to Yard Stock. Sales are billed in 'Sales & Receivables'.
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px' }}>
                <span style={{ color: '#64748B' }}>Yard Stock Addition:</span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: '#059669' }}>
                  +{liveCalc.stockDelta.toLocaleString('en-IN')} pcs
                </span>
              </div>
            </div>

            {/* Yield & Target Comparison: Pre-Shift Target vs Actual Realized */}
            <div
              style={{
                marginTop: '14px',
                padding: '12px 14px',
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Pre-Shift Target:</span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: '#7C3AED' }}>
                  ~{morningEst.recommendedTarget.toLocaleString('en-IN')} pcs (@ ₹{estimatedCostPerBrick.toFixed(2)})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Actual Shift Output:</span>
                <span className="tabular-nums" style={{ fontWeight: 800, color: '#0F172A' }}>
                  {totalProduced.toLocaleString('en-IN')} pcs (@ ₹{liveCalc.costPerBrick.toFixed(2)})
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '6px', borderTop: '1px dashed #E2E8F0', fontSize: '11.5px' }}>
                <span style={{ color: '#64748B' }}>Actual Cement Yield:</span>
                <span className="tabular-nums" style={{ fontWeight: 700, color: totalProduced >= morningEst.recommendedTarget ? '#059669' : '#D97706' }}>
                  {cementBags > 0 ? Math.round(totalProduced / cementBags) : 0} bricks / bag
                </span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: '#64748B' }}>
                {totalProduced >= morningEst.recommendedTarget ? (
                  <span style={{ color: '#059669', fontWeight: 600 }}>✓ Target achieved! Cement efficiency optimal.</span>
                ) : (
                  <span style={{ color: '#D97706', fontWeight: 600 }}>
                    ⚠ Loss of {morningEst.recommendedTarget - totalProduced} bricks vs recipe. Check mix or leakage.
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
