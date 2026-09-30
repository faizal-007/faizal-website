import React from 'react';
import { useFuel } from '../context/FuelContext';
import { 
  LayoutDashboard, 
  Fuel, 
  PlusCircle, 
  History, 
  ReceiptIndianRupee, 
  QrCode, 
  CheckCircle2, 
  BarChart3, 
  Users, 
  Settings,
  HardDrive,
  Coffee,
  Layers,
  Banknote,
  Crown,
  Lock,
  X
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const { 
    activeTab, 
    setActiveTab, 
    data, 
    isDayClosed, 
    activeDate, 
    userRole, 
    isOwnerAuthorized, 
    openOwnerAuthModal 
  } = useFuel();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pumps', label: 'Pump Management', icon: Fuel, badge: '10' },
    { id: 'entry', label: 'Account Entry', icon: PlusCircle, highlight: true },
    { id: 'sales', label: 'Sales History', icon: History, count: data.transactions.length },
    { id: 'expenses', label: 'Expenses', icon: ReceiptIndianRupee, count: data.expenses.length },
    { id: 'expansion1', label: 'Expansion 1', icon: Coffee, count: (data.expansion1Items || []).length },
    { id: 'expansion2', label: 'Expansion 2', icon: Layers, count: (data.expansion2Entries || []).length },
    { id: 'denomination', label: 'Cash Denomination', icon: Banknote },
    { id: 'owner-dashboard', label: 'Owner Dashboard', icon: Crown, ownerOnly: true, badge: isOwnerAuthorized ? 'Unlocked' : 'PIN' },
    { id: 'staff-attendance', label: 'Staff Attendance', icon: Users, badge: `${data.staff.filter(s => s.status === 'Active').length}` },
    { id: 'upi', label: 'GPay / UPI', icon: QrCode },
    { 
      id: 'closing', 
      label: 'Daily Closing', 
      icon: CheckCircle2,
      closingStatus: isDayClosed(activeDate) ? 'Closed' : 'Pending'
    },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectTab = (tabId, ownerOnly) => {
    if (ownerOnly && !isOwnerAuthorized) {
      openOwnerAuthModal(() => {
        setActiveTab(tabId);
        if (onClose) onClose();
      }, 'Owner Dashboard Access');
      return;
    }
    setActiveTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div 
          className="modal-backdrop" 
          style={{ zIndex: 35, background: 'rgba(0,0,0,0.5)' }} 
          onClick={onClose} 
        />
      )}
      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon-box">
            <Fuel size={24} />
          </div>
          <div className="brand-info">
            <div className="brand-title">
              FAIZAL <span>FuelFlow</span>
            </div>
            <div className="brand-tagline">Smart Fuel Station Manager</div>
          </div>
          {isOpen && (
            <button 
              className="modal-close-btn" 
              style={{ marginLeft: 'auto', color: '#fff' }} 
              onClick={onClose}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleSelectTab(item.id, item.ownerOnly)}
              >
                <span className="nav-icon">
                  <Icon size={19} />
                </span>
                <span>{item.label}</span>

                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}

                {item.closingStatus && (
                  <span 
                    className="nav-badge" 
                    style={{ 
                      backgroundColor: item.closingStatus === 'Closed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: item.closingStatus === 'Closed' ? '#10b981' : '#f59e0b',
                      borderColor: 'transparent'
                    }}
                  >
                    {item.closingStatus}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="storage-badge">
            <span className="storage-pulse" />
            <HardDrive size={13} />
            <span>Local Device Storage Active</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', textAlign: 'center' }}>
            Version 2.4 Enterprise • FAIZAL FuelFlow
          </div>
        </div>
      </aside>
    </>
  );
}
