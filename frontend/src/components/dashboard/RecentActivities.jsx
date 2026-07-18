/**
 * RecentActivities Component
 * 
 * Displays recent company activity from activity_logs
 */

import { Activity, User, Building2, Calendar, FileText, UserPlus, Clock } from 'lucide-react';

const activityIcons = {
  employee: User,
  department: Building2,
  attendance: Calendar,
  user: UserPlus,
  default: FileText,
};

const RecentActivities = ({ activities = [] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity size={18} className="text-emerald-300" />
          Recent Activities
        </h3>
        <div className="text-center py-12 text-white/40 text-sm">
          No recent activities to display.
        </div>
      </div>
    );
  }

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getActivityDescription = (activity) => {
    const action = activity.action?.toLowerCase() || '';
    const entityType = activity.entityType?.toLowerCase() || '';
    const userEmail = activity.userEmail || 'Someone';
    const role = activity.userRole?.toUpperCase() || '';

    // Parse details if JSON
    let details = activity.details;
    try {
      if (typeof details === 'string') {
        details = JSON.parse(details);
      }
    } catch {
      // Keep as string if not JSON
    }

    // Build description based on action and entity
    if (action.includes('create') || action.includes('add')) {
      return `${userEmail} created a new ${entityType}`;
    } else if (action.includes('update') || action.includes('edit')) {
      return `${userEmail} updated ${entityType}`;
    } else if (action.includes('delete') || action.includes('remove')) {
      return `${userEmail} deleted ${entityType}`;
    } else if (action.includes('invite')) {
      return `${userEmail} sent an invitation`;
    } else if (action.includes('login')) {
      return `${role} logged in`;
    } else if (action.includes('check')) {
      return `Attendance recorded for ${entityType}`;
    } else {
      return `${action} on ${entityType || 'item'}`;
    }
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Activity size={18} className="text-emerald-300" />
        Recent Activities
      </h3>

      <div className="space-y-3">
        {activities.map((activity) => {
          const Icon = activityIcons[activity.entityType?.toLowerCase()] || activityIcons.default;
          const description = getActivityDescription(activity);

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-white/[0.02] transition-colors"
            >
              {/* Icon */}
              <div className="shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Icon size={14} className="text-emerald-300" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/90 mb-1">{description}</p>
                {activity.userEmail && (
                  <p className="text-xs text-white/40">
                    {activity.userEmail}
                    {activity.userRole && (
                      <span className="ml-2 px-1.5 py-0.5 rounded bg-white/5 text-[10px] uppercase">
                        {activity.userRole}
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Time */}
              <div className="shrink-0 flex items-center gap-1 text-xs text-white/40">
                <Clock size={12} />
                <span>{formatTimeAgo(activity.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivities;
