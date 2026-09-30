import React, { useState, useMemo } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatLitres, formatDate } from '../utils/formatters';
import { 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  AlertTriangle,
  History,
  Download
} from 'lucide-react';
import Modal from '../components/Modal';
import { downloadCSV } from '../utils/exportUtils';

export default function SalesHistoryView() {
  const { data, updateTransaction, deleteTransaction, isDayClosed, activeDate } = useFuel();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [fuelFilter, setFuelFilter] = useState('ALL');
  const [pumpFilter, setPumpFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [staffFilter, setStaffFilter] = useState('ALL');
  const [dateFilterMode, setDateFilterMode] = useState('ALL'); // 'ALL' or 'ACTIVE_DATE'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Modals state: Edit & Delete
  const [editingTxn, setEditingTxn] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editReason, setEditReason] = useState('');
  const [deletingTxn, setDeletingTxn] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter(t => {
      // Date filter
      if (dateFilterMode === 'ACTIVE_DATE' && t.date !== activeDate) {
        return false;
      }

      // Fuel filter
      if (fuelFilter !== 'ALL' && t.fuelCategory !== fuelFilter) {
        return false;
      }

      // Pump filter
      if (pumpFilter !== 'ALL' && t.pumpId !== pumpFilter) {
        return false;
      }

      // Payment filter
      if (paymentFilter !== 'ALL' && t.paymentMethod !== paymentFilter) {
        return false;
      }

      // Staff filter
      if (staffFilter !== 'ALL' && t.staffId !== staffFilter) {
        return false;
      }

      // Search term (Vehicle number, Staff name, Ref, Pump)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const vehicleMatch = (t.vehicleNumber || '').toLowerCase().includes(query);
        const staffMatch = (t.staffName || '').toLowerCase().includes(query);
        const pumpMatch = (t.pumpName || '').toLowerCase().includes(query);
        const refMatch = (t.transactionRef || '').toLowerCase().includes(query);
        if (!vehicleMatch && !staffMatch && !pumpMatch && !refMatch) {
          return false;
        }
      }

      return true;
    });
  }, [data.transactions, activeDate, dateFilterMode, fuelFilter, pumpFilter, paymentFilter, staffFilter, searchTerm]);

  // Aggregate totals for the filtered results
  const filteredTotals = useMemo(() => {
    let litres = 0;
    let amount = 0;
    filteredTransactions.forEach(t => {
      litres += Number(t.litres) || 0;
      amount += Number(t.totalAmount) || 0;
    });
    return { count: filteredTransactions.length, litres, amount };
  }, [filteredTransactions]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredTransactions.length / pageSize) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Open Edit Modal
  const handleOpenEdit = (txn) => {
    setEditingTxn(txn);
    setEditFormData({
      litres: txn.litres,
      fuelRate: txn.fuelRate,
      totalAmount: txn.totalAmount,
      vehicleNumber: txn.vehicleNumber || '',
      paymentMethod: txn.paymentMethod,
      transactionRef: txn.transactionRef || '',
      notes: txn.notes || ''
    });
    setEditReason('');
  };

  // Submit Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editReason || editReason.trim().length < 3) {
      alert('Please specify an audit reason for editing this transaction.');
      return;
    }
    const res = updateTransaction(editingTxn.id, {
      ...editFormData,
      litres: parseFloat(editFormData.litres),
      fuelRate: parseFloat(editFormData.fuelRate),
      totalAmount: parseFloat(editFormData.totalAmount)
    }, editReason);

    if (res.success) {
      setEditingTxn(null);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (txn) => {
    setDeletingTxn(txn);
    setDeleteReason('');
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    const res = deleteTransaction(deletingTxn.id, deleteReason);
    if (res.success) {
      setDeletingTxn(null);
    }
  };

  // Export filtered transactions to CSV
  const handleExportCSV = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Pump',
      'Fuel Category',
      'Vehicle Number',
      'Litres',
      'Rate (INR)',
      'Total Amount (INR)',
      'Payment Method',
      'Ref Number',
      'Staff Name',
      'Sample Entry'
    ];
    const rows = filteredTransactions.map(t => [
      t.id,
      t.date,
      t.time,
      t.pumpName,
      t.fuelCategory,
      t.vehicleNumber || 'Walk-in',
      t.litres.toFixed(2),
      t.fuelRate.toFixed(2),
      t.totalAmount.toFixed(2),
      t.paymentMethod,
      t.transactionRef || '',
      t.staffName,
      t.isSample ? 'Yes' : 'No'
    ]);
    downloadCSV(`FuelFlow_Sales_${Date.now()}`, headers, rows);
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Sales Ledger & Audit History</h1>
          <p>
            Complete searchable register of fuel dispense transactions with audit modification tracking
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card">
        <div className="card-body" style={{ padding: '16px' }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            {/* Search Input */}
            <div className="filter-input-wrap">
              <Search size={16} className="filter-icon" />
              <input
                type="text"
                className="filter-input"
                placeholder="Search vehicle #, staff, pump or ref..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Date Scope Filter */}
            <select
              className="filter-select"
              value={dateFilterMode}
              onChange={(e) => {
                setDateFilterMode(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Recorded Dates</option>
              <option value="ACTIVE_DATE">Only Active Date ({formatDate(activeDate)})</option>
            </select>

            {/* Fuel Filter */}
            <select
              className="filter-select"
              value={fuelFilter}
              onChange={(e) => {
                setFuelFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Fuel Types</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Power Petrol">Power Petrol</option>
            </select>

            {/* Pump Filter */}
            <select
              className="filter-select"
              value={pumpFilter}
              onChange={(e) => {
                setPumpFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Pumps (10)</option>
              {data.pumps.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Payment Filter */}
            <select
              className="filter-select"
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Payments</option>
              <option value="Cash">Cash</option>
              <option value="GPay">Google Pay</option>
              <option value="Other UPI">Other UPI</option>
              <option value="Card">Card</option>
            </select>

            {/* Staff Filter */}
            <select
              className="filter-select"
              value={staffFilter}
              onChange={(e) => {
                setStaffFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">All Staff</option>
              {data.staff.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Summary Metrics Bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <div style={{ color: 'var(--text-secondary)' }}>
              Showing <strong>{filteredTotals.count}</strong> transactions matching filters
            </div>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Total Volume:</span>
                <strong className="mono-num" style={{ color: 'var(--cyan)' }}>{formatLitres(filteredTotals.litres)}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', marginRight: '6px' }}>Total Value:</span>
                <strong className="mono-num" style={{ color: 'var(--primary)', fontSize: '1rem' }}>{formatINR(filteredTotals.amount)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {paginatedTransactions.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <History size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>No transactions match the selected filters or search criteria.</p>
            </div>
          ) : (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Staff</th>
                    <th>Pump & Fuel</th>
                    <th>Vehicle Reg.</th>
                    <th>Litres</th>
                    <th>Rate</th>
                    <th>Amount</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((t) => {
                    const isLocked = isDayClosed(t.date);
                    const fuelClass = t.fuelCategory.toLowerCase().replace(' ', '-');
                    const hasHistory = t.editHistory && t.editHistory.length > 0;

                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="mono-num" style={{ fontWeight: '600' }}>{formatDate(t.date)}</div>
                          <div className="mono-num" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{t.time}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: '500' }}>{t.staffName}</span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600' }}>{t.pumpName}</div>
                          <span className={`fuel-tag ${fuelClass}`} style={{ fontSize: '0.68rem', padding: '1px 6px', marginTop: '2px' }}>
                            {t.fuelCategory}
                          </span>
                        </td>
                        <td>
                          <span className="mono-num" style={{ fontWeight: '600', color: t.vehicleNumber ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                            {t.vehicleNumber || 'Walk-in'}
                          </span>
                        </td>
                        <td className="mono-num font-semibold">{t.litres.toFixed(2)} L</td>
                        <td className="mono-num" style={{ color: 'var(--text-secondary)' }}>₹{t.fuelRate.toFixed(2)}</td>
                        <td className="mono-num" style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '0.95rem' }}>
                          {formatINR(t.totalAmount)}
                        </td>
                        <td>
                          <span className="badge" style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', fontWeight: '600' }}>
                            {t.paymentMethod}
                          </span>
                          {t.transactionRef && (
                            <div className="mono-num" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {t.transactionRef}
                            </div>
                          )}
                        </td>
                        <td>
                          {hasHistory ? (
                            <span 
                              className="status-badge excess" 
                              style={{ fontSize: '0.7rem' }} 
                              title={`Modified ${t.editHistory.length} time(s). Last reason: ${t.editHistory[0]?.reason}`}
                            >
                              Modified ({t.editHistory.length})
                            </span>
                          ) : isLocked ? (
                            <span className="status-badge active" style={{ fontSize: '0.7rem' }}>Locked</span>
                          ) : (
                            <span className="status-badge active" style={{ fontSize: '0.7rem' }}>Recorded</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', height: '28px' }}
                              onClick={() => handleOpenEdit(t)}
                              disabled={isLocked}
                              title={isLocked ? 'Day is locked by daily closing' : 'Edit entry with audit log'}
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', height: '28px', color: 'var(--danger)' }}
                              onClick={() => handleOpenDelete(t)}
                              disabled={isLocked}
                              title={isLocked ? 'Day is locked by daily closing' : 'Delete entry'}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredTransactions.length} records)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTxn && (
        <Modal
          isOpen={!!editingTxn}
          onClose={() => setEditingTxn(null)}
          title={`Edit Transaction: ${editingTxn.id}`}
        >
          <form onSubmit={handleSaveEdit}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Litres Sold</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control mono-num"
                  value={editFormData.litres}
                  onChange={(e) => {
                    const l = parseFloat(e.target.value) || 0;
                    const r = parseFloat(editFormData.fuelRate) || 0;
                    setEditFormData(prev => ({
                      ...prev,
                      litres: e.target.value,
                      totalAmount: (l * r).toFixed(2)
                    }));
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Total Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control mono-num"
                  value={editFormData.totalAmount}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Vehicle Registration</label>
                <input
                  type="text"
                  className="form-control mono-num"
                  value={editFormData.vehicleNumber}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-control"
                  value={editFormData.paymentMethod}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <option value="Cash">Cash</option>
                  <option value="GPay">GPay</option>
                  <option value="Other UPI">Other UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Audit Reason for Edit <span className="req">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Corrected typo in litres from meter reading"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingTxn(null)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save Changes with Audit Log
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTxn && (
        <Modal
          isOpen={!!deletingTxn}
          onClose={() => setDeletingTxn(null)}
          title="Confirm Transaction Deletion"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--danger-bg)', borderRadius: '8px', color: 'var(--danger)' }}>
              <AlertTriangle size={24} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.86rem' }}>
                Are you sure you want to delete sale <strong>{deletingTxn.id}</strong> (₹{deletingTxn.totalAmount}, {deletingTxn.litres}L of {deletingTxn.fuelCategory})?
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason for Deletion <span className="req">*</span></label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Duplicate customer swipe entry"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn-secondary" onClick={() => setDeletingTxn(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleConfirmDelete}>
                Confirm Deletion
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
