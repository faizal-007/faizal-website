import React, { useState } from 'react';
import { useFuel } from '../context/FuelContext';
import { Shield, KeyRound, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function OwnerAuthModal() {
  const { ownerAuthModal, closeOwnerAuthModal, loginAsOwner } = useFuel();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!ownerAuthModal.isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pin) {
      setError('Please enter the owner PIN');
      return;
    }

    const res = loginAsOwner(pin);
    if (res.success) {
      if (typeof ownerAuthModal.callback === 'function') {
        ownerAuthModal.callback();
      }
      setPin('');
      setError('');
      closeOwnerAuthModal();
    } else {
      setError('Incorrect Owner PIN. Please try again.');
    }
  };

  const handleClose = () => {
    setPin('');
    setError('');
    closeOwnerAuthModal();
  };

  return (
    <div className="modal-backdrop" onClick={handleClose} style={{ zIndex: 100 }}>
      <div 
        className="modal-container" 
        style={{ maxWidth: '420px', padding: '0' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                {ownerAuthModal.title || 'Owner Authentication'}
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: 0 }}>
                Authorized management access only
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={handleClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            This section is restricted to the fuel station owner and authorized supervisors. Enter your security PIN to continue.
          </p>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '600', marginBottom: '6px' }}>
              <KeyRound size={15} color="var(--primary)" />
              Owner Security PIN
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (error) setError('');
              }}
              style={{
                fontSize: '1.25rem',
                letterSpacing: '0.25em',
                textAlign: 'center',
                height: '46px',
                fontWeight: '700'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              <span>Default owner PIN is <strong>1234</strong></span>
              <button 
                type="button" 
                onClick={() => setPin('1234')}
                style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
              >
                Fill 1234
              </button>
            </div>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '0.8rem', marginBottom: '16px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1, backgroundColor: '#059669', borderColor: '#059669' }}
            >
              <CheckCircle size={16} />
              Authorize & Enter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
