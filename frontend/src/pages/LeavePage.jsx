import { useCallback, useState } from 'react';
import { CalendarDays, Check, X, Clock3 } from 'lucide-react';
import { useFetch } from '../hooks/useFetch';
import { usePermissions } from '../hooks/usePermissions';
import { useToast } from '../hooks/useToast';
import leaveService from '../services/leaveService';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import Select from '../components/common/Select';
import Input from '../components/common/Input';
import Toast from '../components/common/Toast';

const statusStyle = {
  pending: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
  approved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  rejected: 'bg-red-500/15 text-red-300 border-red-500/20',
  cancelled: 'bg-white/10 text-white/40 border-white/10',
};

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'vacation', label: 'Vacation' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'other', label: 'Other' },
];

const LeavePage = () => {
  const permissions = usePermissions();
  const { toast, showSuccess, showError, hideToast } = useToast();
  const canReview = permissions.isCEO || permissions.isHR || permissions.isManager;

  // Apply form (everyone can apply, including managers/HR/CEO for themselves)
  const [form, setForm] = useState({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
  const [applying, setApplying] = useState(false);

  const fetchHistory = useCallback(async () => await leaveService.myHistory(), []);
  const { data: historyRes, loading: historyLoading, refetch: refetchHistory } = useFetch(fetchHistory);
  const history = historyRes?.data || [];

  const fetchQueue = useCallback(async () => {
    if (!canReview) return { data: [] };
    return await leaveService.list();
  }, [canReview]);
  const { data: queueRes, loading: queueLoading, refetch: refetchQueue } = useFetch(fetchQueue);
  const queue = queueRes?.data || [];

  const handleApply = async (e) => {
    e.preventDefault();
    setApplying(true);
    try {
      await leaveService.apply(form);
      showSuccess('Leave request submitted');
      setForm({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
      refetchHistory();
      if (canReview) refetchQueue();
    } catch (err) {
      showError(err.message);
    } finally {
      setApplying(false);
    }
  };

  const handleCancel = async (id) => {
    try {
      await leaveService.cancel(id);
      showSuccess('Leave request cancelled');
      refetchHistory();
    } catch (err) {
      showError(err.message);
    }
  };

  const handleReview = async (id, action) => {
    try {
      if (action === 'approve') await leaveService.approve(id);
      else await leaveService.reject(id);
      showSuccess(`Leave request ${action}d`);
      refetchQueue();
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      <PageHeader
        title="Leave Management"
        subtitle={canReview ? 'Apply, and review team requests' : 'Apply for leave and track your requests'}
      />

      <div className={`grid grid-cols-1 ${canReview ? 'lg:grid-cols-[380px_1fr]' : ''} gap-6`}>
        {/* Apply form */}
        <form
          onSubmit={handleApply}
          className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 space-y-4 h-fit"
        >
          <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest mb-1 flex items-center gap-2">
            <CalendarDays size={16} /> Apply for Leave
          </h3>

          <Select
            label="Leave Type"
            value={form.leave_type}
            onChange={(e) => setForm((f) => ({ ...f, leave_type: e.target.value }))}
            options={LEAVE_TYPES}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Start Date</label>
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">End Date</label>
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-white/40 mb-2">Reason (optional)</label>
            <Input
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="Brief reason for leave"
            />
          </div>

          <Button type="submit" disabled={applying} className="w-full">
            {applying ? 'Submitting…' : 'Submit Request'}
          </Button>

          {/* My history */}
          <div className="pt-4 border-t border-white/8">
            <h4 className="text-xs uppercase tracking-widest text-white/40 mb-3">My Requests</h4>
            {historyLoading ? (
              <LoadingSpinner message="Loading..." />
            ) : history.length === 0 ? (
              <p className="text-xs text-white/30">No leave requests yet</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {history.map((h) => (
                  <div key={h.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/8 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white/80 capitalize">{h.leave_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${statusStyle[h.status]}`}>
                        {h.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/40">
                      {h.start_date} → {h.end_date} ({h.total_days}d)
                    </p>
                    {h.status === 'pending' && (
                      <button
                        onClick={() => handleCancel(h.id)}
                        className="text-xs text-red-300 hover:text-red-200 mt-1"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Review queue (CEO / HR / Manager) */}
        {canReview && (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden h-fit">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <Clock3 size={16} className="text-white/50" />
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-widest">
                {permissions.isManager && !permissions.isCEO && !permissions.isHR
                  ? "My Department's Requests"
                  : 'All Leave Requests'}
                {' '}({queue.length})
              </h3>
            </div>

            {queueLoading ? (
              <div className="p-8">
                <LoadingSpinner message="Loading requests..." />
              </div>
            ) : queue.length === 0 ? (
              <div className="p-8 text-center text-sm text-white/30">No leave requests to review</div>
            ) : (
              <div className="divide-y divide-white/5">
                {queue.map((req) => (
                  <div key={req.id} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-medium text-white/90">{req.employee_name}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full border capitalize ${statusStyle[req.status]}`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 capitalize mb-1">
                      {req.leave_type} • {req.start_date} → {req.end_date} ({req.total_days} days)
                    </p>
                    {req.reason && <p className="text-xs text-white/30 mb-2">"{req.reason}"</p>}

                    {req.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
                        <Button variant="success" size="sm" onClick={() => handleReview(req.id, 'approve')}>
                          <Check size={14} /> Approve
                        </Button>
                        <Button variant="ghostDanger" size="sm" onClick={() => handleReview(req.id, 'reject')}>
                          <X size={14} /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeavePage;
