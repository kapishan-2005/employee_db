/**
 * Button Component
 * Reusable button with variants
 */
const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-colors';

  const variants = {
    primary: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20',
    success: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20',
    warning: 'bg-orange-500 hover:bg-orange-400 text-white shadow-lg shadow-orange-500/20',
    danger: 'bg-red-500 hover:bg-red-400 text-white',
    secondary: 'bg-white/8 hover:bg-white/12 text-white/70',
    ghost: 'bg-white/8 hover:bg-indigo-500/20 hover:text-indigo-300',
    ghostDanger: 'bg-white/8 hover:bg-red-500/20 hover:text-red-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
