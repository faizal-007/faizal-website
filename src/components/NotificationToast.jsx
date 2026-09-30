import React from 'react';
import { useFuel } from '../context/FuelContext';
import { CheckCircle, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export default function NotificationToast() {
  const { toasts, removeToast } = useFuel();

  if (!toasts.length) return null;

  return (
    <div className="toast-container" role="status" aria-live="polite">
      {toasts.map((toast) => {
        let Icon = CheckCircle;
        if (toast.type === 'error') Icon = AlertCircle;
        else if (toast.type === 'warning') Icon = AlertTriangle;
        else if (toast.type === 'info') Icon = Info;

        return (
          <div key={toast.id} className={`toast ${toast.type}`}>
            <Icon size={18} style={{ flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
              aria-label="Dismiss notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
