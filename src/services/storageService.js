/**
 * FuelFlow - Persistent Storage & State Service
 * Uses browser localStorage with automatic initialization and fallback.
 */

import { INITIAL_SETTINGS, INITIAL_PUMPS, INITIAL_STAFF, generateSampleData } from './sampleData';
import { getTodayDateStr } from '../utils/formatters';

const STORAGE_KEY = 'fuelflow_db_v1';

export const storageService = {
  /**
   * Load entire database from localStorage or initialize with sample data
   */
  loadData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Ensure all required collections exist
        const sample = generateSampleData();
        return {
          settings: parsed.settings || INITIAL_SETTINGS,
          pumps: parsed.pumps || INITIAL_PUMPS,
          staff: parsed.staff || INITIAL_STAFF,
          transactions: parsed.transactions || [],
          expenses: parsed.expenses || [],
          adjustments: parsed.adjustments || [],
          closings: parsed.closings || {},
          auditLogs: parsed.auditLogs || [],
          expansion1Items: parsed.expansion1Items || [],
          expansion2Entries: parsed.expansion2Entries || [],
          cashDenominations: parsed.cashDenominations || {},
          pumpReadings: parsed.pumpReadings || sample.pumpReadings || {},
          staffAttendance: parsed.staffAttendance || sample.staffAttendance || [],
          ownerAuditLogs: parsed.ownerAuditLogs || []
        };
      }
    } catch (e) {
      console.error('Error loading data from localStorage', e);
    }

    // Default initialization with sample data
    const sample = generateSampleData();
    const initialData = {
      settings: INITIAL_SETTINGS,
      pumps: INITIAL_PUMPS,
      staff: INITIAL_STAFF,
      transactions: sample.transactions,
      expenses: sample.expenses,
      adjustments: sample.adjustments,
      closings: sample.closings,
      auditLogs: sample.auditLogs,
      expansion1Items: [],
      expansion2Entries: [],
      cashDenominations: {},
      pumpReadings: sample.pumpReadings || {},
      staffAttendance: sample.staffAttendance || [],
      ownerAuditLogs: []
    };
    this.saveData(initialData);
    return initialData;
  },

  /**
   * Save entire database to localStorage
   */
  saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error saving data to localStorage', e);
      return false;
    }
  },

  /**
   * Reset database back to default sample state
   */
  resetToSample() {
    const sample = generateSampleData();
    const data = {
      settings: INITIAL_SETTINGS,
      pumps: INITIAL_PUMPS,
      staff: INITIAL_STAFF,
      transactions: sample.transactions,
      expenses: sample.expenses,
      adjustments: sample.adjustments,
      closings: sample.closings,
      auditLogs: sample.auditLogs,
      expansion1Items: [],
      expansion2Entries: [],
      cashDenominations: {},
      pumpReadings: sample.pumpReadings || {},
      staffAttendance: sample.staffAttendance || [],
      ownerAuditLogs: []
    };
    this.saveData(data);
    return data;
  },

  /**
   * Remove only sample items, preserving user-created entries
   */
  clearSampleDataOnly(currentData) {
    const cleanData = {
      ...currentData,
      transactions: currentData.transactions.filter(t => !t.isSample),
      expenses: currentData.expenses.filter(e => !e.isSample),
      adjustments: currentData.adjustments.filter(a => !a.isSample),
      expansion1Items: currentData.expansion1Items || [],
      expansion2Entries: currentData.expansion2Entries || [],
      cashDenominations: currentData.cashDenominations || {},
      pumpReadings: currentData.pumpReadings || {},
      staffAttendance: currentData.staffAttendance || [],
      ownerAuditLogs: currentData.ownerAuditLogs || [],
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'CLEAR_SAMPLE_DATA',
          entity: 'SYSTEM',
          details: 'Cleared sample transactions and sample expenses. Real user entries preserved.',
          user: 'Admin'
        },
        ...currentData.auditLogs
      ]
    };
    this.saveData(cleanData);
    return cleanData;
  },

  /**
   * Factory reset - completely clean workspace (no transactions, default 10 pumps, default settings)
   */
  factoryReset() {
    const data = {
      settings: INITIAL_SETTINGS,
      pumps: INITIAL_PUMPS,
      staff: INITIAL_STAFF,
      transactions: [],
      expenses: [],
      adjustments: [],
      closings: {},
      auditLogs: [
        {
          id: `AUDIT-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'FACTORY_RESET',
          entity: 'SYSTEM',
          details: 'All data cleared. Initialized fresh empty station records.',
          user: 'Admin'
        }
      ],
      expansion1Items: [],
      expansion2Entries: [],
      cashDenominations: {},
      pumpReadings: {},
      staffAttendance: [],
      ownerAuditLogs: []
    };
    this.saveData(data);
    return data;
  },

  /**
   * Export database as downloadable JSON file
   */
  exportBackupJSON(currentData) {
    const jsonStr = JSON.stringify(currentData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FuelFlow_Backup_${getTodayDateStr()}_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Import database from JSON string
   */
  importBackupJSON(jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.pumps || !parsed.settings) {
        throw new Error('Invalid FuelFlow backup file: missing required schemas.');
      }
      this.saveData(parsed);
      return { success: true, data: parsed };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};
