import React, { useState } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatLitres, formatDate } from '../utils/formatters';
import { 
  Fuel, 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  History, 
  Trash2, 
  Save, 
  Calendar,
  Lock,
  ShieldCheck,
  X
} from 'lucide-react';
import Modal from '../components/Modal';

export default function PumpManagementView() {
  const { 
    data, 
    activeDate, 
    getPumpCalculations, 
    updatePumpMeters, 
    recordPumpTest, 
    removePumpTest,
    userRole,
    isOwnerAuthorized,
    openOwnerAuthModal,
    showToast 
  } = useFuel();

  const [activeFilterCategory, setActiveFilterCategory] = useState('ALL');
  
  // Confirmation Modal for 5-Litre Testing
  const [confirmTestPump, setConfirmTestPump] = useState(null);
  const [isTestButtonLocked, setIsTestButtonLocked] = useState(false);

  // Remove test modal state
  const [removeTestModal, setRemoveTestModal] = useState({ isOpen: false, pump: null, test: null, reason: '' });

  // Filter pumps
  const filteredPumps = data.pumps.filter(p => {
    if (activeFilterCategory === 'ALL') return true;
    return p.fuelType === activeFilterCategory;
  });

  // Handle Recording 5 Litre Test
  const handleConfirmRecordTest = () => {
    if (!confirmTestPump || isTestButtonLocked) return;

    setIsTestButtonLocked(true);
    const workerName = userRole === 'owner' ? 'Owner' : 'Pump Worker';
    recordPumpTest(confirmTestPump.id, activeDate, workerName);

    setConfirmTestPump(null);
    // 1.5s cooldown to prevent accidental repeated clicks
    setTimeout(() => {
      setIsTestButtonLocked(false);
    }, 1500);
  };

  // Handle Remove Test Authorization
  const handleInitiateRemoveTest = (pump, test) => {
    if (isOwnerAuthorized) {
      setRemoveTestModal({ isOpen: true, pump, test, reason: '' });
    } else {
      openOwnerAuthModal(() => {
        setRemoveTestModal({ isOpen: true, pump, test, reason: '' });
      }, 'Authorize Test Removal');
    }
  };

  const handleConfirmRemoveTest = (e) => {
    e.preventDefault();
    if (!removeTestModal.pump || !removeTestModal.test) return;

    removePumpTest(
      removeTestModal.pump.id,
      removeTestModal.test.id,
      activeDate,
      removeTestModal.reason || 'Incorrect test entry',
      userRole === 'owner' ? 'Owner' : 'Authorized Supervisor'
    );

    setRemoveTestModal({ isOpen: false, pump: null, test: null, reason: '' });
  };

  return (
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-header-info">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Fuel size={24} color="#059669" />
            Petrol Pump Management
          </h1>
          <p>
            Daily opening & closing meter readings with separate 5-litre calibration testing for <strong>{formatDate(activeDate)}</strong>
          </p>
        </div>

        {/* Filter Pills */}
        <div className="page-actions">
          <div className="date-selector-wrapper" style={{ padding: '3px 6px' }}>
            {['ALL', 'Petrol', 'Diesel', 'Power Petrol'].map((cat) => (
              <button
                key={cat}
                type="button"
                className={`date-quick-btn ${activeFilterCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveFilterCategory(cat)}
              >
                {cat === 'ALL' ? 'All (10)' : `${cat} (${data.pumps.filter(p => p.fuelType === cat).length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fuel Rate Pill Summary */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
        <div className="fuel-rate-pill petrol">
          <span className="fuel-dot petrol" />
          <span>Petrol Rate: <strong>₹{Number(data.settings.rates['Petrol'] || 102.84).toFixed(2)}/L</strong></span>
        </div>
        <div className="fuel-rate-pill diesel">
          <span className="fuel-dot diesel" />
          <span>Diesel Rate: <strong>₹{Number(data.settings.rates['Diesel'] || 88.92).toFixed(2)}/L</strong></span>
        </div>
        <div className="fuel-rate-pill power">
          <span className="fuel-dot power" />
          <span>Power Petrol: <strong>₹{Number(data.settings.rates['Power Petrol'] || 109.50).toFixed(2)}/L</strong></span>
        </div>
      </div>

      {/* Pumps Grid */}
      <div className="pumps-management-grid">
        {filteredPumps.map((pump) => {
          const calc = getPumpCalculations(pump.id, activeDate) || {
            openingMeter: 0,
            closingMeter: 0,
            meterDifference: 0,
            testingEvents: [],
            testingCount: 0,
            testingLitres: 0,
            finalLitresSold: 0,
            finalSalesAmount: 0,
            fuelRate: data.settings.rates[pump.fuelType] || 0,
            isClosingValid: true
          };

          const fuelClass = pump.fuelType.toLowerCase().replace(' ', '-');
          const hasTests = calc.testingEvents.length > 0;
          const isInvalidClosing = calc.closingMeter < calc.openingMeter;

          return (
            <div key={pump.id} className="pump-meter-card" id={`pump-card-${pump.id}`}>
              {/* Card Header */}
              <div className="pump-meter-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`pump-nozzle-badge ${fuelClass}`}>
                    #{pump.pumpNumber}
                  </span>
                  <div>
                    <h3 className="pump-title">{pump.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span className={`fuel-tag ${fuelClass}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                        {pump.fuelType}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        ₹{calc.fuelRate.toFixed(2)}/L
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge ${pump.status === 'Active' ? 'active' : 'inactive'}`}>
                    {pump.status}
                  </span>
                </div>
              </div>

              {/* Meter Inputs: Opening & Closing */}
              <div className="meter-inputs-row">
                {/* Opening Meter */}
                <div className="meter-input-group">
                  <label className="meter-input-label">
                    Opening Meter
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id={`opening-meter-${pump.id}`}
                    className="form-control meter-number-input"
                    value={calc.openingMeter === 0 ? '' : calc.openingMeter}
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      updatePumpMeters(pump.id, val, calc.closingMeter, activeDate);
                    }}
                  />
                </div>

                {/* Closing Meter */}
                <div className="meter-input-group">
                  <label className="meter-input-label">
                    Closing Meter
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id={`closing-meter-${pump.id}`}
                    className={`form-control meter-number-input ${isInvalidClosing ? 'input-error' : ''}`}
                    value={calc.closingMeter === 0 ? '' : calc.closingMeter}
                    placeholder="0.00"
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                      updatePumpMeters(pump.id, calc.openingMeter, val, activeDate);
                    }}
                  />
                </div>
              </div>

              {/* Validation Warning */}
              {isInvalidClosing && (
                <div className="meter-error-notice">
                  <AlertTriangle size={14} />
                  <span>Closing meter cannot be less than opening meter</span>
                </div>
              )}

              {/* Meter Difference Row */}
              <div className="meter-metric-row">
                <span className="metric-row-label">Meter Difference</span>
                <span className="metric-row-value mono-num">
                  {formatLitres(calc.meterDifference)}
                </span>
              </div>

              {/* 5-Litre Testing Section */}
              <div className="testing-control-box">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FlaskConical size={16} color="#059669" />
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                      Pump Testing
                    </span>
                  </div>
                  
                  <span className="testing-qty-tag">
                    5.00 L / Test
                  </span>
                </div>

                {/* 5 Litre Testing Button */}
                <button
                  type="button"
                  id={`btn-test-${pump.id}`}
                  className="btn-testing-action"
                  disabled={isTestButtonLocked || isInvalidClosing || (calc.meterDifference <= calc.testingLitres)}
                  onClick={() => setConfirmTestPump(pump)}
                  title="Deduct 5 litres for nozzle calibration test"
                >
                  <FlaskConical size={15} />
                  <span>5 Litre Testing</span>
                </button>

                {/* Testing Count & Litres Status */}
                <div className="testing-stats-strip">
                  <div>
                    <span className="strip-label">Testing Count:</span>
                    <span className="strip-val mono-num">
                      {calc.testingCount} {calc.testingCount === 1 ? 'Event' : 'Events'}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="strip-label">Testing Litres:</span>
                    <span className="strip-val mono-num deduction">
                      -{formatLitres(calc.testingLitres)}
                    </span>
                  </div>
                </div>

                {/* Testing History (Visible) */}
                {hasTests && (
                  <div className="testing-history-list">
                    <div className="history-heading">
                      <History size={12} /> Testing History ({calc.testingCount})
                    </div>
                    {calc.testingEvents.map((t, idx) => (
                      <div key={t.id || idx} className="testing-history-item">
                        <span className="test-badge-num">#{idx + 1}</span>
                        <span className="test-time">{t.time || 'Logged'}</span>
                        <span className="test-qty mono-num">5.00 L</span>
                        <button
                          type="button"
                          className="btn-remove-test"
                          onClick={() => handleInitiateRemoveTest(pump, t)}
                          title="Remove test (Authorized users only)"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Final Calculations Strip */}
              <div className="final-calculations-card">
                <div className="calc-item">
                  <div className="calc-label">Final Litres Sold</div>
                  <div className="calc-value mono-num" id={`final-litres-${pump.id}`}>
                    {formatLitres(calc.finalLitresSold)}
                  </div>
                  <div className="calc-subtext">
                    ({calc.meterDifference.toFixed(1)}L - {calc.testingLitres.toFixed(1)}L)
                  </div>
                </div>

                <div className="calc-item highlighted">
                  <div className="calc-label">Final Sales Amount</div>
                  <div className="calc-value mono-num highlight-currency" id={`final-amount-${pump.id}`}>
                    {formatINR(calc.finalSalesAmount)}
                  </div>
                  <div className="calc-subtext">
                    @ ₹{calc.fuelRate.toFixed(2)}/L
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal: Record 5-Litre Test */}
      {confirmTestPump && (
        <Modal
          isOpen={!!confirmTestPump}
          onClose={() => setConfirmTestPump(null)}
          title="Confirm 5 Litre Testing"
        >
          <div style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0', marginBottom: '16px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FlaskConical size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '0.98rem', color: '#065f46', fontWeight: '700' }}>
                  Record 5.00 L Test for {confirmTestPump.name}?
                </h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857' }}>
                  Fuel Type: {confirmTestPump.fuelType} • 5.00 Litres will be deducted from sales
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
              Selecting confirm will record one 5-litre calibration test event for <strong>{confirmTestPump.name}</strong>. The 5 litres will be automatically subtracted from the calculated sales litres for this shift.
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setConfirmTestPump(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#059669', borderColor: '#059669' }}
                onClick={handleConfirmRecordTest}
              >
                <CheckCircle2 size={16} />
                Confirm 5L Test
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Authorized Modal: Remove Test */}
      {removeTestModal.isOpen && (
        <Modal
          isOpen={removeTestModal.isOpen}
          onClose={() => setRemoveTestModal({ isOpen: false, pump: null, test: null, reason: '' })}
          title="Remove Testing Record"
        >
          <form onSubmit={handleConfirmRemoveTest} style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca', marginBottom: '16px', color: '#991b1b' }}>
              <ShieldCheck size={20} />
              <div style={{ fontSize: '0.85rem' }}>
                Authorized removal of <strong>5.00 L test</strong> on <strong>{removeTestModal.pump?.name}</strong>.
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
                Reason for Removal:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Accidental click, incorrect nozzle"
                required
                value={removeTestModal.reason}
                onChange={(e) => setRemoveTestModal(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setRemoveTestModal({ isOpen: false, pump: null, test: null, reason: '' })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-danger"
                style={{ flex: 1 }}
              >
                <Trash2 size={15} />
                Confirm Remove
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
