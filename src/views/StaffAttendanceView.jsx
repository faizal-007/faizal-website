import React, { useState, useMemo } from 'react';
import { useFuel } from '../context/FuelContext';
import { formatDate, getTodayDateStr } from '../utils/formatters';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Calendar, 
  Clock, 
  PlusCircle, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Search, 
  Filter,
  BarChart2,
  Lock,
  UserPlus,
  Power
} from 'lucide-react';
import Modal from '../components/Modal';

export default function StaffAttendanceView() {
  const { 
    data, 
    activeDate, 
    setActiveDate, 
    markAttendance, 
    correctAttendance, 
    deleteAttendance, 
    getDailyAttendance, 
    getStaffMonthlySummary,
    addStaff,
    updateStaff,
    userRole,
    isOwnerAuthorized,
    openOwnerAuthModal,
    showToast 
  } = useFuel();

  const [activeTabSub, setActiveTabSub] = useState('daily'); // 'daily' | 'monthly' | 'directory'
  const [selectedMonth, setSelectedMonth] = useState(() => activeDate.substring(0, 7)); // e.g. "2026-09"
  const [searchStaff, setSearchStaff] = useState('');

  // Mark Attendance Modal
  const [isMarkModalOpen, setIsMarkModalOpen] = useState(false);
  const [markForm, setMarkForm] = useState({
    staffId: '',
    date: activeDate,
    status: 'Present',
    shift: 'Morning Shift (06:00 - 14:00)',
    checkInTime: '06:00 AM',
    checkOutTime: '',
    notes: ''
  });

  // Edit / Correction Modal
  const [editModal, setEditModal] = useState({
    isOpen: false,
    record: null,
    status: 'Present',
    shift: '',
    checkInTime: '',
    checkOutTime: '',
    notes: '',
    reason: ''
  });

  // Add / Edit Staff Profile Modal
  const [staffModal, setStaffModal] = useState({
    isOpen: false,
    isEditing: false,
    id: null,
    name: '',
    phone: '',
    role: 'Pump Operator'
  });

  const dailyData = getDailyAttendance(activeDate);
  const monthlyData = getStaffMonthlySummary(selectedMonth);

  // Filtered staff list for Daily
  const filteredDailyList = dailyData.list.filter(item => {
    if (!searchStaff) return true;
    return item.staff.name.toLowerCase().includes(searchStaff.toLowerCase()) ||
           item.staff.role.toLowerCase().includes(searchStaff.toLowerCase());
  });

  // Open Mark Attendance
  const handleOpenMarkModal = (staff = null) => {
    const defaultStaff = staff || data.staff.find(s => s.status === 'Active');
    setMarkForm({
      staffId: defaultStaff ? defaultStaff.id : '',
      date: activeDate,
      status: 'Present',
      shift: 'Morning Shift (06:00 - 14:00)',
      checkInTime: '06:00 AM',
      checkOutTime: '',
      notes: ''
    });
    setIsMarkModalOpen(true);
  };

  // Submit Mark Attendance
  const handleSubmitMark = (e) => {
    e.preventDefault();
    const st = data.staff.find(s => s.id === markForm.staffId);
    if (!st) {
      showToast('Please select a staff member.', 'error');
      return;
    }

    const res = markAttendance({
      staffId: st.id,
      staffName: st.name,
      date: markForm.date,
      status: markForm.status,
      shift: markForm.shift,
      checkInTime: markForm.checkInTime,
      checkOutTime: markForm.checkOutTime,
      notes: markForm.notes
    });

    if (res.success) {
      setIsMarkModalOpen(false);
    } else if (res.duplicate) {
      // Suggest opening correction modal
      if (window.confirm(`An attendance entry already exists for ${st.name} on ${markForm.date}. Open record to edit and correct?`)) {
        setIsMarkModalOpen(false);
        handleOpenCorrection(res.existingRecord);
      }
    }
  };

  // Open Correction Modal (Requires Owner if in worker mode)
  const handleOpenCorrection = (record) => {
    const openForm = () => {
      setEditModal({
        isOpen: true,
        record,
        status: record.status,
        shift: record.shift,
        checkInTime: record.checkInTime || '',
        checkOutTime: record.checkOutTime || '',
        notes: record.notes || '',
        reason: ''
      });
    };

    if (isOwnerAuthorized) {
      openForm();
    } else {
      openOwnerAuthModal(openForm, 'Authorize Attendance Correction');
    }
  };

  // Save Correction
  const handleSaveCorrection = (e) => {
    e.preventDefault();
    if (!editModal.record) return;

    correctAttendance(
      editModal.record.id,
      {
        status: editModal.status,
        shift: editModal.shift,
        checkInTime: editModal.checkInTime,
        checkOutTime: editModal.checkOutTime,
        notes: editModal.notes
      },
      editModal.reason,
      userRole === 'owner' ? 'Owner' : 'Authorized Supervisor'
    );

    setEditModal({ isOpen: false, record: null, status: 'Present', shift: '', checkInTime: '', checkOutTime: '', notes: '', reason: '' });
  };

  // Delete Attendance Record
  const handleDeleteRecord = (record) => {
    const doDelete = () => {
      if (window.confirm(`Delete attendance record for ${record.staffName} on ${record.date}?`)) {
        deleteAttendance(record.id, userRole === 'owner' ? 'Owner' : 'Supervisor');
      }
    };

    if (isOwnerAuthorized) {
      doDelete();
    } else {
      openOwnerAuthModal(doDelete, 'Authorize Attendance Deletion');
    }
  };

  // Save Staff Member
  const handleSaveStaff = (e) => {
    e.preventDefault();
    if (!staffModal.name.trim()) return;

    if (staffModal.isEditing && staffModal.id) {
      updateStaff(staffModal.id, {
        name: staffModal.name.trim(),
        phone: staffModal.phone.trim(),
        role: staffModal.role
      });
    } else {
      addStaff({
        name: staffModal.name.trim(),
        phone: staffModal.phone.trim(),
        role: staffModal.role,
        assignedPumpId: null
      });
    }

    setStaffModal({ isOpen: false, isEditing: false, id: null, name: '', phone: '', role: 'Pump Operator' });
  };

  // Toggle Staff Active/Inactive
  const handleToggleStaffStatus = (staff) => {
    const newStatus = staff.status === 'Active' ? 'Inactive' : 'Active';
    updateStaff(staff.id, { status: newStatus });
  };

  return (
    <div className="page-content" style={{ paddingBottom: '90px' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '16px' }}>
        <div className="page-header-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="owner-crown-badge">
              <Users size={14} /> Staff Attendance
            </span>
            <span style={{ fontSize: '0.78rem', color: '#059669', fontWeight: '600', background: '#ecfdf5', padding: '3px 8px', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
              Shift & Roster Management
            </span>
          </div>
          <h1 style={{ marginTop: '4px' }}>Petrol Pump Staff Attendance & Shifts</h1>
          <p>
            Track daily attendance, shift assignments, check-in times and monthly summaries for forecourt workers
          </p>
        </div>

        {/* Tab switch pills */}
        <div className="page-actions">
          <div className="date-selector-wrapper" style={{ padding: '3px 6px' }}>
            <button
              type="button"
              className={`date-quick-btn ${activeTabSub === 'daily' ? 'active' : ''}`}
              onClick={() => setActiveTabSub('daily')}
            >
              Daily Attendance
            </button>
            <button
              type="button"
              className={`date-quick-btn ${activeTabSub === 'monthly' ? 'active' : ''}`}
              onClick={() => setActiveTabSub('monthly')}
            >
              Monthly Summary
            </button>
            <button
              type="button"
              className={`date-quick-btn ${activeTabSub === 'directory' ? 'active' : ''}`}
              onClick={() => setActiveTabSub('directory')}
            >
              Staff Directory ({data.staff.length})
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: DAILY ATTENDANCE */}
      {activeTabSub === 'daily' && (
        <>
          {/* Daily Status Stats */}
          <div className="summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: '20px' }}>
            <div className="stat-card">
              <div className="stat-label">PRESENT TODAY</div>
              <div className="stat-value mono-num" style={{ color: '#059669', fontSize: '1.6rem', fontWeight: '800' }}>
                {dailyData.presentCount}
              </div>
              <div className="stat-meta">Active attendants on duty</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">ABSENT TODAY</div>
              <div className="stat-value mono-num" style={{ color: '#dc2626', fontSize: '1.6rem', fontWeight: '800' }}>
                {dailyData.absentCount}
              </div>
              <div className="stat-meta">Workers not reported</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">ON LEAVE</div>
              <div className="stat-value mono-num" style={{ color: '#d97706', fontSize: '1.6rem', fontWeight: '800' }}>
                {dailyData.leaveCount}
              </div>
              <div className="stat-meta">Authorized leave approved</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">TOTAL FORECOURT STAFF</div>
              <div className="stat-value mono-num" style={{ color: 'var(--text-primary)', fontSize: '1.6rem', fontWeight: '800' }}>
                {dailyData.totalStaff}
              </div>
              <div className="stat-meta">{dailyData.unmarkedCount} pending marking</div>
            </div>
          </div>

          {/* Action & Filter Bar */}
          <div className="filter-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '220px' }}>
              <div className="search-input-wrap" style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="form-control"
                  style={{ paddingLeft: '32px', height: '36px', fontSize: '0.84rem' }}
                  placeholder="Search staff by name or role..."
                  value={searchStaff}
                  onChange={(e) => setSearchStaff(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                onClick={() => handleOpenMarkModal()}
              >
                <PlusCircle size={15} /> Mark Attendance
              </button>
            </div>
          </div>

          {/* Daily Table */}
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Designation</th>
                  <th>Attendance Status</th>
                  <th>Assigned Shift</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredDailyList.map(({ staff, record, status, shift, checkInTime, checkOutTime }) => (
                  <tr key={staff.id}>
                    <td>
                      <strong>{staff.name}</strong>
                    </td>
                    <td>{staff.role}</td>
                    <td>
                      <span className={`status-badge ${status === 'Present' ? 'active' : status === 'Leave' ? 'pending' : status === 'Absent' ? 'inactive' : ''}`}>
                        {status}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {shift}
                      </span>
                    </td>
                    <td className="mono-num">
                      {checkInTime || <span style={{ color: 'var(--text-muted)' }}>--</span>}
                    </td>
                    <td className="mono-num">
                      {checkOutTime || <span style={{ color: 'var(--text-muted)' }}>--</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {record ? (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              onClick={() => handleOpenCorrection(record)}
                              title="Owner correction with history"
                            >
                              <Edit3 size={12} /> Correct
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              onClick={() => handleDeleteRecord(record)}
                              title="Remove attendance entry"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.74rem', backgroundColor: '#059669', borderColor: '#059669' }}
                            onClick={() => handleOpenMarkModal(staff)}
                          >
                            <PlusCircle size={12} /> Mark
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* VIEW 2: MONTHLY SUMMARY */}
      {activeTabSub === 'monthly' && (
        <div className="owner-section-block">
          <div className="section-title-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} color="#059669" />
              <h2 className="section-title">Monthly Staff Attendance Summary</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                Select Month:
              </label>
              <input
                type="month"
                className="form-control"
                style={{ height: '34px', fontSize: '0.84rem' }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Role</th>
                  <th>Present Days</th>
                  <th>Absent Days</th>
                  <th>Leave Days</th>
                  <th>Total Recorded</th>
                  <th>Attendance %</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.summaries.map((s) => {
                  const rate = s.totalRecordedDays > 0 
                    ? ((s.present / s.totalRecordedDays) * 100).toFixed(0) 
                    : 100;
                  return (
                    <tr key={s.staffId}>
                      <td><strong>{s.staffName}</strong></td>
                      <td>{s.role}</td>
                      <td>
                        <span className="badge" style={{ background: '#d1fae5', color: '#065f46', fontWeight: '700' }}>
                          {s.present} Days
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#fee2e2', color: '#991b1b', fontWeight: '700' }}>
                          {s.absent} Days
                        </span>
                      </td>
                      <td>
                        <span className="badge" style={{ background: '#fef3c7', color: '#92400e', fontWeight: '700' }}>
                          {s.leave} Days
                        </span>
                      </td>
                      <td className="mono-num">{s.totalRecordedDays} Days</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className="mono-num" style={{ fontWeight: '700', color: rate >= 80 ? '#059669' : '#d97706' }}>
                            {rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: STAFF DIRECTORY & PROFILES */}
      {activeTabSub === 'directory' && (
        <div className="owner-section-block">
          <div className="section-title-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="#059669" />
              <h2 className="section-title">Forecourt Staff Profiles</h2>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              style={{ backgroundColor: '#059669', borderColor: '#059669' }}
              onClick={() => {
                if (isOwnerAuthorized) {
                  setStaffModal({ isOpen: true, isEditing: false, id: null, name: '', phone: '', role: 'Pump Operator' });
                } else {
                  openOwnerAuthModal(() => {
                    setStaffModal({ isOpen: true, isEditing: false, id: null, name: '', phone: '', role: 'Pump Operator' });
                  }, 'Authorize Staff Management');
                }
              }}
            >
              <UserPlus size={14} /> Add New Staff
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Designation / Role</th>
                  <th>Mobile Number</th>
                  <th>Profile Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.staff.map((st) => (
                  <tr key={st.id}>
                    <td><strong>{st.name}</strong></td>
                    <td>{st.role}</td>
                    <td className="mono-num">{st.phone || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${st.status === 'Active' ? 'active' : 'inactive'}`}>
                        {st.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          onClick={() => {
                            setStaffModal({
                              isOpen: true,
                              isEditing: true,
                              id: st.id,
                              name: st.name,
                              phone: st.phone || '',
                              role: st.role
                            });
                          }}
                          title="Edit profile"
                        >
                          <Edit3 size={12} /> Edit
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${st.status === 'Active' ? 'btn-danger' : 'btn-secondary'}`}
                          style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                          onClick={() => handleToggleStaffStatus(st)}
                          title={st.status === 'Active' ? 'Deactivate profile' : 'Activate profile'}
                        >
                          <Power size={12} /> {st.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MARK ATTENDANCE MODAL */}
      {isMarkModalOpen && (
        <Modal
          isOpen={isMarkModalOpen}
          onClose={() => setIsMarkModalOpen(false)}
          title="Mark Staff Attendance"
        >
          <form onSubmit={handleSubmitMark} style={{ padding: '4px 0' }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Staff Member:
              </label>
              <select
                className="form-control"
                value={markForm.staffId}
                onChange={(e) => setMarkForm(prev => ({ ...prev, staffId: e.target.value }))}
                required
              >
                {data.staff.filter(s => s.status === 'Active').map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Date:
              </label>
              <input
                type="date"
                className="form-control"
                value={markForm.date}
                onChange={(e) => setMarkForm(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Attendance Status:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Present', 'Absent', 'Leave'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn ${markForm.status === st ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '6px' }}
                    onClick={() => setMarkForm(prev => ({ ...prev, status: st }))}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Shift Assigned:
              </label>
              <select
                className="form-control"
                value={markForm.shift}
                onChange={(e) => setMarkForm(prev => ({ ...prev, shift: e.target.value }))}
              >
                <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
                <option value="General Shift (09:00 - 18:00)">General Shift (09:00 - 18:00)</option>
              </select>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                  Check-In Time:
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 05:50 AM"
                  value={markForm.checkInTime}
                  onChange={(e) => setMarkForm(prev => ({ ...prev, checkInTime: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                  Check-Out Time:
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 02:10 PM"
                  value={markForm.checkOutTime}
                  onChange={(e) => setMarkForm(prev => ({ ...prev, checkOutTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Remarks / Notes:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Optional notes"
                value={markForm.notes}
                onChange={(e) => setMarkForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setIsMarkModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <CheckCircle2 size={16} /> Save Attendance
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* CORRECTION / EDIT MODAL */}
      {editModal.isOpen && (
        <Modal
          isOpen={editModal.isOpen}
          onClose={() => setEditModal({ isOpen: false, record: null, status: 'Present', shift: '', checkInTime: '', checkOutTime: '', notes: '', reason: '' })}
          title={`Correct Attendance: ${editModal.record?.staffName}`}
        >
          <form onSubmit={handleSaveCorrection} style={{ padding: '4px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#eff6ff', borderRadius: '6px', border: '1px solid #bfdbfe', marginBottom: '14px', fontSize: '0.82rem', color: '#1e40af' }}>
              <ShieldCheck size={16} />
              <span>Owner audit trail: edits are tracked with correction reason.</span>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Attendance Status:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['Present', 'Absent', 'Leave'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    className={`btn ${editModal.status === st ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '6px' }}
                    onClick={() => setEditModal(prev => ({ ...prev, status: st }))}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Shift:
              </label>
              <select
                className="form-control"
                value={editModal.shift}
                onChange={(e) => setEditModal(prev => ({ ...prev, shift: e.target.value }))}
              >
                <option value="Morning Shift (06:00 - 14:00)">Morning Shift (06:00 - 14:00)</option>
                <option value="Evening Shift (14:00 - 22:00)">Evening Shift (14:00 - 22:00)</option>
                <option value="Night Shift (22:00 - 06:00)">Night Shift (22:00 - 06:00)</option>
                <option value="General Shift (09:00 - 18:00)">General Shift (09:00 - 18:00)</option>
              </select>
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                  Check-In Time:
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editModal.checkInTime}
                  onChange={(e) => setEditModal(prev => ({ ...prev, checkInTime: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                  Check-Out Time:
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editModal.checkOutTime}
                  onChange={(e) => setEditModal(prev => ({ ...prev, checkOutTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Reason for Correction:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Worker forgot to log check-in time"
                value={editModal.reason}
                onChange={(e) => setEditModal(prev => ({ ...prev, reason: e.target.value }))}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setEditModal({ isOpen: false, record: null, status: 'Present', shift: '', checkInTime: '', checkOutTime: '', notes: '', reason: '' })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <CheckCircle2 size={16} /> Save Correction
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* STAFF PROFILE ADD/EDIT MODAL */}
      {staffModal.isOpen && (
        <Modal
          isOpen={staffModal.isOpen}
          onClose={() => setStaffModal({ isOpen: false, isEditing: false, id: null, name: '', phone: '', role: 'Pump Operator' })}
          title={staffModal.isEditing ? 'Edit Staff Profile' : 'Add New Staff Member'}
        >
          <form onSubmit={handleSaveStaff} style={{ padding: '4px 0' }}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Full Name:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Gowda"
                value={staffModal.name}
                onChange={(e) => setStaffModal(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Mobile Number:
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="+91 98765 43210"
                value={staffModal.phone}
                onChange={(e) => setStaffModal(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: '600', marginBottom: '4px' }}>
                Role / Designation:
              </label>
              <select
                className="form-control"
                value={staffModal.role}
                onChange={(e) => setStaffModal(prev => ({ ...prev, role: e.target.value }))}
              >
                <option value="Pump Operator">Pump Operator</option>
                <option value="Senior Operator">Senior Operator</option>
                <option value="Cashier">Cashier</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Forecourt Manager">Forecourt Manager</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setStaffModal({ isOpen: false, isEditing: false, id: null, name: '', phone: '', role: 'Pump Operator' })}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#059669', borderColor: '#059669' }}
              >
                <CheckCircle2 size={16} /> Save Profile
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
