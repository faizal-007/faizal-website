import React, { useState } from 'react';
import { FuelProvider, useFuel } from './context/FuelContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import NotificationToast from './components/NotificationToast';
import QuickSaleModal from './components/QuickSaleModal';
import OwnerAuthModal from './components/OwnerAuthModal';

// Views
import DashboardView from './views/DashboardView';
import PumpManagementView from './views/PumpManagementView';
import AccountEntryView from './views/AccountEntryView';
import SalesHistoryView from './views/SalesHistoryView';
import ExpensesView from './views/ExpensesView';
import GPayUpiView from './views/GPayUpiView';
import DailyClosingView from './views/DailyClosingView';
import ReportsView from './views/ReportsView';
import StaffView from './views/StaffView';
import SettingsView from './views/SettingsView';
import Expansion1View from './views/Expansion1View';
import Expansion2View from './views/Expansion2View';
import CashDenominationView from './views/CashDenominationView';
import OwnerDashboardView from './views/OwnerDashboardView';
import StaffAttendanceView from './views/StaffAttendanceView';

function AppLayout() {
  const { activeTab } = useFuel();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-container">
      {/* Dark Navy Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* Main Workspace */}
      <div className="app-main">
        {/* Sticky Top Navbar */}
        <Navbar 
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} 
        />

        {/* View Switcher */}
        <main>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'pumps' && <PumpManagementView />}
          {activeTab === 'entry' && <AccountEntryView />}
          {activeTab === 'sales' && <SalesHistoryView />}
          {activeTab === 'expenses' && <ExpensesView />}
          {activeTab === 'expansion1' && <Expansion1View />}
          {activeTab === 'expansion2' && <Expansion2View />}
          {activeTab === 'denomination' && <CashDenominationView />}
          {activeTab === 'owner-dashboard' && <OwnerDashboardView />}
          {activeTab === 'staff-attendance' && <StaffAttendanceView />}
          {activeTab === 'upi' && <GPayUpiView />}
          {activeTab === 'closing' && <DailyClosingView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'staff' && <StaffView />}
          {activeTab === 'settings' && <SettingsView />}
        </main>

        {/* Bottom Navigation for mobile and desktop quick access */}
        <BottomNav />
      </div>

      {/* Global Quick Sale Modal */}
      <QuickSaleModal />

      {/* Real-time Toast Notifications */}
      <NotificationToast />

      {/* Owner PIN Authentication Modal */}
      <OwnerAuthModal />
    </div>
  );
}

export default function App() {
  return (
    <FuelProvider>
      <AppLayout />
    </FuelProvider>
  );
}
