import React, { useState, useMemo, useEffect } from 'react';
import { useFuel } from '../context/FuelContext';
import { 
  formatINRCurrency, 
  formatINR, 
  formatDate, 
  getTodayDateStr, 
  numberToIndianWords 
} from '../utils/formatters';
import { 
  Banknote, 
  RotateCcw, 
  Copy, 
  Printer, 
  Save, 
  Calendar, 
  Check, 
  Calculator, 
  ShieldCheck, 
  ArrowRight,
  Plus,
  Minus,
  CheckCircle2,
  Receipt,
  Sparkles
} from 'lucide-react';

// Standard Indian Currency Denominations
const NOTE_DENOMINATIONS = [
  { 
    value: 500, 
    label: '₹500', 
    color: '#334155', 
    bg: '#f1f5f9', 
    border: '#cbd5e1', 
    accent: '#475569',
    desc: 'Stone Grey Note'
  },
  { 
    value: 200, 
    label: '₹200', 
    color: '#c2410c', 
    bg: '#fff7ed', 
    border: '#fed7aa', 
    accent: '#ea580c',
    desc: 'Bright Yellow Note'
  },
  { 
    value: 100, 
    label: '₹100', 
    color: '#4338ca', 
    bg: '#eef2ff', 
    border: '#c7d2fe', 
    accent: '#6366f1',
    desc: 'Lavender Note'
  },
  { 
    value: 50, 
    label: '₹50', 
    color: '#0891b2', 
    bg: '#ecfeff', 
    border: '#a5f3fc', 
    accent: '#06b6d4',
    desc: 'Fluorescent Blue Note'
  },
  { 
    value: 20, 
    label: '₹20', 
    color: '#15803d', 
    bg: '#f0fdf4', 
    border: '#bbf7d0', 
    accent: '#22c55e',
    desc: 'Greenish Yellow Note'
  },
  { 
    value: 10, 
    label: '₹10', 
    color: '#92400e', 
    bg: '#fef3c7', 
    border: '#fde68a', 
    accent: '#d97706',
    desc: 'Chocolate Brown Note'
  }
];

export default function CashDenominationView() {
  const { 
    data, 
    activeDate, 
    getDateMetrics, 
    saveCashDenomination, 
    showToast 
  } = useFuel();

  const metrics = getDateMetrics(activeDate);

  // Load existing saved denominations for active date if available
  const savedRecord = data.cashDenominations?.[activeDate];

  // Denomination Counts State
  const [counts, setCounts] = useState(() => {
    if (savedRecord?.counts) {
      return savedRecord.counts;
    }
    return {
      500: '',
      200: '',
      100: '',
      50: '',
      20: '',
      10: '',
      coins: ''
    };
  });

  // Track if user has coins enabled
  const [includeCoins, setIncludeCoins] = useState(() => {
    return !!(savedRecord?.counts?.coins && parseFloat(savedRecord.counts.coins) > 0);
  });

  // Shift & Cashier Note
  const [cashierName, setCashierName] = useState(() => {
    const s = data.staff.find(st => st.status === 'Active');
    return s ? s.name : 'Duty Operator';
  });
  const [shiftNote, setShiftNote] = useState('');
  const [copied, setCopied] = useState(false);

  // Sync state if activeDate changes
  useEffect(() => {
    const record = data.cashDenominations?.[activeDate];
    if (record?.counts) {
      setCounts(record.counts);
      setShiftNote(record.shiftNote || '');
      if (record.cashierName) setCashierName(record.cashierName);
    } else {
      setCounts({
        500: '',
        200: '',
        100: '',
        50: '',
        20: '',
        10: '',
        coins: ''
      });
      setShiftNote('');
    }
  }, [activeDate, data.cashDenominations]);

  // Safe input handler preventing negative numbers
  const handleCountChange = (valKey, rawValue) => {
    // Empty string allowed
    if (rawValue === '' || rawValue === null || rawValue === undefined) {
      setCounts(prev => ({ ...prev, [valKey]: '' }));
      return;
    }

    // Strip negative signs and non-numeric characters
    const sanitized = String(rawValue).replace(/[^0-9]/g, '');
    if (!sanitized) {
      setCounts(prev => ({ ...prev, [valKey]: '' }));
      return;
    }
    const num = parseInt(sanitized, 10);

    if (isNaN(num) || num < 0) {
      setCounts(prev => ({ ...prev, [valKey]: '' }));
    } else {
      setCounts(prev => ({ ...prev, [valKey]: String(num) }));
    }
  };

  // Stepper increment/decrement
  const handleStep = (valKey, delta) => {
    const current = parseInt(counts[valKey], 10) || 0;
    const nextVal = Math.max(0, current + delta);
    setCounts(prev => ({
      ...prev,
      [valKey]: nextVal === 0 ? '' : String(nextVal)
    }));
  };

  // Quick preset adder
  const handleAddPreset = (valKey, addAmount) => {
    const current = parseInt(counts[valKey], 10) || 0;
    const nextVal = current + addAmount;
    setCounts(prev => ({
      ...prev,
      [valKey]: String(nextVal)
    }));
  };

  // Coins handler
  const handleCoinsChange = (val) => {
    const clean = val.replace(/[^0-9.]/g, '');
    setCounts(prev => ({ ...prev, coins: clean }));
  };

  // Computed row calculations and grand totals
  const breakdown = useMemo(() => {
    let totalNotesCount = 0;
    let grandTotal = 0;

    const rows = NOTE_DENOMINATIONS.map(denom => {
      const notes = parseInt(counts[denom.value], 10) || 0;
      const subtotal = denom.value * notes;
      totalNotesCount += notes;
      grandTotal += subtotal;

      return {
        ...denom,
        notes,
        notesRaw: counts[denom.value] || '',
        calculation: `${denom.value} × ${notes}`,
        subtotal,
        subtotalFormatted: formatINRCurrency(subtotal)
      };
    });

    const coinsVal = includeCoins ? (parseFloat(counts.coins) || 0) : 0;
    grandTotal += coinsVal;

    return {
      rows,
      totalNotesCount,
      coinsVal,
      grandTotal,
      grandTotalFormatted: formatINRCurrency(grandTotal)
    };
  }, [counts, includeCoins]);

  // Reset all
  const handleReset = () => {
    setCounts({
      500: '',
      200: '',
      100: '',
      50: '',
      20: '',
      10: '',
      coins: ''
    });
    showToast('All denomination counts reset to 0.', 'info');
  };

  // Load Specification Example (₹7,000 Grand Total: 10 notes of ₹500, 5 notes of ₹200, 10 notes of ₹100)
  const handleLoadExample = () => {
    setCounts({
      500: '10',
      200: '5',
      100: '10',
      50: '',
      20: '',
      10: '',
      coins: ''
    });
    setIncludeCoins(false);
    showToast('Loaded requirement example (₹500×10 + ₹200×5 + ₹100×10 = ₹7,000).', 'info');
  };

  // Save to Context
  const handleSave = () => {
    saveCashDenomination(activeDate, {
      counts,
      grandTotal: breakdown.grandTotal,
      totalNotesCount: breakdown.totalNotesCount,
      cashierName,
      shiftNote
    });
  };

  // Copy Summary text to clipboard
  const handleCopySummary = () => {
    let text = `FAIZAL PETROL PUMP - CASH DENOMINATION\n`;
    text += `Date: ${formatDate(activeDate)}\n`;
    text += `Cashier / Operator: ${cashierName}\n`;
    text += `-------------------------------------------\n`;
    text += `Denomination | Notes | Calculation | Amount\n`;
    text += `-------------------------------------------\n`;

    breakdown.rows.forEach(r => {
      text += `${r.label.padEnd(12)} | ${String(r.notes).padStart(5)} | ${r.calculation.padEnd(11)} | ${r.subtotalFormatted}\n`;
    });

    if (includeCoins && breakdown.coinsVal > 0) {
      text += `Coins / Change |   -   |      -      | ${formatINRCurrency(breakdown.coinsVal)}\n`;
    }

    text += `-------------------------------------------\n`;
    text += `Total Notes: ${breakdown.totalNotesCount}\n`;
    text += `GRAND TOTAL: ${breakdown.grandTotalFormatted}\n`;
    text += `In Words: ${numberToIndianWords(breakdown.grandTotal)}\n`;
    if (shiftNote) {
      text += `Shift Remarks: ${shiftNote}\n`;
    }
    text += `===========================================`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      showToast('Denomination breakdown copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {
      showToast('Failed to copy to clipboard.', 'error');
    });
  };

  // Print slip
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="dealer-tag" style={{ backgroundColor: 'var(--fuel-petrol-bg)', color: 'var(--fuel-petrol)', borderColor: 'var(--fuel-petrol-border)' }}>
              Cash Management
            </span>
            <h1>Cash Denomination</h1>
          </div>
          <p>
            Indian Currency Cash Denomination Calculator • Instant auto-calculation for ₹500, ₹200, ₹100, ₹50, ₹20 & ₹10 notes
          </p>
        </div>

        <div className="page-actions no-print">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleLoadExample}
            title="Load requirement example (10×₹500, 5×₹200, 10×₹100 = ₹7,000)"
          >
            <Sparkles size={16} color="var(--primary)" />
            <span>Load Example (₹7,000)</span>
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleCopySummary}
            title="Copy denomination summary to clipboard"
          >
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handlePrint}
            title="Print denomination handover slip"
          >
            <Printer size={16} />
            <span>Print Slip</span>
          </button>

          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleReset}
            title="Clear all note counts"
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>

          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSave}
            title="Save denomination snapshot for active date"
          >
            <Save size={16} />
            <span>Save Count</span>
          </button>
        </div>
      </div>

      {/* Grand Total Hero Banner */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #0b1329 0%, #172554 100%)', 
        color: '#ffffff',
        border: '1px solid #1e293b',
        boxShadow: '0 10px 25px -5px rgba(11, 19, 41, 0.4)'
      }}>
        <div className="card-body" style={{ padding: '24px 28px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--cyan)' }}>
                <Calculator size={18} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Grand Total Cash Counted
                </span>
              </div>
              <div className="mono-num" style={{ fontSize: '2.5rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.1 }}>
                {breakdown.grandTotalFormatted}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontStyle: 'italic', marginTop: '2px' }}>
                {numberToIndianWords(breakdown.grandTotal)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                padding: '12px 20px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid rgba(255, 255, 255, 0.12)',
                minWidth: '140px'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Notes
                </div>
                <div className="mono-num" style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--cyan)' }}>
                  {breakdown.totalNotesCount}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Currency count</div>
              </div>

              <div style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.08)', 
                padding: '12px 20px', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid rgba(255, 255, 255, 0.12)',
                minWidth: '160px'
              }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                  Shift / Active Date
                </div>
                <div className="mono-num" style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                  {formatDate(activeDate)}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{cashierName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Side-by-Side Denomination Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Banknote size={20} color="var(--primary)" />
            <span>Denomination Breakdown (Side-by-Side View)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Auto-updating calculation
            </span>
          </div>
        </div>

        <div className="card-body" style={{ padding: '16px 20px' }}>
          {/* Responsive Side-by-Side Table */}
          <div className="table-responsive">
            <table className="data-table" style={{ verticalAlign: 'middle' }}>
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Denomination</th>
                  <th style={{ width: '320px' }}>Number of Notes</th>
                  <th style={{ width: '180px', textAlign: 'center' }}>Calculation</th>
                  <th style={{ width: '180px', textAlign: 'right' }}>Calculated Total</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.rows.map((row) => (
                  <tr key={row.value} style={{ transition: 'background-color 0.15s ease' }}>
                    {/* Column 1: Denomination */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          minWidth: '70px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: row.bg,
                          color: row.color,
                          border: `1.5px solid ${row.border}`,
                          fontWeight: 800,
                          fontSize: '1rem',
                          textAlign: 'center',
                          boxShadow: 'var(--shadow-sm)'
                        }} className="mono-num">
                          {row.label}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                            {row.label} Note
                          </span>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {row.desc}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Column 2: Number of Notes with Stepper & Presets */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStep(row.value, -1)}
                            disabled={!row.notes || row.notes <= 0}
                            style={{ width: '32px', height: '36px', padding: 0 }}
                            title="Decrease 1 note"
                          >
                            <Minus size={14} />
                          </button>

                          <input
                            type="number"
                            min="0"
                            className="form-control mono-num"
                            style={{ 
                              width: '110px', 
                              height: '36px', 
                              textAlign: 'center', 
                              fontSize: '1rem',
                              fontWeight: 700,
                              borderColor: row.notes > 0 ? 'var(--primary)' : 'var(--border-color)',
                              backgroundColor: row.notes > 0 ? 'var(--primary-light)' : '#ffffff'
                            }}
                            placeholder="0"
                            value={row.notesRaw}
                            onKeyDown={(e) => {
                              if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) => handleCountChange(row.value, e.target.value)}
                          />

                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleStep(row.value, 1)}
                            style={{ width: '32px', height: '36px', padding: 0 }}
                            title="Add 1 note"
                          >
                            <Plus size={14} />
                          </button>

                          {/* Quick Increment Preset Chips */}
                          <div style={{ display: 'flex', gap: '4px', marginLeft: '6px' }}>
                            <button
                              type="button"
                              className="preset-chip"
                              onClick={() => handleAddPreset(row.value, 5)}
                              style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                              title="Add 5 notes"
                            >
                              +5
                            </button>
                            <button
                              type="button"
                              className="preset-chip"
                              onClick={() => handleAddPreset(row.value, 10)}
                              style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                              title="Add 10 notes"
                            >
                              +10
                            </button>
                            <button
                              type="button"
                              className="preset-chip"
                              onClick={() => handleAddPreset(row.value, 50)}
                              style={{ padding: '3px 7px', fontSize: '0.72rem' }}
                              title="Add 50 notes"
                            >
                              +50
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Column 3: Side-by-side Calculation Formula */}
                    <td style={{ textAlign: 'center' }}>
                      <span className="mono-num" style={{ 
                        fontSize: '0.9rem', 
                        color: row.notes > 0 ? 'var(--text-secondary)' : 'var(--text-muted)',
                        padding: '4px 10px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-block'
                      }}>
                        {row.calculation}
                      </span>
                    </td>

                    {/* Column 4: Side-by-side Calculated Total */}
                    <td style={{ textAlign: 'right' }}>
                      <span className="mono-num" style={{ 
                        fontSize: '1.15rem', 
                        fontWeight: 800, 
                        color: row.notes > 0 ? 'var(--text-primary)' : 'var(--text-muted)' 
                      }}>
                        {row.subtotalFormatted}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Optional Coins / Change Row */}
                {includeCoins && (
                  <tr style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                          minWidth: '70px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: '#f8fafc',
                          color: 'var(--text-secondary)',
                          border: '1.5px solid var(--border-color)',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          textAlign: 'center'
                        }}>
                          Coins
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Coins / Loose Change</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control mono-num"
                        style={{ width: '140px', height: '36px' }}
                        placeholder="0.00"
                        value={counts.coins || ''}
                        onChange={(e) => handleCoinsChange(e.target.value)}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Loose cash</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="mono-num" style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                        {formatINRCurrency(breakdown.coinsVal)}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Table Footer with Grand Total */}
              <tfoot>
                <tr style={{ backgroundColor: 'var(--bg-subtle)', borderTop: '2px solid var(--border-dark)' }}>
                  <td>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Grand Total
                    </strong>
                  </td>
                  <td>
                    <span className="mono-num" style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {breakdown.totalNotesCount} Total Notes
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      All notes summed
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <strong className="mono-num" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {breakdown.grandTotalFormatted}
                    </strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Toggle Coins row */}
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIncludeCoins(prev => !prev)}
            >
              {includeCoins ? '− Hide Coins Row' : '+ Include Coins / Loose Cash'}
            </button>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Negative values are prevented • Zero or empty values are treated as 0
            </span>
          </div>
        </div>
      </div>

      {/* Shift Operator & Reconciliation Card */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Shift Details & Remarks */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Receipt size={18} color="var(--primary)" />
              <span>Shift Handover Details</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="cashier-select">
                <span>Duty Cashier / Shift Operator</span>
              </label>
              <select
                id="cashier-select"
                className="form-control"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
              >
                {data.staff.map((s) => (
                  <option key={s.id} value={`${s.name} (${s.role})`}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="denom-notes">
                <span>Shift Notes / Cash Handover Remarks</span>
              </label>
              <textarea
                id="denom-notes"
                className="form-control"
                placeholder="e.g. Morning shift counter cash handed over to supervisor Priya"
                value={shiftNote}
                onChange={(e) => setShiftNote(e.target.value)}
                style={{ minHeight: '65px' }}
              />
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              style={{ marginTop: '4px' }}
            >
              <Save size={16} />
              <span>Save Denomination Record</span>
            </button>
          </div>
        </div>

        {/* Live Daily Closing Reconciliation */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShieldCheck size={18} color="var(--fuel-petrol)" />
              <span>Reconciliation with Daily Closing</span>
            </div>
            <span className="mono-num" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {formatDate(activeDate)}
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Cash Counted (Denominations):</span>
              <strong className="mono-num" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                {breakdown.grandTotalFormatted}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Expected Cash from Sales & Expenses:</span>
              <strong className="mono-num" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {formatINRCurrency(metrics.expectedCash)}
              </strong>
            </div>

            {/* Difference */}
            {(() => {
              const diff = breakdown.grandTotal - metrics.expectedCash;
              const isMatched = Math.abs(diff) < 0.01;
              const isShort = diff < -0.01;
              const statusClass = isMatched ? 'matched' : (isShort ? 'short' : 'excess');
              const statusLabel = isMatched ? 'Perfect Match' : (isShort ? `Short by ${formatINRCurrency(Math.abs(diff))}` : `Excess by ${formatINRCurrency(diff)}`);

              return (
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 14px', 
                  backgroundColor: isMatched ? 'var(--fuel-petrol-bg)' : (isShort ? 'var(--danger-bg)' : 'var(--warning-bg)'),
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isMatched ? 'var(--fuel-petrol-border)' : (isShort ? '#fca5a5' : '#fcd34d')}`
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`status-badge ${statusClass}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                      {statusLabel}
                    </span>
                  </div>
                  <span className="mono-num" style={{ fontWeight: 800, fontSize: '1rem', color: isMatched ? 'var(--fuel-petrol)' : (isShort ? 'var(--danger)' : '#b45309') }}>
                    {diff >= 0 ? `+${formatINRCurrency(diff)}` : `-${formatINRCurrency(Math.abs(diff))}`}
                  </span>
                </div>
              );
            })()}

            <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
              Expected Cash = Opening Cash (₹{Number(metrics.openingCash).toLocaleString('en-IN')}) + Cash Sales (₹{Number(metrics.cashSales).toLocaleString('en-IN')}) - Cash Expenses (₹{Number(metrics.cashExpenses).toLocaleString('en-IN')})
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
