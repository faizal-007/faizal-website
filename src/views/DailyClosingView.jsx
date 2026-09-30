import React, { useState, useEffect, useMemo } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatLitres, formatDate } from '../utils/formatters';
import { 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Unlock, 
  Calculator, 
  Banknote, 
  ShieldAlert, 
  IndianRupee, 
  FileText, 
  Printer,
  History
} from 'lucide-react';
import Modal from '../components/Modal';
import { triggerPrint } from '../utils/exportUtils';

export default function DailyClosingView() {
  const { 
    data, 
    activeDate, 
    getDateMetrics, 
    saveDailyClosing, 
    reopenDailyClosing, 
    isDayClosed,
    showToast 
  } = useFuel();

  const metrics = getDateMetrics(activeDate);
  const closingRecord = metrics.closing;
  const isLocked = isDayClosed(activeDate);

  // Closing Input State
  const [openingCash, setOpeningCash] = useState(() => {
    return closingRecord?.openingCash ?? (data.settings.defaultOpeningCash || 25000);
  });
  const [cashAdjustments, setCashAdjustments] = useState(() => closingRecord?.cashAdjustments ?? 0);
  const [adjustmentReason, setAdjustmentReason] = useState(() => closingRecord?.adjustmentReason ?? '');
  const [closedBy, setClosedBy] = useState(() => {
    const sup = data.staff.find(s => s.role === 'Supervisor' || s.role === 'Cashier');
    return sup ? `${sup.name} (${sup.role})` : 'Priya Sharma (Supervisor)';
  });

  // Indian Currency Denominations Counter State
  const [denominations, setDenominations] = useState(() => {
    if (closingRecord?.denominations) return closingRecord.denominations;
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

  const [useDenominations, setUseDenominations] = useState(true);
  const [manualCountedCash, setManualCountedCash] = useState(() => closingRecord?.actualCashCounted ?? '');

  // Calculate actual cash from denominations
  const denomTotal = useMemo(() => {
    const n500 = (parseInt(denominations[500]) || 0) * 500;
    const n200 = (parseInt(denominations[200]) || 0) * 200;
    const n100 = (parseInt(denominations[100]) || 0) * 100;
    const n50 = (parseInt(denominations[50]) || 0) * 50;
    const n20 = (parseInt(denominations[20]) || 0) * 20;
    const n10 = (parseInt(denominations[10]) || 0) * 10;
    const coins = parseFloat(denominations.coins) || 0;
    return n500 + n200 + n100 + n50 + n20 + n10 + coins;
  }, [denominations]);

  const actualCashCounted = useDenominations ? denomTotal : (parseFloat(manualCountedCash) || 0);

  // Sync inputs if activeDate or existing closing record changes
  useEffect(() => {
    if (closingRecord) {
      setOpeningCash(closingRecord.openingCash);
      setCashAdjustments(closingRecord.cashAdjustments);
      setAdjustmentReason(closingRecord.adjustmentReason || '');
      if (closingRecord.denominations) {
        setDenominations(closingRecord.denominations);
        setUseDenominations(true);
      } else {
        setManualCountedCash(closingRecord.actualCashCounted);
        setUseDenominations(false);
      }
    } else {
      setOpeningCash(data.settings.defaultOpeningCash || 25000);
      setCashAdjustments(0);
      setAdjustmentReason('');
      setDenominations({ 500: '', 200: '', 100: '', 50: '', 20: '', 10: '', coins: '' });
      setManualCountedCash('');
    }
  }, [activeDate, closingRecord, data.settings.defaultOpeningCash]);

  // Expected Cash calculation
  // Expected Cash = Opening Cash + Cash Sales - Cash Expenses + Cash Adjustments
  const expectedCash = (parseFloat(openingCash) || 0) + metrics.cashSales - metrics.cashExpenses + (parseFloat(cashAdjustments) || 0);

  // Cash Difference = Actual Cash Counted - Expected Cash
  const cashDifference = actualCashCounted - expectedCash;

  // Status
  let closingStatus = 'Not Closed';
  if (isLocked && closingRecord) {
    closingStatus = closingRecord.closingStatus;
  } else {
    if (Math.abs(cashDifference) < 0.01) {
      closingStatus = 'Matched';
    } else if (cashDifference < -0.01) {
      closingStatus = 'Short';
    } else {
      closingStatus = 'Excess';
    }
  }

  // Confirmation Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Reopen Modal State
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [reopenPin, setReopenPin] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [reopenUser, setReopenUser] = useState('Priya Sharma (Supervisor)');

  // Handle Close Day Submit
  const handlePerformClosing = () => {
    const payload = {
      openingCash: parseFloat(openingCash) || 0,
      totalSales: {
        Petrol: metrics.petrolSales,
        Diesel: metrics.dieselSales,
        'Power Petrol': metrics.powerPetrolSales,
        total: metrics.totalSales,
        totalLitres: metrics.totalLitres
      },
      paymentBreakdown: {
        Cash: metrics.cashSales,
        GPay: metrics.gpaySales,
        'Other UPI': metrics.otherUpiSales,
        Card: metrics.cardSales,
        total: metrics.totalCollections
      },
      expenses: {
        cash: metrics.cashExpenses,
        digital: metrics.digitalExpenses,
        total: metrics.totalExpenses
      },
      cashAdjustments: parseFloat(cashAdjustments) || 0,
      adjustmentReason: adjustmentReason.trim(),
      expectedCash,
      actualCashCounted,
      denominations: useDenominations ? denominations : null,
      cashDifference,
      closingStatus,
      closedBy
    };

    saveDailyClosing(activeDate, payload);
    setIsConfirmModalOpen(false);
  };

  // Handle Reopen Day
  const handleReopenSubmit = (e) => {
    e.preventDefault();
    const res = reopenDailyClosing(activeDate, reopenPin, reopenReason, reopenUser);
    if (res.success) {
      setIsReopenModalOpen(false);
      setReopenPin('');
      setReopenReason('');
    }
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Daily Closing & End-of-Day Accounting</h1>
          <p>
            Perform formal reconciliation of fuel sales, payment receipts, expenses, and cash drawer for <strong>{formatDate(activeDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={triggerPrint}>
            <Printer size={15} />
            <span>Print Closing Slip</span>
          </button>

          {isLocked ? (
            <button 
              className="btn btn-secondary btn-sm"
              style={{ borderColor: 'var(--warning)', color: 'var(--warning)' }}
              onClick={() => setIsReopenModalOpen(true)}
            >
              <Unlock size={14} />
              <span>Unlock / Reopen Day</span>
            </button>
          ) : (
            <button 
              className="btn btn-success btn-sm"
              onClick={() => setIsConfirmModalOpen(true)}
            >
              <Lock size={14} />
              <span>Submit & Lock Closing</span>
            </button>
          )}
        </div>
      </div>

      {/* Lock Notice Banner */}
      {isLocked && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', backgroundColor: '#ecfdf5', borderRadius: '10px', border: '1px solid #a7f3d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircle2 size={24} color="#059669" />
            <div>
              <div style={{ fontWeight: '700', color: '#065f46' }}>
                Accounts Locked for {formatDate(activeDate)} • Status: {closingRecord?.closingStatus}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                Closed by {closingRecord?.closedBy} on {new Date(closingRecord?.closedAt).toLocaleString('en-IN')}. Transactions cannot be altered unless reopened.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsReopenModalOpen(true)}
          >
            <Unlock size={13} /> Supervisor Reopen
          </button>
        </div>
      )}

      {/* Status Summary Highlight Banner */}
      <div 
        className="card" 
        style={{ 
          background: closingStatus === 'Matched' ? '#f0fdf4' : closingStatus === 'Short' ? '#fef2f2' : closingStatus === 'Excess' ? '#fffbeb' : '#f8fafc',
          borderColor: closingStatus === 'Matched' ? '#86efac' : closingStatus === 'Short' ? '#fca5a5' : closingStatus === 'Excess' ? '#fde68a' : 'var(--border-color)'
        }}
      >
        <div className="card-body" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '700', color: 'var(--text-secondary)' }}>
              Cash Reconciliation Result
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <span className={`status-badge ${closingStatus.toLowerCase()}`} style={{ fontSize: '0.9rem', padding: '4px 12px' }}>
                {closingStatus}
              </span>
              <span className="mono-num" style={{ fontSize: '1.4rem', fontWeight: '800', color: closingStatus === 'Matched' ? 'var(--success)' : closingStatus === 'Short' ? 'var(--danger)' : 'var(--warning)' }}>
                Difference: {formatINR(cashDifference)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>EXPECTED CASH</div>
              <div className="mono-num" style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                {formatINR(expectedCash)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ACTUAL CASH COUNTED</div>
              <div className="mono-num" style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--primary)' }}>
                {formatINR(actualCashCounted)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 4 Core Sections A, B, C, D */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Section A: Total Fuel Sales */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>A</span>
              <span>Total Fuel Sales</span>
            </div>
            <span className="mono-num font-bold" style={{ color: 'var(--primary)' }}>
              {formatINR(metrics.totalSales)}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Petrol Sales:</span>
              <span className="mono-num font-semibold">{formatINR(metrics.petrolSales)} <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>({metrics.petrolLitres.toFixed(1)}L)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Diesel Sales:</span>
              <span className="mono-num font-semibold">{formatINR(metrics.dieselSales)} <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>({metrics.dieselLitres.toFixed(1)}L)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Power Petrol Sales:</span>
              <span className="mono-num font-semibold">{formatINR(metrics.powerPetrolSales)} <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>({metrics.powerPetrolLitres.toFixed(1)}L)</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', paddingTop: '4px', fontWeight: '700' }}>
              <span>Gross Sales:</span>
              <span className="mono-num" style={{ color: 'var(--primary)' }}>{formatINR(metrics.totalSales)}</span>
            </div>
          </div>
        </div>

        {/* Section B: Payment Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--cyan-light)', color: 'var(--cyan)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>B</span>
              <span>Payment Breakdown</span>
            </div>
            <span className="mono-num font-bold">
              {formatINR(metrics.totalCollections)}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cash Sales:</span>
              <span className="mono-num font-semibold" style={{ color: 'var(--fuel-petrol)' }}>{formatINR(metrics.cashSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Google Pay (GPay):</span>
              <span className="mono-num font-semibold">{formatINR(metrics.gpaySales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Other UPI (PhonePe/Paytm):</span>
              <span className="mono-num font-semibold">{formatINR(metrics.otherUpiSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Card / POS Collections:</span>
              <span className="mono-num font-semibold">{formatINR(metrics.cardSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', paddingTop: '4px', fontWeight: '700' }}>
              <span>Total Collections:</span>
              <span className="mono-num">{formatINR(metrics.totalCollections)}</span>
            </div>
          </div>
        </div>

        {/* Section C: Expenses Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--danger-bg)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>C</span>
              <span>Daily Expenses</span>
            </div>
            <span className="mono-num font-bold" style={{ color: 'var(--danger)' }}>
              {formatINR(metrics.totalExpenses)}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cash Paid Expenses:</span>
              <span className="mono-num font-semibold" style={{ color: 'var(--danger)' }}>- {formatINR(metrics.cashExpenses)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Digital Paid Expenses:</span>
              <span className="mono-num font-semibold">{formatINR(metrics.digitalExpenses)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Impact on Physical Cash:</span>
              <span className="mono-num font-semibold" style={{ color: 'var(--danger)' }}>- {formatINR(metrics.cashExpenses)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', paddingTop: '4px', fontWeight: '700' }}>
              <span>Total Expenses:</span>
              <span className="mono-num" style={{ color: 'var(--danger)' }}>{formatINR(metrics.totalExpenses)}</span>
            </div>
          </div>
        </div>

        {/* Section D: Expected Cash Formula Card */}
        <div className="card" style={{ borderColor: 'var(--primary-border)' }}>
          <div className="card-header">
            <div className="card-title">
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--fuel-petrol-bg)', color: 'var(--fuel-petrol)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>D</span>
              <span>Expected Cash Formula</span>
            </div>
            <span className="mono-num font-bold" style={{ color: 'var(--primary)' }}>
              {formatINR(expectedCash)}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Opening Cash Balance:</span>
              <span className="mono-num font-semibold">+ {formatINR(openingCash)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cash Fuel Sales:</span>
              <span className="mono-num font-semibold" style={{ color: 'var(--fuel-petrol)' }}>+ {formatINR(metrics.cashSales)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cash Expenses Paid:</span>
              <span className="mono-num font-semibold" style={{ color: 'var(--danger)' }}>- {formatINR(metrics.cashExpenses)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', paddingBottom: '6px', borderBottom: '1px solid var(--border-color)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Cash Adjustments:</span>
              <span className="mono-num font-semibold">{cashAdjustments >= 0 ? `+ ${formatINR(cashAdjustments)}` : `- ${formatINR(Math.abs(cashAdjustments))}`}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', paddingTop: '4px', fontWeight: '700' }}>
              <span>Expected Cash on Hand:</span>
              <span className="mono-num" style={{ color: 'var(--primary)' }}>{formatINR(expectedCash)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Counting & Denomination Section */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Banknote size={18} color="var(--fuel-petrol)" />
            <span>Actual Physical Cash Counted (Cash Drawer)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className={`date-quick-btn ${useDenominations ? 'active' : ''}`}
              onClick={() => setUseDenominations(true)}
              disabled={isLocked}
            >
              Indian Denominations (₹500, ₹200, ...)
            </button>
            <button
              type="button"
              className={`date-quick-btn ${!useDenominations ? 'active' : ''}`}
              onClick={() => setUseDenominations(false)}
              disabled={isLocked}
            >
              Direct Lumpsum Amount
            </button>
          </div>
        </div>

        <div className="card-body">
          {useDenominations ? (
            <div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Enter the physical note counts counted from the safe/till at shift close:
              </p>

              <div className="denom-grid">
                {[
                  { note: '500', label: '₹500 Notes', mult: 500 },
                  { note: '200', label: '₹200 Notes', mult: 200 },
                  { note: '100', label: '₹100 Notes', mult: 100 },
                  { note: '50', label: '₹50 Notes', mult: 50 },
                  { note: '20', label: '₹20 Notes', mult: 20 },
                  { note: '10', label: '₹10 Notes', mult: 10 },
                ].map(({ note, label, mult }) => {
                  const count = parseInt(denominations[note]) || 0;
                  const sub = count * mult;
                  return (
                    <div key={note} className="denom-item">
                      <label className="denom-label">{label}</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control mono-num"
                        placeholder="0"
                        value={denominations[note]}
                        onChange={(e) => setDenominations(prev => ({ ...prev, [note]: e.target.value }))}
                        disabled={isLocked}
                      />
                      <div className="denom-subtotal">
                        = {formatINR(sub)}
                      </div>
                    </div>
                  );
                })}

                {/* Coins */}
                <div className="denom-item">
                  <label className="denom-label">Coins & Loose Cash (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-control mono-num"
                    placeholder="0.00"
                    value={denominations.coins}
                    onChange={(e) => setDenominations(prev => ({ ...prev, coins: e.target.value }))}
                    disabled={isLocked}
                  />
                  <div className="denom-subtotal">
                    = {formatINR(parseFloat(denominations.coins) || 0)}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '16px', gap: '12px' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Total Physical Notes & Coins:
                </span>
                <span className="mono-num" style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--primary)' }}>
                  {formatINR(denomTotal)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: '360px' }}>
              <label className="form-label">Total Actual Cash Counted (₹) <span className="req">*</span></label>
              <input
                type="number"
                step="0.01"
                className="form-control mono-num"
                style={{ fontSize: '1.25rem', fontWeight: '700' }}
                placeholder="₹0.00"
                value={manualCountedCash}
                onChange={(e) => setManualCountedCash(e.target.value)}
                disabled={isLocked}
              />
            </div>
          )}

          {/* Opening Cash & Cash Adjustments Inputs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
            <div className="form-group">
              <label className="form-label">Opening Float Cash (₹)</label>
              <input
                type="number"
                step="0.01"
                className="form-control mono-num"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                disabled={isLocked}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Cash Adjustment (₹) (+ / -)</label>
              <input
                type="number"
                step="0.01"
                className="form-control mono-num"
                placeholder="0.00"
                value={cashAdjustments}
                onChange={(e) => setCashAdjustments(e.target.value)}
                disabled={isLocked}
              />
            </div>

            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Adjustment Reason / Notes</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Bank cash deposit during mid-shift / roundoff error"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                disabled={isLocked}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Closing Officer</label>
              <input
                type="text"
                className="form-control"
                value={closedBy}
                onChange={(e) => setClosedBy(e.target.value)}
                disabled={isLocked}
              />
            </div>
          </div>

          {/* Action Button */}
          {!isLocked && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                type="button" 
                className="btn btn-success"
                onClick={() => setIsConfirmModalOpen(true)}
              >
                <CheckCircle2 size={16} />
                <span>Verify & Complete Daily Closing</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title={`Confirm Daily Closing for ${formatDate(activeDate)}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.85rem' }}>
              Please review closing reconciliation summary before locking accounts:
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Sales:</span>
                <span className="mono-num font-bold">{formatINR(metrics.totalSales)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Expected Cash:</span>
                <span className="mono-num font-bold">{formatINR(expectedCash)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Actual Cash Counted:</span>
                <span className="mono-num font-bold">{formatINR(actualCashCounted)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                <span>Reconciliation Status:</span>
                <span className={`status-badge ${closingStatus.toLowerCase()}`}>{closingStatus} ({formatINR(cashDifference)})</span>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Locking this day will prevent accidental modifications to fuel transactions and expenses unless reopened by an authorized supervisor PIN.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setIsConfirmModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-success" onClick={handlePerformClosing}>
                <Lock size={15} /> Confirm & Lock Closing
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Supervisor Unlock / Reopen Modal */}
      {isReopenModalOpen && (
        <Modal
          isOpen={isReopenModalOpen}
          onClose={() => setIsReopenModalOpen(false)}
          title={`Supervisor Authorization: Unlock Accounts for ${formatDate(activeDate)}`}
        >
          <form onSubmit={handleReopenSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: 'var(--warning-bg)', borderRadius: '8px', color: '#92400e', fontSize: '0.85rem' }}>
                <ShieldAlert size={20} style={{ flexShrink: 0 }} />
                <span>
                  Reopening this date will unlock entries for editing. An immutable audit log will record your name, timestamp, and justification reason.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Supervisor Security PIN <span className="req">*</span></label>
                <input
                  type="password"
                  className="form-control mono-num"
                  placeholder="Enter supervisor PIN (Default: 1234)"
                  value={reopenPin}
                  onChange={(e) => setReopenPin(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Authorized Supervisor Name <span className="req">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={reopenUser}
                  onChange={(e) => setReopenUser(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Audit Reason for Reopening <span className="req">*</span></label>
                <textarea
                  className="form-control"
                  placeholder="e.g. Received late shift meter adjustment / correct diesel entry voucher"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsReopenModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Unlock size={15} /> Authorize & Unlock
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
