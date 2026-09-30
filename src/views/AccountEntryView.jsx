import React, { useState, useEffect } from 'react';
import { useFuel } from '../context/FuelContext';
import { getTodayDateStr, getCurrentTimeStr, cleanVehicleNumber, formatINR } from '../utils/formatters';
import { 
  PlusCircle, 
  RotateCcw, 
  Save, 
  Fuel, 
  Car, 
  User, 
  Clock, 
  Calendar, 
  Banknote, 
  CreditCard, 
  QrCode, 
  CheckCircle,
  AlertCircle,
  Edit3
} from 'lucide-react';

export default function AccountEntryView({ preselectedData = null, onSuccess = null }) {
  const { data, addTransaction, isDayClosed, showToast, activeDate } = useFuel();

  const [date, setDate] = useState(() => preselectedData?.date || activeDate || getTodayDateStr());
  const [time, setTime] = useState(() => getCurrentTimeStr());
  const [staffId, setStaffId] = useState(() => {
    if (preselectedData?.staffId) return preselectedData.staffId;
    const activeStaff = data.staff.find(s => s.status === 'Active');
    return activeStaff ? activeStaff.id : '';
  });
  
  const [fuelCategory, setFuelCategory] = useState(() => preselectedData?.fuelCategory || 'Petrol');
  const [pumpId, setPumpId] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [litres, setLitres] = useState('');
  const [fuelRate, setFuelRate] = useState(() => data.settings.rates[preselectedData?.fuelCategory || 'Petrol'] || 102.84);
  const [totalAmount, setTotalAmount] = useState('');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter pumps matching fuel category
  const matchingPumps = data.pumps.filter(p => p.fuelType === fuelCategory && p.status === 'Active');

  // When fuelCategory changes, update rate and select first matching pump
  useEffect(() => {
    const rate = data.settings.rates[fuelCategory] || 0;
    setFuelRate(rate);

    // If preselected pump matches, keep it, else pick first matching
    if (preselectedData?.pumpId) {
      const match = data.pumps.find(p => p.id === preselectedData.pumpId && p.fuelType === fuelCategory);
      if (match) {
        setPumpId(match.id);
        return;
      }
    }
    const firstMatch = data.pumps.find(p => p.fuelType === fuelCategory && p.status === 'Active');
    setPumpId(firstMatch ? firstMatch.id : '');
  }, [fuelCategory, data.settings.rates, data.pumps, preselectedData]);

  // If pump is selected and it has an assigned staff, auto-select staff if not already picked
  useEffect(() => {
    if (pumpId) {
      const p = data.pumps.find(item => item.id === pumpId);
      if (p && p.assignedStaffId) {
        const staffExists = data.staff.some(s => s.id === p.assignedStaffId && s.status === 'Active');
        if (staffExists && !staffId) {
          setStaffId(p.assignedStaffId);
        }
      }
    }
  }, [pumpId, data.pumps, data.staff, staffId]);

  // Recalculate total amount when litres or rate changes (if not in manual override mode)
  useEffect(() => {
    if (!isManualOverride) {
      const l = parseFloat(litres);
      const r = parseFloat(fuelRate);
      if (!isNaN(l) && !isNaN(r) && l > 0 && r > 0) {
        const total = (l * r).toFixed(2);
        setTotalAmount(total);
      } else {
        setTotalAmount('');
      }
    }
  }, [litres, fuelRate, isManualOverride]);

  // Handle manual quick amount preset (e.g. ₹500, ₹1000)
  const handleQuickAmount = (amount) => {
    const r = parseFloat(fuelRate);
    if (r > 0) {
      const calcLitres = (amount / r).toFixed(2);
      setLitres(calcLitres);
      setTotalAmount(amount.toFixed(2));
      setIsManualOverride(false);
      setErrors(prev => ({ ...prev, litres: null, totalAmount: null }));
    }
  };

  // Handle manual quick litres preset (e.g. 5L, 10L)
  const handleQuickLitres = (addL) => {
    const current = parseFloat(litres) || 0;
    const nextLitres = (current + addL).toFixed(2);
    setLitres(nextLitres);
    setIsManualOverride(false);
    setErrors(prev => ({ ...prev, litres: null, totalAmount: null }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};

    if (!date) newErrors.date = 'Date is required';
    if (!time) newErrors.time = 'Time is required';
    if (!staffId) newErrors.staffId = 'Please select a staff member';
    if (!pumpId) newErrors.pumpId = 'Please select an active pump';

    const parsedLitres = parseFloat(litres);
    if (isNaN(parsedLitres) || parsedLitres <= 0) {
      newErrors.litres = 'Enter valid litres greater than 0';
    }

    const parsedRate = parseFloat(fuelRate);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      newErrors.fuelRate = 'Invalid fuel rate';
    }

    const parsedTotal = parseFloat(totalAmount);
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      newErrors.totalAmount = 'Total amount must be greater than ₹0';
    }

    if (isManualOverride && (!overrideReason || overrideReason.trim().length < 3)) {
      newErrors.overrideReason = 'Please specify a reason for the manual amount override';
    }

    // Check if pump fuel type matches fuelCategory
    const pumpObj = data.pumps.find(p => p.id === pumpId);
    if (pumpObj && pumpObj.fuelType !== fuelCategory) {
      newErrors.pumpId = `Selected pump (${pumpObj.fuelType}) does not match ${fuelCategory}`;
    }

    // Check if day is locked
    if (isDayClosed(date)) {
      newErrors.date = `Accounts for ${date} are locked and closed.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form
  const handleReset = () => {
    setTime(getCurrentTimeStr());
    setVehicleNumber('');
    setLitres('');
    setTotalAmount('');
    setIsManualOverride(false);
    setOverrideReason('');
    setTransactionRef('');
    setNotes('');
    setErrors({});
  };

  // Save Transaction
  const handleSubmit = (andAddAnother = false) => {
    if (isSubmitting) return;

    if (!validateForm()) {
      showToast('Please fix errors before submitting the entry.', 'error');
      return;
    }

    setIsSubmitting(true);

    const staffObj = data.staff.find(s => s.id === staffId);
    const pumpObj = data.pumps.find(p => p.id === pumpId);

    const payload = {
      date,
      time,
      staffId,
      staffName: staffObj ? staffObj.name : 'Unknown',
      fuelCategory,
      pumpId,
      pumpName: pumpObj ? pumpObj.name : 'Unknown',
      vehicleNumber: cleanVehicleNumber(vehicleNumber),
      litres: parseFloat(litres),
      fuelRate: parseFloat(fuelRate),
      totalAmount: parseFloat(totalAmount),
      isManualOverride,
      overrideReason: isManualOverride ? overrideReason.trim() : '',
      paymentMethod,
      transactionRef: transactionRef.trim(),
      notes: notes.trim()
    };

    const res = addTransaction(payload);
    setIsSubmitting(false);

    if (res.success) {
      if (andAddAnother) {
        handleReset();
      } else {
        if (onSuccess) {
          onSuccess(res.txn);
        } else {
          handleReset();
        }
      }
    }
  };

  return (
    <div className="page-content">
      {/* Page Title */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Account Entry – Fuel Dispense Record</h1>
          <p>
            Fast and accurate sales ledger entry for Indian petrol bunk shifts. Automatic rate calculation, pump validation & digital receipts.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '920px', margin: '0 auto', width: '100%' }}>
        <div className="card" style={{ boxShadow: 'var(--shadow-lg)' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #ffffff 100%)' }}>
            <div className="card-title">
              <PlusCircle size={20} color="var(--primary)" />
              <span>Record New Forecourt Sale</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Fuel Rate: <strong className="mono-num" style={{ color: 'var(--primary)' }}>₹{parseFloat(fuelRate || 0).toFixed(2)} / L</strong>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
              <div className="form-grid">
                {/* Date */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Date <span className="req">*</span></span>
                    <Calendar size={13} color="var(--text-muted)" />
                  </label>
                  <input
                    type="date"
                    className="form-control mono-num"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                  {errors.date && <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{errors.date}</span>}
                </div>

                {/* Time */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Time (24h) <span className="req">*</span></span>
                    <Clock size={13} color="var(--text-muted)" />
                  </label>
                  <input
                    type="time"
                    className="form-control mono-num"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                  />
                  {errors.time && <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{errors.time}</span>}
                </div>

                {/* Staff Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Staff Member <span className="req">*</span></span>
                    <User size={13} color="var(--text-muted)" />
                  </label>
                  <select
                    className="form-control"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Staff --</option>
                    {data.staff.filter(s => s.status === 'Active').map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                  {errors.staffId && <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{errors.staffId}</span>}
                </div>

                {/* Fuel Category Selector */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">
                    <span>Fuel Category <span className="req">*</span></span>
                    <Fuel size={13} color="var(--text-muted)" />
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {[
                      { type: 'Petrol', color: 'var(--fuel-petrol)' },
                      { type: 'Diesel', color: 'var(--fuel-diesel)' },
                      { type: 'Power Petrol', color: 'var(--fuel-power)' }
                    ].map(fuel => (
                      <button
                        key={fuel.type}
                        type="button"
                        className="btn"
                        style={{
                          height: '44px',
                          border: `2px solid ${fuelCategory === fuel.type ? fuel.color : 'var(--border-color)'}`,
                          backgroundColor: fuelCategory === fuel.type ? '#f8fafc' : '#ffffff',
                          color: fuelCategory === fuel.type ? fuel.color : 'var(--text-primary)',
                          fontWeight: fuelCategory === fuel.type ? '700' : '500',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                        onClick={() => setFuelCategory(fuel.type)}
                      >
                        <Fuel size={16} />
                        <span>{fuel.type}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pump Selection */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Select Pump <span className="req">*</span></span>
                  </label>
                  <select
                    className="form-control"
                    value={pumpId}
                    onChange={(e) => setPumpId(e.target.value)}
                    required
                  >
                    <option value="">-- Select Pump --</option>
                    {matchingPumps.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Pump #{p.pumpNumber})
                      </option>
                    ))}
                  </select>
                  {errors.pumpId && <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{errors.pumpId}</span>}
                </div>

                {/* Vehicle Registration Number */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Vehicle Reg. Number (Optional)</span>
                    <Car size={13} color="var(--text-muted)" />
                  </label>
                  <input
                    type="text"
                    className="form-control mono-num"
                    placeholder="e.g. KA-04-MB-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(cleanVehicleNumber(e.target.value))}
                    maxLength={16}
                  />
                </div>

                {/* Fuel Rate (₹/L) */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Fuel Rate per Litre (₹) <span className="req">*</span></span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control mono-num"
                    value={fuelRate}
                    onChange={(e) => setFuelRate(e.target.value)}
                    required
                  />
                  {errors.fuelRate && <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{errors.fuelRate}</span>}
                </div>

                {/* Litres Sold */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Litres Sold <span className="req">*</span></span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control mono-num"
                    placeholder="0.00"
                    value={litres}
                    onChange={(e) => {
                      setLitres(e.target.value);
                      setIsManualOverride(false);
                      setErrors(prev => ({ ...prev, litres: null }));
                    }}
                    required
                  />
                  {/* Quick Volume Presets */}
                  <div className="presets-group">
                    <button type="button" className="preset-chip" onClick={() => handleQuickLitres(2)}>+2L</button>
                    <button type="button" className="preset-chip" onClick={() => handleQuickLitres(5)}>+5L</button>
                    <button type="button" className="preset-chip" onClick={() => handleQuickLitres(10)}>+10L</button>
                    <button type="button" className="preset-chip" onClick={() => handleQuickLitres(20)}>+20L</button>
                    <button type="button" className="preset-chip" onClick={() => handleQuickLitres(50)}>+50L</button>
                  </div>
                  {errors.litres && <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{errors.litres}</span>}
                </div>

                {/* Total Amount (₹) */}
                <div className="form-group">
                  <label className="form-label">
                    <span>Total Amount (₹) <span className="req">*</span></span>
                    {isManualOverride ? (
                      <span style={{ color: 'var(--warning)', fontSize: '0.72rem', fontWeight: '700' }}>
                        Manual Override Active
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        (Litres × Rate)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control mono-num"
                    style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '800', 
                      color: 'var(--primary)',
                      backgroundColor: isManualOverride ? '#fffbeb' : '#f8fafc' 
                    }}
                    placeholder="₹0.00"
                    value={totalAmount}
                    onChange={(e) => {
                      setTotalAmount(e.target.value);
                      setIsManualOverride(true);
                      setErrors(prev => ({ ...prev, totalAmount: null }));
                    }}
                    required
                  />
                  {/* Quick Rupee Presets */}
                  <div className="presets-group">
                    <button type="button" className="preset-chip" onClick={() => handleQuickAmount(100)}>₹100</button>
                    <button type="button" className="preset-chip" onClick={() => handleQuickAmount(200)}>₹200</button>
                    <button type="button" className="preset-chip" onClick={() => handleQuickAmount(500)}>₹500</button>
                    <button type="button" className="preset-chip" onClick={() => handleQuickAmount(1000)}>₹1000</button>
                    <button type="button" className="preset-chip" onClick={() => handleQuickAmount(2000)}>₹2000</button>
                  </div>
                  {errors.totalAmount && <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{errors.totalAmount}</span>}
                </div>

                {/* Override Reason (if manual override active) */}
                {isManualOverride && (
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label" style={{ color: 'var(--warning)' }}>
                      <span>Manual Override Reason <span className="req">*</span></span>
                      <Edit3 size={13} />
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Rounding off concession, calibration test, special coupon"
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      required
                    />
                    {errors.overrideReason && <span style={{ color: 'var(--danger)', fontSize: '0.74rem' }}>{errors.overrideReason}</span>}
                  </div>
                )}

                {/* Payment Method */}
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">
                    <span>Payment Method <span className="req">*</span></span>
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {[
                      { id: 'Cash', label: 'Cash', icon: Banknote },
                      { id: 'GPay', label: 'GPay', icon: QrCode },
                      { id: 'Other UPI', label: 'Other UPI', icon: QrCode },
                      { id: 'Card', label: 'Card / POS', icon: CreditCard }
                    ].map(pm => {
                      const Icon = pm.icon;
                      const selected = paymentMethod === pm.id;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          className="btn"
                          style={{
                            height: '42px',
                            border: `2px solid ${selected ? 'var(--primary)' : 'var(--border-color)'}`,
                            backgroundColor: selected ? 'var(--primary-light)' : '#ffffff',
                            color: selected ? 'var(--primary)' : 'var(--text-secondary)',
                            fontWeight: selected ? '700' : '500'
                          }}
                          onClick={() => setPaymentMethod(pm.id)}
                        >
                          <Icon size={16} />
                          <span>{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Transaction Reference (if digital) */}
                {paymentMethod !== 'Cash' && (
                  <div className="form-group">
                    <label className="form-label">
                      <span>Transaction / UTR Reference</span>
                    </label>
                    <input
                      type="text"
                      className="form-control mono-num"
                      placeholder="e.g. UPI Ref / Approval Code"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="form-group" style={{ gridColumn: paymentMethod === 'Cash' ? 'span 2' : 'span 1' }}>
                  <label className="form-label">
                    <span>Notes / Customer Name (Optional)</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Regular fleet client / Bill receipt requested"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  <RotateCcw size={15} />
                  <span>Clear Form</span>
                </button>

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                >
                  <Save size={15} />
                  <span>Save & Add Another</span>
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleSubmit(false)}
                  disabled={isSubmitting}
                >
                  <CheckCircle size={16} />
                  <span>Save Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
