import React, { useState, useMemo } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatLitres, formatDate, getTodayDateStr, getRelativeDateStr } from '../utils/formatters';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  FileSpreadsheet, 
  Fuel, 
  Users, 
  ReceiptIndianRupee, 
  QrCode, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { downloadCSV, downloadExcel, triggerPrint } from '../utils/exportUtils';

export default function ReportsView() {
  const { data, activeDate } = useFuel();

  // Date Filter Presets
  const [filterPreset, setFilterPreset] = useState('LAST_7'); // TODAY, YESTERDAY, LAST_7, THIS_MONTH, CUSTOM
  const todayStr = getTodayDateStr();
  const yesterdayStr = getRelativeDateStr(-1);

  const [customStartDate, setCustomStartDate] = useState(() => getRelativeDateStr(-7));
  const [customEndDate, setCustomEndDate] = useState(() => todayStr);

  // Active Report Type (1 to 7)
  const [reportType, setReportType] = useState('DAILY_SALES');

  // Compute resolved Start and End date strings
  const [startDate, endDate] = useMemo(() => {
    if (filterPreset === 'TODAY') return [todayStr, todayStr];
    if (filterPreset === 'YESTERDAY') return [yesterdayStr, yesterdayStr];
    if (filterPreset === 'LAST_7') return [getRelativeDateStr(-6), todayStr];
    if (filterPreset === 'THIS_MONTH') {
      const parts = todayStr.split('-');
      return [`${parts[0]}-${parts[1]}-01`, todayStr];
    }
    return [customStartDate, customEndDate];
  }, [filterPreset, todayStr, yesterdayStr, customStartDate, customEndDate]);

  // Filter Transactions in range
  const rangeTransactions = useMemo(() => {
    return data.transactions.filter(t => t.date >= startDate && t.date <= endDate);
  }, [data.transactions, startDate, endDate]);

  // Filter Expenses in range
  const rangeExpenses = useMemo(() => {
    return data.expenses.filter(e => e.date >= startDate && e.date <= endDate);
  }, [data.expenses, startDate, endDate]);

  // Filter Adjustments in range
  const rangeAdjustments = useMemo(() => {
    return data.adjustments.filter(a => a.date >= startDate && a.date <= endDate);
  }, [data.adjustments, startDate, endDate]);

  // Grand summary for selected range
  const grandSummary = useMemo(() => {
    let sales = 0, litres = 0;
    let petrolSales = 0, dieselSales = 0, powerPetrolSales = 0;
    let cashSales = 0, digitalSales = 0, cardSales = 0;

    rangeTransactions.forEach(t => {
      const amt = Number(t.totalAmount) || 0;
      const l = Number(t.litres) || 0;
      sales += amt;
      litres += l;

      if (t.fuelCategory === 'Petrol') petrolSales += amt;
      else if (t.fuelCategory === 'Diesel') dieselSales += amt;
      else if (t.fuelCategory === 'Power Petrol') powerPetrolSales += amt;

      if (t.paymentMethod === 'Cash') cashSales += amt;
      else if (t.paymentMethod === 'Card') cardSales += amt;
      else digitalSales += amt;
    });

    const expenses = rangeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    return {
      sales,
      litres,
      petrolSales,
      dieselSales,
      powerPetrolSales,
      cashSales,
      digitalSales,
      cardSales,
      expenses,
      netRevenue: sales - expenses,
      count: rangeTransactions.length
    };
  }, [rangeTransactions, rangeExpenses]);

  // 1. Daily Sales Report Data (Grouped by date)
  const dailySalesData = useMemo(() => {
    const map = {};
    rangeTransactions.forEach(t => {
      if (!map[t.date]) {
        map[t.date] = { date: t.date, petrol: 0, diesel: 0, power: 0, litres: 0, total: 0, count: 0 };
      }
      const amt = Number(t.totalAmount) || 0;
      const l = Number(t.litres) || 0;
      map[t.date].total += amt;
      map[t.date].litres += l;
      map[t.date].count += 1;
      if (t.fuelCategory === 'Petrol') map[t.date].petrol += amt;
      else if (t.fuelCategory === 'Diesel') map[t.date].diesel += amt;
      else map[t.date].power += amt;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [rangeTransactions]);

  // 2. Pump-wise Sales Report Data
  const pumpWiseData = useMemo(() => {
    return data.pumps.map(pump => {
      const txns = rangeTransactions.filter(t => t.pumpId === pump.id);
      const litres = txns.reduce((s, t) => s + (Number(t.litres) || 0), 0);
      const sales = txns.reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);
      return {
        pumpId: pump.id,
        name: pump.name,
        fuelType: pump.fuelType,
        pumpNumber: pump.pumpNumber,
        status: pump.status,
        litres,
        sales,
        count: txns.length
      };
    }).sort((a, b) => b.sales - a.sales);
  }, [data.pumps, rangeTransactions]);

  // 3. Fuel Category Sales Report Data
  const fuelCategoryData = useMemo(() => {
    const cats = ['Petrol', 'Diesel', 'Power Petrol'];
    return cats.map(cat => {
      const txns = rangeTransactions.filter(t => t.fuelCategory === cat);
      const litres = txns.reduce((s, t) => s + (Number(t.litres) || 0), 0);
      const sales = txns.reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);
      const percent = grandSummary.sales > 0 ? (sales / grandSummary.sales) * 100 : 0;
      return {
        category: cat,
        litres,
        sales,
        count: txns.length,
        percent,
        rate: data.settings.rates[cat] || 0
      };
    });
  }, [rangeTransactions, grandSummary.sales, data.settings.rates]);

  // 4. Staff-wise Sales Report Data
  const staffWiseData = useMemo(() => {
    return data.staff.map(st => {
      const txns = rangeTransactions.filter(t => t.staffId === st.id);
      const litres = txns.reduce((s, t) => s + (Number(t.litres) || 0), 0);
      const sales = txns.reduce((s, t) => s + (Number(t.totalAmount) || 0), 0);
      return {
        id: st.id,
        name: st.name,
        role: st.role,
        count: txns.length,
        litres,
        sales
      };
    }).sort((a, b) => b.sales - a.sales);
  }, [data.staff, rangeTransactions]);

  // 5. Expense Report Data (Grouped by Category)
  const expenseReportData = useMemo(() => {
    const map = {};
    rangeExpenses.forEach(e => {
      if (!map[e.category]) {
        map[e.category] = { category: e.category, cashAmt: 0, digitalAmt: 0, totalAmt: 0, count: 0 };
      }
      const amt = Number(e.amount) || 0;
      map[e.category].totalAmt += amt;
      map[e.category].count += 1;
      if (e.paymentMethod === 'Cash') map[e.category].cashAmt += amt;
      else map[e.category].digitalAmt += amt;
    });
    return Object.values(map).sort((a, b) => b.totalAmt - a.totalAmt);
  }, [rangeExpenses]);

  // 6. Payment Collection Report Data
  const paymentCollectionData = useMemo(() => {
    const methods = [
      { name: 'Cash', sales: grandSummary.cashSales, share: grandSummary.sales > 0 ? (grandSummary.cashSales / grandSummary.sales) * 100 : 0 },
      { name: 'Google Pay (GPay)', sales: grandSummary.digitalSales * 0.7, share: grandSummary.sales > 0 ? ((grandSummary.digitalSales * 0.7) / grandSummary.sales) * 100 : 0 },
      { name: 'Other UPI (PhonePe/Paytm)', sales: grandSummary.digitalSales * 0.3, share: grandSummary.sales > 0 ? ((grandSummary.digitalSales * 0.3) / grandSummary.sales) * 100 : 0 },
      { name: 'Card / POS', sales: grandSummary.cardSales, share: grandSummary.sales > 0 ? (grandSummary.cardSales / grandSummary.sales) * 100 : 0 },
    ];
    return methods;
  }, [grandSummary]);

  // 7. Daily Closings in Range
  const dailyClosingsData = useMemo(() => {
    return Object.values(data.closings)
      .filter(c => c.date >= startDate && c.date <= endDate)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data.closings, startDate, endDate]);

  // Export handlers
  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let title = `FuelFlow_Report_${reportType}`;

    if (reportType === 'DAILY_SALES') {
      headers = ['Date', 'Transactions', 'Total Litres', 'Petrol Sales (INR)', 'Diesel Sales (INR)', 'Power Petrol Sales (INR)', 'Total Gross Sales (INR)'];
      rows = dailySalesData.map(d => [d.date, d.count, d.litres.toFixed(2), d.petrol.toFixed(2), d.diesel.toFixed(2), d.power.toFixed(2), d.total.toFixed(2)]);
    } else if (reportType === 'PUMP_WISE') {
      headers = ['Pump Name', 'Pump #', 'Fuel Type', 'Status', 'Transactions', 'Dispensed Litres', 'Sales Revenue (INR)'];
      rows = pumpWiseData.map(p => [p.name, p.pumpNumber, p.fuelType, p.status, p.count, p.litres.toFixed(2), p.sales.toFixed(2)]);
    } else if (reportType === 'FUEL_CATEGORY') {
      headers = ['Fuel Category', 'Current Rate (INR)', 'Transactions', 'Volume (Litres)', 'Sales Revenue (INR)', 'Share (%)'];
      rows = fuelCategoryData.map(f => [f.category, f.rate.toFixed(2), f.count, f.litres.toFixed(2), f.sales.toFixed(2), `${f.percent.toFixed(1)}%`]);
    } else if (reportType === 'STAFF_WISE') {
      headers = ['Staff Name', 'Role', 'Transactions Handled', 'Volume Dispensed (L)', 'Sales Collected (INR)'];
      rows = staffWiseData.map(s => [s.name, s.role, s.count, s.litres.toFixed(2), s.sales.toFixed(2)]);
    } else if (reportType === 'EXPENSES') {
      headers = ['Category', 'Disbursements Count', 'Cash Paid (INR)', 'Digital Paid (INR)', 'Total Expenses (INR)'];
      rows = expenseReportData.map(e => [e.category, e.count, e.cashAmt.toFixed(2), e.digitalAmt.toFixed(2), e.totalAmt.toFixed(2)]);
    } else if (reportType === 'PAYMENT_COLLECTION') {
      headers = ['Payment Method', 'Collected Amount (INR)', 'Share of Revenue (%)'];
      rows = paymentCollectionData.map(p => [p.name, p.sales.toFixed(2), `${p.share.toFixed(1)}%`]);
    } else if (reportType === 'DAILY_CLOSING') {
      headers = ['Closing Date', 'Status', 'Closed By', 'Expected Cash (INR)', 'Actual Cash Counted (INR)', 'Cash Difference (INR)'];
      rows = dailyClosingsData.map(c => [c.date, c.closingStatus, c.closedBy, c.expectedCash.toFixed(2), c.actualCashCounted.toFixed(2), c.cashDifference.toFixed(2)]);
    }

    downloadCSV(title, headers, rows);
  };

  const handleExportExcel = () => {
    let headers = [];
    let rows = [];
    let title = `FuelFlow_${reportType}_${startDate}_to_${endDate}`;

    if (reportType === 'DAILY_SALES') {
      headers = ['Date', 'Transactions', 'Total Litres', 'Petrol Sales (INR)', 'Diesel Sales (INR)', 'Power Petrol Sales (INR)', 'Total Gross Sales (INR)'];
      rows = dailySalesData.map(d => [d.date, d.count, d.litres.toFixed(2), d.petrol.toFixed(2), d.diesel.toFixed(2), d.power.toFixed(2), d.total.toFixed(2)]);
    } else if (reportType === 'PUMP_WISE') {
      headers = ['Pump Name', 'Pump #', 'Fuel Type', 'Status', 'Transactions', 'Dispensed Litres', 'Sales Revenue (INR)'];
      rows = pumpWiseData.map(p => [p.name, p.pumpNumber, p.fuelType, p.status, p.count, p.litres.toFixed(2), p.sales.toFixed(2)]);
    } else {
      headers = ['Category', 'Volume (L)', 'Revenue (INR)'];
      rows = fuelCategoryData.map(f => [f.category, f.litres.toFixed(2), f.sales.toFixed(2)]);
    }

    downloadExcel(title, 'Report', headers, rows);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Station Business Reports & Analytics</h1>
          <p>
            Detailed audited reports for audit, oil company submission, GST accounting & forecourt performance
          </p>
        </div>

        <div className="page-actions no-print">
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={14} /> CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportExcel}>
            <FileSpreadsheet size={14} /> Excel (.xls)
          </button>
          <button className="btn btn-primary btn-sm" onClick={triggerPrint}>
            <Printer size={14} /> Print Report
          </button>
        </div>
      </div>

      {/* Printable Letterhead Banner (Visible during Print) */}
      <div style={{ display: 'none' }} className="print-header">
        <div style={{ textAlign: 'center', paddingBottom: '16px', borderBottom: '2px solid #000', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{data.settings.stationName}</h2>
          <p style={{ margin: '4px 0', fontSize: '0.85rem' }}>{data.settings.address}</p>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>
            Dealer Code: {data.settings.dealerCode} • GSTIN: {data.settings.gstin} • Tel: {data.settings.phone}
          </p>
          <h3 style={{ marginTop: '10px', fontSize: '1.1rem' }}>
            {reportType.replace(/_/g, ' ')} REPORT ({formatDate(startDate)} to {formatDate(endDate)})
          </h3>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="card no-print">
        <div className="card-body" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
            {/* Quick Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Range:</span>
              {[
                { id: 'TODAY', label: 'Today' },
                { id: 'YESTERDAY', label: 'Yesterday' },
                { id: 'LAST_7', label: 'Last 7 Days' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'CUSTOM', label: 'Custom' }
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  className={`date-quick-btn ${filterPreset === p.id ? 'active' : ''}`}
                  onClick={() => setFilterPreset(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {filterPreset === 'CUSTOM' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="date"
                  className="form-control mono-num"
                  style={{ height: '34px', fontSize: '0.82rem' }}
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>to</span>
                <input
                  type="date"
                  className="form-control mono-num"
                  style={{ height: '34px', fontSize: '0.82rem' }}
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            )}

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Period: <strong className="mono-num">{formatDate(startDate)}</strong> to <strong className="mono-num">{formatDate(endDate)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Grand Summary Metrics */}
      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Period Fuel Sales</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--primary)' }}>
            {formatINR(grandSummary.sales)}
          </div>
          <div className="stat-subtext">
            <span>{grandSummary.count} transactions in period</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Period Litres Sold</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--cyan-light)', color: 'var(--cyan)' }}>
              <Fuel size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--cyan)' }}>
            {formatLitres(grandSummary.litres)}
          </div>
          <div className="stat-subtext">
            <span>Average: {grandSummary.count > 0 ? (grandSummary.litres / grandSummary.count).toFixed(1) : 0} L / fill</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Period Operating Expenses</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <ReceiptIndianRupee size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--danger)' }}>
            {formatINR(grandSummary.expenses)}
          </div>
          <div className="stat-subtext">
            <span>{rangeExpenses.length} expense items</span>
          </div>
        </div>

        <div className="stat-card" style={{ borderColor: 'var(--fuel-petrol-border)', backgroundColor: '#f0fdf4' }}>
          <div className="stat-card-header">
            <span className="stat-title" style={{ color: 'var(--fuel-petrol)' }}>Net Forecourt Receipts</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--fuel-petrol)', color: '#ffffff' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--fuel-petrol)' }}>
            {formatINR(grandSummary.netRevenue)}
          </div>
          <div className="stat-subtext">
            <span>Gross Sales minus Expenses</span>
          </div>
        </div>
      </div>

      {/* Report Type Selector Tabs */}
      <div className="no-print" style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '4px' }}>
        {[
          { id: 'DAILY_SALES', label: '1. Daily Sales Report', icon: BarChart3 },
          { id: 'PUMP_WISE', label: '2. Pump-wise Sales', icon: Fuel },
          { id: 'FUEL_CATEGORY', label: '3. Fuel Category Sales', icon: Fuel },
          { id: 'STAFF_WISE', label: '4. Staff-wise Sales', icon: Users },
          { id: 'EXPENSES', label: '5. Expense Report', icon: ReceiptIndianRupee },
          { id: 'PAYMENT_COLLECTION', label: '6. Payment Collections', icon: QrCode },
          { id: 'DAILY_CLOSING', label: '7. Daily Closing History', icon: CheckCircle2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                backgroundColor: isActive ? 'var(--sidebar-bg)' : '#ffffff',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                borderColor: isActive ? 'var(--sidebar-bg)' : 'var(--border-color)',
                whiteSpace: 'nowrap'
              }}
              onClick={() => setReportType(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Report Tables Container */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={18} color="var(--primary)" />
            <span>
              {reportType === 'DAILY_SALES' && 'Daily Sales & Fuel Category Progression'}
              {reportType === 'PUMP_WISE' && 'Pump-wise Dispenser Utilization Report'}
              {reportType === 'FUEL_CATEGORY' && 'Fuel Product Category Sales Breakdown'}
              {reportType === 'STAFF_WISE' && 'Staff Performance & Sales Audit'}
              {reportType === 'EXPENSES' && 'Operational Expenses & Disbursements'}
              {reportType === 'PAYMENT_COLLECTION' && 'Payment Method Share & Collections'}
              {reportType === 'DAILY_CLOSING' && 'Daily Closing & Audit Lock Status Records'}
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Showing data for {formatDate(startDate)} to {formatDate(endDate)}
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {/* 1. Daily Sales Report Table */}
          {reportType === 'DAILY_SALES' && (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transactions</th>
                    <th>Volume (Litres)</th>
                    <th>Petrol (₹)</th>
                    <th>Diesel (₹)</th>
                    <th>Power Petrol (₹)</th>
                    <th style={{ textAlign: 'right' }}>Total Gross (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySalesData.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No sales records found in selected range.</td></tr>
                  ) : (
                    dailySalesData.map(d => (
                      <tr key={d.date}>
                        <td className="mono-num" style={{ fontWeight: '700' }}>{formatDate(d.date)}</td>
                        <td className="mono-num">{d.count}</td>
                        <td className="mono-num">{formatLitres(d.litres)}</td>
                        <td className="mono-num">{formatINR(d.petrol)}</td>
                        <td className="mono-num">{formatINR(d.diesel)}</td>
                        <td className="mono-num">{formatINR(d.power)}</td>
                        <td className="mono-num font-bold" style={{ textAlign: 'right', color: 'var(--primary)' }}>
                          {formatINR(d.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: '800' }}>
                    <td>Grand Totals</td>
                    <td className="mono-num">{grandSummary.count}</td>
                    <td className="mono-num">{formatLitres(grandSummary.litres)}</td>
                    <td className="mono-num">{formatINR(grandSummary.petrolSales)}</td>
                    <td className="mono-num">{formatINR(grandSummary.dieselSales)}</td>
                    <td className="mono-num">{formatINR(grandSummary.powerPetrolSales)}</td>
                    <td className="mono-num" style={{ textAlign: 'right', color: 'var(--primary)', fontSize: '1rem' }}>
                      {formatINR(grandSummary.sales)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* 2. Pump-wise Sales Report */}
          {reportType === 'PUMP_WISE' && (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pump Name</th>
                    <th>Fuel Type</th>
                    <th>Pump #</th>
                    <th>Status</th>
                    <th>Transactions</th>
                    <th>Volume Dispensed</th>
                    <th style={{ textAlign: 'right' }}>Total Sales (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {pumpWiseData.map(p => (
                    <tr key={p.pumpId}>
                      <td style={{ fontWeight: '700' }}>{p.name}</td>
                      <td>
                        <span className={`fuel-tag ${p.fuelType.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.7rem' }}>
                          {p.fuelType}
                        </span>
                      </td>
                      <td className="mono-num">#{p.pumpNumber}</td>
                      <td>
                        <span className={`status-badge ${p.status.toLowerCase()}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="mono-num">{p.count}</td>
                      <td className="mono-num">{formatLitres(p.litres)}</td>
                      <td className="mono-num font-bold" style={{ textAlign: 'right', color: 'var(--primary)' }}>
                        {formatINR(p.sales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 3. Fuel Category Sales Report */}
          {reportType === 'FUEL_CATEGORY' && (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fuel Product</th>
                    <th>Current Unit Price</th>
                    <th>Entries</th>
                    <th>Volume Sold (L)</th>
                    <th>Sales Revenue (₹)</th>
                    <th style={{ textAlign: 'right' }}>Share of Gross Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelCategoryData.map(f => (
                    <tr key={f.category}>
                      <td style={{ fontWeight: '700' }}>
                        <span className={`fuel-tag ${f.category.toLowerCase().replace(' ', '-')}`}>
                          {f.category}
                        </span>
                      </td>
                      <td className="mono-num font-semibold">₹{f.rate.toFixed(2)} / L</td>
                      <td className="mono-num">{f.count}</td>
                      <td className="mono-num">{formatLitres(f.litres)}</td>
                      <td className="mono-num font-bold">{formatINR(f.sales)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <strong className="mono-num">{f.percent.toFixed(1)}%</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 4. Staff-wise Report */}
          {reportType === 'STAFF_WISE' && (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Designated Role</th>
                    <th>Dispenses Handled</th>
                    <th>Volume Dispensed</th>
                    <th style={{ textAlign: 'right' }}>Revenue Recorded (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {staffWiseData.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '700' }}>{s.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{s.role}</td>
                      <td className="mono-num">{s.count}</td>
                      <td className="mono-num">{formatLitres(s.litres)}</td>
                      <td className="mono-num font-bold" style={{ textAlign: 'right', color: 'var(--primary)' }}>
                        {formatINR(s.sales)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. Expense Report */}
          {reportType === 'EXPENSES' && (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Expense Category</th>
                    <th>Count of Items</th>
                    <th>Cash Paid (₹)</th>
                    <th>Digital / Bank Paid (₹)</th>
                    <th style={{ textAlign: 'right' }}>Total Expense (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseReportData.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No expense records found.</td></tr>
                  ) : (
                    expenseReportData.map(e => (
                      <tr key={e.category}>
                        <td style={{ fontWeight: '700' }}>{e.category}</td>
                        <td className="mono-num">{e.count}</td>
                        <td className="mono-num" style={{ color: 'var(--fuel-petrol)' }}>{formatINR(e.cashAmt)}</td>
                        <td className="mono-num" style={{ color: 'var(--cyan)' }}>{formatINR(e.digitalAmt)}</td>
                        <td className="mono-num font-bold" style={{ textAlign: 'right', color: 'var(--danger)' }}>
                          {formatINR(e.totalAmt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', fontWeight: '800' }}>
                    <td>Total Expenses</td>
                    <td className="mono-num">{rangeExpenses.length}</td>
                    <td className="mono-num">{formatINR(rangeExpenses.filter(e => e.paymentMethod === 'Cash').reduce((s, e) => s + (Number(e.amount) || 0), 0))}</td>
                    <td className="mono-num">{formatINR(rangeExpenses.filter(e => e.paymentMethod !== 'Cash').reduce((s, e) => s + (Number(e.amount) || 0), 0))}</td>
                    <td className="mono-num" style={{ textAlign: 'right', color: 'var(--danger)', fontSize: '1rem' }}>
                      {formatINR(grandSummary.expenses)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* 6. Payment Collection Report */}
          {reportType === 'PAYMENT_COLLECTION' && (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Payment Channel</th>
                    <th>Total Collections (₹)</th>
                    <th style={{ textAlign: 'right' }}>Share of Gross Receipts</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentCollectionData.map(p => (
                    <tr key={p.name}>
                      <td style={{ fontWeight: '700' }}>{p.name}</td>
                      <td className="mono-num font-bold">{formatINR(p.sales)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className="mono-num font-semibold">{p.share.toFixed(1)}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 7. Daily Closing Report */}
          {reportType === 'DAILY_CLOSING' && (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Closed By</th>
                    <th>Expected Cash (₹)</th>
                    <th>Counted Cash (₹)</th>
                    <th>Cash Difference (₹)</th>
                    <th style={{ textAlign: 'right' }}>Lock State</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyClosingsData.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No closed accounting records in range.</td></tr>
                  ) : (
                    dailyClosingsData.map(c => (
                      <tr key={c.date}>
                        <td className="mono-num font-bold">{formatDate(c.date)}</td>
                        <td>
                          <span className={`status-badge ${c.closingStatus.toLowerCase()}`}>
                            {c.closingStatus}
                          </span>
                        </td>
                        <td>{c.closedBy}</td>
                        <td className="mono-num">{formatINR(c.expectedCash)}</td>
                        <td className="mono-num font-semibold">{formatINR(c.actualCashCounted)}</td>
                        <td className="mono-num font-bold" style={{ color: c.cashDifference === 0 ? 'var(--success)' : c.cashDifference < 0 ? 'var(--danger)' : 'var(--warning)' }}>
                          {formatINR(c.cashDifference)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge" style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '4px', fontSize: '0.72rem' }}>
                            Locked
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
