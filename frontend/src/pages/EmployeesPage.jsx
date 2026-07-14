import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Pencil, Trash2 } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast';
import { useModal } from '../hooks/useModal';
import { useSearch } from '../hooks/useSearch';
import { useFetch } from '../hooks/useFetch';
import { api, endpoints } from '../services/api';
import aiService from '../services/aiService';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/common/StatCard';
import SearchBar from '../components/common/SearchBar';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';

// AI Performance Analysis panel (shown inside a Modal)
const PerformanceAnalysis = ({ employeeId }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    aiService
      .analyzePerformance(employeeId)
      .then((res) => {
        if (!cancelled) setResult(res.data);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to analyze performance');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  if (loading) return <LoadingSpinner message="Analyzing performance..." />;
  if (error) return <p className="text-sm text-red-300">{error}</p>;
  if (!result) return null;

  const scoreColor =
    result.performanceScore >= 80
      ? 'text-emerald-300'
      : result.performanceScore >= 60
      ? 'text-orange-300'
      : 'text-red-300';

  return (
    <div className="space-y-5">
      <div className="text-center">
        <p className="text-xs uppercase tracking-widest text-white/40 mb-1">Performance Score</p>
        <p className={`text-5xl font-bold ${scoreColor}`}>{result.performanceScore}%</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/8">
          <p className="text-xs text-white/40 mb-1">Attendance</p>
          <p className="text-lg font-semibold text-white">{result.breakdown.attendanceScore}%</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/8">
          <p className="text-xs text-white/40 mb-1">Activity</p>
          <p className="text-lg font-semibold text-white">{result.breakdown.activityScore}%</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-white/[0.03] border border-white/8">
          <p className="text-xs text-white/40 mb-1">Task</p>
          <p className="text-lg font-semibold text-white">{result.breakdown.taskScore}%</p>
        </div>
      </div>

      {result.recommendation && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
          <p className="text-xs uppercase tracking-widest text-white/40 mb-1">AI Recommendation</p>
          <p className="text-sm text-white/85">{result.recommendation}</p>
        </div>
      )}
    </div>
  );
};

// Employee Form Component
const EmployeeForm = ({ initial = { name: '', course: '', roll_no: '' }, onSubmit, loading }) => {
  const [form, setForm] = useState(initial);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Full Name"
        value={form.name}
        onChange={handleChange('name')}
        placeholder="e.g. Riya Sharma"
        required
      />
      <Input
        label="Course"
        value={form.course}
        onChange={handleChange('course')}
        placeholder="e.g. B.Tech CSE"
        required
      />
      <Input
        label="Roll No."
        value={form.roll_no}
        onChange={handleChange('roll_no')}
        placeholder="e.g. CS2024001"
        required
      />
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? 'Saving…' : initial.id ? 'Save Changes' : 'Add Employee'}
      </Button>
    </form>
  );
};

export default function EmployeesPage() {
  const permissions = usePermissions();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { modal, openModal, closeModal } = useModal();
  const [saving, setSaving] = useState(false);

  const fetchEmployees = useCallback(async () => {
    const data = await api.get(endpoints.employees.list);
    return Array.isArray(data) ? data : data.data || [];
  }, []);

  const { data: employees, setData: setEmployees, loading } = useFetch(fetchEmployees);
  const { search, setSearch, filtered } = useSearch(employees, ['name', 'course', 'roll_no']);

  const courses = [...new Set(employees.map((e) => e.course))].length;

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const created = await api.post(endpoints.employees.create, form);
      setEmployees((prev) => [...prev, created]);
      showSuccess('Employee added successfully');
      closeModal();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    const { id } = modal.emp;
    setSaving(true);
    try {
      const updated = await api.put(endpoints.employees.update(id), form);
      setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
      showSuccess('Employee updated');
      closeModal();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const { id } = modal.emp;
    setSaving(true);
    try {
      await api.delete(endpoints.employees.delete(id));
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      showSuccess('Employee removed');
      closeModal();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen text-white font-sans">
      <div className="relative max-w-6xl mx-auto px-6 py-10">
        <PageHeader
          title="Employee Directory"
          subtitle="Management System"
          action={
            permissions.canCreateEmployee && (
              <Button onClick={() => openModal('add')}>
                <span className="text-lg leading-none">+</span> Add Employee
              </Button>
            )
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Employees" value={employees.length} />
          <StatCard label="Courses" value={courses} accent="border-violet-500/20" />
          <StatCard label="Search Results" value={filtered.length} accent="border-sky-500/20" />
        </div>

        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, course, or roll no…"
        />

        <div className="rounded-2xl border border-white/8 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-white/[0.04] border-b border-white/8">
                {['#', 'Name', 'Course', 'Roll No.', 'Actions'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/40 tracking-widest uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <LoadingSpinner />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState message={search ? 'No results match your search.' : 'No employees yet. Add one!'} />
                  </td>
                </tr>
              ) : (
                filtered.map((emp, i) => (
                  <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                    <td className="px-5 py-4 text-white/30 font-mono text-xs">{String(i + 1).padStart(2, '0')}</td>
                    <td className="px-5 py-4 font-medium text-white">{emp.name}</td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 rounded-md text-xs font-medium">
                        {emp.course}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-white/60 text-xs">{emp.roll_no}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {permissions.canAnalyzePerformance && (
                          <Button variant="ghost" size="sm" onClick={() => openModal({ type: 'performance', emp })}>
                            <Sparkles size={14} /> AI Score
                          </Button>
                        )}
                        {permissions.canEditEmployee && (
                          <Button variant="ghost" size="sm" onClick={() => openModal({ type: 'edit', emp })}>
                            <Pencil size={14} /> Edit
                          </Button>
                        )}
                        {permissions.canDeleteEmployee && (
                          <Button variant="ghostDanger" size="sm" onClick={() => openModal({ type: 'delete', emp })}>
                            <Trash2 size={14} /> Delete
                          </Button>
                        )}
                        {!permissions.canEditEmployee && !permissions.canDeleteEmployee && (
                          <span className="px-3 py-1.5 text-xs text-white/30">View Only</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          {filtered.length} of {employees.length} employees shown
        </p>
      </div>

      {modal === 'add' && (
        <Modal title="Add New Employee" onClose={closeModal}>
          <EmployeeForm onSubmit={handleCreate} loading={saving} />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit Employee" onClose={closeModal}>
          <EmployeeForm initial={modal.emp} onSubmit={handleUpdate} loading={saving} />
        </Modal>
      )}

      {modal?.type === 'performance' && (
        <Modal title={`AI Performance — ${modal.emp.name}`} onClose={closeModal}>
          <PerformanceAnalysis employeeId={modal.emp.id} />
        </Modal>
      )}

      {modal?.type === 'delete' && (
        <ConfirmDialog
          title="Confirm Deletion"
          message={
            <>
              Are you sure you want to remove{' '}
              <span className="text-white font-semibold">{modal.emp.name}</span>? This action cannot be undone.
            </>
          }
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={closeModal}
          loading={saving}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
