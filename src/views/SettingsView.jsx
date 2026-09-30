import React, { useState } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatDate, formatDateTime } from '../utils/formatters';
import { 
  Settings, 
  Fuel, 
  Building, 
  Lock, 
  Save, 
  HardDrive, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle,
  History,
  Tag
} from 'lucide-react';
import { storageService } from '../services/storageService';

export default function SettingsView() {
  const { 
    data, 
    updateFuelRate, 
    updateSettings, 
    clearSampleData, 
    reloadSampleData, 
    factoryReset,
    showToast 
  } = useFuel();

  // Fuel Rates State
  const [petrolRate, setPetrolRate] = useState(data.settings.rates.Petrol);
  const [dieselRate, setDieselRate] = useState(data.settings.rates.Diesel);
  const [powerPetrolRate, setPowerPetrolRate] = useState(data.settings.rates['Power Petrol']);

  // Station Profile State
  const [stationName, setStationName] = useState(data.settings.stationName);
  const [dealerCode, setDealerCode] = useState(data.settings.dealerCode);
  const [gstin, setGstin] = useState(data.settings.gstin);
  const [address, setAddress] = useState(data.settings.address);
  const [phone, setPhone] = useState(data.settings.phone);
  const [email, setEmail] = useState(data.settings.email);

  // Security & Closing Defaults
  const [defaultOpeningCash, setDefaultOpeningCash] = useState(data.settings.defaultOpeningCash || 25000);
  const [supervisorPin, setSupervisorPin] = useState(data.settings.supervisorPin || '1234');

  // Confirmation flags for destructive actions
  const [confirmClearSample, setConfirmClearSample] = useState(false);
  const [confirmFactoryReset, setConfirmFactoryReset] = useState(false);

  // Handle saving Fuel Rates
  const handleSaveRates = (e) => {
    e.preventDefault();
    updateFuelRate('Petrol', petrolRate);
    updateFuelRate('Diesel', dieselRate);
    updateFuelRate('Power Petrol', powerPetrolRate);
  };

  // Handle saving Profile & Defaults
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateSettings({
      stationName: stationName.trim(),
      dealerCode: dealerCode.trim(),
      gstin: gstin.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim(),
      defaultOpeningCash: parseFloat(defaultOpeningCash) || 25000,
      supervisorPin: supervisorPin.trim() || '1234'
    });
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    storageService.exportBackupJSON(data);
    showToast('FuelFlow JSON backup exported successfully.', 'success');
  };

  // Import JSON Backup
  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const res = storageService.importBackupJSON(content);
      if (res.success) {
        window.location.reload();
      } else {
        showToast(`Failed to restore backup: ${res.error}`, 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Station Settings & Configuration</h1>
          <p>
            Configure fuel prices per litre, dealer identity, security PIN, persistent backups & sample testing data
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Card 1: Fuel Price Rates Configuration */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Fuel size={18} color="var(--primary)" />
              <span>Current Daily Fuel Rates (₹ / Litre)</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Historical rates preserved</span>
          </div>

          <div className="card-body">
            <div style={{ padding: '10px 14px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', fontSize: '0.82rem', color: '#1e40af', marginBottom: '16px' }}>
              <strong>Audit Notice:</strong> Updating fuel prices sets the default rate for all new sales entries. It will <em>never</em> modify rates or amounts of previously saved transactions.
            </div>

            <form onSubmit={handleSaveRates}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Petrol */}
                <div className="form-group">
                  <label className="form-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="fuel-tag petrol" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>PETROL</span>
                      <span>Price per Litre (₹)</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control mono-num"
                    style={{ fontSize: '1.1rem', fontWeight: '700' }}
                    value={petrolRate}
                    onChange={(e) => setPetrolRate(e.target.value)}
                    required
                  />
                </div>

                {/* Diesel */}
                <div className="form-group">
                  <label className="form-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="fuel-tag diesel" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>DIESEL</span>
                      <span>Price per Litre (₹)</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control mono-num"
                    style={{ fontSize: '1.1rem', fontWeight: '700' }}
                    value={dieselRate}
                    onChange={(e) => setDieselRate(e.target.value)}
                    required
                  />
                </div>

                {/* Power Petrol */}
                <div className="form-group">
                  <label className="form-label">
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="fuel-tag power-petrol" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>POWER PETROL</span>
                      <span>Price per Litre (₹)</span>
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    className="form-control mono-num"
                    style={{ fontSize: '1.1rem', fontWeight: '700' }}
                    value={powerPetrolRate}
                    onChange={(e) => setPowerPetrolRate(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button type="submit" className="btn btn-primary">
                    <Save size={15} /> Save Current Rates
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Card 2: Station Identity & Details */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Building size={18} color="var(--cyan)" />
              <span>Petrol Station Profile</span>
            </div>
          </div>

          <div className="card-body">
            <form onSubmit={handleSaveProfile}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Station Business Name <span className="req">*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Oil Company RO Code</label>
                  <input
                    type="text"
                    className="form-control mono-num"
                    placeholder="e.g. IOCL-RO-56214"
                    value={dealerCode}
                    onChange={(e) => setDealerCode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">GSTIN / VAT Number</label>
                  <input
                    type="text"
                    className="form-control mono-num"
                    placeholder="e.g. 29AABCS1429B1Z8"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Forecourt Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input
                    type="text"
                    className="form-control mono-num"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Opening Cash Default */}
                <div className="form-group">
                  <label className="form-label">Default Opening Cash Float (₹)</label>
                  <input
                    type="number"
                    step="1"
                    className="form-control mono-num"
                    value={defaultOpeningCash}
                    onChange={(e) => setDefaultOpeningCash(e.target.value)}
                  />
                </div>

                {/* Supervisor PIN */}
                <div className="form-group">
                  <label className="form-label">Supervisor Security PIN</label>
                  <input
                    type="password"
                    maxLength={6}
                    className="form-control mono-num"
                    value={supervisorPin}
                    onChange={(e) => setSupervisorPin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="submit" className="btn btn-primary">
                  <Save size={15} /> Save Station Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Storage, Backup & Sample Data Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Backup & Persistence Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <HardDrive size={18} color="var(--primary)" />
              <span>Data Storage & Backup</span>
            </div>
            <span className="status-badge active" style={{ fontSize: '0.7rem' }}>
              Persistent Local Storage
            </span>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              All records (pumps, transactions, expenses, closings, audit logs) are securely stored in this browser's persistent local storage. Download JSON backups regularly to keep safe external records.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={handleExportBackup}>
                <Download size={14} />
                <span>Export JSON Backup</span>
              </button>

              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={14} />
                <span>Import JSON Backup</span>
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={handleImportBackup}
                />
              </label>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              Records Count: {data.transactions.length} sales • {data.expenses.length} expenses • {data.staff.length} staff members • {Object.keys(data.closings).length} day closings
            </div>
          </div>
        </div>

        {/* Sample Data Management */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <RefreshCw size={18} color="var(--warning)" />
              <span>Sample Testing Data Tools</span>
            </div>
          </div>

          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Manage sample demo entries across all 10 pumps, staff members, and dates:
            </p>

            {/* Clear Sample Data Only */}
            <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>Clear Sample Records Only</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Removes all pre-loaded demo sales and expenses. Any genuine entries you created will remain safe.
              </div>
              {confirmClearSample ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => { clearSampleData(); setConfirmClearSample(false); }}>
                    Yes, Remove Sample Data
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmClearSample(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="btn btn-secondary btn-sm" onClick={() => setConfirmClearSample(true)}>
                  Clear Sample Data
                </button>
              )}
            </div>

            {/* Reset to Fresh Sample Dataset */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary btn-sm" onClick={reloadSampleData}>
                <RefreshCw size={13} />
                <span>Reload Sample Dataset</span>
              </button>

              {confirmFactoryReset ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-danger btn-sm" onClick={() => { factoryReset(); setConfirmFactoryReset(false); }}>
                    Confirm Empty Station Reset
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmFactoryReset(false)}>
                    Cancel
                  </button>
                </div>
              ) : (
                <button className="btn btn-secondary btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setConfirmFactoryReset(true)}>
                  <Trash2 size={13} />
                  <span>Factory Clean Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <History size={18} color="var(--primary)" />
            <span>Station Security & Audit Trail</span>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Immutable operational logs
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-responsive" style={{ border: 'none', maxHeight: '300px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp (IST)</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>User / Authorized By</th>
                </tr>
              </thead>
              <tbody>
                {data.auditLogs.slice(0, 15).map(log => (
                  <tr key={log.id}>
                    <td className="mono-num" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td>
                      <span className="badge" style={{ background: '#f1f5f9', fontWeight: '700', fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {log.entity}
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      {log.details}
                    </td>
                    <td style={{ fontSize: '0.8rem', fontWeight: '600' }}>
                      {log.user}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
