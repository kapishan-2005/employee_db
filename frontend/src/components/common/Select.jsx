/**
 * Select Component
 * Reusable select dropdown with label
 */
const Select = ({
  label,
  value = '',
  onChange,
  options = [],
  placeholder = 'Select...',
  required = false,
  name,
  disabled = false,
}) => {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
          {label}
        </label>
      )}
      <select
        name={name}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed [&>option]:bg-[#161822] [&>option]:text-white"
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
      >
        <option value="" className="bg-[#161822] text-white/50">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#161822] text-white">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
