import { useState, useCallback, useEffect } from 'react';
import departmentService from '../services/departmentService';
import userService from '../services/userService';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast';
import { useModal } from '../hooks/useModal';
import { useSearch } from '../hooks/useSearch';
import { useFetch } from '../hooks/useFetch';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TextArea from '../components/common/TextArea';
import Checkbox from '../components/common/Checkbox';
import Select from '../components/common/Select';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/common/StatCard';
import SearchBar from '../components/common/SearchBar';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Department Form Component
const DepartmentForm = ({ initial = { name: '', description: '', is_active: true, manager_id: '' }, onSubmit, loading, managers = [] }) => {
  const [form, setForm] = useState(initial);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert empty string to null for manager_id
    const submitData = {
      ...form,
      manager_id: form.manager_id === '' ? null : form.manager_id
    };
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Department Name"
        value={form.name}
        onChange={handleChange('name')}
        placeholder="e.g. Engineering"
        required
      />
      <TextArea
        label="Description"
        value={form.description}
        onChange={handleChange('description')}
        placeholder="Department description (optional)"
      />
      <Select
        label="Department Manager (Optional)"
        value={form.manager_id}
        onChange={handleChange('manager_id')}
      >
        <option value="">No Manager Assigned</option>
        {managers.map((manager) => (
          <option key={manager.id} value={manager.id}>
            {manager.username} ({manager.email})
          </option>
        ))}
      </Select>
      <Checkbox
        id="is_active"
        label="Active Department"
        checked={form.is_active}
        onChange={handleChange('is_active')}
      />
      <Button type="submit" disabled={loading} className="w-full mt-2">
        {loading ? 'Saving…' : initial.id ? 'Save Changes' : 'Add Department'}
      </Button>
    </form>
  );
};

// Manager Assignment Modal
const ManagerAssignmentModal = ({ department, managers, onAssign, onClose, loading }) => {
  const [managerId, setManagerId] = useState(department.manager_id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onAssign(managerId === '' ? null : managerId);
  };

  const currentManager = managers.find(m => m.id === department.manager_id);

  return (
    <Modal title="Assign Department Manager" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {currentManager && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
            <p className="text-white/60 mb-1">Current Manager:</p>
            <p className="text-white font-medium">{currentManager.username} ({currentManager.email})</p>
          </div>
        )}
        
        <Select
          label="Select Manager"
          value={managerId}
          onChange={(e) => setManagerId(e.target.value)}
        >
          <option value="">No Manager (Remove Current)</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.id}>
              {manager.username} ({manager.email})
            </option>
          ))}
        </Select>

        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Assigning…' : 'Assign Manager'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Department Details Modal
const DepartmentDetailsModal = ({ department, onClose, permissions }) => {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingStats, setLoadingStats] = useState(permissions.canViewDepartmentStats);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch employees
        const empResponse = await departmentService.getDepartmentEmployees(department.id);
        setEmployees(empResponse.data.employees || []);
        setLoadingEmployees(false);

        // Fetch stats if user has permission
        if (permissions.canViewDepartmentStats) {
          const statsResponse = await departmentService.getDepartmentStats(department.id);
          setStats(statsResponse.data);
          setLoadingStats(false);
        }
      } catch (error) {
        console.error('Error fetching department data:', error);
        setLoadingEmployees(false);
        setLoadingStats(false);
      }
    };

    fetchData();
  }, [department.id, permissions.canViewDepartmentStats]);

  return (
    <Modal title={department.name} onClose={onClose} size="large">
      <div className="space-y-6">
        {/* Department Info */}
        <div>
          <h3 className="text-sm font-semibold text-white/60 mb-2">Description</h3>
          <p className="text-white">{department.description || 'No description provided'}</p>
        </div>

        <div className="flex gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-2">Status</h3>
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
              department.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
            }`}>
              {department.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {department.manager_id && (
            <div>
              <h3 className="text-sm font-semibold text-white/60 mb-2">Manager ID</h3>
              <p className="text-white">{department.manager_id}</p>
            </div>
          )}
        </div>

        {/* Statistics (CEO/HR only) */}
        {permissions.canViewDepartmentStats && (
          <div>
            <h3 className="text-sm font-semibold text-white/60 mb-3">Statistics</h3>
            {loadingStats ? (
              <LoadingSpinner size="sm" />
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard label="Total Employees" value={stats.total_employees || 0} size="sm" />
                <StatCard label="Active" value={stats.active_employees || 0} accent="border-emerald-500/20" size="sm" />
                <StatCard label="Inactive" value={stats.inactive_employees || 0} accent="border-red-500/20" size="sm" />
                <StatCard label="On Leave" value={stats.on_leave_employees || 0} accent="border-yellow-500/20" size="sm" />
              </div>
            ) : (
              <p className="text-white/40 text-sm">Statistics not available</p>
            )}
          </div>
        )}

        {/* Employees List */}
        <div>
          <h3 className="text-sm font-semibold text-white/60 mb-3">Employees ({employees.length})</h3>
          {loadingEmployees ? (
            <LoadingSpinner size="sm" />
          ) : employees.length === 0 ? (
            <EmptyState message="No employees in this department" />
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-white/8">
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] border-b border-white/8 sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-white/40 uppercase">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-white/40 uppercase">Position</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-white/40 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-2 text-white">{emp.name}</td>
                      <td className="px-4 py-2 text-white/60">{emp.position || '—'}</td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          emp.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                        }`}>
                          {emp.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </Modal>
  );
};

const DepartmentsPage = () => {
  const permissions = usePermissions();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { modal, openModal, closeModal } = useModal();
  const [saving, setSaving] = useState(false);
  const [managers, setManagers] = useState([]);

  const fetchDepartments = useCallback(async () => {
    const response = await departmentService.getDepartments();
    return response.data || [];
  }, []);

  const { data: departments, setData: setDepartments, loading } = useFetch(fetchDepartments);
  const { search, setSearch, filtered } = useSearch(departments, ['name', 'description']);

  const activeDepts = departments.filter((d) => d.is_active).length;

  // Fetch managers for dropdown (CEO only)
  useEffect(() => {
    const fetchManagers = async () => {
      if (permissions.canAssignManager || permissions.canCreateDepartment) {
        try {
          const response = await userService.list();
          const managerUsers = (response.data || []).filter(user => user.role === 'manager');
          setManagers(managerUsers);
        } catch (error) {
          console.error('Error fetching managers:', error);
        }
      }
    };
    fetchManagers();
  }, [permissions.canAssignManager, permissions.canCreateDepartment]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      const response = await departmentService.createDepartment(form);
      setDepartments((prev) => [...prev, response.data]);
      showSuccess('Department created successfully');
      closeModal();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (form) => {
    const { id } = modal.dept;
    setSaving(true);
    try {
      const response = await departmentService.updateDepartment(id, form);
      setDepartments((prev) => prev.map((d) => (d.id === id ? response.data : d)));
      showSuccess('Department updated');
      closeModal();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAssignManager = async (managerId) => {
    const { id } = modal.dept;
    setSaving(true);
    try {
      const response = await departmentService.assignManager(id, managerId);
      setDepartments((prev) => prev.map((d) => (d.id === id ? response.data : d)));
      showSuccess(managerId ? 'Manager assigned successfully' : 'Manager removed');
      closeModal();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    const newStatus = !dept.is_active;
    setSaving(true);
    try {
      const response = await departmentService.toggleStatus(dept.id, newStatus);
      setDepartments((prev) => prev.map((d) => (d.id === dept.id ? response.data : d)));
      showSuccess(`Department ${newStatus ? 'activated' : 'deactivated'}`);
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const { id } = modal.dept;
    setSaving(true);
    try {
      await departmentService.deleteDepartment(id);
      setDepartments((prev) => prev.filter((d) => d.id !== id));
      showSuccess('Department deleted');
      closeModal();
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <PageHeader
        title="Department Management"
        subtitle="Management System"
        action={
          permissions.canCreateDepartment && (
            <Button onClick={() => openModal('add')}>
              <span className="text-lg leading-none">+</span> Add Department
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Departments" value={departments.length} />
        <StatCard label="Active" value={activeDepts} accent="border-emerald-500/20" />
        <StatCard label="Search Results" value={filtered.length} accent="border-sky-500/20" />
      </div>

      <SearchBar
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search departments..."
      />

      <div className="rounded-2xl border border-white/8 overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/8">
              {['#', 'Name', 'Description', 'Status', 'Manager', 'Actions'].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold text-white/40 tracking-widest uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>
                  <LoadingSpinner />
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState message={search ? 'No results match your search.' : 'No departments yet. Add one!'} />
                </td>
              </tr>
            ) : (
              filtered.map((dept, i) => (
                <tr key={dept.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <td className="px-5 py-4 text-white/30 font-mono text-xs">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-5 py-4 font-medium text-white">
                    <button 
                      onClick={() => openModal({ type: 'details', dept })}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {dept.name}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-white/60 text-xs max-w-xs truncate">{dept.description || '—'}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => permissions.canToggleStatus && handleToggleStatus(dept)}
                      disabled={!permissions.canToggleStatus || saving}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-opacity ${
                        dept.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                      } ${permissions.canToggleStatus ? 'hover:opacity-75 cursor-pointer' : 'cursor-default'}`}
                    >
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-white/60 text-xs">
                    {dept.manager_id ? (
                      <span className="px-2 py-1 bg-blue-500/10 rounded text-blue-300">ID: {dept.manager_id}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {permissions.canEditDepartment && (
                        <Button variant="ghost" size="sm" onClick={() => openModal({ type: 'edit', dept })}>
                          Edit
                        </Button>
                      )}
                      {permissions.canAssignManager && (
                        <Button variant="ghost" size="sm" onClick={() => openModal({ type: 'assignManager', dept })}>
                          Manager
                        </Button>
                      )}
                      {permissions.canDeleteDepartment && (
                        <Button variant="ghostDanger" size="sm" onClick={() => openModal({ type: 'delete', dept })}>
                          Delete
                        </Button>
                      )}
                      {!permissions.canEditDepartment && !permissions.canDeleteDepartment && !permissions.canAssignManager && (
                        <Button variant="ghost" size="sm" onClick={() => openModal({ type: 'details', dept })}>
                          View
                        </Button>
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
        {filtered.length} of {departments.length} departments shown
      </p>

      {modal === 'add' && (
        <Modal title="Add New Department" onClose={closeModal}>
          <DepartmentForm onSubmit={handleCreate} loading={saving} managers={managers} />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit Department" onClose={closeModal}>
          <DepartmentForm initial={modal.dept} onSubmit={handleUpdate} loading={saving} managers={managers} />
        </Modal>
      )}

      {modal?.type === 'assignManager' && (
        <ManagerAssignmentModal
          department={modal.dept}
          managers={managers}
          onAssign={handleAssignManager}
          onClose={closeModal}
          loading={saving}
        />
      )}

      {modal?.type === 'details' && (
        <DepartmentDetailsModal
          department={modal.dept}
          onClose={closeModal}
          permissions={permissions}
        />
      )}

      {modal?.type === 'delete' && (
        <ConfirmDialog
          title="Confirm Deletion"
          message={
            <>
              Are you sure you want to delete{' '}
              <span className="text-white font-semibold">{modal.dept.name}</span>? This action cannot be undone.
              {modal.dept.employee_count > 0 && (
                <span className="block mt-2 text-yellow-400">
                  Warning: This department has {modal.dept.employee_count} employees assigned.
                </span>
              )}
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
};

export default DepartmentsPage;
