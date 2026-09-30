import React, { useState, useMemo } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINRCurrency, formatDate, getTodayDateStr } from '../utils/formatters';
import { 
  Layers, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Search, 
  Calendar, 
  Tag, 
  FolderPlus,
  IndianRupee,
  FileText,
  X
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Expansion2View() {
  const { 
    data, 
    activeDate, 
    addExpansion2Entry, 
    updateExpansion2Entry, 
    deleteExpansion2Entry, 
    showToast 
  } = useFuel();

  const entries = data.expansion2Entries || [];

  // Form State for new custom entry
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCustomTag, setFormCustomTag] = useState('');
  const [formDate, setFormDate] = useState(() => activeDate || getTodayDateStr());
  const [formNotes, setFormNotes] = useState('');

  // Edit State
  const [editingEntry, setEditingEntry] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCustomTag, setEditCustomTag] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateMode, setFilterDateMode] = useState('ALL'); // 'ALL' or 'ACTIVE_DATE'

  // Computed metrics
  const activeDateEntries = useMemo(() => {
    return entries.filter(e => e.date === activeDate);
  }, [entries, activeDate]);

  const activeDateTotal = useMemo(() => {
    return activeDateEntries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [activeDateEntries]);

  const grandTotal = useMemo(() => {
    return entries.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [entries]);

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return entries.filter(e => {
      if (filterDateMode === 'ACTIVE_DATE' && e.date !== activeDate) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (e.title || '').toLowerCase().includes(q);
        const tagMatch = (e.customTag || '').toLowerCase().includes(q);
        const notesMatch = (e.notes || '').toLowerCase().includes(q);
        if (!titleMatch && !tagMatch && !notesMatch) return false;
      }
      return true;
    });
  }, [entries, filterDateMode, activeDate, searchQuery]);

  // Handle Add Entry
  const handleAddEntry = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      showToast('Please enter a title for your custom entry.', 'error');
      return;
    }
    const numAmount = parseFloat(formAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      showToast('Please enter a valid amount (₹0 or greater).', 'error');
      return;
    }

    addExpansion2Entry({
      title: formTitle.trim(),
      amount: numAmount,
      customTag: formCustomTag.trim() || 'Custom',
      date: formDate || activeDate || getTodayDateStr(),
      notes: formNotes.trim()
    });

    // Reset Form
    setFormTitle('');
    setFormAmount('');
    setFormCustomTag('');
    setFormNotes('');
  };

  // Open Edit Modal
  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setEditTitle(entry.title || '');
    setEditAmount(entry.amount !== undefined ? String(entry.amount) : '');
    setEditCustomTag(entry.customTag || '');
    setEditDate(entry.date || activeDate);
    setEditNotes(entry.notes || '');
  };

  // Save Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingEntry) return;
    if (!editTitle.trim()) {
      showToast('Entry title cannot be empty.', 'error');
      return;
    }
    const numAmount = parseFloat(editAmount);
    if (isNaN(numAmount) || numAmount < 0) {
      showToast('Please enter a valid amount.', 'error');
      return;
    }

    updateExpansion2Entry(editingEntry.id, {
      title: editTitle.trim(),
      amount: numAmount,
      customTag: editCustomTag.trim() || 'Custom',
      date: editDate,
      notes: editNotes.trim()
    });

    setEditingEntry(null);
  };

  // Confirm Delete
  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteExpansion2Entry(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="dealer-tag" style={{ backgroundColor: 'var(--fuel-power-bg)', color: 'var(--fuel-power)', borderColor: 'var(--fuel-power-border)' }}>
              Custom Only
            </span>
            <h1>Expansion 2</h1>
          </div>
          <p>
            Custom-Only Entries • Completely user-defined entries with no default items or predefined categories
          </p>
        </div>

        <div className="page-actions">
          <div className="date-selector-wrapper" style={{ margin: 0 }}>
            <Calendar size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Active Date: {formatDate(activeDate)}</span>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Total Custom Entries</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--fuel-power-bg)', color: 'var(--fuel-power)' }}>
              <Layers size={18} />
            </div>
          </div>
          <div className="stat-value">{entries.length}</div>
          <div className="stat-subtext">
            <span>User-defined custom entries recorded</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Total Custom Value</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--fuel-petrol-bg)', color: 'var(--fuel-petrol)' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--fuel-petrol)' }}>
            {formatINRCurrency(grandTotal)}
          </div>
          <div className="stat-subtext">
            <span>Combined total of all custom entries</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Today's Entries ({formatDate(activeDate).slice(0, 5)})</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {activeDateEntries.length}
          </div>
          <div className="stat-subtext">
            <span>Custom entries for active date</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Today's Value</span>
            <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <FolderPlus size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#d97706' }}>
            {formatINRCurrency(activeDateTotal)}
          </div>
          <div className="stat-subtext">
            <span>Amount total for active date</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Left, List Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 380px) 1fr', gap: '24px', alignItems: 'start' }} className="expansion-layout-grid">
        {/* Card: Add Custom Entry */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PlusCircle size={18} color="var(--fuel-power)" />
              <span>New Custom Entry</span>
            </div>
            <span className="status-badge" style={{ backgroundColor: 'var(--fuel-power-bg)', color: 'var(--fuel-power)' }}>
              Custom
            </span>
          </div>

          <div className="card-body">
            <form onSubmit={handleAddEntry} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Title */}
              <div className="form-group">
                <label className="form-label" htmlFor="exp2-title">
                  <span>Custom Entry Title <span className="req">*</span></span>
                </label>
                <input
                  id="exp2-title"
                  type="text"
                  className="form-control"
                  placeholder="Enter custom entry name..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {/* Amount */}
              <div className="form-group">
                <label className="form-label" htmlFor="exp2-amount">
                  <span>Amount / Price (₹) <span className="req">*</span></span>
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
                    ₹
                  </span>
                  <input
                    id="exp2-amount"
                    type="number"
                    step="any"
                    min="0"
                    className="form-control mono-num"
                    style={{ paddingLeft: '28px' }}
                    placeholder="0.00"
                    value={formAmount}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setFormAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* User-defined Custom Tag */}
              <div className="form-group">
                <label className="form-label" htmlFor="exp2-tag">
                  <span>Custom Tag / Category (Optional)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Tag size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    id="exp2-tag"
                    type="text"
                    className="form-control"
                    style={{ paddingLeft: '34px' }}
                    placeholder="Type your own custom label/tag"
                    value={formCustomTag}
                    onChange={(e) => setFormCustomTag(e.target.value)}
                  />
                </div>
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="exp2-date">
                  <span>Entry Date <span className="req">*</span></span>
                </label>
                <input
                  id="exp2-date"
                  type="date"
                  className="form-control mono-num"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>

              {/* Details / Notes */}
              <div className="form-group">
                <label className="form-label" htmlFor="exp2-notes">
                  <span>Custom Details / Notes (Optional)</span>
                </label>
                <textarea
                  id="exp2-notes"
                  className="form-control"
                  style={{ minHeight: '70px' }}
                  placeholder="Enter any additional custom details or remarks..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                />
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', height: '44px', fontWeight: 700 }}
              >
                <PlusCircle size={18} />
                <span>Add Custom Entry</span>
              </button>
            </form>
          </div>
        </div>

        {/* Card: Custom Entries List */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <FolderPlus size={18} color="var(--primary)" />
              <span>Custom Entries List ({filteredEntries.length})</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button"
                className={`date-quick-btn ${filterDateMode === 'ALL' ? 'active' : ''}`}
                onClick={() => setFilterDateMode('ALL')}
              >
                All Dates
              </button>
              <button 
                type="button"
                className={`date-quick-btn ${filterDateMode === 'ACTIVE_DATE' ? 'active' : ''}`}
                onClick={() => setFilterDateMode('ACTIVE_DATE')}
              >
                Today Only
              </button>
            </div>
          </div>

          <div className="card-body">
            {/* Filter Bar */}
            <div className="filter-bar" style={{ marginBottom: '16px' }}>
              <div className="filter-input-wrap">
                <Search size={15} className="filter-icon" />
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search custom entries by title, custom tag, or details..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery && (
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} /> Clear
                </button>
              )}
            </div>

            {/* Table or Empty State */}
            {filteredEntries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
                <Layers size={40} color="var(--border-dark)" style={{ marginBottom: '12px', display: 'inline-block' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  No Custom Entries Yet
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
                  {searchQuery 
                    ? `No entries match "${searchQuery}". Try a different keyword.` 
                    : 'This section contains only custom options with no default items. Use the form on the left to add your first custom entry.'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Custom Title</th>
                      <th>Custom Tag</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Details / Notes</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.map((entry) => (
                      <tr key={entry.id}>
                        <td>
                          <span className="mono-num" style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            {formatDate(entry.date)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '6px', 
                              backgroundColor: 'var(--fuel-power-bg)', 
                              color: 'var(--fuel-power)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Layers size={14} />
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {entry.title}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="status-badge" style={{ backgroundColor: 'var(--fuel-power-bg)', color: 'var(--fuel-power)' }}>
                            <Tag size={11} style={{ marginRight: '3px' }} /> {entry.customTag || 'Custom'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="mono-num" style={{ color: 'var(--fuel-petrol)', fontSize: '0.92rem' }}>
                            {formatINRCurrency(entry.amount)}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: entry.notes ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                            {entry.notes || '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEdit(entry)}
                              title="Edit Entry"
                              style={{ padding: '4px 8px' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeletingId(entry.id)}
                              title="Delete Entry"
                              style={{ padding: '4px 8px' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <Modal 
          isOpen={true} 
          onClose={() => setEditingEntry(null)} 
          title="Edit Custom Entry"
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-exp2-title">
                <span>Custom Title <span className="req">*</span></span>
              </label>
              <input
                id="edit-exp2-title"
                type="text"
                className="form-control"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-exp2-amount">
                <span>Amount / Price (₹) <span className="req">*</span></span>
              </label>
              <input
                id="edit-exp2-amount"
                type="number"
                step="any"
                min="0"
                className="form-control mono-num"
                value={editAmount}
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                    e.preventDefault();
                  }
                }}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-exp2-tag">
                <span>Custom Tag / Category</span>
              </label>
              <input
                id="edit-exp2-tag"
                type="text"
                className="form-control"
                value={editCustomTag}
                onChange={(e) => setEditCustomTag(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-exp2-date">
                <span>Date <span className="req">*</span></span>
              </label>
              <input
                id="edit-exp2-date"
                type="date"
                className="form-control mono-num"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-exp2-notes">
                <span>Details / Notes</span>
              </label>
              <textarea
                id="edit-exp2-notes"
                className="form-control"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingEntry(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <Modal
          isOpen={true}
          onClose={() => setDeletingId(null)}
          title="Delete Custom Entry?"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Are you sure you want to delete this custom entry? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingId(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmDelete}
              >
                Delete Entry
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
