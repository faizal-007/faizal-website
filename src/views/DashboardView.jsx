import React from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatLitres, formatDate } from '../utils/formatters';
import { 
  IndianRupee, 
  Fuel, 
  Banknote, 
  QrCode, 
  ReceiptIndianRupee, 
  Wallet, 
  ArrowUpRight, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ChevronRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';

export default function DashboardView() {
  const { 
    data, 
    activeDate, 
    getDateMetrics, 
    setActiveTab, 
    openQuickSale,
    setSelectedPumpForDetails 
  } = useFuel();

  const metrics = getDateMetrics(activeDate);
  const closing = metrics.closing;

  // Recent 5 transactions for the active date
  const recentTransactions = data.transactions
    .filter(t => t.date === activeDate)
    .slice(0, 5);

  // Recent 4 expenses for the active date
  const recentExpenses = data.expenses
    .filter(e => e.date === activeDate)
    .slice(0, 4);

  // Compute 7-day trend data
  const trendDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayMetrics = getDateMetrics(dateStr);
    trendDays.push({
      date: dateStr,
      displayDate: formatDate(dateStr).slice(0, 5), // DD-MM
      sales: dayMetrics.totalSales,
      litres: dayMetrics.totalLitres
    });
  }
  const maxTrendSales = Math.max(...trendDays.map(t => t.sales), 1000);

  return (
    <div className="page-content">
      {/* Top Banner / Welcome */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Station Daily Dashboard</h1>
          <p>
            Overview for <strong style={{ color: 'var(--primary)' }}>{formatDate(activeDate)}</strong> • Real-time sales, collections & closing reconciliations
          </p>
        </div>

        <div className="page-actions">
          {metrics.isClosed ? (
            <div className="status-badge matched" style={{ padding: '8px 14px', fontSize: '0.82rem' }}>
              <CheckCircle2 size={16} /> Day Closed ({closing?.closingStatus})
            </div>
          ) : (
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('closing')}
            >
              <Clock size={15} />
              <span>Perform Daily Closing</span>
            </button>
          )}

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => openQuickSale()}
          >
            <Fuel size={15} />
            <span>+ Record Fuel Sale</span>
          </button>
        </div>
      </div>

      {/* 6 Key Summary Cards */}
      <div className="summary-grid">
        {/* Total Sales */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Total Fuel Sales</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--primary)' }}>
            {formatINR(metrics.totalSales)}
          </div>
          <div className="stat-subtext">
            <span>{metrics.transactionCount} entries recorded</span>
          </div>
        </div>

        {/* Total Litres */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Total Litres Sold</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--cyan-light)', color: 'var(--cyan)' }}>
              <Fuel size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--cyan)' }}>
            {formatLitres(metrics.totalLitres)}
          </div>
          <div className="stat-subtext">
            <span>All 10 operational pumps</span>
          </div>
        </div>

        {/* Cash Collected */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Cash Collected</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--fuel-petrol-bg)', color: 'var(--fuel-petrol)' }}>
              <Banknote size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--fuel-petrol)' }}>
            {formatINR(metrics.cashSales)}
          </div>
          <div className="stat-subtext">
            <span>{metrics.totalSales > 0 ? ((metrics.cashSales / metrics.totalSales) * 100).toFixed(0) : 0}% of total volume</span>
          </div>
        </div>

        {/* GPay / UPI Collected */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">GPay / UPI Digital</span>
            <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
              <QrCode size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: '#16a34a' }}>
            {formatINR(metrics.gpaySales + metrics.otherUpiSales)}
          </div>
          <div className="stat-subtext">
            <span>GPay: {formatINR(metrics.gpaySales)} • Other: {formatINR(metrics.otherUpiSales)}</span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Total Expenses</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <ReceiptIndianRupee size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--danger)' }}>
            {formatINR(metrics.totalExpenses)}
          </div>
          <div className="stat-subtext">
            <span>Cash: {formatINR(metrics.cashExpenses)} • Digital: {formatINR(metrics.digitalExpenses)}</span>
          </div>
        </div>

        {/* Expected Cash Balance */}
        <div className="stat-card" style={{ borderColor: 'var(--primary-border)', backgroundColor: '#f0f7ff' }}>
          <div className="stat-card-header">
            <span className="stat-title" style={{ color: 'var(--primary)' }}>Expected Cash Balance</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--primary)', color: '#ffffff' }}>
              <Wallet size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--primary)' }}>
            {formatINR(metrics.expectedCash)}
          </div>
          <div className="stat-subtext">
            <span>Opening ₹{Number(metrics.openingCash).toLocaleString('en-IN')} + Cash - Exp</span>
          </div>
        </div>
      </div>

      {/* Fuel Category Breakdown 3 Cards */}
      <div className="fuel-cards-row">
        {/* Petrol */}
        <div className="fuel-card petrol">
          <div className="fuel-header">
            <div className="fuel-tag petrol">
              <Fuel size={14} /> PETROL
            </div>
            <div className="fuel-rate-pill mono-num">
              Rate: ₹{data.settings.rates.Petrol?.toFixed(2)}/L
            </div>
          </div>
          <div className="fuel-stats-row">
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>TOTAL PETROL SALES</div>
              <div className="fuel-sales-val mono-num" style={{ color: 'var(--fuel-petrol)' }}>
                {formatINR(metrics.petrolSales)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>VOLUME</div>
              <div className="fuel-litres-val mono-num">
                {formatLitres(metrics.petrolLitres)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            4 Dedicated Pumps (P-1, P-2, P-3, P-4)
          </div>
        </div>

        {/* Diesel */}
        <div className="fuel-card diesel">
          <div className="fuel-header">
            <div className="fuel-tag diesel">
              <Fuel size={14} /> DIESEL
            </div>
            <div className="fuel-rate-pill mono-num">
              Rate: ₹{data.settings.rates.Diesel?.toFixed(2)}/L
            </div>
          </div>
          <div className="fuel-stats-row">
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>TOTAL DIESEL SALES</div>
              <div className="fuel-sales-val mono-num" style={{ color: 'var(--fuel-diesel)' }}>
                {formatINR(metrics.dieselSales)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>VOLUME</div>
              <div className="fuel-litres-val mono-num">
                {formatLitres(metrics.dieselLitres)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            4 Heavy & Fleet Pumps (P-5, P-6, P-7, P-8)
          </div>
        </div>

        {/* Power Petrol */}
        <div className="fuel-card power-petrol">
          <div className="fuel-header">
            <div className="fuel-tag power-petrol">
              <Fuel size={14} /> POWER PETROL
            </div>
            <div className="fuel-rate-pill mono-num">
              Rate: ₹{data.settings.rates['Power Petrol']?.toFixed(2)}/L
            </div>
          </div>
          <div className="fuel-stats-row">
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>TOTAL POWER SALES</div>
              <div className="fuel-sales-val mono-num" style={{ color: 'var(--fuel-power)' }}>
                {formatINR(metrics.powerPetrolSales)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>VOLUME</div>
              <div className="fuel-litres-val mono-num">
                {formatLitres(metrics.powerPetrolLitres)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            2 Premium High Octane Pumps (P-9, P-10)
          </div>
        </div>
      </div>

      {/* Charts & Closing Status Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* 7-Day Trend Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp size={18} color="var(--primary)" />
              <span>7-Day Sales Trend</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Daily Gross Fuel Value</span>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingTop: '20px', gap: '8px' }}>
              {trendDays.map((td) => {
                const heightPercent = Math.max(12, Math.round((td.sales / maxTrendSales) * 100));
                const isSelected = td.date === activeDate;
                return (
                  <div key={td.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: '700', color: isSelected ? 'var(--primary)' : 'var(--text-secondary)', marginBottom: '4px' }}>
                      {td.sales > 0 ? `₹${(td.sales / 1000).toFixed(1)}k` : '₹0'}
                    </div>
                    <div 
                      style={{
                        width: '100%',
                        maxWidth: '38px',
                        height: `${heightPercent}%`,
                        backgroundColor: isSelected ? 'var(--primary)' : '#cbd5e1',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                        boxShadow: isSelected ? '0 0 10px rgba(37, 99, 235, 0.4)' : 'none'
                      }}
                      title={`${td.date}: ₹${td.sales.toLocaleString('en-IN')} (${td.litres.toFixed(1)} L)`}
                    />
                    <div style={{ fontSize: '0.72rem', color: isSelected ? 'var(--primary)' : 'var(--text-muted)', marginTop: '6px', fontWeight: isSelected ? '700' : '500' }}>
                      {td.displayDate}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment Method Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <BarChart2 size={18} color="var(--cyan)" />
              <span>Payment Collections Breakdown</span>
            </div>
            <span className="mono-num" style={{ fontSize: '0.8rem', fontWeight: '700' }}>
              {formatINR(metrics.totalCollections)}
            </span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Cash */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--fuel-petrol)' }} />
                  Cash
                </span>
                <span className="mono-num font-semibold">{formatINR(metrics.cashSales)} ({metrics.totalSales > 0 ? ((metrics.cashSales / metrics.totalSales) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${metrics.totalSales > 0 ? (metrics.cashSales / metrics.totalSales) * 100 : 0}%`, height: '100%', background: 'var(--fuel-petrol)' }} />
              </div>
            </div>

            {/* GPay */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#2563eb' }} />
                  Google Pay (UPI)
                </span>
                <span className="mono-num font-semibold">{formatINR(metrics.gpaySales)} ({metrics.totalSales > 0 ? ((metrics.gpaySales / metrics.totalSales) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${metrics.totalSales > 0 ? (metrics.gpaySales / metrics.totalSales) * 100 : 0}%`, height: '100%', background: '#2563eb' }} />
              </div>
            </div>

            {/* Other UPI */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--cyan)' }} />
                  Other UPI (PhonePe/Paytm)
                </span>
                <span className="mono-num font-semibold">{formatINR(metrics.otherUpiSales)} ({metrics.totalSales > 0 ? ((metrics.otherUpiSales / metrics.totalSales) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${metrics.totalSales > 0 ? (metrics.otherUpiSales / metrics.totalSales) * 100 : 0}%`, height: '100%', background: 'var(--cyan)' }} />
              </div>
            </div>

            {/* Card / POS */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'var(--fuel-power)' }} />
                  Credit / Debit Card (POS)
                </span>
                <span className="mono-num font-semibold">{formatINR(metrics.cardSales)} ({metrics.totalSales > 0 ? ((metrics.cardSales / metrics.totalSales) * 100).toFixed(1) : 0}%)</span>
              </div>
              <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${metrics.totalSales > 0 ? (metrics.cardSales / metrics.totalSales) * 100 : 0}%`, height: '100%', background: 'var(--fuel-power)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Closing Status Card */}
        <div className="card" style={{ borderColor: metrics.isClosed ? 'var(--success)' : 'var(--border-color)' }}>
          <div className="card-header">
            <div className="card-title">
              <CheckCircle2 size={18} color={metrics.isClosed ? 'var(--success)' : 'var(--warning)'} />
              <span>Daily Closing Status</span>
            </div>
            {metrics.isClosed ? (
              <span className={`status-badge ${closing?.closingStatus?.toLowerCase() || 'matched'}`}>
                {closing?.closingStatus || 'Closed'}
              </span>
            ) : (
              <span className="status-badge inactive">Not Closed</span>
            )}
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {metrics.isClosed ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Accounts for <strong>{formatDate(activeDate)}</strong> were closed by <strong>{closing?.closedBy}</strong>.
                </div>
                <div className="summary-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                  <div style={{ padding: '8px', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ACTUAL CASH</div>
                    <div className="mono-num" style={{ fontWeight: '700', fontSize: '0.95rem' }}>{formatINR(closing?.actualCashCounted)}</div>
                  </div>
                  <div style={{ padding: '8px', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DIFFERENCE</div>
                    <div className="mono-num" style={{ fontWeight: '700', fontSize: '0.95rem', color: closing?.cashDifference === 0 ? 'var(--success)' : closing?.cashDifference < 0 ? 'var(--danger)' : 'var(--warning)' }}>
                      {formatINR(closing?.cashDifference)}
                    </div>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary btn-sm" 
                  style={{ marginTop: '8px' }}
                  onClick={() => setActiveTab('closing')}
                >
                  View Closing Summary & Logs
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Day is currently operational. Current expected cash balance on hand is:
                </p>
                <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.72rem', color: '#065f46', fontWeight: '700' }}>EXPECTED CASH ON HAND</div>
                  <div className="mono-num" style={{ fontSize: '1.4rem', fontWeight: '800', color: '#047857' }}>
                    {formatINR(metrics.expectedCash)}
                  </div>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={() => setActiveTab('closing')}
                >
                  Enter Closing Cash Count
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Account Entries & Recent Expenses */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
        {/* Recent Sales Entries */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Fuel size={17} color="var(--primary)" />
              <span>Recent Fuel Entries ({formatDate(activeDate)})</span>
            </div>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setActiveTab('sales')}
            >
              View All ({data.transactions.filter(t => t.date === activeDate).length})
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentTransactions.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No sales recorded for this date yet.
              </div>
            ) : (
              <div className="table-responsive" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Pump</th>
                      <th>Fuel</th>
                      <th>Litres</th>
                      <th>Amount</th>
                      <th>Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentTransactions.map((t) => (
                      <tr key={t.id}>
                        <td className="mono-num">{t.time}</td>
                        <td style={{ fontWeight: '600' }}>{t.pumpName}</td>
                        <td>
                          <span 
                            className={`fuel-tag ${t.fuelCategory.toLowerCase().replace(' ', '-')}`}
                            style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                          >
                            {t.fuelCategory}
                          </span>
                        </td>
                        <td className="mono-num">{t.litres.toFixed(2)} L</td>
                        <td className="mono-num" style={{ fontWeight: '700' }}>{formatINR(t.totalAmount)}</td>
                        <td>
                          <span className="badge" style={{ fontSize: '0.72rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>
                            {t.paymentMethod}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Expenses */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ReceiptIndianRupee size={17} color="var(--danger)" />
              <span>Recent Daily Expenses ({formatDate(activeDate)})</span>
            </div>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => setActiveTab('expenses')}
            >
              Manage Expenses
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentExpenses.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No expenses logged for this date.
              </div>
            ) : (
              <div className="table-responsive" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Method</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentExpenses.map((e) => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: '600' }}>{e.category}</td>
                        <td style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.description || e.paidTo || '-'}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {e.paymentMethod}
                          </span>
                        </td>
                        <td className="mono-num" style={{ fontWeight: '700', color: 'var(--danger)' }}>
                          {formatINR(e.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
