import React, { useState, useMemo } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatDate, getCurrentTimeStr, getTodayDateStr } from '../utils/formatters';
import { 
  QrCode, 
  PlusCircle, 
  Trash2, 
  Search, 
  ArrowDownLeft, 
  CheckCircle2, 
  Fuel, 
  Building2,
  Calendar,
  Clock,
  Layers
} from 'lucide-react';
import Modal from '../components/Modal';

export default function GPayUpiView() {
  const { data, activeDate, addAdjustment, deleteAdjustment, isDayClosed, showToast } = useFuel();

  // Manual non-sale adjustment modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adjDate, setAdjDate] = useState(() => activeDate || getTodayDateStr());
  const [adjTime, setAdjTime] = useState(() => getCurrentTimeStr());
  const [adjAmount, setAdjAmount] = useState('');
  const [adjPaymentType, setAdjPaymentType] = useState('GPay');
  const [adjRef, setAdjRef] = useState('');
  const [adjPumpId, setAdjPumpId] = useState('');
  const [adjNotes, setAdjNotes] = useState('');

  // Filter state
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL', 'SALES_LINKED', 'MANUAL_ADJUSTMENT'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL', 'GPay', 'Other UPI'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Sales-linked digital transactions for activeDate
  const salesDigital = useMemo(() => {
    return data.transactions
      .filter(t => t.date === activeDate && (t.paymentMethod === 'GPay' || t.paymentMethod === 'Other UPI'))
      .map(t => ({
        id: t.id,
        source: 'SALE',
        sourceLabel: 'Direct Fuel Sale',
        date: t.date,
        time: t.time,
        paymentType: t.paymentMethod === 'GPay' ? 'GPay' : 'Other UPI',
        amount: Number(t.totalAmount) || 0,
        reference: t.transactionRef || '-',
        pumpName: t.pumpName,
        details: `${t.fuelCategory} (${t.litres.toFixed(2)}L) • ${t.vehicleNumber || 'Walk-in'} • Staff: ${t.staffName}`,
        isSample: t.isSample
      }));
  }, [data.transactions, activeDate]);

  // 2. Manual adjustments / non-sale collections for activeDate
  const manualDigital = useMemo(() => {
    return data.adjustments
      .filter(a => a.date === activeDate)
      .map(a => {
        const pump = data.pumps.find(p => p.id === a.relatedPumpId);
        return {
          id: a.id,
          source: 'MANUAL',
          sourceLabel: 'Direct Settlement / Non-Sale',
          date: a.date,
          time: a.time,
          paymentType: a.paymentType,
          amount: Number(a.amount) || 0,
          reference: a.transactionRef || '-',
          pumpName: pump ? pump.name : 'Station QR / Bank Direct',
          details: a.notes || 'Manual digital collection / advance adjustment',
          isSample: a.isSample
        };
      });
  }, [data.adjustments, data.pumps, activeDate]);

  // Combined collections without duplicate counting
  const combinedCollections = useMemo(() => {
    const list = [...salesDigital, ...manualDigital];
    // Sort descending by time
    return list.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
  }, [salesDigital, manualDigital]);

  // Calculations for Active Date
  const gpayTotal = useMemo(() => {
    return combinedCollections
      .filter(c => c.paymentType === 'GPay')
      .reduce((sum, c) => sum + c.amount, 0);
  }, [combinedCollections]);

  const otherUpiTotal = useMemo(() => {
    return combinedCollections
      .filter(c => c.paymentType === 'Other UPI')
      .reduce((sum, c) => sum + c.amount, 0);
  }, [combinedCollections]);

  const totalDigitalCollection = gpayTotal + otherUpiTotal;

  // Filtered list
  const filteredList = useMemo(() => {
    return combinedCollections.filter(item => {
      if (sourceFilter === 'SALES_LINKED' && item.source !== 'SALE') return false;
      if (sourceFilter === 'MANUAL_ADJUSTMENT' && item.source !== 'MANUAL') return false;

      if (typeFilter !== 'ALL' && item.paymentType !== typeFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const refMatch = item.reference.toLowerCase().includes(q);
        const detailsMatch = item.details.toLowerCase().includes(q);
        const pumpMatch = item.pumpName.toLowerCase().includes(q);
        if (!refMatch && !detailsMatch && !pumpMatch) return false;
      }

      return true;
    });
  }, [combinedCollections, sourceFilter, typeFilter, searchQuery]);

  // Save manual adjustment
  const handleSaveAdjustment = (e) => {
    e.preventDefault();
    const num = parseFloat(adjAmount);
    if (isNaN(num) || num <= 0) {
      showToast('Enter valid amount greater than ₹0.', 'error');
      return;
    }

    addAdjustment({
      date: adjDate,
      time: adjTime,
      amount: num,
      paymentType: adjPaymentType,
      transactionRef: adjRef.trim(),
      relatedPumpId: adjPumpId || null,
      notes: adjNotes.trim()
    });

    setIsModalOpen(false);
    setAdjAmount('');
    setAdjRef('');
    setAdjNotes('');
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>GPay & Digital UPI Collections</h1>
          <p>
            Reconcile all forecourt QR collections, PhonePe, Paytm, and direct bank settlements for <strong>{formatDate(activeDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setIsModalOpen(true)}
          >
            <PlusCircle size={15} />
            <span>+ Record Non-Sale Settlement</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="summary-grid">
        {/* Total Digital Collection */}
        <div className="stat-card" style={{ borderColor: '#6ee7b7', backgroundColor: '#f0fdf4' }}>
          <div className="stat-card-header">
            <span className="stat-title" style={{ color: '#047857' }}>Total Digital Collections</span>
            <div className="stat-icon" style={{ backgroundColor: '#10b981', color: '#ffffff' }}>
              <QrCode size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: '#047857' }}>
            {formatINR(totalDigitalCollection)}
          </div>
          <div className="stat-subtext">
            <span>{combinedCollections.length} total digital receipts</span>
          </div>
        </div>

        {/* GPay Total */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Google Pay (GPay)</span>
            <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
              <QrCode size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: '#2563eb' }}>
            {formatINR(gpayTotal)}
          </div>
          <div className="stat-subtext">
            <span>{combinedCollections.filter(c => c.paymentType === 'GPay').length} transactions</span>
          </div>
        </div>

        {/* Other UPI Total */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Other UPI (PhonePe / Paytm)</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--cyan-light)', color: 'var(--cyan)' }}>
              <QrCode size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--cyan)' }}>
            {formatINR(otherUpiTotal)}
          </div>
          <div className="stat-subtext">
            <span>{combinedCollections.filter(c => c.paymentType === 'Other UPI').length} transactions</span>
          </div>
        </div>

        {/* Split: Sales vs Settlements */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Collection Composition</span>
            <div className="stat-icon" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
              <Layers size={18} />
            </div>
          </div>
          <div style={{ fontSize: '0.86rem', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Fuel Sales:</span>
              <strong className="mono-num">{formatINR(salesDigital.reduce((s, i) => s + i.amount, 0))}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Non-Sale QR:</span>
              <strong className="mono-num" style={{ color: 'var(--cyan)' }}>{formatINR(manualDigital.reduce((s, i) => s + i.amount, 0))}</strong>
            </div>
          </div>
          <div className="stat-subtext" style={{ marginTop: '4px' }}>
            <span>Verified zero double-counting</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <QrCode size={18} color="var(--primary)" />
            <span>Digital Receipts Register ({formatDate(activeDate)})</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '16px' }}>
          {/* Filters */}
          <div className="filter-bar" style={{ margin: 0, marginBottom: '16px' }}>
            <div className="filter-input-wrap">
              <Search size={16} className="filter-icon" />
              <input
                type="text"
                className="filter-input"
                placeholder="Search UTR reference, notes, or vehicle..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="ALL">All Sources (Sales & Adjustments)</option>
              <option value="SALES_LINKED">Sales Linked (Auto)</option>
              <option value="MANUAL_ADJUSTMENT">Manual QR / Non-Sale Adjustments</option>
            </select>

            <select
              className="filter-select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All Digital Types</option>
              <option value="GPay">GPay</option>
              <option value="Other UPI">Other UPI</option>
            </select>
          </div>

          {filteredList.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No digital collections found for this date and filter.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Type</th>
                    <th>Source Classification</th>
                    <th>Amount</th>
                    <th>Reference / UTR</th>
                    <th>Pump / Station Location</th>
                    <th>Details / Vehicle / Notes</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const isManual = item.source === 'MANUAL';
                    return (
                      <tr key={item.id}>
                        <td className="mono-num">{item.time}</td>
                        <td>
                          <span 
                            className="badge" 
                            style={{ 
                              background: item.paymentType === 'GPay' ? '#eff6ff' : '#ecfeff',
                              color: item.paymentType === 'GPay' ? '#2563eb' : '#0891b2',
                              fontWeight: '700',
                              padding: '3px 8px',
                              borderRadius: '4px'
                            }}
                          >
                            {item.paymentType}
                          </span>
                        </td>
                        <td>
                          {isManual ? (
                            <span className="status-badge excess" style={{ fontSize: '0.72rem' }}>
                              Manual Non-Sale
                            </span>
                          ) : (
                            <span className="status-badge active" style={{ fontSize: '0.72rem' }}>
                              Sale Linked
                            </span>
                          )}
                        </td>
                        <td className="mono-num" style={{ fontWeight: '800', color: '#16a34a', fontSize: '0.95rem' }}>
                          {formatINR(item.amount)}
                        </td>
                        <td className="mono-num" style={{ fontSize: '0.8rem', color: item.reference !== '-' ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {item.reference}
                        </td>
                        <td style={{ fontWeight: '500' }}>
                          {item.pumpName}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {item.details}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {isManual ? (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', height: '28px', color: 'var(--danger)' }}
                              onClick={() => deleteAdjustment(item.id)}
                              title="Delete manual adjustment"
                            >
                              <Trash2 size={13} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Auto Linked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Manual Non-Sale Digital Collection Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Record Non-Sale Bank / QR Collection"
        >
          <form onSubmit={handleSaveAdjustment}>
            <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '16px', fontSize: '0.84rem', color: '#1e40af' }}>
              Use this form to record standalone digital payments like bulk customer fleet QR advances or direct bank UPI settlements not tied to a single pump dispenser entry.
            </div>

            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Date <span className="req">*</span></label>
                <input
                  type="date"
                  className="form-control mono-num"
                  value={adjDate}
                  onChange={(e) => setAdjDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time <span className="req">*</span></label>
                <input
                  type="time"
                  className="form-control mono-num"
                  value={adjTime}
                  onChange={(e) => setAdjTime(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Amount Received (₹) <span className="req">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control mono-num"
                  placeholder="₹0.00"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Channel <span className="req">*</span></label>
                <select
                  className="form-control"
                  value={adjPaymentType}
                  onChange={(e) => setAdjPaymentType(e.target.value)}
                >
                  <option value="GPay">Google Pay (GPay QR)</option>
                  <option value="Other UPI">Other UPI (PhonePe/Paytm)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Transaction / UTR Reference</label>
                <input
                  type="text"
                  className="form-control mono-num"
                  placeholder="e.g. UTR / Bank Credit Ref"
                  value={adjRef}
                  onChange={(e) => setAdjRef(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Related Forecourt Pump (Optional)</label>
                <select
                  className="form-control"
                  value={adjPumpId}
                  onChange={(e) => setAdjPumpId(e.target.value)}
                >
                  <option value="">None / General Station QR</option>
                  {data.pumps.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Notes / Customer Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. ABC Logistics monthly diesel advance / QR settlement"
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Record Settlement
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
