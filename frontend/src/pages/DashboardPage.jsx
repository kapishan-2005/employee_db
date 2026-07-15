import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users2,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Calendar,
  User,
  LogIn,
  LogOut,
  ClipboardList,
  Plus,
  BarChart3,
  UserPlus,
  Target,
  Sparkles,
} from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';
import { useFetch } from '../hooks/useFetch';
import dashboardService from '../services/dashboardService';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardCard from '../components/dashboard/DashboardCard';
import ActivityList from '../components/dashboard/ActivityList';
import QuickActions from '../components/dashboard/QuickActions';

const DashboardPage = () => {
  const permissions = usePermissions();
  const navigate = useNavigate();

  // CEOs get a dedicated, richer view at /ceo/dashboard (company overview +
  // AI insights) — send them straight there instead of the generic view.
  useEffect(() => {
    if (permissions.isCEO) {
      navigate('/ceo/dashboard', { replace: true });
    }
  }, [permissions.isCEO, navigate]);

  const fetchOverview = useCallback(async () => {
    const response = await dashboardService.getOverview();
    return response;
  }, []);

  const fetchActivity = useCallback(async () => {
    const response = await dashboardService.getRecentActivity(10);
    return response;
  }, []);

  const { data: overview, loading: overviewLoading, refetch: refetchOverview } = useFetch(fetchOverview);
  const { data: activity, loading: activityLoading, refetch: refetchActivity } = useFetch(fetchActivity);

  // Silent auto-refresh every 15s (no loading spinner, just refreshes data in background)
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      refetchOverview();
      refetchActivity();
      setLastUpdated(new Date());
    }, 15000);

    return () => clearInterval(intervalRef.current);
  }, [refetchOverview, refetchActivity]);

  if (overviewLoading || activityLoading || permissions.isCEO) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  // Employee Dashboard
  if (permissions.isEmployee && overview?.role === 'employee') {
    const { employee, stats, today } = overview.data || {};
    const recentAttendance = activity?.data?.recentAttendance || [];

    // Safety check for employee data
    if (!employee) {
      return (
        <div className="max-w-7xl mx-auto px-6 py-10">
          <LoadingSpinner message="Loading employee data..." />
        </div>
      );
    }

    const attendanceItems = recentAttendance.map((record) => ({
      icon: <Calendar size={16} />,
      title: new Date(record.date).toLocaleDateString(),
      subtitle: `${record.check_in ? record.check_in.substring(0, 5) : '—'} - ${record.check_out ? record.check_out.substring(0, 5) : '—'}`,
      badge: record.status,
      badgeClass:
        record.status === 'present'
          ? 'bg-emerald-500/15 text-emerald-300'
          : record.status === 'late'
          ? 'bg-orange-500/15 text-orange-300'
          : 'bg-red-500/15 text-red-300',
    }));

    const quickActions = [
      { label: 'Check In', icon: <LogIn size={16} />, variant: 'success', path: '/attendance' },
      { label: 'Check Out', icon: <LogOut size={16} />, variant: 'warning', path: '/attendance' },
      { label: 'View Attendance', icon: <ClipboardList size={16} />, variant: 'primary', path: '/attendance' },
      { label: 'My Profile', icon: <User size={16} />, variant: 'secondary', path: '/employees' },
    ];

    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between">
          <PageHeader title="My Dashboard" subtitle="Welcome back" />
          <div className="flex items-center gap-2 text-xs text-white/40">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Live • Updated {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-white font-medium">{employee.name}</p>
          <p className="text-white/60 text-sm">{employee.course} • {employee.roll_no}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <DashboardCard
            title="Total Days"
            value={stats?.totalDays || 0}
            icon={<BarChart3 size={20} />}
            color="indigo"
          />
          <DashboardCard
            title="Present"
            value={stats?.presentDays || 0}
            icon={<CheckCircle2 size={20} />}
            color="emerald"
          />
          <DashboardCard
            title="Late"
            value={stats?.lateDays || 0}
            icon={<Clock size={20} />}
            color="orange"
          />
          <DashboardCard
            title="Absent"
            value={stats?.absentDays || 0}
            icon={<XCircle size={20} />}
            color="red"
          />
        </div>

        {today && (
          <div className="mb-8 p-6 rounded-2xl border border-white/8 bg-white/[0.02]">
            <h3 className="text-lg font-semibold text-white mb-3">Today's Status</h3>
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Check In</p>
                <p className="text-xl font-bold text-white">
                  {today.check_in ? today.check_in.substring(0, 5) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Check Out</p>
                <p className="text-xl font-bold text-white">
                  {today.check_out ? today.check_out.substring(0, 5) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Status</p>
                <span
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    today.status === 'present'
                      ? 'bg-emerald-500/15 text-emerald-300'
                      : today.status === 'late'
                      ? 'bg-orange-500/15 text-orange-300'
                      : 'bg-red-500/15 text-red-300'
                  }`}
                >
                  {today.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ActivityList
            title="Recent Attendance"
            items={attendanceItems}
            emptyMessage="No attendance records yet"
          />
          <QuickActions actions={quickActions} />
        </div>
      </div>
    );
  }

  // Admin (HR) / Manager Dashboard
  const overviewData = overview?.data || {};
  const activityData = activity?.data || {};

  const recentEmployees = activityData.recentEmployees || [];
  const recentAttendance = activityData.recentAttendance || [];
  const recentDepartments = activityData.recentDepartments || [];

  const employeeItems = recentEmployees.map((emp) => ({
    icon: <User size={16} />,
    title: emp.name,
    subtitle: `${emp.course} • ${emp.roll_no}`,
    badge: 'New',
    badgeClass: 'bg-indigo-500/15 text-indigo-300',
  }));

  const attendanceItems = recentAttendance.map((record) => ({
    icon: record.check_out ? <LogOut size={16} /> : <LogIn size={16} />,
    title: record.employee_name,
    subtitle: `${record.check_in ? record.check_in.substring(0, 5) : '—'} ${
      record.check_out ? `- ${record.check_out.substring(0, 5)}` : ''
    }`,
    badge: record.status,
    badgeClass:
      record.status === 'present'
        ? 'bg-emerald-500/15 text-emerald-300'
        : record.status === 'late'
        ? 'bg-orange-500/15 text-orange-300'
        : 'bg-red-500/15 text-red-300',
  }));

  const departmentItems = recentDepartments.map((dept) => ({
    icon: <Building2 size={16} />,
    title: dept.name,
    subtitle: dept.description || 'No description',
    badge: dept.is_active ? 'Active' : 'Inactive',
    badgeClass: dept.is_active
      ? 'bg-emerald-500/15 text-emerald-300'
      : 'bg-red-500/15 text-red-300',
  }));

  // HR/Admin: people-ops focused actions (hiring, org structure, reports)
  const adminActions = [
    { label: 'Add Employee', icon: <UserPlus size={16} />, variant: 'primary', path: '/employees' },
    { label: 'Post a Role', icon: <Target size={16} />, variant: 'primary', path: '/recruitment' },
    { label: 'Add Department', icon: <Plus size={16} />, variant: 'secondary', path: '/departments' },
    { label: 'Attendance Reports', icon: <BarChart3 size={16} />, variant: 'secondary', path: '/attendance' },
  ];

  // Manager: team-execution focused actions (no org-structure changes)
  const managerActions = [
    { label: 'Check In', icon: <LogIn size={16} />, variant: 'success', path: '/attendance' },
    { label: 'Team Attendance', icon: <ClipboardList size={16} />, variant: 'primary', path: '/attendance' },
    { label: 'Team Directory', icon: <Users2 size={16} />, variant: 'secondary', path: '/employees' },
    { label: 'AI Team Insights', icon: <Sparkles size={16} />, variant: 'secondary', path: '/employees' },
  ];

  const quickActions = permissions.isAdmin ? adminActions : managerActions;
  const pageTitle = permissions.isAdmin ? 'HR Dashboard' : 'Team Dashboard';
  const pageSubtitle = permissions.isAdmin ? 'People operations overview' : 'Your team at a glance';

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between">
        <PageHeader title={pageTitle} subtitle={pageSubtitle} />
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Live • Updated {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title={permissions.isAdmin ? 'Total Employees' : 'Team Size'}
          value={overviewData.totalEmployees || 0}
          icon={<Users2 size={20} />}
          color="indigo"
        />
        <DashboardCard
          title="Departments"
          value={overviewData.totalDepartments || 0}
          icon={<Building2 size={20} />}
          color="violet"
        />
        <DashboardCard
          title="Present Today"
          value={overviewData.presentToday || 0}
          subtitle={`${overviewData.attendanceToday || 0} total`}
          icon={<CheckCircle2 size={20} />}
          color="emerald"
        />
        <DashboardCard
          title="Late Today"
          value={overviewData.lateToday || 0}
          subtitle={`${overviewData.absentToday || 0} absent`}
          icon={<Clock size={20} />}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ActivityList
          title={permissions.isAdmin ? 'Recent Employees' : 'Recent Team Updates'}
          items={employeeItems.slice(0, 5)}
          emptyMessage="No recent employees"
        />
        <ActivityList
          title="Today's Attendance"
          items={attendanceItems.slice(0, 5)}
          emptyMessage="No attendance records today"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {permissions.isAdmin ? (
          <ActivityList
            title="Recent Departments"
            items={departmentItems.slice(0, 5)}
            emptyMessage="No recent departments"
          />
        ) : (
          <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Tip</h3>
            <p className="text-sm text-white/50">
              Use the AI assistant (bottom-right) to ask things like "how's my
              team doing?" or "any workload issues this week?" — it's tuned
              for managers.
            </p>
          </div>
        )}
        <QuickActions actions={quickActions} />
      </div>
    </div>
  );
};

export default DashboardPage;
