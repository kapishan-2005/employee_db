import { useEffect } from 'react';

/**
 * Toast Notification Component
 * Reusable toast for success/error messages
 */
const Toast = ({ message, type = 'success', onClose, duration = 3200 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl text-sm font-medium tracking-wide transition-all
        ${type === 'error' ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'}`}
    >
      <span>{type === 'error' ? '✕' : '✓'}</span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        ✕
      </button>
    </div>
  );
};

export default Toast;
