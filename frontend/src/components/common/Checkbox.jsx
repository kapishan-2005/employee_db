/**
 * Checkbox Component
 * Reusable checkbox with label
 */
const Checkbox = ({ id, label, checked, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="w-4 h-4 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-400/30"
      />
      {label && (
        <label htmlFor={id} className="text-sm text-white/70">
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;
