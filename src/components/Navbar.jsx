import React, { useState, useEffect } from 'react';
import { useFuel } from '../context/FuelContext';
import { getTodayDateStr, getRelativeDateStr, formatDate } from '../utils/formatters';
import { Calendar, Plus, Clock, Menu, ShieldCheck } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  const { 
    data, 
    activeDate, 
    setActiveDate, 
    openQuickSale, 
    isDayClosed,
    isOwnerAuthorized,
    setActiveTab,
    openOwnerAuthModal
  } = useFuel();
  const [currentTime, setCurrentTime] = useState('');

  // Live time ticker in Asia/Kolkata
  useEffect(() => {
    const updateTime = () => {
      try {
        const now = new Date();
        const str = new Intl.DateTimeFormat('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        }).format(now);
        setCurrentTime(str);
      } catch {
        setCurrentTime(new Date().toLocaleTimeString());
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const todayStr = getTodayDateStr();
  const yesterdayStr = getRelativeDateStr(-1);
  const isLocked = isDayClosed(activeDate);

  return (
    <header className="app-navbar">
      <div className="navbar-left">
        <button 
          className="btn btn-secondary btn-sm" 
          onClick={onToggleSidebar}
          style={{ display: 'flex', alignItems: 'center', padding: '6px' }}
          aria-label="Toggle Navigation"
        >
          <Menu size={18} />
        </button>

        <div className="station-badge-group">
          <div className="station-name">
            {data.settings.stationName || 'FuelFlow Station'}
            <span className="dealer-tag">{data.settings.dealerCode || 'IOCL DEALER'}</span>
          </div>
          <div className="station-meta">
            GSTIN: <span className="mono-num">{data.settings.gstin || '29AABCS1429B1Z8'}</span> • {data.settings.timezone || 'Asia/Kolkata'}
          </div>
        </div>
      </div>

      <div className="navbar-right">
        {/* Date Selector */}
        <div className="date-selector-wrapper">
          <Calendar size={15} color="var(--primary)" />
          <input
            type="date"
            value={activeDate}
            onChange={(e) => setActiveDate(e.target.value)}
            title="Filter data by date"
          />
          <button 
            type="button"
            className={`date-quick-btn ${activeDate === todayStr ? 'active' : ''}`}
            onClick={() => setActiveDate(todayStr)}
          >
            Today
          </button>
          <button 
            type="button"
            className={`date-quick-btn ${activeDate === yesterdayStr ? 'active' : ''}`}
            onClick={() => setActiveDate(yesterdayStr)}
          >
            Yesterday
          </button>
        </div>

        {/* Live Indian Timezone */}
        <div 
          className="date-selector-wrapper" 
          style={{ display: 'none', background: 'transparent', borderColor: 'transparent' }}
          id="clock-pill"
        >
          <Clock size={14} color="var(--text-muted)" />
          <span className="mono-num" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {currentTime} (IST)
          </span>
        </div>

        {/* Closing status pill */}
        {isLocked ? (
          <div className="status-badge matched" style={{ padding: '6px 10px', fontSize: '0.78rem' }}>
            <ShieldCheck size={14} /> Day Closed & Locked ({formatDate(activeDate)})
          </div>
        ) : (
          <button 
            className="btn-quick-sale"
            onClick={() => openQuickSale()}
            title="Record quick fuel transaction"
          >
            <Plus size={16} />
            <span>+ Quick Sale</span>
          </button>
        )}

        {/* Owner / Worker Mode Switcher Pill */}
        {isOwnerAuthorized ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: '#ecfdf5', 
              borderColor: '#a7f3d0', 
              color: '#065f46',
              fontWeight: '700',
              fontSize: '0.76rem',
              padding: '6px 10px'
            }}
            onClick={() => setActiveTab('owner-dashboard')}
            title="Owner Dashboard Active (Click to switch view)"
          >
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
            👑 Owner Mode
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              fontSize: '0.76rem',
              padding: '6px 10px'
            }}
            onClick={() => openOwnerAuthModal(() => setActiveTab('owner-dashboard'), 'Owner Dashboard Access')}
            title="Authenticate as Owner"
          >
            <span>🔒 Owner Login</span>
          </button>
        )}
      </div>
    </header>
  );
}
