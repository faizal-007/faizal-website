import React from 'react';
import { useFuel } from '../context/FuelContext';
import { 
  Home, 
  PlusCircle, 
  Fuel, 
  History, 
  ReceiptIndianRupee, 
  CheckCircle2, 
  ShieldCheck,
  Lock
} from 'lucide-react';

export default function BottomNav() {
  const { 
    activeTab, 
    setActiveTab, 
    userRole, 
    isOwnerAuthorized, 
    openOwnerAuthModal 
  } = useFuel();

  const handleTabClick = (tabId) => {
    if (tabId === 'owner-dashboard') {
      if (isOwnerAuthorized) {
        setActiveTab('owner-dashboard');
      } else {
        openOwnerAuthModal(() => {
          setActiveTab('owner-dashboard');
        }, 'Unlock Owner Maintenance');
      }
      return;
    }
    setActiveTab(tabId);
  };

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'pumps', label: 'Pumps', icon: Fuel },
    { id: 'entry', label: 'Accounts', icon: PlusCircle, highlight: true },
    { id: 'sales', label: 'Sales', icon: History },
    { id: 'expenses', label: 'Expenses', icon: ReceiptIndianRupee },
    { id: 'closing', label: 'Settle', icon: CheckCircle2 },
    { 
      id: 'owner-dashboard', 
      label: 'Owner', 
      icon: isOwnerAuthorized ? ShieldCheck : Lock,
      isOwner: true 
    }
  ];

  return (
    <nav className="bottom-nav-bar" aria-label="Bottom Navigation">
      <div className="bottom-nav-inner">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`bottom-nav-${item.id}`}
              className={`bottom-nav-item ${isActive ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`}
              onClick={() => handleTabClick(item.id)}
              title={item.label}
            >
              <div className="bottom-nav-icon-wrap">
                <Icon size={19} />
              </div>
              <span className="bottom-nav-label">{item.label}</span>
              {isActive && <span className="bottom-nav-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
