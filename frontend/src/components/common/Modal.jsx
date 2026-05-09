/**
 * Modal Component
 * Reusable modal dialog with backdrop
 */
const Modal = ({ title, onClose, children }) => {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-50 w-full max-w-md bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
