/**
 * StatCard Component
 * Reusable statistics card
 */
const StatCard = ({ label, value, accent = 'border-indigo-500/20' }) => {
  return (
    <div className={`rounded-2xl p-5 border ${accent} bg-white/[0.03]`}>
      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  );
};

export default StatCard;
