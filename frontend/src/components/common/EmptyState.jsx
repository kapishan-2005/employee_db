/**
 * EmptyState Component
 * Reusable empty state message
 */
const EmptyState = ({ message }) => {
  return (
    <div className="text-center py-20 text-white/25">
      {message}
    </div>
  );
};

export default EmptyState;
