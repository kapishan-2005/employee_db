import { useCallback, useState } from 'react';
import { Users, Building2, CheckCircle2, Clock, Sparkles, Info, AlertTriangle, AlertOctagon, FolderKanban, Mail, UserX } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import ceoDashboardService from '../../services/ceoDashboardService';
import aiService from '../../services/aiService';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DashboardCard from '../../components/dashboard/DashboardCard';
import WorkforceGrowthChart from '../../components/dashboard/WorkforceGrowthChart';
import DepartmentDistributionChart from '../../components/dashboard/DepartmentDistributionChart';
import RecentActivities from '../../components/dashboard/RecentActivities';
import PendingInvitationsTable from '../../components/dashboard/PendingInvitationsTable';
import QuickActions from '../../components/dashboard/QuickActions';

const severityStyles = {
  info: 'border-sky-500/20 bg-sky-500/5 text-sky-300',
  warning: 'border-orange-500/20 bg-orange-500/5 text-orange-300',
  critical: 'border-red-500/20 bg-red-500/5 text-red-300',
};

const severityIcon = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertOctagon,
};

const CEODashboard = () => {
  // Fetch complete CEO dashboard data
  const fetchCEODashboard = useCallback(async () => {
    return await ceoDashboardService.getCEODashboard();
  }, []);

  const { data: dashboardData, loading: dashboardLoading, refetch: refetchDashboard } = 
    useFetch(fetchCEODashboard);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const data = dashboardData?.data || {};
  const stats = data.stats || {};
  const workforceGrowth = data.workforceGrowth || [];
  const departmentDistribution = data.departmentDistribution || [];
  const recentActivities = data.recentActivities || [];
  const pendingInvitations = data.pendingInvitations || [];
  const aiInsights = data.aiInsights || [];

  const handleGenerateInsights = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      await aiService.generateInsights();
      await refetchDashboard();
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <LoadingSpinner message="Loading CEO dashboard..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <PageHeader title="Company Overview" subtitle="CEO Dashboard" />
        <button
          onClick={handleGenerateInsights}
          disabled={generating}
          className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Generate AI Insights
            </>
          )}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8 mt-6">
        <DashboardCard
          title="Total Employees"
          value={stats.totalEmployees || 0}
          icon={<Users size={20} />}
          color="indigo"
        />
        <DashboardCard
          title="Departments"
          value={stats.totalDepartments || 0}
          icon={<Building2 size={20} />}
          color="violet"
        />
        <DashboardCard
          title="Active Projects"
          value={stats.activeProjects || 0}
          icon={<FolderKanban size={20} />}
          color="sky"
        />
        <DashboardCard
          title="Pending Invites"
          value={stats.pendingInvitations || 0}
          icon={<Mail size={20} />}
          color="orange"
        />
        <DashboardCard
          title="On Leave"
          value={stats.employeesOnLeave || 0}
          icon={<UserX size={20} />}
          color="red"
        />
        <DashboardCard
          title="Attendance"
          value={`${stats.attendanceToday || 0}%`}
          subtitle={`${stats.attendanceDetails?.present || 0}/${stats.attendanceDetails?.total || 0} present`}
          icon={<CheckCircle2 size={20} />}
          color="emerald"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <WorkforceGrowthChart data={workforceGrowth} />
        <DepartmentDistributionChart data={departmentDistribution} />
      </div>

      {/* Activities and Invitations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecentActivities activities={recentActivities} />
        <PendingInvitationsTable invitations={pendingInvitations} />
      </div>

      {/* AI Insights */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-300" /> AI Executive Insights
          </h3>
        </div>

        {generateError && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-300 text-sm">
            {generateError}
          </div>
        )}

        {aiInsights.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            No executive insights available yet. Click "Generate AI Insights" to analyze current
            workforce data.
          </div>
        ) : (
          <div className="space-y-3">
            {aiInsights.map((insight) => {
              const severityIcon = {
                info: Info,
                warning: AlertTriangle,
                critical: AlertOctagon,
              };
              const severityStyles = {
                info: 'border-sky-500/20 bg-sky-500/5 text-sky-300',
                warning: 'border-orange-500/20 bg-orange-500/5 text-orange-300',
                critical: 'border-red-500/20 bg-red-500/5 text-red-300',
              };
              const SeverityIcon = severityIcon[insight.severity] || Info;
              return (
                <div
                  key={insight.id}
                  className={`p-4 rounded-xl border ${severityStyles[insight.severity] || severityStyles.info}`}
                >
                  <div className="flex items-start gap-3">
                    <SeverityIcon size={18} className="mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs uppercase tracking-widest text-white/40 mb-1">
                        {insight.insightType?.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm text-white/90">{insight.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />
    </div>
  );
};

export default CEODashboard;
