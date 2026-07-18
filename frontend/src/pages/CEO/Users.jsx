import { useCallback, useMemo, useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import userService from '../../services/userService';
import { api, endpoints } from '../../services/api';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';

const roleBadge = {
  ceo: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  hr: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  manager: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  employee: 'bg-white/10 text-white/60 border-white/10',
};

// Roles that represent people who work at the company (as opposed to a
// pure system-admin login) and should have an Employee Directory profile.
const NEEDS_EMPLOYEE_PROFILE = ['employee', 'manager', 'hr'];

const CEOUsers = () => {
  const fetchUsers = useCallback(async () => await userService.list(), []);
  const { data: usersData, loading: usersLoading, refetch: refetchUsers } = useFetch(fetchUsers);
  const users = usersData?.users || [];

  const fetchEmployees = useCallback(async () => {
    const res = await api.get(endpoints.employees.list);
    return res?.data || [];
  }, []);
  const { data: employees, loading: employeesLoading, refetch: refetchEmployees } = useFetch(fetchEmployees);

  // Employees that don't already have a login account linked to them
  const unlinkedEmployees = useMemo(() => {
    const linkedIds = new Set(users.map((u) => u.employee_id).filter(Boolean));
    return employees.filter((e) => !linkedIds.has(e.id));
  }, [employees, users]);

  const [mode, setMode] = useState('new'); // 'new' | 'existing'
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
    employee_id: '',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const needsProfile = NEEDS_EMPLOYEE_PROFILE.includes(form.role);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    const emp = employees.find((x) => String(x.id) === String(empId));
    setForm((f) => ({
      ...f,
      employee_id: empId,
      username: emp ? emp.name.toLowerCase().replace(/\s+/g, '.') : f.username,
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      // Prepare user creation payload
      const payload = {
        username: form.username,
        email: form.email,
        password: form.password,
        role: form.role,
        mode: mode, // 'new' or 'existing'
      };

      // If existing mode, include the selected employee_id
      if (mode === 'existing') {
        if (!form.employee_id) {
          throw new Error('Please select an employee to link this login to');
        }
        payload.employee_id = parseInt(form.employee_id);
      }

      // Backend handles employee profile creation in transaction
      await userService.create(payload);
      
      setSuccess(`${form.username} created as ${form.role}`);
      setForm({ username: '', email: '', password: '', role: 'employee', employee_id: '' });
      await Promise.all([refetchUsers(), refetchEmployees()]);
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  const employeeOptions = unlinkedEmployees.map((e) => ({
    value: e.id,
    label: `${e.name} — ${e.course} (${e.roll_no})`,
  }));

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeader title="Manage Users" subtitle="Grant login access to CEO, HR, Manager, and Employee accounts" />

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 mt-6">
        {/* Create form */}
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4 h-fit"
        >
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-1">
            Grant Login Access
          </h3>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-300 text-sm">
              {success}
            </div>
          )}

          {/* Mode toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-lg bg-white/5 border border-white/10">
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                mode === 'new' ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              New Person
            </button>
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`py-2 rounded-md text-xs font-semibold transition-colors ${
                mode === 'existing' ? 'bg-indigo-500 text-white' : 'text-white/50 hover:text-white'
              }`}
            >
              Existing Employee
            </button>
          </div>

          {mode === 'existing' && (
            <div>
              <Select
                label="Employee"
                value={form.employee_id}
                onChange={handleEmployeeSelect}
                placeholder={employeesLoading ? 'Loading...' : 'Select an employee'}
                options={employeeOptions}
                required
              />
              {!employeesLoading && employeeOptions.length === 0 && (
                <p className="text-xs text-white/30 mt-2">
                  Every employee already has a login. Switch to "New Person" to add someone new.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
              Username
            </label>
            <Input name="username" value={form.username} onChange={handleChange} required />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
              Email
            </label>
            <Input type="email" name="email" value={form.email} onChange={handleChange} required />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">
              Temporary Password
            </label>
            <Input
              type="text"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 chars, mixed case + number"
              required
            />
          </div>

          <div>
            <Select
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              placeholder="Select role"
              options={[
                { value: 'employee', label: 'Employee' },
                { value: 'manager', label: 'Manager' },
                { value: 'hr', label: 'HR' },
              ]}
              required
            />
          </div>

          {mode === 'new' && needsProfile && (
            <div className="p-3 rounded-lg border border-indigo-500/15 bg-indigo-500/5 text-xs text-indigo-200">
              An Employee Directory profile will be automatically created and linked to this login account.
            </div>
          )}

          <Button type="submit" disabled={creating} className="w-full">
            {creating ? 'Creating…' : '+ Grant Access'}
          </Button>
        </form>

        {/* User list */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden h-fit">
          <div className="px-5 py-4 border-b border-white/8">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
              All Accounts ({users.length})
            </h3>
          </div>

          {usersLoading ? (
            <div className="p-8">
              <LoadingSpinner message="Loading users..." />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-sm text-white/90 font-medium">{u.username}</p>
                    <p className="text-xs text-white/40">{u.email}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border capitalize ${
                      roleBadge[u.role] || roleBadge.employee
                    }`}
                  >
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CEOUsers;
