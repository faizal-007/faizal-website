import React, { useState, useMemo } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINRCurrency, formatINR, formatDate, getTodayDateStr } from '../utils/formatters';
import { 
  Coffee, 
  PlusCircle, 
  Trash2, 
  Edit3, 
  Search, 
  Calendar, 
  Tag, 
  FileText, 
  Sparkles,
  ShoppingBag,
  IndianRupee,
  UtensilsCrossed,
  Layers,
  X,
  CheckCircle2
} from 'lucide-react';
import Modal from '../components/Modal';

export default function Expansion1View() {
  const { 
    data, 
    activeDate, 
    addExpansion1Item, 
    updateExpansion1Item, 
    deleteExpansion1Item, 
    showToast 
  } = useFuel();

  const items = data.expansion1Items || [];

  // Form State for new item
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formQuantity, setFormQuantity] = useState('1');
  const [formDate, setFormDate] = useState(() => activeDate || getTodayDateStr());
  const [formNotes, setFormNotes] = useState('');

  // Edit Modal State
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editQuantity, setEditQuantity] = useState('1');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Delete Confirm Modal
  const [deletingId, setDeletingId] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDateMode, setFilterDateMode] = useState('ALL'); // 'ALL' or 'ACTIVE_DATE'

  // Computed total for form
  const formCalculatedTotal = useMemo(() => {
    const p = parseFloat(formPrice) || 0;
    const q = parseInt(formQuantity) || 1;
    return p * q;
  }, [formPrice, formQuantity]);

  // Computed metrics
  const activeDateItems = useMemo(() => {
    return items.filter(it => it.date === activeDate);
  }, [items, activeDate]);

  const activeDateTotal = useMemo(() => {
    return activeDateItems.reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0);
  }, [activeDateItems]);

  const grandTotal = useMemo(() => {
    return items.reduce((acc, it) => acc + (Number(it.totalAmount) || 0), 0);
  }, [items]);

  // Filtered list
  const filteredItems = useMemo(() => {
    return items.filter(it => {
      if (filterDateMode === 'ACTIVE_DATE' && it.date !== activeDate) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (it.name || '').toLowerCase().includes(q);
        const notesMatch = (it.notes || '').toLowerCase().includes(q);
        if (!nameMatch && !notesMatch) return false;
      }
      return true;
    });
  }, [items, filterDateMode, activeDate, searchQuery]);

  // Handle Add Item
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast('Please enter an item name (e.g. Tea, Food item).', 'error');
      return;
    }
    const priceNum = parseFloat(formPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid item price (₹0 or greater).', 'error');
      return;
    }
    const qtyNum = parseInt(formQuantity) || 1;
    if (qtyNum <= 0) {
      showToast('Quantity must be at least 1.', 'error');
      return;
    }

    const totalAmount = priceNum * qtyNum;

    addExpansion1Item({
      name: formName.trim(),
      price: priceNum,
      quantity: qtyNum,
      totalAmount,
      date: formDate || activeDate || getTodayDateStr(),
      notes: formNotes.trim()
    });

    // Reset Form
    setFormName('');
    setFormPrice('');
    setFormQuantity('1');
    setFormNotes('');
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setEditName(item.name || '');
    setEditPrice(item.price !== undefined ? String(item.price) : '');
    setEditQuantity(item.quantity !== undefined ? String(item.quantity) : '1');
    setEditDate(item.date || activeDate);
    setEditNotes(item.notes || '');
  };

  // Submit Edit
  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editName.trim()) {
      showToast('Item name cannot be empty.', 'error');
      return;
    }
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid price.', 'error');
      return;
    }
    const qtyNum = parseInt(editQuantity) || 1;
    if (qtyNum <= 0) {
      showToast('Quantity must be at least 1.', 'error');
      return;
    }

    const totalAmount = priceNum * qtyNum;

    updateExpansion1Item(editingItem.id, {
      name: editName.trim(),
      price: priceNum,
      quantity: qtyNum,
      totalAmount,
      date: editDate,
      notes: editNotes.trim()
    });

    setEditingItem(null);
  };

  // Handle Delete
  const handleConfirmDelete = () => {
    if (deletingId) {
      deleteExpansion1Item(deletingId);
      setDeletingId(null);
    }
  };

  // Convenient Shift Suggestions (purely for quick-typing convenience, never forced)
  const quickSuggestions = [
    { label: 'Tea', defaultPrice: 15 },
    { label: 'Special Tea', defaultPrice: 20 },
    { label: 'Coffee', defaultPrice: 25 },
    { label: 'Breakfast / Tiffin', defaultPrice: 60 },
    { label: 'Lunch Meals', defaultPrice: 90 },
    { label: 'Snacks / Samosa', defaultPrice: 30 },
    { label: 'Drinking Water Bottle', defaultPrice: 20 },
    { label: 'Biscuits / Cookies', defaultPrice: 20 }
  ];

  const handleApplySuggestion = (sug) => {
    setFormName(sug.label);
    if (!formPrice) {
      setFormPrice(String(sug.defaultPrice));
    }
  };

  return (
    <div className="page-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="dealer-tag" style={{ backgroundColor: 'var(--cyan-light)', color: 'var(--cyan-hover)', borderColor: 'var(--cyan)' }}>
              Shift Module
            </span>
            <h1>Expansion 1</h1>
          </div>
          <p>
            Customizable Items & Shift Expenses • Track tea, food, refreshments and custom shift items with names & prices
          </p>
        </div>

        <div className="page-actions">
          <div className="date-selector-wrapper" style={{ margin: 0 }}>
            <Calendar size={14} color="var(--primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>Active Date: {formatDate(activeDate)}</span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Total Custom Items</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--cyan-light)', color: 'var(--cyan-hover)' }}>
              <UtensilsCrossed size={18} />
            </div>
          </div>
          <div className="stat-value">{items.length}</div>
          <div className="stat-subtext">
            <span>All recorded items across all shifts</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Total Amount</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--fuel-petrol-bg)', color: 'var(--fuel-petrol)' }}>
              <IndianRupee size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--fuel-petrol)' }}>
            {formatINRCurrency(grandTotal)}
          </div>
          <div className="stat-subtext">
            <span>Cumulative total across all items</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Today's Items ({formatDate(activeDate).slice(0, 5)})</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
              <Calendar size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {activeDateItems.length}
          </div>
          <div className="stat-subtext">
            <span>Entries recorded for {formatDate(activeDate)}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Today's Total</span>
            <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
              <Coffee size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: '#d97706' }}>
            {formatINRCurrency(activeDateTotal)}
          </div>
          <div className="stat-subtext">
            <span>Shift expense total for active date</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Add Item Form on Left, Records List on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 400px) 1fr', gap: '24px', alignItems: 'start' }} className="expansion-layout-grid">
        {/* Card: Add Custom Item */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PlusCircle size={18} color="var(--primary)" />
              <span>Add Custom Item</span>
            </div>
            <span className="dealer-tag">Customizable</span>
          </div>

          <div className="card-body">
            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Optional Quick Suggestion Chips */}
              <div className="form-group">
                <label className="form-label" style={{ fontSize: '0.75rem' }}>
                  <span>Quick suggestions (optional click-to-fill):</span>
                </label>
                <div className="presets-group" style={{ marginTop: '2px' }}>
                  {quickSuggestions.map((sug) => (
                    <button
                      key={sug.label}
                      type="button"
                      className="preset-chip"
                      onClick={() => handleApplySuggestion(sug)}
                      title={`Fill "${sug.label}" (₹${sug.defaultPrice})`}
                    >
                      + {sug.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="exp1-name">
                  <span>Item Name <span className="req">*</span></span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tea, Food, etc.</span>
                </label>
                <input
                  id="exp1-name"
                  type="text"
                  className="form-control"
                  placeholder="Enter item name (e.g. Tea, Snacks, Lunch)"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </div>

              {/* Price & Quantity Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="exp1-price">
                    <span>Item Price (₹) <span className="req">*</span></span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ₹
                    </span>
                    <input
                      id="exp1-price"
                      type="number"
                      step="any"
                      min="0"
                      className="form-control mono-num"
                      style={{ paddingLeft: '28px' }}
                      placeholder="0.00"
                      value={formPrice}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                          e.preventDefault();
                        }
                      }}
                      onChange={(e) => setFormPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="exp1-qty">
                    <span>Quantity</span>
                  </label>
                  <input
                    id="exp1-qty"
                    type="number"
                    min="1"
                    className="form-control mono-num"
                    placeholder="1"
                    value={formQuantity}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setFormQuantity(e.target.value)}
                  />
                </div>
              </div>

              {/* Calculated Total Preview */}
              <div style={{ 
                backgroundColor: 'var(--bg-subtle)', 
                padding: '12px 14px', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                border: '1px dashed var(--border-color)' 
              }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Calculated Amount:
                </span>
                <span className="mono-num" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {formatINRCurrency(formCalculatedTotal)}
                </span>
              </div>

              {/* Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="exp1-date">
                  <span>Entry Date <span className="req">*</span></span>
                </label>
                <input
                  id="exp1-date"
                  type="date"
                  className="form-control mono-num"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  required
                />
              </div>

              {/* Notes / Shift Details */}
              <div className="form-group">
                <label className="form-label" htmlFor="exp1-notes">
                  <span>Shift / Notes (Optional)</span>
                </label>
                <input
                  id="exp1-notes"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Morning Shift tea, Operator refreshments"
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
                <span>Save Item to Shift</span>
              </button>
            </form>
          </div>
        </div>

        {/* Card: Custom Items List & History */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <ShoppingBag size={18} color="var(--primary)" />
              <span>Custom Items List ({filteredItems.length})</span>
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
            {/* Search Filter Bar */}
            <div className="filter-bar" style={{ marginBottom: '16px' }}>
              <div className="filter-input-wrap">
                <Search size={15} className="filter-icon" />
                <input
                  type="text"
                  className="filter-input"
                  placeholder="Search custom items by name or shift notes..."
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
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-secondary)' }}>
                <UtensilsCrossed size={40} color="var(--border-dark)" style={{ marginBottom: '12px', display: 'inline-block' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  No Custom Items Found
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
                  {searchQuery 
                    ? `No custom items match "${searchQuery}". Try a different keyword.` 
                    : 'Start adding your daily food items, tea, and other shift refreshments using the form on the left.'}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Item Name</th>
                      <th style={{ textAlign: 'right' }}>Unit Price</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Total Amount</th>
                      <th>Shift / Notes</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <span className="mono-num" style={{ fontWeight: 600, fontSize: '0.8rem' }}>
                            {formatDate(item.date)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ 
                              width: '28px', 
                              height: '28px', 
                              borderRadius: '6px', 
                              backgroundColor: 'var(--cyan-light)', 
                              color: 'var(--cyan-hover)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}>
                              <Coffee size={14} />
                            </div>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {item.name}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="mono-num">
                            {formatINRCurrency(item.price)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="status-badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                            × {item.quantity || 1}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <strong className="mono-num" style={{ color: 'var(--primary)', fontSize: '0.92rem' }}>
                            {formatINRCurrency(item.totalAmount)}
                          </strong>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.8rem', color: item.notes ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                            {item.notes || '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEdit(item)}
                              title="Edit Item"
                              style={{ padding: '4px 8px' }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeletingId(item.id)}
                              title="Delete Item"
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
      {editingItem && (
        <Modal 
          isOpen={true} 
          onClose={() => setEditingItem(null)} 
          title="Edit Custom Item"
        >
          <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="edit-exp1-name">
                <span>Item Name <span className="req">*</span></span>
              </label>
              <input
                id="edit-exp1-name"
                type="text"
                className="form-control"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-exp1-price">
                  <span>Price (₹) <span className="req">*</span></span>
                </label>
                <input
                  id="edit-exp1-price"
                  type="number"
                  step="any"
                  min="0"
                  className="form-control mono-num"
                  value={editPrice}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setEditPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="edit-exp1-qty">
                  <span>Quantity</span>
                </label>
                <input
                  id="edit-exp1-qty"
                  type="number"
                  min="1"
                  className="form-control mono-num"
                  value={editQuantity}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-exp1-date">
                <span>Date <span className="req">*</span></span>
              </label>
              <input
                id="edit-exp1-date"
                type="date"
                className="form-control mono-num"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-exp1-notes">
                <span>Shift / Notes</span>
              </label>
              <input
                id="edit-exp1-notes"
                type="text"
                className="form-control"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
              />
            </div>

            <div style={{ 
              backgroundColor: 'var(--bg-subtle)', 
              padding: '12px', 
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Calculated Total:</span>
              <strong className="mono-num" style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>
                {formatINRCurrency((parseFloat(editPrice) || 0) * (parseInt(editQuantity) || 1))}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setEditingItem(null)}
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
          title="Delete Custom Item?"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Are you sure you want to delete this custom item? This action will remove it from the shift records.
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
                Delete Item
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
