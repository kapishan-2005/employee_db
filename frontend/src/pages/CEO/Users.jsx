import { useCallback, useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import userService from '../../services/userService';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';

const roleBadge = {
  ceo: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
  admin: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  manager: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
  employee: 'bg-white/10 text-white/60 border-white/10',
};

const CEOUsers = () => {
  const fetchUsers = useCallback(async () => await userService.list(), []);
  const { data, loading, refetch } = useFetch(fetchUsers);
  const users = data?.users || [];

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);
    try {
      await userService.create(form);
      setSuccess(`${form.username} created as ${form.role}`);
      setForm({ username: '', email: '', password: '', role: 'employee' });
      await refetch();
    } catch (err) {
      setError(err.message || 'Failed to create account');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <PageHeader title="Manage Users" subtitle="Create HR, Manager, and Employee accounts" />

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 mt-6">
        {/* Create form */}
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4 h-fit"
        >
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-1">
            Create Account
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
                { value: 'admin', label: 'Admin / HR' },
              ]}
              required
            />
          </div>

          <Button type="submit" disabled={creating} className="w-full">
            {creating ? 'Creating…' : '+ Create Account'}
          </Button>
        </form>

        {/* User list */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
              All Accounts ({users.length})
            </h3>
          </div>

          {loading ? (
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
