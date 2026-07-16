import { useState, useCallback } from 'react';
import departmentService from '../services/departmentService';
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
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/common/StatCard';
import SearchBar from '../components/common/SearchBar';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';

// Department Form Component
const DepartmentForm = ({ initial = { name: '', description: '', is_active: true }, onSubmit, loading }) => {
  const [form, setForm] = useState(initial);

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
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

const DepartmentsPage = () => {
  const permissions = usePermissions();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { modal, openModal, closeModal } = useModal();
  const [saving, setSaving] = useState(false);

  const fetchDepartments = useCallback(async () => {
    const response = await departmentService.getDepartments();
    return response.data || [];
  }, []);

  const { data: departments, setData: setDepartments, loading, refetch } = useFetch(fetchDepartments);
  const { search, setSearch, filtered } = useSearch(departments, ['name', 'description']);

  const activeDepts = departments.filter((d) => d.is_active).length;

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
              {['#', 'Name', 'Description', 'Status', 'Actions'].map((h) => (
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
                  <EmptyState message={search ? 'No results match your search.' : 'No departments yet. Add one!'} />
                </td>
              </tr>
            ) : (
              filtered.map((dept, i) => (
                <tr key={dept.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <td className="px-5 py-4 text-white/30 font-mono text-xs">{String(i + 1).padStart(2, '0')}</td>
                  <td className="px-5 py-4 font-medium text-white">{dept.name}</td>
                  <td className="px-5 py-4 text-white/60 text-xs">{dept.description || '—'}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      dept.is_active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                    }`}>
                      {dept.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                      {permissions.canEditDepartment && (
                        <Button variant="ghost" size="sm" onClick={() => openModal({ type: 'edit', dept })}>
                          Edit
                        </Button>
                      )}
                      {permissions.canDeleteDepartment && (
                        <Button variant="ghostDanger" size="sm" onClick={() => openModal({ type: 'delete', dept })}>
                          Delete
                        </Button>
                      )}
                      {!permissions.canEditDepartment && !permissions.canDeleteDepartment && (
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
        {filtered.length} of {departments.length} departments shown
      </p>

      {modal === 'add' && (
        <Modal title="Add New Department" onClose={closeModal}>
          <DepartmentForm onSubmit={handleCreate} loading={saving} />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit Department" onClose={closeModal}>
          <DepartmentForm initial={modal.dept} onSubmit={handleUpdate} loading={saving} />
        </Modal>
      )}

      {modal?.type === 'delete' && (
        <ConfirmDialog
          title="Confirm Deletion"
          message={
            <>
              Are you sure you want to delete{' '}
              <span className="text-white font-semibold">{modal.dept.name}</span>? This action cannot be undone.
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
