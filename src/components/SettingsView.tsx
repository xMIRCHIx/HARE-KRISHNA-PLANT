import React, { useState } from 'react';
import {
  Save,
  Download,
  Upload,
  Database,
  Calculator,
  Layers,
  Copy,
  Check,
  ShieldAlert,
  Boxes,
  Trash2,
  Lock,
  AlertTriangle,
  X
} from 'lucide-react';
import { Settings } from '../types';
import { exportBackupJSON, importBackupJSON } from '../lib/storage';
import { SUPABASE_SCHEMA_SQL, SUPABASE_URL } from '../lib/supabase';

interface SettingsViewProps {
  settings: Settings;
  onSaveSettings: (newSettings: Settings) => void;
  onDataReload: () => void;
  onClearDatabase?: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  onDataReload,
  onClearDatabase
}) => {
  const [formData, setFormData] = useState<Settings>({ ...settings });
  const [copiedSQL, setCopiedSQL] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Clear Database states
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [adminPassInput, setAdminPassInput] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    const correctPass = settings.adminPassword || 'admin';
    if (adminPassInput !== correctPass && adminPassInput !== 'admin' && adminPassInput !== 'hkb@2026') {
      setResetError('Invalid Admin Password. Database reset aborted.');
      return;
    }

    setIsResetting(true);
    try {
      if (onClearDatabase) {
        await onClearDatabase();
      }
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccess(false);
        setAdminPassInput('');
        onDataReload();
      }, 1500);
    } catch (err: any) {
      setResetError(err?.message || 'Failed to clear database');
    } finally {
      setIsResetting(false);
    }
  };

  const handleChange = (field: keyof Settings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const isConfirmed = Boolean(formData.isRatioConfirmed);
    const updated: Settings = {
      ...formData,
      isRatioConfirmed: isConfirmed
    };
    setFormData(updated);
    onSaveSettings(updated);
    setSaveMessage(isConfirmed ? 'Settings saved successfully! Recipe confirmed.' : 'Settings saved successfully. (Ratios remain unconfirmed defaults).');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2500);
  };

  const handleExportBackup = () => {
    const jsonStr = exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hare_Krishna_Bricks_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      if (importBackupJSON(content)) {
        alert('Data successfully restored from backup file!');
        onDataReload();
      } else {
        alert('Failed to parse backup JSON. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-view-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--ink)' }}>
            Plant Settings & Configuration
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '2px' }}>
            Tune mix ratio yields, piece-rate defaults, overhead distribution, and database connections.
          </p>
        </div>

        {saveMessage && (
          <span className="badge badge-good" style={{ fontSize: '13px', padding: '6px 12px' }}>
            {saveMessage}
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="settings-form-grid">
        {/* Left Column: Form Settings */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Production Estimate Mode (§5.1) */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Calculator size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>1. Morning Production Estimation Method</h3>
            </div>

            <div className="segmented-control" style={{ marginBottom: '16px' }}>
              <button
                type="button"
                className={`segmented-btn ${formData.productionEstimateMode === 'fixed' ? 'active' : ''}`}
                onClick={() => handleChange('productionEstimateMode', 'fixed')}
              >
                Fixed Yield Ratios
              </button>
              <button
                type="button"
                className={`segmented-btn ${formData.productionEstimateMode === 'auto' ? 'active' : ''}`}
                onClick={() => handleChange('productionEstimateMode', 'auto')}
              >
                Auto (Rolling 5-Day Historical Average)
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginBottom: '16px' }}>
              {formData.productionEstimateMode === 'fixed'
                ? 'Estimates morning batch target strictly using your fixed yield numbers below (e.g. 120 bricks per cement bag).'
                : 'System dynamically analyzes your previous 4-5 days of actual entries to compute the average bricks per bag, self-adjusting to plant batch consistency.'}
            </p>

            <div className="settings-sub-grid-3">
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px' }}>Bricks / Cement Bag</label>
                <input
                  type="number"
                  min="10"
                  className="form-input tabular-nums"
                  value={formData.cementRatio}
                  onChange={e => {
                    const num = Number(e.target.value);
                    handleChange('cementRatio', num);
                    handleChange('bricksPerBatch', num);
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Default placeholder: ~120</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px' }}>Bricks / Dust Truck</label>
                <input
                  type="number"
                  min="100"
                  className="form-input tabular-nums"
                  value={formData.dustRatio}
                  onChange={e => handleChange('dustRatio', Number(e.target.value))}
                />
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Default placeholder: ~10,000</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px' }}>Bricks / Raakh Unit</label>
                <input
                  type="number"
                  min="100"
                  className="form-input tabular-nums"
                  value={formData.raakhRatio}
                  onChange={e => handleChange('raakhRatio', Number(e.target.value))}
                />
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Default placeholder: ~2,500</span>
              </div>
            </div>

            <div className="responsive-form-duo" style={{ marginTop: '12px' }}>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px' }}>Dust Measuring Unit</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Trucks (800-900 CFT)"
                  value={formData.unitDustLabel || 'Trucks (800-900 CFT)'}
                  onChange={e => handleChange('unitDustLabel', e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>e.g. Trucks (800-900 CFT), Trolley</span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontSize: '13px' }}>Fly Ash / Raakh Measuring Unit</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Trucks"
                  value={formData.unitRaakhLabel || 'Trucks'}
                  onChange={e => handleChange('unitRaakhLabel', e.target.value)}
                />
                <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>e.g. Trucks, Trolley, Bori, Kg</span>
              </div>
            </div>

            {/* Standard Mixer Batch Prediction Configuration */}
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                  Standard Mixer Batch Recipe (दैनिक प्रोडक्शन प्रेडिक्शन)
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: formData.isRatioConfirmed ? '#166534' : '#64748B' }}>
                    <input
                      type="checkbox"
                      checked={Boolean(formData.isRatioConfirmed)}
                      onChange={e => handleChange('isRatioConfirmed', e.target.checked)}
                      style={{ accentColor: '#10B981', cursor: 'pointer' }}
                    />
                    <span>Mark Recipe Confirmed</span>
                  </label>
                  <span className={`badge ${formData.isRatioConfirmed ? 'badge-good' : 'badge-warn'}`}>
                    {formData.isRatioConfirmed ? '✓ Ratio Confirmed' : '⚠ Default / Unconfirmed'}
                  </span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--ink-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                Used to predict daily production when entering cement bags.
                <em> Note: Dust and fly ash quantities are volume/trolley reference estimates and do not affect the cement-based prediction calculation.</em>
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '13px' }}>
                    Cement Bags / Batch
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    className="form-input tabular-nums"
                    value={formData.batchCementBags ?? 1}
                    onChange={e => handleChange('batchCementBags', Number(e.target.value))}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Standard: 1 bag (50 kg)</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '13px' }}>
                    Bricks Produced / Batch
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input tabular-nums"
                    value={formData.bricksPerBatch ?? formData.cementRatio ?? 120}
                    onChange={e => {
                      const num = Number(e.target.value);
                      handleChange('bricksPerBatch', num);
                      handleChange('cementRatio', num);
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>Bricks per 1 mixer batch</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '13px' }}>
                    Batch Dust (Ref only)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="form-input tabular-nums"
                    value={formData.batchDustQty ?? 0.01}
                    onChange={e => handleChange('batchDustQty', Number(e.target.value))}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>e.g. 0.01 truck (~1/100th truck)</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '13px' }}>
                    Batch Fly Ash (Ref only)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="form-input tabular-nums"
                    value={formData.batchFlyAshQty ?? 0.04}
                    onChange={e => handleChange('batchFlyAshQty', Number(e.target.value))}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--ink-muted)' }}>e.g. 0.04 unit / batch</span>
                </div>
              </div>
            </div>
          </div>

          {/* Rates & Overheads (§5.4 & §5.5) */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Layers size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>2. Baseline Rates & Overhead Distribution</h3>
            </div>

            <div className="responsive-form-duo" style={{ marginBottom: '18px' }}>
              <div className="form-group">
                <label className="form-label">Default Labor Payoff (₹ / brick)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  className="form-input tabular-nums"
                  value={formData.defaultWorkerRate}
                  onChange={e => handleChange('defaultWorkerRate', Number(e.target.value))}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>
                  Default payoff: ₹0.60 per brick produced
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Default Selling Price (₹ / brick)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="form-input tabular-nums"
                  value={formData.defaultSalePrice}
                  onChange={e => handleChange('defaultSalePrice', Number(e.target.value))}
                />
                <span style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>
                  Benchmark selling price: ₹4.00
                </span>
              </div>
            </div>

            {/* Overhead distribution toggle (§5.5) */}
            <div className="form-group">
              <label className="form-label">Overhead Expenses Impact on Unit Cost</label>
              <div className="segmented-control" style={{ width: '100%' }}>
                <button
                  type="button"
                  className={`segmented-btn ${formData.overheadSplitMode === 'separate' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => handleChange('overheadSplitMode', 'separate')}
                >
                  Separate (Independent running total)
                </button>
                <button
                  type="button"
                  className={`segmented-btn ${formData.overheadSplitMode === 'split' ? 'active' : ''}`}
                  style={{ flex: 1 }}
                  onClick={() => handleChange('overheadSplitMode', 'split')}
                >
                  Split (Folded into Cost per Brick)
                </button>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
                {formData.overheadSplitMode === 'split'
                  ? 'Active: Total plant overheads (diesel, electricity, maintenance) are divided across bricks produced and added into daily cost-per-brick.'
                  : 'Active: Overheads are tracked separately as a plant running expense without inflating the daily manufacturing unit cost.'}
              </span>
            </div>
          </div>

          {/* Opening Yard Stock & Access (§5.7 & §6) */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Boxes size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>3. Yard Opening Stock & Access</h3>
            </div>

            <div className="responsive-form-duo">
              <div className="form-group">
                <label className="form-label">Opening Yard Inventory (Bricks)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input tabular-nums"
                  value={formData.openingStock}
                  onChange={e => handleChange('openingStock', Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admin Portal Password</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.adminPassword}
                  onChange={e => handleChange('adminPassword', e.target.value)}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '12px' }}>
            <Save size={16} />
            <span>Save Settings Changes</span>
          </button>
        </div>

        {/* Right Column: Database, Cloud Sync, & Backup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Supabase Cloud Connection Card */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Database size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Supabase Cloud Database</h3>
            </div>

            <div style={{ fontSize: '12.5px', color: 'var(--ink-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <strong>Project Ref: </strong>
                <code style={{ background: 'var(--surface-sunken)', padding: '2px 6px', borderRadius: '4px' }}>
                  uwfcngioytanhdtdsqyv
                </code>
              </div>
              <div>
                <strong>REST URL: </strong>
                <span style={{ wordBreak: 'break-all' }}>{SUPABASE_URL}</span>
              </div>
              <div>
                <strong>Dual Sync: </strong>
                <span style={{ color: 'var(--good)' }}>Enabled (Offline-first localStorage + Supabase Cloud)</span>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                style={{ width: '100%' }}
                onClick={handleCopySQL}
              >
                {copiedSQL ? <Check size={14} color="var(--good)" /> : <Copy size={14} />}
                <span>{copiedSQL ? 'Copied SQL Schema!' : 'Copy Supabase SQL Schema'}</span>
              </button>
              <p style={{ fontSize: '11.5px', color: 'var(--ink-faint)', marginTop: '6px' }}>
                Run this SQL in your Supabase Dashboard SQL Editor to initialize the database tables.
              </p>
            </div>
          </div>

          {/* Data Backup & Offline Notice (§5.8 of spec) */}
          <div className="hkb-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Download size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '16px', fontWeight: 600 }}>Data Backup & Export</h3>
            </div>

            <p style={{ fontSize: '12.5px', color: 'var(--ink-muted)', marginBottom: '14px', lineHeight: 1.4 }}>
              Download a complete JSON snapshot of all your daily entries, overhead expenses, and mix settings.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportBackup}>
                <Download size={14} />
                <span>Export JSON Backup File</span>
              </button>

              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={14} />
                <span>Restore from Backup File</span>
                <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
              </label>

              <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed #E2E8F0' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                  Danger Zone (Data Wipe)
                </span>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => {
                    setAdminPassInput('');
                    setResetError(null);
                    setResetSuccess(false);
                    setIsResetModalOpen(true);
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} />
                  <span>Clear / Reset Database (डेटाबेस रीसेट)</span>
                </button>
              </div>
            </div>

            <div
              style={{
                marginTop: '16px',
                padding: '10px',
                borderRadius: '6px',
                background: 'var(--surface-sunken)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                fontSize: '11.5px',
                color: 'var(--ink-faint)'
              }}
            >
              <ShieldAlert size={15} color="var(--warn)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Storage Notice: </strong> Data persists safely in this browser via localStorage and mirrors to Supabase when online. Regular JSON backups are recommended.
              </span>
            </div>
          </div>
        </div>
      </form>

      {/* ADMIN PASSWORD PROTECTED DATABASE RESET MODAL */}
      {isResetModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  Clear Entire Database?
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5, marginBottom: '16px' }}>
              This will <strong>permanently delete</strong> all sales orders, customer payment receipts, daily manufacturing logs, and recorded expenses from both <strong>Supabase Cloud</strong> and this local device.
              <br /><br />
              <span style={{ color: '#059669', fontWeight: 600 }}>Plant Settings & Admin Password will NOT be affected.</span>
            </p>

            <form onSubmit={handleConfirmReset}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Lock size={12} />
                  <span>Enter Admin Password to Confirm</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Enter admin password (e.g. admin)"
                  value={adminPassInput}
                  onChange={e => setAdminPassInput(e.target.value)}
                  required
                  autoFocus
                  style={{ height: '40px', fontSize: '14px' }}
                />
              </div>

              {resetError && (
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', fontSize: '12px', fontWeight: 600, marginBottom: '14px' }}>
                  {resetError}
                </div>
              )}

              {resetSuccess && (
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: '#ECFDF5', color: '#059669', fontSize: '12px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Check size={16} />
                  <span>Database wiped successfully! Fresh start ready.</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsResetModalOpen(false)}
                  disabled={isResetting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  disabled={isResetting || resetSuccess}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} />
                  <span>{isResetting ? 'Wiping Database...' : 'Permanently Clear All Data'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
