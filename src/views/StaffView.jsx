import React, { useState } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatINR, formatLitres, formatDate } from '../utils/formatters';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Power, 
  Phone, 
  Shield, 
  Fuel, 
  CheckCircle,
  Activity,
  History
} from 'lucide-react';
import Modal from '../components/Modal';

export default function StaffView() {
  const { data, addStaff, updateStaff, allTimeStats, activeDate, getDateMetrics } = useFuel();
  const todayMetrics = getDateMetrics(activeDate);

  // Modal State: Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'Pump Operator',
    assignedPumpId: ''
  });

  // Selected staff for viewing detailed shift activity log
  const [viewingStaff, setViewingStaff] = useState(null);

  const openAddModal = () => {
    setEditingStaffId(null);
    setFormData({
      name: '',
      phone: '',
      role: 'Pump Operator',
      assignedPumpId: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditingStaffId(staff.id);
    setFormData({
      name: staff.name,
      phone: staff.phone || '',
      role: staff.role,
      assignedPumpId: staff.assignedPumpId || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingStaffId) {
      updateStaff(editingStaffId, {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        assignedPumpId: formData.assignedPumpId || null
      });
    } else {
      addStaff({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        assignedPumpId: formData.assignedPumpId || null
      });
    }
    setIsModalOpen(false);
  };

  const handleToggleStatus = (staff) => {
    const nextStatus = staff.status === 'Active' ? 'Inactive' : 'Active';
    updateStaff(staff.id, { status: nextStatus });
  };

  return (
    <div className="page-content">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-info">
          <h1>Staff & Forecourt Attendants</h1>
          <p>
            Manage operators, cashiers, supervisors and track individual performance metrics
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary btn-sm" onClick={openAddModal}>
            <UserPlus size={15} />
            <span>+ Add Staff Member</span>
          </button>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {data.staff.map((staff) => {
          const isActive = staff.status === 'Active';
          const stats = allTimeStats.staffStats[staff.id] || { sales: 0, litres: 0, count: 0 };
          const todayStat = todayMetrics.staffStats[staff.id] || { sales: 0, litres: 0, count: 0 };
          const assignedPump = data.pumps.find(p => p.id === staff.assignedPumpId);

          return (
            <div 
              key={staff.id} 
              className="card"
              style={{ opacity: isActive ? 1 : 0.65, borderTop: `4px solid ${isActive ? 'var(--primary)' : '#94a3b8'}` }}
            >
              <div className="card-header" style={{ padding: '14px 18px' }}>
                <div>
                  <div style={{ fontWeight: '800', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{staff.name}</span>
                    <span className={`status-badge ${isActive ? 'active' : 'inactive'}`} style={{ fontSize: '0.68rem' }}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Shield size={12} color="var(--primary)" />
                    <span>{staff.role}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', height: '28px' }}
                    onClick={() => openEditModal(staff)}
                    title="Edit staff details"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 8px', height: '28px', color: isActive ? 'var(--danger)' : 'var(--success)' }}
                    onClick={() => handleToggleStatus(staff)}
                    title={isActive ? 'Deactivate staff' : 'Activate staff'}
                  >
                    <Power size={13} />
                  </button>
                </div>
              </div>

              <div className="card-body" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Contact & Assigned Pump */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <Phone size={13} />
                    <span>{staff.phone || 'No phone'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Fuel size={13} color="var(--primary)" />
                    <span style={{ fontWeight: '600' }}>
                      {assignedPump ? assignedPump.name : 'Floating / Shift'}
                    </span>
                  </div>
                </div>

                {/* Today's Metrics */}
                <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                    ACTIVITY ON {formatDate(activeDate)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <div>
                      <span className="mono-num" style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--primary)' }}>
                        {formatINR(todayStat.sales)}
                      </span>
                    </div>
                    <div className="mono-num" style={{ fontSize: '0.86rem', color: 'var(--cyan)', fontWeight: '700' }}>
                      {formatLitres(todayStat.litres)}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {todayStat.count} transactions handled today
                  </div>
                </div>

                {/* All-Time Performance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>All-Time Sales:</span>
                    <div className="mono-num" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {formatINR(stats.sales)}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>All-Time Litres:</span>
                    <div className="mono-num" style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {formatLitres(stats.litres)}
                    </div>
                  </div>
                </div>

                {/* View Activity Button */}
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', fontSize: '0.78rem' }}
                  onClick={() => setViewingStaff(staff)}
                >
                  <Activity size={13} /> View Recent Activity
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Staff Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStaffId ? 'Edit Staff Member' : 'Add New Staff Member'}
        >
          <form onSubmit={handleSaveStaff}>
            <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Full Name <span className="req">*</span></label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (Optional)</label>
                <input
                  type="tel"
                  className="form-control mono-num"
                  placeholder="e.g. +91 98450 12345"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role <span className="req">*</span></label>
                <select
                  className="form-control"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="Pump Operator">Pump Operator</option>
                  <option value="Senior Operator">Senior Operator</option>
                  <option value="Cashier">Cashier</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Station Manager">Station Manager</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Assigned Pump (Optional)</label>
                <select
                  className="form-control"
                  value={formData.assignedPumpId}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedPumpId: e.target.value }))}
                >
                  <option value="">None / Floating Operator</option>
                  {data.pumps.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.fuelType})</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                {editingStaffId ? 'Update Staff Member' : 'Save Staff Member'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Staff Activity Modal */}
      {viewingStaff && (
        <Modal
          isOpen={!!viewingStaff}
          onClose={() => setViewingStaff(null)}
          title={`Activity Log: ${viewingStaff.name} (${viewingStaff.role})`}
          wide
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TODAY'S REVENUE</div>
                <div className="mono-num font-bold" style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                  {formatINR(todayMetrics.staffStats[viewingStaff.id]?.sales || 0)}
                </div>
              </div>
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TODAY'S LITRES</div>
                <div className="mono-num font-bold" style={{ color: 'var(--cyan)', fontSize: '1.1rem' }}>
                  {formatLitres(todayMetrics.staffStats[viewingStaff.id]?.litres || 0)}
                </div>
              </div>
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ALL-TIME ENTRIES</div>
                <div className="mono-num font-bold" style={{ fontSize: '1.1rem' }}>
                  {allTimeStats.staffStats[viewingStaff.id]?.count || 0}
                </div>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Recent Sales Handled</h4>
              <div className="table-responsive">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Pump</th>
                      <th>Vehicle</th>
                      <th>Volume</th>
                      <th>Amount</th>
                      <th>Method</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions
                      .filter(t => t.staffId === viewingStaff.id)
                      .slice(0, 8)
                      .map(t => (
                        <tr key={t.id}>
                          <td className="mono-num">{formatDate(t.date)}</td>
                          <td className="mono-num">{t.time}</td>
                          <td>{t.pumpName}</td>
                          <td className="mono-num">{t.vehicleNumber || 'Walk-in'}</td>
                          <td className="mono-num">{t.litres.toFixed(2)} L</td>
                          <td className="mono-num font-bold">{formatINR(t.totalAmount)}</td>
                          <td>{t.paymentMethod}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
