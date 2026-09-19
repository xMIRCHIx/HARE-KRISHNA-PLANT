import React, { useState } from 'react';
import {
  HelpCircle,
  Calculator,
  AlertTriangle,
  Factory,
  Database,
  Copy,
  Check
} from 'lucide-react';
import { SUPABASE_SCHEMA_SQL, SUPABASE_SALES_SCHEMA_SQL } from '../lib/supabase';
import { Language, translations } from '../lib/i18n';

interface GuideViewProps {
  language: Language;
}

export const GuideView: React.FC<GuideViewProps> = ({ language }) => {
  const [copied, setCopied] = useState(false);
  const [copiedSales, setCopiedSales] = useState(false);
  const t = translations[language].guide;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopySalesSQL = () => {
    navigator.clipboard.writeText(SUPABASE_SALES_SCHEMA_SQL);
    setCopiedSales(true);
    setTimeout(() => setCopiedSales(false), 2500);
  };

  return (
    <div className="page-view-enter" style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1080px' }}>
      {/* Title Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '4px' }}>
          <HelpCircle size={20} />
          <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {t.badge}
          </span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ink)' }}>
          {t.title}
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--ink-muted)', marginTop: '4px' }}>
          {t.subtitle}
        </p>
      </div>

      {/* Quick Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        <div className="hkb-card" style={{ padding: '18px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-faint)' }}>{t.targetCostLabel}</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>~₹3.50</div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
            {t.targetCostSub}
          </div>
        </div>

        <div className="hkb-card" style={{ padding: '18px', borderLeft: '4px solid var(--good)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-faint)' }}>{t.sellingPriceLabel}</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--good)', marginTop: '4px' }}>₹4.00</div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
            {t.sellingPriceSub}
          </div>
        </div>

        <div className="hkb-card" style={{ padding: '18px', borderLeft: '4px solid #D97706' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-faint)' }}>{t.workerPayoffLabel}</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#D97706', marginTop: '4px' }}>₹0.60</div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
            {t.workerPayoffSub}
          </div>
        </div>

        <div className="hkb-card" style={{ padding: '18px', borderLeft: '4px solid #059669' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink-faint)' }}>{t.netMarginLabel}</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#059669', marginTop: '4px' }}>₹0.50 / brick</div>
          <div style={{ fontSize: '12px', color: 'var(--ink-muted)', marginTop: '4px' }}>
            {t.netMarginSub}
          </div>
        </div>
      </div>

      {/* Section 1: Supabase Setup & SQL Query */}
      <div className="hkb-card" style={{ padding: '24px', border: '1.5px solid var(--primary)', background: '#F8FAFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
                {t.sqlTitle}
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--ink-muted)' }}>
                {t.sqlDesc}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopySalesSQL}
              className="btn btn-secondary"
              style={{ padding: '8px 14px', fontSize: '12.5px' }}
              title="Copy only the sales_orders and customer_payments tables SQL"
            >
              {copiedSales ? <Check size={15} color="#059669" /> : <Copy size={15} />}
              <span>{copiedSales ? 'Sales SQL Copied!' : 'Copy Sales Tables SQL'}</span>
            </button>

            <button
              onClick={handleCopySQL}
              className="btn btn-primary"
              style={{ padding: '8px 18px', fontSize: '13px' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? t.copiedSqlBtn : t.copySqlBtn}</span>
            </button>
          </div>
        </div>

        {/* Steps to run */}
        <div style={{ background: '#FFFFFF', padding: '16px', borderRadius: '6px', border: '1px solid var(--line)', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
            {t.sqlStepsTitle}
          </div>
          <ol style={{ paddingLeft: '20px', fontSize: '13px', color: 'var(--ink-muted)', lineHeight: 1.7 }}>
            <li>
              {t.sqlStep1}
              <a
                href="https://supabase.com/dashboard/project/uwfcngioytanhdtdsqyv/sql/new"
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline', wordBreak: 'break-all' }}
              >
                https://supabase.com/dashboard/project/uwfcngioytanhdtdsqyv/sql/new
              </a>
            </li>
            <li>{t.sqlStep2}</li>
            <li>{t.sqlStep3}</li>
          </ol>
        </div>

        {/* The Exact SQL Code Box */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E293B', color: '#94A3B8', padding: '8px 14px', borderRadius: '6px 6px 0 0', fontSize: '12px', fontFamily: 'monospace' }}>
            <span>supabase_schema.sql</span>
            <span>PostgreSQL 15+</span>
          </div>
          <pre
            style={{
              background: '#0F172A',
              color: '#F8FAFC',
              padding: '16px',
              borderRadius: '0 0 6px 6px',
              fontSize: '12.5px',
              lineHeight: 1.5,
              overflowX: 'auto',
              fontFamily: 'Consolas, Monaco, monospace',
              maxHeight: '280px'
            }}
          >
            {SUPABASE_SCHEMA_SQL}
          </pre>
        </div>
      </div>

      {/* Section 2: Core Concept 1 - Morning Estimation vs Evening Output */}
      <div className="hkb-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: 'var(--primary-soft)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Factory size={18} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
            {t.sec1Title}
          </h3>
        </div>

        <div style={{ fontSize: '13.5px', color: 'var(--ink-muted)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p>{t.sec1Desc}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '6px' }}>
            <div style={{ padding: '16px', background: 'var(--surface-alt)', borderRadius: '6px', border: '1px solid var(--line)' }}>
              <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                {t.sec1Card1Title}
              </strong>
              {t.sec1Card1Desc}
            </div>

            <div style={{ padding: '16px', background: 'var(--surface-alt)', borderRadius: '6px', border: '1px solid var(--line)' }}>
              <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '6px' }}>
                {t.sec1Card2Title}
              </strong>
              {t.sec1Card2Desc}
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Core Concept 2 - Per-Brick Dynamic Costing */}
      <div className="hkb-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: '#ECFDF5', color: 'var(--good)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calculator size={18} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)' }}>
            {t.sec2Title}
          </h3>
        </div>

        <div style={{ fontSize: '13.5px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
          <p>{t.sec2Desc}</p>

          {/* Formula Breakdown Table */}
          <div className="hkb-table-wrapper" style={{ marginTop: '16px' }}>
            <table className="hkb-table">
              <thead>
                <tr>
                  <th>{t.thComponent}</th>
                  <th>{t.thFormula}</th>
                  <th>{t.thSample}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>{t.rowCement}</td>
                  <td>{t.rowCementFormula}</td>
                  <td className="tabular-nums" style={{ fontWeight: 600 }}>₹2.20 / brick</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>{t.rowDust}</td>
                  <td>{t.rowDustFormula}</td>
                  <td className="tabular-nums" style={{ fontWeight: 600 }}>₹0.60 / brick</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>{t.rowRaakh}</td>
                  <td>{t.rowRaakhFormula}</td>
                  <td className="tabular-nums" style={{ fontWeight: 600 }}>₹0.15 / brick</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>{t.rowWorker}</td>
                  <td>{t.rowWorkerFormula}</td>
                  <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--primary)' }}>₹0.60 / brick</td>
                </tr>
                <tr style={{ background: 'var(--surface-alt)', fontWeight: 600 }}>
                  <td>{t.rowTotalCost}</td>
                  <td>{t.rowTotalFormula}</td>
                  <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--ink)' }}>₹3.55 / brick</td>
                </tr>
                <tr style={{ background: '#ECFDF5' }}>
                  <td style={{ fontWeight: 700, color: 'var(--good)' }}>{t.rowProfit}</td>
                  <td>{t.rowProfitFormula}</td>
                  <td className="tabular-nums" style={{ fontWeight: 700, color: 'var(--good)' }}>+₹0.45 / brick margin</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 4: Loss Warning Red Alert */}
      <div className="hkb-card" style={{ padding: '24px', borderLeft: '4px solid var(--bad)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '6px', background: 'var(--bad-soft)', color: 'var(--bad)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={18} />
          </div>
          <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--bad)' }}>
            {t.sec3Title}
          </h3>
        </div>

        <p style={{ fontSize: '13.5px', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
          {t.sec3Desc}
        </p>
      </div>

      {/* Section 5: Step-by-Step Daily Workflow */}
      <div className="hkb-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--ink)', marginBottom: '16px' }}>
          {t.sec4Title}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '16px', border: '1px solid var(--line)', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>{t.step1Title}</div>
            <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '4px' }}>
              {t.step1Desc}
            </div>
          </div>

          <div style={{ padding: '16px', border: '1px solid var(--line)', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>{t.step2Title}</div>
            <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '4px' }}>
              {t.step2Desc}
            </div>
          </div>

          <div style={{ padding: '16px', border: '1px solid var(--line)', borderRadius: '6px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>{t.step3Title}</div>
            <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '4px' }}>
              {t.step3Desc}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
