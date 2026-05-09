/**
 * Input Component
 * Reusable form input with label
 */
const Input = ({
  label,
  value = '',
  onChange,
  placeholder,
  required = false,
  type = 'text',
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
      <input
        type={type}
        name={name}
        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
      />
    </div>
  );
};

export default Input;
