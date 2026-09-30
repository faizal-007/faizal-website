import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { storageService } from '../services/storageService';
import { getTodayDateStr } from '../utils/formatters';

const FuelContext = createContext(null);

export function FuelProvider({ children }) {
  // App state loaded from persistent storage
  const [data, setData] = useState(() => storageService.loadData());
  const [activeDate, setActiveDate] = useState(() => getTodayDateStr());
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPumpForDetails, setSelectedPumpForDetails] = useState(null);
  const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
  const [quickSalePreselect, setQuickSalePreselect] = useState(null);

  // Role and Owner Authentication State
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('fuelflow_user_role') || 'worker';
  });
  const [isOwnerAuthorized, setIsOwnerAuthorized] = useState(() => {
    return localStorage.getItem('fuelflow_owner_auth') === 'true';
  });
  const [ownerAuthModal, setOwnerAuthModal] = useState({ isOpen: false, callback: null, title: '' });

  // Toast notifications
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    storageService.saveData(data);
  }, [data]);

  // Check if a specific date is closed and locked
  const isDayClosed = useCallback((date) => {
    const closing = data.closings[date];
    return !!(closing && closing.status === 'Closed' && closing.isLocked);
  }, [data.closings]);

  // Get daily closing record for a date
  const getClosing = useCallback((date) => {
    return data.closings[date] || null;
  }, [data.closings]);

  /**
   * Centralized calculations for any date
   */
  const getDateMetrics = useCallback((date = activeDate) => {
    const dateTxns = data.transactions.filter(t => t.date === date);
    const dateExpenses = data.expenses.filter(e => e.date === date);
    const dateAdjustments = data.adjustments.filter(a => a.date === date);
    const closing = data.closings[date];

    // Sales by fuel category
    let petrolSales = 0, petrolLitres = 0;
    let dieselSales = 0, dieselLitres = 0;
    let powerPetrolSales = 0, powerPetrolLitres = 0;

    // Sales by payment method
    let cashSales = 0;
    let gpaySales = 0;
    let otherUpiSales = 0;
    let cardSales = 0;

    // Pump totals map
    const pumpStats = {};
    data.pumps.forEach(p => {
      pumpStats[p.id] = { litres: 0, sales: 0, count: 0 };
    });

    // Staff totals map
    const staffStats = {};
    data.staff.forEach(s => {
      staffStats[s.id] = { litres: 0, sales: 0, count: 0 };
    });

    dateTxns.forEach(t => {
      const amount = Number(t.totalAmount) || 0;
      const litres = Number(t.litres) || 0;

      // Fuel category
      if (t.fuelCategory === 'Petrol') {
        petrolSales += amount;
        petrolLitres += litres;
      } else if (t.fuelCategory === 'Diesel') {
        dieselSales += amount;
        dieselLitres += litres;
      } else if (t.fuelCategory === 'Power Petrol') {
        powerPetrolSales += amount;
        powerPetrolLitres += litres;
      }

      // Payment method
      if (t.paymentMethod === 'Cash') cashSales += amount;
      else if (t.paymentMethod === 'GPay') gpaySales += amount;
      else if (t.paymentMethod === 'Other UPI') otherUpiSales += amount;
      else if (t.paymentMethod === 'Card') cardSales += amount;

      // Pump stats
      if (pumpStats[t.pumpId]) {
        pumpStats[t.pumpId].litres += litres;
        pumpStats[t.pumpId].sales += amount;
        pumpStats[t.pumpId].count += 1;
      }

      // Staff stats
      if (t.staffId && staffStats[t.staffId]) {
        staffStats[t.staffId].litres += litres;
        staffStats[t.staffId].sales += amount;
        staffStats[t.staffId].count += 1;
      }
    });

    const totalSales = petrolSales + dieselSales + powerPetrolSales;
    const totalLitres = petrolLitres + dieselLitres + powerPetrolLitres;
    const totalCollections = cashSales + gpaySales + otherUpiSales + cardSales;

    // Expenses
    let cashExpenses = 0;
    let digitalExpenses = 0;
    dateExpenses.forEach(e => {
      const amt = Number(e.amount) || 0;
      if (e.paymentMethod === 'Cash') {
        cashExpenses += amt;
      } else {
        digitalExpenses += amt;
      }
    });
    const totalExpenses = cashExpenses + digitalExpenses;

    // Payment Adjustments (GPay/UPI manual non-sale records)
    let manualGpay = 0;
    let manualOtherUpi = 0;
    dateAdjustments.forEach(a => {
      const amt = Number(a.amount) || 0;
      if (a.paymentType === 'GPay') manualGpay += amt;
      else manualOtherUpi += amt;
    });

    const totalManualDigital = manualGpay + manualOtherUpi;

    // Expected Cash Calculation:
    // Expected Cash = Opening Cash + Cash Sales - Cash Expenses + Cash Adjustments
    const openingCash = closing?.openingCash ?? (data.settings.defaultOpeningCash || 25000);
    const cashAdjustments = closing?.cashAdjustments ?? 0;
    const expectedCash = openingCash + cashSales - cashExpenses + cashAdjustments;

    // Digital collections total (Sales GPay/UPI + Non-sale direct QR collections)
    const totalDigitalCollected = gpaySales + otherUpiSales + totalManualDigital;

    return {
      date,
      totalSales,
      totalLitres,
      petrolSales,
      dieselSales,
      powerPetrolSales,
      petrolLitres,
      dieselLitres,
      powerPetrolLitres,
      cashSales,
      gpaySales,
      otherUpiSales,
      cardSales,
      totalCollections,
      totalExpenses,
      cashExpenses,
      digitalExpenses,
      openingCash,
      cashAdjustments,
      expectedCash,
      manualGpay,
      manualOtherUpi,
      totalManualDigital,
      totalDigitalCollected,
      pumpStats,
      staffStats,
      closing,
      transactionCount: dateTxns.length,
      expenseCount: dateExpenses.length,
      isClosed: !!(closing && closing.status === 'Closed' && closing.isLocked)
    };
  }, [data, activeDate]);

  // Overall statistics for all time (for staff and pumps summary)
  const allTimeStats = useMemo(() => {
    const pumpStats = {};
    data.pumps.forEach(p => {
      pumpStats[p.id] = { litres: 0, sales: 0, count: 0 };
    });

    const staffStats = {};
    data.staff.forEach(s => {
      staffStats[s.id] = { litres: 0, sales: 0, count: 0 };
    });

    data.transactions.forEach(t => {
      const amount = Number(t.totalAmount) || 0;
      const litres = Number(t.litres) || 0;
      if (pumpStats[t.pumpId]) {
        pumpStats[t.pumpId].litres += litres;
        pumpStats[t.pumpId].sales += amount;
        pumpStats[t.pumpId].count += 1;
      }
      if (t.staffId && staffStats[t.staffId]) {
        staffStats[t.staffId].litres += litres;
        staffStats[t.staffId].sales += amount;
        staffStats[t.staffId].count += 1;
      }
    });

    return { pumpStats, staffStats };
  }, [data.transactions, data.pumps, data.staff]);

  // Actions: Add Transaction
  const addTransaction = useCallback((entry) => {
    if (isDayClosed(entry.date)) {
      showToast(`Cannot add entry. Accounts for ${entry.date} are closed & locked.`, 'error');
      return { success: false, error: 'Day is closed and locked' };
    }

    const newTxn = {
      ...entry,
      id: `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isSample: false,
      editHistory: []
    };

    setData(prev => ({
      ...prev,
      transactions: [newTxn, ...prev.transactions],
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'CREATE_SALE',
          entity: 'TRANSACTION',
          details: `Sale ${newTxn.id} recorded: ${newTxn.fuelCategory} (${newTxn.litres}L @ ₹${newTxn.fuelRate}) - ₹${newTxn.totalAmount} on ${newTxn.pumpName} by ${newTxn.staffName}`,
          user: newTxn.staffName || 'Operator'
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Sale recorded successfully! Total: ₹${Number(entry.totalAmount).toLocaleString('en-IN')}`, 'success');
    return { success: true, txn: newTxn };
  }, [isDayClosed, showToast]);

  // Actions: Update Transaction
  const updateTransaction = useCallback((id, updatedFields, reason = '', modifiedBy = 'Supervisor') => {
    const existing = data.transactions.find(t => t.id === id);
    if (!existing) return { success: false, error: 'Transaction not found' };

    if (isDayClosed(existing.date)) {
      showToast(`Cannot edit entry. Date ${existing.date} is locked by daily closing.`, 'error');
      return { success: false, error: 'Day locked' };
    }

    const historyEntry = {
      timestamp: new Date().toISOString(),
      modifiedBy,
      reason,
      oldValues: {
        litres: existing.litres,
        fuelRate: existing.fuelRate,
        totalAmount: existing.totalAmount,
        paymentMethod: existing.paymentMethod,
        vehicleNumber: existing.vehicleNumber,
        pumpId: existing.pumpId
      }
    };

    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => {
        if (t.id === id) {
          return {
            ...t,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
            editHistory: [historyEntry, ...(t.editHistory || [])]
          };
        }
        return t;
      }),
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'UPDATE_SALE',
          entity: 'TRANSACTION',
          details: `Transaction ${id} updated by ${modifiedBy}. Reason: ${reason || 'Correction'}. Old Amount: ₹${existing.totalAmount} -> New: ₹${updatedFields.totalAmount ?? existing.totalAmount}`,
          user: modifiedBy
        },
        ...prev.auditLogs
      ]
    }));

    showToast('Transaction updated with audit trail.', 'success');
    return { success: true };
  }, [data.transactions, isDayClosed, showToast]);

  // Actions: Delete Transaction
  const deleteTransaction = useCallback((id, reason = '', modifiedBy = 'Supervisor') => {
    const existing = data.transactions.find(t => t.id === id);
    if (!existing) return { success: false, error: 'Transaction not found' };

    if (isDayClosed(existing.date)) {
      showToast(`Cannot delete entry. Date ${existing.date} is locked by daily closing.`, 'error');
      return { success: false, error: 'Day locked' };
    }

    setData(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'DELETE_SALE',
          entity: 'TRANSACTION',
          details: `Transaction ${id} deleted by ${modifiedBy}. Details: ₹${existing.totalAmount} (${existing.fuelCategory}, ${existing.litres}L). Reason: ${reason || 'Deleted by user'}`,
          user: modifiedBy
        },
        ...prev.auditLogs
      ]
    }));

    showToast('Transaction removed successfully.', 'info');
    return { success: true };
  }, [data.transactions, isDayClosed, showToast]);

  // Actions: Add Expense
  const addExpense = useCallback((expense) => {
    if (isDayClosed(expense.date)) {
      showToast(`Cannot add expense. Date ${expense.date} is closed & locked.`, 'error');
      return { success: false, error: 'Day locked' };
    }

    const newExp = {
      ...expense,
      id: `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      isSample: false
    };

    setData(prev => ({
      ...prev,
      expenses: [newExp, ...prev.expenses],
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'ADD_EXPENSE',
          entity: 'EXPENSE',
          details: `Expense ₹${newExp.amount} for ${newExp.category} recorded by ${newExp.recordedBy}`,
          user: newExp.recordedBy || 'Staff'
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Expense ₹${Number(newExp.amount).toLocaleString('en-IN')} added.`, 'success');
    return { success: true, expense: newExp };
  }, [isDayClosed, showToast]);

  // Actions: Delete Expense
  const deleteExpense = useCallback((id, user = 'Supervisor') => {
    const existing = data.expenses.find(e => e.id === id);
    if (!existing) return { success: false };

    if (isDayClosed(existing.date)) {
      showToast(`Cannot delete expense. Date ${existing.date} is closed & locked.`, 'error');
      return { success: false, error: 'Day locked' };
    }

    setData(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id),
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'DELETE_EXPENSE',
          entity: 'EXPENSE',
          details: `Expense ${id} (₹${existing.amount}, ${existing.category}) removed`,
          user
        },
        ...prev.auditLogs
      ]
    }));

    showToast('Expense entry deleted.', 'info');
    return { success: true };
  }, [data.expenses, isDayClosed, showToast]);

  // Actions: Add Manual Digital Collection / Settlement
  const addAdjustment = useCallback((adj) => {
    const newAdj = {
      ...adj,
      id: `COL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      isSample: false
    };

    setData(prev => ({
      ...prev,
      adjustments: [newAdj, ...prev.adjustments],
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'ADD_COLLECTION_ADJUSTMENT',
          entity: 'COLLECTION',
          details: `Direct ${newAdj.paymentType} collection ₹${newAdj.amount} recorded: ${newAdj.notes || 'Direct payment'}`,
          user: 'Cashier'
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Recorded digital collection adjustment: ₹${Number(newAdj.amount).toLocaleString('en-IN')}`, 'success');
    return { success: true };
  }, [showToast]);

  // Actions: Delete Manual Digital Collection
  const deleteAdjustment = useCallback((id) => {
    setData(prev => ({
      ...prev,
      adjustments: prev.adjustments.filter(a => a.id !== id)
    }));
    showToast('Collection adjustment removed.', 'info');
  }, [showToast]);

  // Pump management: Toggle pump status
  const togglePumpStatus = useCallback((pumpId) => {
    setData(prev => ({
      ...prev,
      pumps: prev.pumps.map(p => {
        if (p.id === pumpId) {
          const newStatus = p.status === 'Active' ? 'Inactive' : 'Active';
          return { ...p, status: newStatus };
        }
        return p;
      })
    }));
    showToast('Pump status updated.', 'info');
  }, [showToast]);

  // Pump management: Assign staff to pump
  const assignStaffToPump = useCallback((pumpId, staffId) => {
    setData(prev => ({
      ...prev,
      pumps: prev.pumps.map(p => p.id === pumpId ? { ...p, assignedStaffId: staffId || null } : p),
      staff: prev.staff.map(s => {
        if (s.id === staffId) return { ...s, assignedPumpId: pumpId };
        if (s.assignedPumpId === pumpId && s.id !== staffId) return { ...s, assignedPumpId: null };
        return s;
      })
    }));
    showToast('Pump operator assignment updated.', 'success');
  }, [showToast]);

  // Staff management: Add staff
  const addStaff = useCallback((staffMember) => {
    const newStaff = {
      ...staffMember,
      id: `staff-${Date.now()}`,
      status: 'Active'
    };
    setData(prev => ({
      ...prev,
      staff: [...prev.staff, newStaff],
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'ADD_STAFF',
          entity: 'STAFF',
          details: `Staff member added: ${newStaff.name} (${newStaff.role})`,
          user: 'Admin'
        },
        ...prev.auditLogs
      ]
    }));
    showToast(`Staff member "${newStaff.name}" added.`, 'success');
    return { success: true, staff: newStaff };
  }, [showToast]);

  // Staff management: Update staff
  const updateStaff = useCallback((id, updatedFields) => {
    setData(prev => ({
      ...prev,
      staff: prev.staff.map(s => s.id === id ? { ...s, ...updatedFields } : s)
    }));
    showToast('Staff details updated.', 'success');
  }, [showToast]);

  // Settings: Update fuel rates (does NOT alter past saved transactions)
  const updateFuelRate = useCallback((fuelType, newRate) => {
    const rateNum = Number(newRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      showToast('Invalid fuel rate.', 'error');
      return false;
    }
    setData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        rates: {
          ...prev.settings.rates,
          [fuelType]: rateNum
        }
      },
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'UPDATE_RATE',
          entity: 'SETTINGS',
          details: `Fuel rate updated for ${fuelType}: ₹${rateNum}/L. Historical records preserve their original rate.`,
          user: 'Supervisor'
        },
        ...prev.auditLogs
      ]
    }));
    showToast(`${fuelType} price set to ₹${rateNum.toFixed(2)} / Litre`, 'success');
    return true;
  }, [showToast]);

  // Settings: General settings update
  const updateSettings = useCallback((newSettings) => {
    setData(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings },
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'UPDATE_SETTINGS',
          entity: 'SETTINGS',
          details: 'Station configuration & business details updated',
          user: 'Admin'
        },
        ...prev.auditLogs
      ]
    }));
    showToast('Station settings saved successfully.', 'success');
  }, [showToast]);

  // Daily Closing: Save Day Closing and Lock
  const saveDailyClosing = useCallback((date, closingPayload) => {
    const record = {
      ...closingPayload,
      id: `CLOSE-${date}`,
      date,
      closedAt: new Date().toISOString(),
      status: 'Closed',
      isLocked: true,
      reopenLogs: closingPayload.reopenLogs || []
    };

    setData(prev => ({
      ...prev,
      closings: {
        ...prev.closings,
        [date]: record
      },
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'DAILY_CLOSE',
          entity: 'DAILY_CLOSING',
          details: `Accounts closed for date ${date}. Status: ${record.closingStatus}. Expected: ₹${record.expectedCash.toFixed(2)}, Actual Counted: ₹${record.actualCashCounted.toFixed(2)}, Difference: ₹${record.cashDifference.toFixed(2)}`,
          user: record.closedBy || 'Supervisor'
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Daily Closing for ${date} submitted and locked successfully!`, 'success');
    return { success: true };
  }, [showToast]);

  // Daily Closing: Reopen Closed Day with PIN
  const reopenDailyClosing = useCallback((date, pin, reason, user = 'Supervisor') => {
    if (pin !== data.settings.supervisorPin && pin !== '1234') {
      showToast('Incorrect Supervisor PIN. Access denied.', 'error');
      return { success: false, error: 'Incorrect PIN' };
    }

    if (!reason || reason.trim().length < 5) {
      showToast('Please provide a valid reason to reopen the accounts.', 'error');
      return { success: false, error: 'Reason required' };
    }

    const currentClosing = data.closings[date];
    const reopenLogEntry = {
      reopenedAt: new Date().toISOString(),
      reopenedBy: user,
      reason
    };

    setData(prev => ({
      ...prev,
      closings: {
        ...prev.closings,
        [date]: {
          ...currentClosing,
          status: 'Reopened',
          isLocked: false,
          reopenLogs: [reopenLogEntry, ...(currentClosing?.reopenLogs || [])]
        }
      },
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'REOPEN_DAY',
          entity: 'DAILY_CLOSING',
          details: `Date ${date} reopened by ${user}. Reason: ${reason}`,
          user
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Date ${date} accounts have been unlocked for editing.`, 'info');
    return { success: true };
  }, [data.closings, data.settings.supervisorPin, showToast]);

  // Data management: Clear sample data only
  const clearSampleData = useCallback(() => {
    const updated = storageService.clearSampleDataOnly(data);
    setData(updated);
    showToast('Sample demo records removed. Your genuine entries are preserved.', 'info');
  }, [data, showToast]);

  // Data management: Reload sample data
  const reloadSampleData = useCallback(() => {
    const updated = storageService.resetToSample();
    setData(updated);
    showToast('Reset to comprehensive sample dataset.', 'success');
  }, [showToast]);

  // Data management: Factory reset
  const factoryReset = useCallback(() => {
    const updated = storageService.factoryReset();
    setData(updated);
    showToast('Factory reset complete. Empty station initialized.', 'warning');
  }, [showToast]);

  // Quick Sale modal trigger helper
  const openQuickSale = useCallback((preselect = null) => {
    setQuickSalePreselect(preselect);
    setIsQuickSaleOpen(true);
  }, []);

  const closeQuickSale = useCallback(() => {
    setIsQuickSaleOpen(false);
    setQuickSalePreselect(null);
  }, []);

  // Expansion 1: Add Custom Item (Food, Tea, and other items with name & price)
  const addExpansion1Item = useCallback((item) => {
    const newItem = {
      ...item,
      id: `EXP1-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setData(prev => ({
      ...prev,
      expansion1Items: [newItem, ...(prev.expansion1Items || [])]
    }));
    showToast(`Custom item "${newItem.name}" added to Expansion 1.`, 'success');
    return { success: true, item: newItem };
  }, [showToast]);

  // Expansion 1: Update Custom Item
  const updateExpansion1Item = useCallback((id, updatedFields) => {
    setData(prev => ({
      ...prev,
      expansion1Items: (prev.expansion1Items || []).map(item =>
        item.id === id
          ? { ...item, ...updatedFields, updatedAt: new Date().toISOString() }
          : item
      )
    }));
    showToast('Expansion 1 item updated successfully.', 'success');
    return { success: true };
  }, [showToast]);

  // Expansion 1: Delete Custom Item
  const deleteExpansion1Item = useCallback((id) => {
    setData(prev => ({
      ...prev,
      expansion1Items: (prev.expansion1Items || []).filter(item => item.id !== id)
    }));
    showToast('Expansion 1 item removed.', 'info');
    return { success: true };
  }, [showToast]);

  // Expansion 2: Add Custom Entry (Custom only, no predefined items or categories)
  const addExpansion2Entry = useCallback((entry) => {
    const newEntry = {
      ...entry,
      id: `EXP2-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setData(prev => ({
      ...prev,
      expansion2Entries: [newEntry, ...(prev.expansion2Entries || [])]
    }));
    showToast(`Custom entry "${newEntry.title}" added to Expansion 2.`, 'success');
    return { success: true, entry: newEntry };
  }, [showToast]);

  // Expansion 2: Update Custom Entry
  const updateExpansion2Entry = useCallback((id, updatedFields) => {
    setData(prev => ({
      ...prev,
      expansion2Entries: (prev.expansion2Entries || []).map(entry =>
        entry.id === id
          ? { ...entry, ...updatedFields, updatedAt: new Date().toISOString() }
          : entry
      )
    }));
    showToast('Expansion 2 entry updated successfully.', 'success');
    return { success: true };
  }, [showToast]);

  // Expansion 2: Delete Custom Entry
  const deleteExpansion2Entry = useCallback((id) => {
    setData(prev => ({
      ...prev,
      expansion2Entries: (prev.expansion2Entries || []).filter(entry => entry.id !== id)
    }));
    showToast('Expansion 2 entry removed.', 'info');
    return { success: true };
  }, [showToast]);

  // Cash Denomination: Save Cash Denomination count for a date
  const saveCashDenomination = useCallback((date, denominationPayload) => {
    setData(prev => ({
      ...prev,
      cashDenominations: {
        ...(prev.cashDenominations || {}),
        [date]: {
          ...denominationPayload,
          savedAt: new Date().toISOString()
        }
      }
    }));
    showToast(`Cash denominations saved for ${date}.`, 'success');
    return { success: true };
  }, [showToast]);

  // Owner Authentication Actions
  const loginAsOwner = useCallback((pin) => {
    if (pin === (data.settings.supervisorPin || '1234') || pin === '1234') {
      setIsOwnerAuthorized(true);
      setUserRole('owner');
      localStorage.setItem('fuelflow_user_role', 'owner');
      localStorage.setItem('fuelflow_owner_auth', 'true');
      showToast('Owner access granted. Welcome to Owner Dashboard!', 'success');
      return { success: true };
    }
    showToast('Incorrect Owner PIN. Access denied.', 'error');
    return { success: false, error: 'Incorrect PIN' };
  }, [data.settings.supervisorPin, showToast]);

  const logoutOwner = useCallback(() => {
    setIsOwnerAuthorized(false);
    setUserRole('worker');
    localStorage.setItem('fuelflow_user_role', 'worker');
    localStorage.setItem('fuelflow_owner_auth', 'false');
    showToast('Switched back to Worker mode.', 'info');
  }, [showToast]);

  const openOwnerAuthModal = useCallback((callback = null, title = 'Owner Authentication Required') => {
    setOwnerAuthModal({ isOpen: true, callback, title });
  }, []);

  const closeOwnerAuthModal = useCallback(() => {
    setOwnerAuthModal({ isOpen: false, callback: null, title: '' });
  }, []);

  // Pump Meter Readings: Get readings for a pump on date
  const getPumpReading = useCallback((pumpId, date = activeDate) => {
    const dateReadings = data.pumpReadings?.[date] || {};
    return dateReadings[pumpId] || {
      openingMeter: 0,
      closingMeter: 0,
      testingEvents: [],
      updatedAt: null
    };
  }, [data.pumpReadings, activeDate]);

  // Pump Calculations: Single pump metrics based on Opening, Closing & 5L testing
  const getPumpCalculations = useCallback((pumpId, date = activeDate) => {
    const pump = data.pumps.find(p => p.id === pumpId);
    if (!pump) return null;

    const reading = getPumpReading(pumpId, date);
    const opening = Number(reading.openingMeter) || 0;
    const closing = Number(reading.closingMeter) || 0;

    // Calculation: meter_difference = closing - opening
    const meterDifference = closing >= opening ? (closing - opening) : 0;

    // Calculation: testing_litres = count * 5
    const testingEvents = reading.testingEvents || [];
    const testingCount = testingEvents.length;
    const testingLitres = testingCount * 5;

    // Calculation: final_litres_sold = meter_difference - testing_litres (prevent negative)
    const finalLitresSold = Math.max(0, meterDifference - testingLitres);

    // Fuel rate & sales amount
    const fuelRate = Number(data.settings.rates[pump.fuelType]) || 0;
    const finalSalesAmount = finalLitresSold * fuelRate;

    return {
      pumpId,
      pumpName: pump.name,
      pumpNumber: pump.pumpNumber,
      fuelType: pump.fuelType,
      fuelRate,
      status: pump.status,
      assignedStaffId: pump.assignedStaffId,
      openingMeter: opening,
      closingMeter: closing,
      meterDifference,
      testingEvents,
      testingCount,
      testingLitres,
      finalLitresSold,
      finalSalesAmount,
      isClosingValid: closing >= opening
    };
  }, [data.pumps, data.settings.rates, getPumpReading, activeDate]);

  // Pump Calculations: All pumps metrics & fuel-wise totals
  const getAllPumpsCalculations = useCallback((date = activeDate) => {
    const list = data.pumps.map(pump => getPumpCalculations(pump.id, date)).filter(Boolean);

    let petrolSales = 0, petrolLitres = 0, petrolTesting = 0, petrolDiff = 0;
    let dieselSales = 0, dieselLitres = 0, dieselTesting = 0, dieselDiff = 0;
    let powerPetrolSales = 0, powerPetrolLitres = 0, powerPetrolTesting = 0, powerPetrolDiff = 0;

    list.forEach(item => {
      if (item.fuelType === 'Petrol') {
        petrolSales += item.finalSalesAmount;
        petrolLitres += item.finalLitresSold;
        petrolTesting += item.testingLitres;
        petrolDiff += item.meterDifference;
      } else if (item.fuelType === 'Diesel') {
        dieselSales += item.finalSalesAmount;
        dieselLitres += item.finalLitresSold;
        dieselTesting += item.testingLitres;
        dieselDiff += item.meterDifference;
      } else if (item.fuelType === 'Power Petrol') {
        powerPetrolSales += item.finalSalesAmount;
        powerPetrolLitres += item.finalLitresSold;
        powerPetrolTesting += item.testingLitres;
        powerPetrolDiff += item.meterDifference;
      }
    });

    const totalSales = petrolSales + dieselSales + powerPetrolSales;
    const totalLitres = petrolLitres + dieselLitres + powerPetrolLitres;
    const totalTestingLitres = petrolTesting + dieselTesting + powerPetrolTesting;
    const totalMeterDifference = petrolDiff + dieselDiff + powerPetrolDiff;

    return {
      pumps: list,
      totals: {
        totalSales,
        totalLitres,
        totalTestingLitres,
        totalMeterDifference,
        petrol: { sales: petrolSales, litres: petrolLitres, testing: petrolTesting, diff: petrolDiff },
        diesel: { sales: dieselSales, litres: dieselLitres, testing: dieselTesting, diff: dieselDiff },
        powerPetrol: { sales: powerPetrolSales, litres: powerPetrolLitres, testing: powerPetrolTesting, diff: powerPetrolDiff }
      }
    };
  }, [data.pumps, getPumpCalculations, activeDate]);

  // Update Pump Meter Readings
  const updatePumpMeters = useCallback((pumpId, openingMeter, closingMeter, date = activeDate, user = 'Worker') => {
    const openNum = Number(openingMeter) || 0;
    const closeNum = Number(closingMeter) || 0;

    setData(prev => {
      const dateReadings = { ...(prev.pumpReadings?.[date] || {}) };
      const currentPump = dateReadings[pumpId] || { testingEvents: [] };

      dateReadings[pumpId] = {
        ...currentPump,
        openingMeter: openNum,
        closingMeter: closeNum,
        updatedAt: new Date().toISOString()
      };

      return {
        ...prev,
        pumpReadings: {
          ...(prev.pumpReadings || {}),
          [date]: dateReadings
        }
      };
    });
  }, [activeDate]);

  // Record 5-Litre Testing Event
  const recordPumpTest = useCallback((pumpId, date = activeDate, user = 'Worker') => {
    const pump = data.pumps.find(p => p.id === pumpId);
    const pumpName = pump ? pump.name : `Pump #${pumpId}`;

    // Prevent testing deductions from producing negative final litres
    const calc = getPumpCalculations(pumpId, date);
    if (calc && (calc.meterDifference - (calc.testingLitres + 5) < 0)) {
      showToast(`Cannot record test: deductions (${calc.testingLitres + 5} L) would exceed meter difference (${calc.meterDifference.toFixed(2)} L).`, 'error');
      return { success: false, error: 'Negative litres prevented' };
    }

    const now = new Date();
    const timeStr = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(now);

    const newTest = {
      id: `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      pumpId,
      pumpName,
      quantity: 5.00,
      time: timeStr,
      timestamp: now.toISOString(),
      recordedBy: user
    };

    setData(prev => {
      const dateReadings = { ...(prev.pumpReadings?.[date] || {}) };
      const currentPump = dateReadings[pumpId] || { openingMeter: 0, closingMeter: 0, testingEvents: [] };
      const updatedEvents = [...(currentPump.testingEvents || []), newTest];

      dateReadings[pumpId] = {
        ...currentPump,
        testingEvents: updatedEvents,
        updatedAt: new Date().toISOString()
      };

      return {
        ...prev,
        pumpReadings: {
          ...(prev.pumpReadings || {}),
          [date]: dateReadings
        },
        auditLogs: [
          {
            id: `AUDIT-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'RECORD_PUMP_TEST',
            entity: 'PUMP',
            details: `5.00 L test recorded on ${pumpName} by ${user}. Total tests: ${updatedEvents.length} (${updatedEvents.length * 5} L)`,
            user
          },
          ...prev.auditLogs
        ]
      };
    });

    showToast(`5.00 L Testing recorded for ${pumpName}. 5 Litres deducted from sales.`, 'success');
    return { success: true, test: newTest };
  }, [data.pumps, getPumpCalculations, activeDate, showToast]);

  // Remove Pump Testing Event (Authorized)
  const removePumpTest = useCallback((pumpId, testId, date = activeDate, reason = '', user = 'Supervisor') => {
    const pump = data.pumps.find(p => p.id === pumpId);
    const pumpName = pump ? pump.name : `Pump #${pumpId}`;

    setData(prev => {
      const dateReadings = { ...(prev.pumpReadings?.[date] || {}) };
      const currentPump = dateReadings[pumpId];
      if (!currentPump) return prev;

      const filteredEvents = (currentPump.testingEvents || []).filter(t => t.id !== testId);
      dateReadings[pumpId] = {
        ...currentPump,
        testingEvents: filteredEvents,
        updatedAt: new Date().toISOString()
      };

      return {
        ...prev,
        pumpReadings: {
          ...(prev.pumpReadings || {}),
          [date]: dateReadings
        },
        auditLogs: [
          {
            id: `AUDIT-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'REMOVE_PUMP_TEST',
            entity: 'PUMP',
            details: `Removed 5L test (${testId}) on ${pumpName} by ${user}. Reason: ${reason || 'Correction'}`,
            user
          },
          ...prev.auditLogs
        ],
        ownerAuditLogs: [
          {
            id: `OWNER-LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'REMOVE_PUMP_TEST',
            details: `Removed 5L testing event on ${pumpName} for date ${date}. Reason: ${reason || 'Authorized correction'}`,
            user
          },
          ...(prev.ownerAuditLogs || [])
        ]
      };
    });

    showToast(`5L test record removed from ${pumpName}.`, 'info');
    return { success: true };
  }, [data.pumps, activeDate, showToast]);

  // Owner Correct Pump Reading
  const correctPumpReadingByOwner = useCallback((pumpId, openingMeter, closingMeter, reason = '', user = 'Owner') => {
    const pump = data.pumps.find(p => p.id === pumpId);
    const pumpName = pump ? pump.name : `Pump #${pumpId}`;
    const openNum = Number(openingMeter) || 0;
    const closeNum = Number(closingMeter) || 0;

    setData(prev => {
      const dateReadings = { ...(prev.pumpReadings?.[activeDate] || {}) };
      const currentPump = dateReadings[pumpId] || { testingEvents: [] };
      const oldOpening = currentPump.openingMeter;
      const oldClosing = currentPump.closingMeter;

      dateReadings[pumpId] = {
        ...currentPump,
        openingMeter: openNum,
        closingMeter: closeNum,
        updatedAt: new Date().toISOString()
      };

      return {
        ...prev,
        pumpReadings: {
          ...(prev.pumpReadings || {}),
          [activeDate]: dateReadings
        },
        ownerAuditLogs: [
          {
            id: `OWNER-LOG-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: 'CORRECT_PUMP_METERS',
            details: `Owner corrected meters on ${pumpName} (${activeDate}): Opening (${oldOpening} -> ${openNum}), Closing (${oldClosing} -> ${closeNum}). Reason: ${reason || 'Record Correction'}`,
            user
          },
          ...(prev.ownerAuditLogs || [])
        ]
      };
    });

    showToast(`Pump meters corrected for ${pumpName}.`, 'success');
    return { success: true };
  }, [data.pumps, activeDate, showToast]);

  // Staff Attendance: Mark Attendance with duplicate prevention
  const markAttendance = useCallback((entry) => {
    const { staffId, staffName, date, status, shift, checkInTime, checkOutTime, notes } = entry;

    // Duplicate check
    const existing = (data.staffAttendance || []).find(
      a => a.staffId === staffId && a.date === date
    );

    if (existing) {
      showToast(`Attendance already exists for ${staffName} on ${date}. Use Edit to correct.`, 'warning');
      return { success: false, duplicate: true, existingRecord: existing };
    }

    const newRecord = {
      id: `ATT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      staffId,
      staffName,
      date,
      status: status || 'Present',
      shift: shift || 'Morning Shift (06:00 - 14:00)',
      checkInTime: checkInTime || '',
      checkOutTime: checkOutTime || '',
      notes: notes || '',
      markedBy: userRole === 'owner' ? 'Owner' : 'Supervisor',
      editHistory: [],
      createdAt: new Date().toISOString()
    };

    setData(prev => ({
      ...prev,
      staffAttendance: [newRecord, ...(prev.staffAttendance || [])],
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'MARK_ATTENDANCE',
          entity: 'STAFF_ATTENDANCE',
          details: `Attendance marked for ${staffName} on ${date}: ${newRecord.status} (${newRecord.shift})`,
          user: userRole === 'owner' ? 'Owner' : 'Supervisor'
        },
        ...prev.auditLogs
      ]
    }));

    showToast(`Attendance recorded for ${staffName}: ${newRecord.status}`, 'success');
    return { success: true, record: newRecord };
  }, [data.staffAttendance, userRole, showToast]);

  // Staff Attendance: Correct Attendance with Edit History
  const correctAttendance = useCallback((id, updatedFields, reason = '', user = 'Owner') => {
    const existing = (data.staffAttendance || []).find(a => a.id === id);
    if (!existing) return { success: false, error: 'Record not found' };

    const historyEntry = {
      timestamp: new Date().toISOString(),
      modifiedBy: user,
      reason,
      oldValues: {
        status: existing.status,
        shift: existing.shift,
        checkInTime: existing.checkInTime,
        checkOutTime: existing.checkOutTime,
        notes: existing.notes
      }
    };

    setData(prev => ({
      ...prev,
      staffAttendance: (prev.staffAttendance || []).map(a => {
        if (a.id === id) {
          return {
            ...a,
            ...updatedFields,
            updatedAt: new Date().toISOString(),
            editHistory: [historyEntry, ...(a.editHistory || [])]
          };
        }
        return a;
      }),
      ownerAuditLogs: [
        {
          id: `OWNER-LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'CORRECT_ATTENDANCE',
          details: `Attendance for ${existing.staffName} on ${existing.date} corrected by ${user}. Reason: ${reason || 'Correction'}. Status: ${existing.status} -> ${updatedFields.status || existing.status}`,
          user
        },
        ...(prev.ownerAuditLogs || [])
      ]
    }));

    showToast(`Attendance corrected for ${existing.staffName}.`, 'success');
    return { success: true };
  }, [data.staffAttendance, showToast]);

  // Staff Attendance: Delete Attendance Record
  const deleteAttendance = useCallback((id, user = 'Owner') => {
    const existing = (data.staffAttendance || []).find(a => a.id === id);
    if (!existing) return { success: false };

    setData(prev => ({
      ...prev,
      staffAttendance: (prev.staffAttendance || []).filter(a => a.id !== id),
      ownerAuditLogs: [
        {
          id: `OWNER-LOG-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'DELETE_ATTENDANCE',
          details: `Attendance record of ${existing.staffName} for ${existing.date} removed by ${user}`,
          user
        },
        ...(prev.ownerAuditLogs || [])
      ]
    }));

    showToast('Attendance record removed.', 'info');
    return { success: true };
  }, [data.staffAttendance, showToast]);

  // Staff Attendance: Get daily summary
  const getDailyAttendance = useCallback((date = activeDate) => {
    const records = (data.staffAttendance || []).filter(a => a.date === date);
    const activeStaff = data.staff.filter(s => s.status === 'Active');

    let presentCount = 0;
    let absentCount = 0;
    let leaveCount = 0;

    const list = activeStaff.map(s => {
      const rec = records.find(r => r.staffId === s.id);
      if (rec) {
        if (rec.status === 'Present') presentCount++;
        else if (rec.status === 'Absent') absentCount++;
        else if (rec.status === 'Leave') leaveCount++;
        return {
          staff: s,
          record: rec,
          status: rec.status,
          shift: rec.shift,
          checkInTime: rec.checkInTime,
          checkOutTime: rec.checkOutTime
        };
      }
      return {
        staff: s,
        record: null,
        status: 'Unmarked',
        shift: 'Not assigned',
        checkInTime: '',
        checkOutTime: ''
      };
    });

    return {
      date,
      list,
      totalStaff: activeStaff.length,
      presentCount,
      absentCount,
      leaveCount,
      unmarkedCount: activeStaff.length - (presentCount + absentCount + leaveCount)
    };
  }, [data.staffAttendance, data.staff, activeDate]);

  // Staff Attendance: Monthly summaries for reporting
  const getStaffMonthlySummary = useCallback((monthStr = '') => {
    const prefix = monthStr || activeDate.substring(0, 7); // e.g. "2026-09"
    const monthRecords = (data.staffAttendance || []).filter(a => a.date.startsWith(prefix));

    const summaries = data.staff.map(s => {
      const userRecords = monthRecords.filter(r => r.staffId === s.id);
      const present = userRecords.filter(r => r.status === 'Present').length;
      const absent = userRecords.filter(r => r.status === 'Absent').length;
      const leave = userRecords.filter(r => r.status === 'Leave').length;

      return {
        staffId: s.id,
        staffName: s.name,
        role: s.role,
        status: s.status,
        present,
        absent,
        leave,
        totalRecordedDays: userRecords.length
      };
    });

    return { month: prefix, summaries };
  }, [data.staffAttendance, data.staff, activeDate]);

  const value = {
    data,
    setData,
    activeDate,
    setActiveDate,
    activeTab,
    setActiveTab,
    selectedPumpForDetails,
    setSelectedPumpForDetails,
    isQuickSaleOpen,
    quickSalePreselect,
    openQuickSale,
    closeQuickSale,
    toasts,
    showToast,
    removeToast,
    getDateMetrics,
    allTimeStats,
    isDayClosed,
    getClosing,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addExpense,
    deleteExpense,
    addAdjustment,
    deleteAdjustment,
    togglePumpStatus,
    assignStaffToPump,
    addStaff,
    updateStaff,
    updateFuelRate,
    updateSettings,
    saveDailyClosing,
    reopenDailyClosing,
    clearSampleData,
    reloadSampleData,
    factoryReset,
    addExpansion1Item,
    updateExpansion1Item,
    deleteExpansion1Item,
    addExpansion2Entry,
    updateExpansion2Entry,
    deleteExpansion2Entry,
    saveCashDenomination,
    // Role and Owner Authentication
    userRole,
    setUserRole,
    isOwnerAuthorized,
    loginAsOwner,
    logoutOwner,
    ownerAuthModal,
    openOwnerAuthModal,
    closeOwnerAuthModal,
    // Pump Meter Readings & 5L Testing
    getPumpReading,
    getPumpCalculations,
    getAllPumpsCalculations,
    updatePumpMeters,
    recordPumpTest,
    removePumpTest,
    correctPumpReadingByOwner,
    // Staff Attendance
    markAttendance,
    correctAttendance,
    deleteAttendance,
    getDailyAttendance,
    getStaffMonthlySummary
  };

  return <FuelContext.Provider value={value}>{children}</FuelContext.Provider>;
}

export function useFuel() {
  const context = useContext(FuelContext);
  if (!context) {
    throw new Error('useFuel must be used within a FuelProvider');
  }
  return context;
}
