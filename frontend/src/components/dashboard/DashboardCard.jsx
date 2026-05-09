/**
 * DashboardCard Component
 * Reusable card for dashboard metrics
 */
const DashboardCard = ({ title, value, subtitle, icon, color = 'indigo' }) => {
  const colorClasses = {
    indigo: 'border-indigo-500/20 bg-indigo-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    orange: 'border-orange-500/20 bg-orange-500/5',
    red: 'border-red-500/20 bg-red-500/5',
    sky: 'border-sky-500/20 bg-sky-500/5',
    violet: 'border-violet-500/20 bg-violet-500/5',
  };

  return (
    <div className={`rounded-2xl p-6 border ${colorClasses[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
            {title}
          </p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        {icon && (
          <div className="text-2xl opacity-50">{icon}</div>
        )}
      </div>
      {subtitle && (
        <p className="text-xs text-white/50">{subtitle}</p>
      )}
    </div>
  );
};

export default DashboardCard;
