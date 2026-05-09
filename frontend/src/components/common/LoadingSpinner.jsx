/**
 * LoadingSpinner Component
 * Reusable loading indicator
 */
const LoadingSpinner = ({ size = 'md', message = '' }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className="text-center py-20 text-white/30">
      <div
        className={`inline-block ${sizes[size]} border-2 border-indigo-400 border-t-transparent rounded-full animate-spin`}
      />
      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
