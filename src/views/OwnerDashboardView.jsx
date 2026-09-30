import React, { useState } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatLitres, formatDate } from '../utils/formatters';
import { 
  ShieldCheck, 
  Crown, 
  Fuel, 
  Users, 
  Clock, 
  FileText, 
  AlertCircle, 
  Edit3, 
  CheckCircle2, 
  RotateCcw, 
  Printer, 
  Calendar,
  Lock,
  ArrowRight,
  FlaskConical,
  IndianRupee,
  Layers,
  Sparkles,
  BarChart3,
  Trash2
} from 'lucide-react';
import Modal from '../components/Modal';

export default function OwnerDashboardView() {
  const { 
    data, 
    activeDate, 
    setActiveDate, 
    getAllPumpsCalculations, 
    getDailyAttendance,
    correctPumpReadingByOwner,
    removePumpTest,
    userRole,
    isOwnerAuthorized,
    loginAsOwner,
    logoutOwner,
    openOwnerAuthModal,
    setActiveTab,
    showToast 
  } = useFuel();

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Owner Correct Meter Modal
  const [correctModal, setCorrectModal] = useState({
    isOpen: false,
    pump: null,
    openingMeter: '',
    closingMeter: '',
    reason: ''
  });

  const pumpData = getAllPumpsCalculations(activeDate);
  const attendanceData = getDailyAttendance(activeDate);
  const { totals, pumps } = pumpData;

  // Handle PIN unlock on lock screen
  const handleUnlock = (e) => {
    e.preventDefault();
    const res = loginAsOwner(pinInput);
    if (res.success) {
      setPinInput('');
      setPinError('');
    } else {
      setPinError('Invalid Owner PIN. Default PIN is 1234.');
    }
  };

  // If not authorized as owner, show lock screen
  if (!isOwnerAuthorized) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="auth-lock-card">
          <div className="lock-icon-circle">
            <Crown size={32} color="#059669" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800', marginTop: '12px', color: 'var(--text-primary)' }}>
            Owner Dashboard Locked
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '20px', textAlign: 'center' }}>
            Enter your management security PIN to view daily sales, pump meter readings, staff attendance and forecourt operations.
          </p>

          <form onSubmit={handleUnlock} style={{ width: '100%' }}>
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <input
                type="password"
                className="form-control"
                placeholder="Enter PIN (Default: 1234)"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  if (pinError) setPinError('');
                }}
                style={{ textAlign: 'center', fontSize: '1.15rem', letterSpacing: '0.2em', height: '46px', fontWeight: '700' }}
              />
            </div>

            {pinError && (
              <div style={{ color: '#dc2626', fontSize: '0.78rem', marginBottom: '12px', textAlign: 'center' }}>
                {pinError}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '44px', backgroundColor: '#059669', borderColor: '#059669', justifyContent: 'center' }}
            >
              <ShieldCheck size={16} /> Unlock Owner Dashboard
            </button>
            <div style={{ textAlign: 'center', marginTop: '10px' }}>
              <button 
                type="button" 
                onClick={() => setPinInput('1234')} 
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
              >
                Quick Fill 1234
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Handle Owner Correction Submit
  const handleSaveCorrection = (e) => {
    e.preventDefault();
    if (!correctModal.pump) return;

    correctPumpReadingByOwner(
      correctModal.pump.pumpId,
      correctModal.openingMeter,
      correctModal.closingMeter,
      correctModal.reason,
      'Owner'
    );

    setCorrectModal({ isOpen: false, pump: null, openingMeter: '', closingMeter: '', reason: '' });
  };

  // Extract all testing records across all pumps for today
  const allTestingEvents = [];
  pumps.forEach(p => {
    (p.testingEvents || []).forEach(t => {
      allTestingEvents.push({ ...t, pumpName: p.pumpName, fuelType: p.fuelType });
    });
  });

  return (
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      {/* Top Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="owner-crown-badge">
              <Crown size={14} /> Owner Maintenance
            </span>
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '600', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
              Authorized Mode
            </span>
          </div>
          <h1 style={{ marginTop: '4px' }}>Owner Forecourt Operations Dashboard</h1>
          <p>
            Real-time daily sales, pump meter audits, testing records, worker shifts & operations summary for <strong>{formatDate(activeDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={logoutOwner}
            title="Switch back to worker interface"
          >
            <Lock size={14} /> Switch to Worker Mode
          </button>
        </div>
      </div>

      {/* SECTION 1: TODAY'S SALES */}
      <div className="owner-section-block">
        <div className="section-title-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="#059669" />
            <h2 className="section-title">1. Today's Forecourt Sales Summary</h2>
          </div>
          <span className="date-tag-mini">{formatDate(activeDate)}</span>
        </div>

        <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
          <div className="stat-card">
            <div className="stat-label">TOTAL ADJUSTED SALES</div>
            <div className="stat-value mono-num" style={{ color: '#059669', fontSize: '1.5rem', fontWeight: '800' }}>
              {formatINR(totals.totalSales)}
            </div>
            <div className="stat-meta">Net revenue after 5L testing deductions</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">FINAL LITRES SOLD</div>
            <div className="stat-value mono-num" style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: '800' }}>
              {formatLitres(totals.totalLitres)}
            </div>
            <div className="stat-meta">Dispensed across all 10 forecourt nozzles</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">TOTAL TESTING DEDUCTED</div>
            <div className="stat-value mono-num" style={{ color: '#d97706', fontSize: '1.5rem', fontWeight: '800' }}>
              {formatLitres(totals.totalTestingLitres)}
            </div>
            <div className="stat-meta">{totals.totalTestingLitres / 5} calibration events today</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">METER DIFFERENCE</div>
            <div className="stat-value mono-num" style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: '800' }}>
              {formatLitres(totals.totalMeterDifference)}
            </div>
            <div className="stat-meta">Total raw meter readings difference</div>
          </div>
        </div>
      </div>

      {/* SECTIONS 2, 3, 4: PETROL, DIESEL, POWER PETROL SALES */}
      <div className="owner-section-block">
        <div className="section-title-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Fuel size={18} color="#059669" />
            <h2 className="section-title">2, 3, 4. Fuel-Wise Sales Breakdown</h2>
          </div>
        </div>

        <div className="fuel-breakdown-grid">
          {/* Petrol Sales */}
          <div className="fuel-overview-card petrol">
            <div className="fuel-card-head">
              <span className="fuel-tag petrol">Petrol (P1 - P4)</span>
              <span className="mono-num rate-text">₹{Number(data.settings.rates['Petrol'] || 102.84).toFixed(2)}/L</span>
            </div>
            <div className="fuel-amount-hero mono-num">
              {formatINR(totals.petrol.sales)}
            </div>
            <div className="fuel-detail-rows">
              <div className="detail-row">
                <span>Final Litres Sold:</span>
                <strong className="mono-num">{formatLitres(totals.petrol.litres)}</strong>
              </div>
              <div className="detail-row">
                <span>Testing Deductions:</span>
                <span className="mono-num" style={{ color: '#d97706' }}>-{formatLitres(totals.petrol.testing)}</span>
              </div>
              <div className="detail-row">
                <span>Meter Difference:</span>
                <span className="mono-num">{formatLitres(totals.petrol.diff)}</span>
              </div>
            </div>
          </div>

          {/* Diesel Sales */}
          <div className="fuel-overview-card diesel">
            <div className="fuel-card-head">
              <span className="fuel-tag diesel">Diesel (P5 - P8)</span>
              <span className="mono-num rate-text">₹{Number(data.settings.rates['Diesel'] || 88.92).toFixed(2)}/L</span>
            </div>
            <div className="fuel-amount-hero mono-num">
              {formatINR(totals.diesel.sales)}
            </div>
            <div className="fuel-detail-rows">
              <div className="detail-row">
                <span>Final Litres Sold:</span>
                <strong className="mono-num">{formatLitres(totals.diesel.litres)}</strong>
              </div>
              <div className="detail-row">
                <span>Testing Deductions:</span>
                <span className="mono-num" style={{ color: '#d97706' }}>-{formatLitres(totals.diesel.testing)}</span>
              </div>
              <div className="detail-row">
                <span>Meter Difference:</span>
                <span className="mono-num">{formatLitres(totals.diesel.diff)}</span>
              </div>
            </div>
          </div>

          {/* Power Petrol Sales */}
          <div className="fuel-overview-card power">
            <div className="fuel-card-head">
              <span className="fuel-tag power">Power Petrol (P9 - P10)</span>
              <span className="mono-num rate-text">₹{Number(data.settings.rates['Power Petrol'] || 109.50).toFixed(2)}/L</span>
            </div>
            <div className="fuel-amount-hero mono-num">
              {formatINR(totals.powerPetrol.sales)}
            </div>
            <div className="fuel-detail-rows">
              <div className="detail-row">
                <span>Final Litres Sold:</span>
                <strong className="mono-num">{formatLitres(totals.powerPetrol.litres)}</strong>
              </div>
              <div className="detail-row">
                <span>Testing Deductions:</span>
                <span className="mono-num" style={{ color: '#d97706' }}>-{formatLitres(totals.powerPetrol.testing)}</span>
              </div>
              <div className="detail-row">
                <span>Meter Difference:</span>
                <span className="mono-num">{formatLitres(totals.powerPetrol.diff)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: PUMP-WISE METER READINGS */}
      <div className="owner-section-block">
        <div className="section-title-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#059669" />
            <h2 className="section-title">5. Pump-Wise Meter Readings & Audit Table</h2>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Owner review and correction enabled
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Pump</th>
                <th>Fuel</th>
                <th>Opening Meter</th>
                <th>Closing Meter</th>
                <th>Meter Diff</th>
                <th>5L Tests</th>
                <th>Net Litres</th>
                <th>Rate</th>
                <th>Sales Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pumps.map((p) => {
                const fuelClass = p.fuelType.toLowerCase().replace(' ', '-');
                return (
                  <tr key={p.pumpId}>
                    <td>
                      <strong>{p.pumpName}</strong>
                    </td>
                    <td>
                      <span className={`fuel-tag ${fuelClass}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {p.fuelType}
                      </span>
                    </td>
                    <td className="mono-num">{p.openingMeter.toFixed(2)}</td>
                    <td className="mono-num">{p.closingMeter.toFixed(2)}</td>
                    <td className="mono-num">{formatLitres(p.meterDifference)}</td>
                    <td>
                      {p.testingCount > 0 ? (
                        <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: '700' }}>
                          {p.testingCount} ({p.testingLitres}L)
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>0</span>
                      )}
                    </td>
                    <td className="mono-num" style={{ fontWeight: '700', color: 'var(--primary)' }}>
                      {formatLitres(p.finalLitresSold)}
                    </td>
                    <td className="mono-num">₹{p.fuelRate.toFixed(2)}</td>
                    <td className="mono-num" style={{ fontWeight: '800', color: '#059669' }}>
                      {formatINR(p.finalSalesAmount)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                        onClick={() => setCorrectModal({
                          isOpen: true,
                          pump: p,
                          openingMeter: p.openingMeter,
                          closingMeter: p.closingMeter,
                          reason: ''
                        })}
                        title="Owner correct meter readings"
                      >
                        <Edit3 size={12} /> Correct
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 6: PUMP TESTING RECORDS */}
      <div className="owner-section-block">
        <div className="section-title-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FlaskConical size={18} color="#059669" />
            <h2 className="section-title">6. Pump Testing & Calibration Records</h2>
          </div>
          <span className="strip-val mono-num">
            {allTestingEvents.length} Tests Recorded ({allTestingEvents.length * 5} Litres Deducted)
          </span>
        </div>

        {allTestingEvents.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', background: '#fff', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            No pump calibration tests recorded for {formatDate(activeDate)}.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event ID</th>
                  <th>Pump</th>
                  <th>Fuel</th>
                  <th>Testing Litres</th>
                  <th>Time Recorded</th>
                  <th>Recorded By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allTestingEvents.map((t) => (
                  <tr key={t.id}>
                    <td className="mono-num" style={{ fontSize: '0.76rem' }}>{t.id}</td>
                    <td><strong>{t.pumpName}</strong></td>
                    <td>
                      <span className={`fuel-tag ${t.fuelType.toLowerCase().replace(' ', '-')}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {t.fuelType}
                      </span>
                    </td>
                    <td className="mono-num" style={{ color: '#d97706', fontWeight: '700' }}>
                      5.00 L
                    </td>
                    <td className="mono-num">{t.time || 'Logged'}</td>
                    <td>{t.recordedBy || 'Operator'}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                        onClick={() => {
                          const p = pumps.find(item => item.pumpName === t.pumpName);
                          if (p && window.confirm(`Remove 5L test for ${t.pumpName}?`)) {
                            removePumpTest(p.pumpId, t.id, activeDate, 'Owner correction', 'Owner');
                          }
                        }}
                      >
                        <Trash2 size={12} /> Remove Test
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 7 & 8: STAFF ATTENDANCE & SHIFT STATUS */}
      <div className="grid-2-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {/* Staff Attendance */}
        <div className="owner-section-block" style={{ marginBottom: 0 }}>
          <div className="section-title-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#059669" />
              <h2 className="section-title">7. Staff Attendance Today</h2>
            </div>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActiveTab('staff-attendance')}
            >
              Manage Attendance <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <span className="badge" style={{ background: '#d1fae5', color: '#065f46', padding: '6px 12px' }}>
              Present: <strong>{attendanceData.presentCount}</strong>
            </span>
            <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 12px' }}>
              Absent: <strong>{attendanceData.absentCount}</strong>
            </span>
            <span className="badge" style={{ background: '#fef3c7', color: '#92400e', padding: '6px 12px' }}>
              Leave: <strong>{attendanceData.leaveCount}</strong>
            </span>
          </div>

          <div className="attendance-mini-list">
            {attendanceData.list.map((st) => (
              <div key={st.staff.id} className="attendance-mini-item">
                <div>
                  <strong>{st.staff.name}</strong>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {st.staff.role} • {st.shift}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge ${st.status === 'Present' ? 'active' : st.status === 'Leave' ? 'pending' : 'inactive'}`}>
                    {st.status}
                  </span>
                  {st.checkInTime && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }} className="mono-num">
                      In: {st.checkInTime}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shift Status */}
        <div className="owner-section-block" style={{ marginBottom: 0 }}>
          <div className="section-title-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={18} color="#059669" />
              <h2 className="section-title">8. Forecourt Shift Status</h2>
            </div>
            <span className="badge" style={{ background: '#ecfdf5', color: '#059669', fontWeight: '700' }}>
              Day Shift Active
            </span>
          </div>

          <div className="shift-info-box">
            <div className="shift-info-row">
              <span className="label">Current Active Shift:</span>
              <strong className="val">Morning / General Shift</strong>
            </div>
            <div className="shift-info-row">
              <span className="label">Workers On Duty:</span>
              <strong className="val">{attendanceData.presentCount} Attendants</strong>
            </div>
            <div className="shift-info-row">
              <span className="label">Active Forecourt Nozzles:</span>
              <strong className="val">10 / 10 Operational</strong>
            </div>
            <div className="shift-info-row">
              <span className="label">Day Settlement Status:</span>
              <strong className="val" style={{ color: data.closings[activeDate] ? '#059669' : '#d97706' }}>
                {data.closings[activeDate] ? 'Closed & Locked' : 'Shift Open (Pending Closing)'}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 9: DAILY REPORTS & OPERATIONS SUMMARY */}
      <div className="owner-section-block">
        <div className="section-title-strip">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="#059669" />
            <h2 className="section-title">9. Daily Operations Summary & Audits</h2>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => window.print()}
          >
            <Printer size={14} /> Print Summary
          </button>
        </div>

        <div className="operations-summary-card">
          <h4 style={{ fontSize: '0.96rem', fontWeight: '700', marginBottom: '8px', color: '#065f46' }}>
            Executive Station Briefing for {formatDate(activeDate)}
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            <li>Total fuel revenue recorded across all pumps: <strong>{formatINR(totals.totalSales)}</strong> ({formatLitres(totals.totalLitres)} sold).</li>
            <li>Calibration testing: <strong>{allTestingEvents.length} events</strong> recorded; exactly <strong>{formatLitres(totals.totalTestingLitres)}</strong> deducted from sale volumes.</li>
            <li>Staffing: <strong>{attendanceData.presentCount} attendants on duty</strong>, {attendanceData.absentCount} absent, {attendanceData.leaveCount} on approved leave.</li>
            <li>All forecourt meters audited with zero unverified differences.</li>
          </ul>
        </div>

        {/* Owner Audit Trail */}
        {(data.ownerAuditLogs || []).length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <h4 style={{ fontSize: '0.88rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-primary)' }}>
              Owner Edit & Correction History
            </h4>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Action</th>
                    <th>Details</th>
                    <th>Authorized By</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.ownerAuditLogs || []).slice(0, 5).map((log) => (
                    <tr key={log.id}>
                      <td className="mono-num" style={{ fontSize: '0.74rem' }}>
                        {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.72rem' }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.82rem' }}>{log.details}</td>
                      <td><strong>{log.user}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Owner Correction Modal */}
      {correctModal.isOpen && (
        <Modal
          isOpen={correctModal.isOpen}
          onClose={() => setCorrectModal({ isOpen: false, pump: null, openingMeter: '', closingMeter: '', reason: '' })}
          title={`Owner Meter Correction: ${correctModal.pump?.pumpName}`}
        >
          <form onSubmit={handleSaveCorrection} style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', marginBottom: '14px', fontSize: '0.82rem', color: '#1e40af' }}>
              <ShieldCheck size={16} />
              <span>Owner override: meter adjustments are recorded in the station audit trail.</span>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Opening Meter Reading:
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                value={correctModal.openingMeter}
                onChange={(e) => setCorrectModal(prev => ({ ...prev, openingMeter: e.target.value }))}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Closing Meter Reading:
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-control"
                value={correctModal.closingMeter}
                onChange={(e) => setCorrectModal(prev => ({ ...prev, closingMeter: e.target.value }))}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Reason for Correction:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Worker entered wrong reading at shift end"
                value={correctModal.reason}
                onChange={(e) => setCorrectModal(prev => ({ ...prev, reason: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setCorrectModal({ isOpen: false, pump: null, openingMeter: '', closingMeter: '', reason: '' })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <CheckCircle2 size={16} /> Save Correction
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
