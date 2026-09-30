import React, { useState, useMemo } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatDate, getTodayDateStr } from '../utils/formatters';
import { 
  ReceiptIndianRupee, 
  PlusCircle, 
  Trash2, 
  Search, 
  Tag, 
  Calendar, 
  User, 
  Banknote, 
  CreditCard, 
  QrCode,
  AlertCircle,
  Plus,
  Settings
} from 'lucide-react';
import Modal from '../components/Modal';

export default function ExpensesView() {
  const { data, activeDate, addExpense, deleteExpense, isDayClosed, updateSettings, showToast } = useFuel();

  // Form State
  const [formDate, setFormDate] = useState(() => activeDate || getTodayDateStr());
  const [category, setCategory] = useState(data.settings.customExpenseCategories[0] || 'Tea / Food');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [paidTo, setPaidTo] = useState('');
  const [description, setDescription] = useState('');
  const [recordedBy, setRecordedBy] = useState(() => {
    const s = data.staff.find(st => st.status === 'Active');
    return s ? s.name : 'Supervisor';
  });

  // Category Manager Modal state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [dateFilterMode, setDateFilterMode] = useState('ACTIVE_DATE'); // 'ACTIVE_DATE' or 'ALL'

  // Active categories list from settings
  const categoriesList = data.settings.customExpenseCategories || [
    'Electricity', 'Staff Salary', 'Maintenance', 'Tea / Food', 'Transport', 'Cleaning', 'Office Expenses', 'Other'
  ];

  // Active Date expenses
  const activeDateExpenses = data.expenses.filter(e => e.date === activeDate);
  const activeDateTotal = activeDateExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const activeDateCash = activeDateExpenses.filter(e => e.paymentMethod === 'Cash').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const activeDateDigital = activeDateTotal - activeDateCash;

  // Category breakdown for active date
  const categoryBreakdown = useMemo(() => {
    const map = {};
    activeDateExpenses.forEach(e => {
      map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [activeDateExpenses]);

  // Filtered expense history list
  const filteredExpenses = useMemo(() => {
    return data.expenses.filter(e => {
      if (dateFilterMode === 'ACTIVE_DATE' && e.date !== activeDate) {
        return false;
      }
      if (filterCategory !== 'ALL' && e.category !== filterCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const catMatch = e.category.toLowerCase().includes(q);
        const descMatch = (e.description || '').toLowerCase().includes(q);
        const paidToMatch = (e.paidTo || '').toLowerCase().includes(q);
        const recMatch = (e.recordedBy || '').toLowerCase().includes(q);
        if (!catMatch && !descMatch && !paidToMatch && !recMatch) return false;
      }
      return true;
    });
  }, [data.expenses, activeDate, dateFilterMode, filterCategory, searchQuery]);

  // Handle Add Expense
  const handleAddExpense = (e) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid expense amount greater than ₹0.', 'error');
      return;
    }
    if (!description.trim() && !paidTo.trim()) {
      showToast('Please specify a description or recipient for the expense.', 'error');
      return;
    }

    const res = addExpense({
      date: formDate,
      category,
      amount: numAmount,
      paymentMethod,
      paidTo: paidTo.trim(),
      description: description.trim(),
      recordedBy
    });

    if (res.success) {
      setAmount('');
      setDescription('');
      setPaidTo('');
    }
  };

  // Add new custom category
  const handleAddCustomCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categoriesList.includes(trimmed)) {
      showToast('Category already exists.', 'warning');
      return;
    }
    const updated = [...categoriesList, trimmed];
    updateSettings({ customExpenseCategories: updated });
    setNewCatName('');
    showToast(`Added custom category "${trimmed}"`, 'success');
  };

  // Delete custom category
  const handleDeleteCategory = (catToDelete) => {
    if (categoriesList.length <= 1) {
      showToast('At least one category must remain.', 'warning');
      return;
    }
    const updated = categoriesList.filter(c => c !== catToDelete);
    updateSettings({ customExpenseCategories: updated });
    if (category === catToDelete) {
      setCategory(updated[0]);
    }
    showToast(`Category "${catToDelete}" removed.`, 'info');
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Daily Expense Ledger</h1>
          <p>
            Track operational bunk disbursements, forecourt maintenance, staff wages & daily supplies for <strong>{formatDate(activeDate)}</strong>
          </p>
        </div>

        <div className="page-actions">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsCategoryModalOpen(true)}
          >
            <Settings size={15} />
            <span>Manage Custom Categories</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Selected Date Total Expenses</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <ReceiptIndianRupee size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--danger)' }}>
            {formatINR(activeDateTotal)}
          </div>
          <div className="stat-subtext">
            <span>{activeDateExpenses.length} disbursements logged</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Cash Expenses (Deducted from Register)</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--fuel-petrol-bg)', color: 'var(--fuel-petrol)' }}>
              <Banknote size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--fuel-petrol)' }}>
            {formatINR(activeDateCash)}
          </div>
          <div className="stat-subtext">
            <span>Directly impacts physical cash balance</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <span className="stat-title">Digital / Bank Paid Expenses</span>
            <div className="stat-icon" style={{ backgroundColor: 'var(--cyan-light)', color: 'var(--cyan)' }}>
              <QrCode size={18} />
            </div>
          </div>
          <div className="stat-value mono-num" style={{ color: 'var(--cyan)' }}>
            {formatINR(activeDateDigital)}
          </div>
          <div className="stat-subtext">
            <span>UPI, GPay or Card vendor transfers</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Add Form & Category Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Record Expense Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PlusCircle size={18} color="var(--primary)" />
              <span>Record Daily Expense</span>
            </div>
            {isDayClosed(formDate) && (
              <span className="status-badge short" style={{ fontSize: '0.72rem' }}>
                Day Closed
              </span>
            )}
          </div>
          <div className="card-body">
            <form onSubmit={handleAddExpense}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">Date <span className="req">*</span></label>
                  <input
                    type="date"
                    className="form-control mono-num"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category <span className="req">*</span></label>
                  <select
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    {categoriesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Amount (₹) <span className="req">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-control mono-num"
                    placeholder="₹0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method <span className="req">*</span></label>
                  <select
                    className="form-control"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">Cash (from Till)</option>
                    <option value="GPay">GPay (Station Account)</option>
                    <option value="Other UPI">Other UPI / PhonePe</option>
                    <option value="Card">Bank Card / Transfer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Paid To (Vendor/Person)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Tea Shop / Electrician / Delivery"
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Recorded By <span className="req">*</span></label>
                  <select
                    className="form-control"
                    value={recordedBy}
                    onChange={(e) => setRecordedBy(e.target.value)}
                    required
                  >
                    {data.staff.filter(s => s.status === 'Active').map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Description / Remarks <span className="req">*</span></label>
                  <textarea
                    className="form-control"
                    placeholder="Detailed explanation of purchase or service..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isDayClosed(formDate)}
                >
                  <PlusCircle size={15} />
                  <span>Log Expense Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Category-wise Breakdown Card */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Tag size={18} color="var(--primary)" />
              <span>Category Breakdown ({formatDate(activeDate)})</span>
            </div>
            <span className="mono-num" style={{ fontWeight: '700', fontSize: '0.88rem' }}>
              {formatINR(activeDateTotal)}
            </span>
          </div>
          <div className="card-body">
            {categoryBreakdown.length === 0 ? (
              <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No expenses logged for this date.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {categoryBreakdown.map(([cat, catTotal]) => {
                  const percent = activeDateTotal > 0 ? (catTotal / activeDateTotal) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', marginBottom: '4px' }}>
                        <span style={{ fontWeight: '600' }}>{cat}</span>
                        <span className="mono-num">
                          {formatINR(catTotal)} <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>({percent.toFixed(0)}%)</span>
                        </span>
                      </div>
                      <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--danger)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expense History Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <ReceiptIndianRupee size={18} color="var(--text-primary)" />
            <span>Expense Ledger History</span>
          </div>
        </div>
        <div className="card-body" style={{ padding: '16px' }}>
          {/* Filter Bar */}
          <div className="filter-bar" style={{ margin: 0, marginBottom: '16px' }}>
            <div className="filter-input-wrap">
              <Search size={16} className="filter-icon" />
              <input
                type="text"
                className="filter-input"
                placeholder="Search description, recipient or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={dateFilterMode}
              onChange={(e) => setDateFilterMode(e.target.value)}
            >
              <option value="ACTIVE_DATE">Only Active Date ({formatDate(activeDate)})</option>
              <option value="ALL">All Recorded Dates</option>
            </select>

            <select
              className="filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {categoriesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {filteredExpenses.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No expenses match current filters.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Paid To</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Logged By</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((exp) => {
                    const isLocked = isDayClosed(exp.date);
                    return (
                      <tr key={exp.id}>
                        <td className="mono-num">{formatDate(exp.date)}</td>
                        <td>
                          <span className="badge" style={{ background: '#f1f5f9', fontWeight: '600', padding: '3px 8px', borderRadius: '4px' }}>
                            {exp.category}
                          </span>
                        </td>
                        <td>{exp.description}</td>
                        <td style={{ color: exp.paidTo ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {exp.paidTo || '-'}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', color: exp.paymentMethod === 'Cash' ? 'var(--fuel-petrol)' : 'var(--cyan)' }}>
                            {exp.paymentMethod}
                          </span>
                        </td>
                        <td className="mono-num" style={{ fontWeight: '800', color: 'var(--danger)', fontSize: '0.95rem' }}>
                          {formatINR(exp.amount)}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {exp.recordedBy}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ height: '28px', padding: '4px 8px', color: 'var(--danger)' }}
                            onClick={() => deleteExpense(exp.id)}
                            disabled={isLocked}
                            title={isLocked ? 'Date is closed & locked' : 'Delete expense'}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Category Manager Modal */}
      {isCategoryModalOpen && (
        <Modal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          title="Manage Custom Expense Categories"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Create or remove expense categories specific to your petrol bunk operations.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="New Category (e.g. Generator Fuel, Water Tanker)..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleAddCustomCategory}>
                <Plus size={15} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {categoriesList.map(cat => (
                <div 
                  key={cat}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    background: '#f1f5f9',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem'
                  }}
                >
                  <span>{cat}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex' }}
                    title="Delete category"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
