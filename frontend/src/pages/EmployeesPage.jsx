import { useState, useCallback, useEffect } from 'react';
import { Sparkles, Pencil, Trash2, User } from 'lucide-react';
import employeeService from '../services/employeeService';
import departmentService from '../services/departmentService';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast';
import { useModal } from '../hooks/useModal';
import Toast from '../components/common/Toast';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Select from '../components/common/Select';
import TextArea from '../components/common/TextArea';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import StatCard from '../components/common/StatCard';
import SearchBar from '../components/common/SearchBar';
import PageHeader from '../components/common/PageHeader';
import ConfirmDialog from '../components/common/ConfirmDialog';

/**
 * Employee Form Component
 * Uses ACTUAL database fields:
 * - Required: name, course, roll_no
 * - Optional: email, phone, department_id, position, hire_date, salary, status, address
 */
const EmployeeForm = ({ 
  initial = { 
    name: '', 
    course: '', 
    roll_no: '',
    email: '',
    phone: '',
    department_id: '',
    position: '',
    hire_date: '',
    salary: '',
    status: 'active',
    address: ''
  }, 
  onSubmit, 
  loading,
  departments = []
}) => {
  const [form, setForm] = useState(initial);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Clean up empty optional fields
    const submitData = { ...form };
    if (!submitData.email) delete submitData.email;
    if (!submitData.phone) delete submitData.phone;
    if (!submitData.department_id) delete submitData.department_id;
    if (!submitData.position) delete submitData.position;
    if (!submitData.hire_date) delete submitData.hire_date;
    if (!submitData.salary) delete submitData.salary;
    if (!submitData.address) delete submitData.address;
    
    onSubmit(submitData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
      {/* Required Fields */}
      <div className="space-y-4 pb-4 border-b border-white/8">
        <p className="text-xs uppercase tracking-wider text-white/40">Required Information</p>
        
        <Input
          label="Full Name"
          value={form.name}
          onChange={handleChange('name')}
          placeholder="e.g. John Doe"
          required
        />
        
        <Input
          label="Course/Job Category"
          value={form.course}
          onChange={handleChange('course')}
          placeholder="e.g. Engineering, Sales"
          required
        />
        
        <Input
          label="Employee ID / Roll Number"
          value={form.roll_no}
          onChange={handleChange('roll_no')}
          placeholder="e.g. EMP2024001"
          required
        />
      </div>

      {/* Optional Fields */}
      <div className="space-y-4 pt-2">
        <p className="text-xs uppercase tracking-wider text-white/40">Optional Information</p>
        
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={handleChange('email')}
          placeholder="e.g. john.doe@company.com"
        />
        
        <Input
          label="Phone"
          value={form.phone}
          onChange={handleChange('phone')}
          placeholder="e.g. +1234567890"
        />
        
        <Select
          label="Department"
          value={form.department_id}
          onChange={handleChange('department_id')}
        >
          <option value="">No Department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
            </option>
          ))}
        </Select>
        
        <Input
          label="Position/Title"
          value={form.position}
          onChange={handleChange('position')}
          placeholder="e.g. Senior Developer"
        />
        
        <Input
          label="Hire Date"
          type="date"
          value={form.hire_date}
          onChange={handleChange('hire_date')}
        />
        
        <Input
          label="Salary"
          type="number"
          value={form.salary}
          onChange={handleChange('salary')}
          placeholder="e.g. 75000"
          min="0"
          step="0.01"
        />
        
        <Select
          label="Status"
          value={form.status}
          onChange={handleChange('status')}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
        </Select>
        
        <TextArea
          label="Address"
          value={form.address}
          onChange={handleChange('address')}
          placeholder="Full address"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full mt-4">
        {loading ? 'Saving…' : initial.id ? 'Save Changes' : 'Add Employee'}
      </Button>
    </form>
  );
};

/**
 * Enhanced Employees Page
 * Features:
 * - Role-based filtering (handled by backend)
 * - Search by name, email, roll_no, course
 * - Filter by status and department
 * - Pagination
 * - Full CRUD with actual database fields
 */
export default function EmployeesPage() {
  const permissions = usePermissions();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const { modal, openModal, closeModal } = useModal();
  
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Filters and pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [pagination, setPagination] = useState(null);

  // Fetch employees
  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await employeeService.getEmployees({
        page,
        limit,
        search,
        status: statusFilter,
        department_id: departmentFilter
      });
      
      setEmployees(response.data || []);
      setPagination(response.pagination);
    } catch (error) {
      showError(error.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, departmentFilter, showError]);

  // Fetch departments for dropdown
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentService.getDepartments();
        setDepartments(response.data || []);
      } catch (error) {
        console.error('Failed to fetch departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch employees on mount and when filters change
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleCreate = async (form) => {
    setSaving(true);
    try {
      await employeeService.createEmployee(form);
      showSuccess('Employee added successfully');
      closeModal();
      fetchEmployees(); // Refresh list
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
      await employeeService.updateEmployee(id, form);
      showSuccess('Employee updated successfully');
      closeModal();
      fetchEmployees(); // Refresh list
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
      await employeeService.deleteEmployee(id);
      showSuccess('Employee deleted successfully');
      closeModal();
      fetchEmployees(); // Refresh list
    } catch (e) {
      showError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleDepartmentFilterChange = (e) => {
    setDepartmentFilter(e.target.value);
    setPage(1);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/15 text-emerald-300';
      case 'inactive':
        return 'bg-red-500/15 text-red-300';
      case 'on_leave':
        return 'bg-yellow-500/15 text-yellow-300';
      default:
        return 'bg-gray-500/15 text-gray-300';
    }
  };

  // Get department name
  const getDepartmentName = (deptId) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : '—';
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
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

      {/* Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard 
          label="Total Employees" 
          value={pagination?.total || 0} 
        />
        <StatCard 
          label="Active" 
          value={employees.filter(e => e.status === 'active').length} 
          accent="border-emerald-500/20" 
        />
        <StatCard 
          label="On Leave" 
          value={employees.filter(e => e.status === 'on_leave').length} 
          accent="border-yellow-500/20" 
        />
        <StatCard 
          label="Current Page" 
          value={employees.length} 
          accent="border-sky-500/20" 
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email, ID..."
          />
        </div>
        
        <Select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="sm:w-40"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
        </Select>
        
        <Select
          value={departmentFilter}
          onChange={handleDepartmentFilterChange}
          className="sm:w-48"
        >
          <option value="">All Departments</option>
          {departments.map(dept => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/8 overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/8">
              {['#', 'Name', 'Email', 'Position', 'Department', 'Status', 'Actions'].map((h) => (
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
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <EmptyState message={search || statusFilter || departmentFilter ? 'No results match your filters.' : 'No employees yet. Add one!'} />
                </td>
              </tr>
            ) : (
              employees.map((emp, i) => (
                <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors group">
                  <td className="px-5 py-4 text-white/30 font-mono text-xs">
                    {String((page - 1) * limit + i + 1).padStart(2, '0')}
                  </td>
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-medium text-white">{emp.name}</p>
                      <p className="text-xs text-white/40 font-mono">{emp.roll_no}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-white/60 text-xs">
                    {emp.email || '—'}
                  </td>
                  <td className="px-5 py-4">
                    <span className="px-2.5 py-1 bg-indigo-500/15 text-indigo-300 rounded-md text-xs font-medium">
                      {emp.position || emp.course}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/60 text-xs">
                    {getDepartmentName(emp.department_id)}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(emp.status)}`}>
                      {emp.status?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
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
                        <span className="px-3 py-1.5 text-xs text-white/30">
                          <User size={14} className="inline mr-1" /> View Only
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-white/40">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.total)} of {pagination.total} employees
          </p>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {[...Array(pagination.totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first, last, current, and adjacent pages
                if (
                  pageNum === 1 ||
                  pageNum === pagination.totalPages ||
                  (pageNum >= page - 1 && pageNum <= page + 1)
                ) {
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "primary" : "ghost"}
                      size="sm"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                } else if (pageNum === page - 2 || pageNum === page + 2) {
                  return <span key={pageNum} className="px-2 py-1 text-white/30">...</span>;
                }
                return null;
              })}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === 'add' && (
        <Modal title="Add New Employee" onClose={closeModal}>
          <EmployeeForm 
            onSubmit={handleCreate} 
            loading={saving} 
            departments={departments}
          />
        </Modal>
      )}

      {modal?.type === 'edit' && (
        <Modal title="Edit Employee" onClose={closeModal}>
          <EmployeeForm 
            initial={modal.emp} 
            onSubmit={handleUpdate} 
            loading={saving}
            departments={departments}
          />
        </Modal>
      )}

      {modal?.type === 'delete' && (
        <ConfirmDialog
          title="Confirm Deletion"
          message={
            <>
              Are you sure you want to delete{' '}
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
