import { useCallback, useState } from 'react';
import { Users, Building2, CheckCircle2, Clock, Sparkles, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { useFetch } from '../../hooks/useFetch';
import dashboardService from '../../services/dashboardService';
import aiService from '../../services/aiService';
import PageHeader from '../../components/common/PageHeader';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DashboardCard from '../../components/dashboard/DashboardCard';

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
  const fetchOverview = useCallback(async () => {
    return await dashboardService.getOverview();
  }, []);

  const fetchInsights = useCallback(async () => {
    return await aiService.getInsights();
  }, []);

  const { data: overview, loading: overviewLoading } = useFetch(fetchOverview);
  const { data: insightsData, loading: insightsLoading, refetch: refetchInsights } =
    useFetch(fetchInsights);

  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const overviewData = overview?.data || {};
  const insights = insightsData?.data?.insights || [];

  const handleGenerateInsights = async () => {
    setGenerating(true);
    setGenerateError(null);
    try {
      await aiService.generateInsights();
      await refetchInsights();
    } catch (err) {
      setGenerateError(err.message || 'Failed to generate insights');
    } finally {
      setGenerating(false);
    }
  };

  if (overviewLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-10">
        <LoadingSpinner message="Loading company overview..." />
      </div>
    );
  }

  const attendancePct = overviewData.attendanceToday
    ? Math.round((overviewData.presentToday / overviewData.attendanceToday) * 100)
    : 0;

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

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8 mt-6">
        <DashboardCard
          title="Total Employees"
          value={overviewData.totalEmployees || 0}
          icon={<Users size={20} />}
          color="indigo"
        />
        <DashboardCard
          title="Departments"
          value={overviewData.totalDepartments || 0}
          icon={<Building2 size={20} />}
          color="violet"
        />
        <DashboardCard
          title="Attendance Today"
          value={`${attendancePct}%`}
          subtitle={`${overviewData.presentToday || 0}/${overviewData.attendanceToday || 0} present`}
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

      {/* AI Insights */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-300" /> AI Business Insights
          </h3>
        </div>

        {generateError && (
          <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-300 text-sm">
            {generateError}
          </div>
        )}

        {insightsLoading ? (
          <LoadingSpinner message="Loading insights..." />
        ) : insights.length === 0 ? (
          <div className="text-center py-8 text-white/40 text-sm">
            No insights yet. Click "Generate AI Insights" to analyze current
            workforce data.
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => {
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
                        {insight.insight_type?.replace(/_/g, ' ')}
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
    </div>
  );
};

export default CEODashboard;
