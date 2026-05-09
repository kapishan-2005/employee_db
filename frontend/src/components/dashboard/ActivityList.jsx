/**
 * ActivityList Component
 * Displays recent activity items
 */
const ActivityList = ({ title, items, emptyMessage = 'No recent activity' }) => {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      {items.length === 0 ? (
        <p className="text-white/40 text-sm text-center py-8">{emptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] hover:bg-white/[0.05] transition-colors"
            >
              {item.icon && (
                <div className="text-lg mt-0.5">{item.icon}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {item.title}
                </p>
                {item.subtitle && (
                  <p className="text-xs text-white/50 mt-0.5">{item.subtitle}</p>
                )}
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${item.badgeClass}`}>
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityList;
