import { useState, useCallback } from 'react';
import attendanceService from '../services/attendanceService';
import { api, endpoints } from '../services/api';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast';
import { useModal } from '../hooks/useModal';
import { useFetch } from '../hooks/useFetch';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import TextArea from '../components/common/TextArea';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/common/StatCard';
import PageHeader from '../components/common/PageHeader';

// Attendance Form Component
const AttendanceForm = ({ type, onSubmit, loading, employees }) => {
  const [form, setForm] = useState({ employee_id: '', notes: '' });

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const employeeOptions = employees.map((emp) => ({
    value: emp.id,
    label: `${emp.name} (${emp.roll_no})`,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Employee"
        value={form.employee_id}
        onChange={handleChange('employee_id')}
        options={employeeOptions}
        placeholder="Select employee..."
        required
      />
      <TextArea
        label="Notes (Optional)"
        value={form.notes}
        onChange={handleChange('notes')}
        placeholder="Add notes..."
      />
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? 'Processing…' : type === 'in' ? 'Check In' : 'Check Out'}
      </Button>
    </form>
  );
};

const AttendancePage = () => {
  const permissions = usePermissions();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { modal, openModal, closeModal } = useModal();
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    status: '',
  });

  const fetchEmployees = useCallback(async () => {
    const data = await api.get(endpoints.employees.list);
    return Array.isArray(data) ? data : data.data || [];
  }, []);

  const fetchAttendance = useCallback(async () => {
    const response = await attendanceService.getAttendance(filters);
    return response.data || [];
  }, [filters]);

  const { data: employees } = useFetch(fetchEmployees, []);
  const { data: attendance, setData: setAttendance, loading, refetch } = useFetch(fetchAttendance, [filters]);

  const handleCheckIn = async (form) => {
    setSaving(true);
    try {
      const response = await attendanceService.checkIn({
        employee_id: parseInt(form.employee_id),
        notes: form.notes,
      });
      showSuccess(response.message || 'Check-in successful');
      closeModal();
      refetch();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckOut = async (form) => {
    setSaving(true);
    try {
      const response = await attendanceService.checkOut({
        employee_id: parseInt(form.employee_id),
        notes: form.notes,
      });
      showSuccess(response.message || 'Check-out successful');
      closeModal();
      refetch();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (time) => (time ? time.substring(0, 5) : '—');
  const formatDate = (date) => (date ? new Date(date).toLocaleDateString() : '—');

  const stats = {
    total: attendance.length,
    present: attendance.filter((a) => a.status === 'present').length,
    late: attendance.filter((a) => a.status === 'late').length,
    checkedOut: attendance.filter((a) => a.check_out).length,
  };

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'half_day', label: 'Half Day' },
    { value: 'leave', label: 'Leave' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeader
        title="Attendance Tracking"
        subtitle="Management System"
        action={
          permissions.canCheckIn && (
            <div className="flex gap-2">
              <Button variant="success" onClick={() => openModal('checkin')}>
                <span className="text-lg leading-none">→</span> Check In
              </Button>
              <Button variant="warning" onClick={() => openModal('checkout')}>
                <span className="text-lg leading-none">←</span> Check Out
              </Button>
            </div>
          )
        }
      />

      {permissions.isEmployee && (
        <p className="text-xs text-white/40 mb-6">Viewing your own attendance records</p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Records" value={stats.total} />
        <StatCard label="Present" value={stats.present} accent="border-emerald-500/20" />
        <StatCard label="Late" value={stats.late} accent="border-orange-500/20" />
        <StatCard label="Checked Out" value={stats.checkedOut} accent="border-sky-500/20" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Input
          label="Date"
          type="date"
          value={filters.date}
          onChange={(e) => setFilters((p) => ({ ...p, date: e.target.value }))}
        />
        <Select
          label="Status"
          value={filters.status}
          onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          options={statusOptions}
        />
      </div>

      <div className="rounded-2xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/8">
              {['#', 'Employee', 'Date', 'Check In', 'Check Out', 'Status', 'Notes'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/40 tracking-widest uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7}>
                  <LoadingSpinner />
                </td>
              </tr>
            ) : attendance.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState message="No attendance records for selected filters." />
                </td>
              </tr>
            ) : (
              attendance.map((record, i) => (
                <tr key={record.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                  <td className="px-5 py-4 text-white/30 font-mono text-xs">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-white">{record.employee_name}</p>
                      <p className="text-xs text-white/40">{record.employee_roll_no}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-white/60 text-xs">{formatDate(record.date)}</td>
                  <td className="px-5 py-4 font-mono text-white/80 text-xs">{formatTime(record.check_in)}</td>
                  <td className="px-5 py-4 font-mono text-white/80 text-xs">{formatTime(record.check_out)}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      record.status === 'present' ? 'bg-emerald-500/15 text-emerald-300' :
                      record.status === 'late' ? 'bg-orange-500/15 text-orange-300' :
                      record.status === 'absent' ? 'bg-red-500/15 text-red-300' :
                      record.status === 'half_day' ? 'bg-yellow-500/15 text-yellow-300' :
                      'bg-blue-500/15 text-blue-300'
                    }`}>
                      {record.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/40 text-xs max-w-xs truncate">
                    {record.notes || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-center text-xs text-white/20 mt-6">
        {attendance.length} attendance records shown
      </p>

      {modal === 'checkin' && (
        <Modal title="Check In Employee" onClose={closeModal}>
          <AttendanceForm type="in" onSubmit={handleCheckIn} loading={saving} employees={employees} />
        </Modal>
      )}

      {modal === 'checkout' && (
        <Modal title="Check Out Employee" onClose={closeModal}>
          <AttendanceForm type="out" onSubmit={handleCheckOut} loading={saving} employees={employees} />
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
};

export default AttendancePage;
