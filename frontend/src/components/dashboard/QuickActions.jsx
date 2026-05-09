import { useNavigate } from 'react-router-dom';
import Button from '../common/Button';

/**
 * QuickActions Component
 * Quick navigation buttons for common actions
 */
const QuickActions = ({ actions }) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'primary'}
            onClick={() => action.path ? navigate(action.path) : action.onClick?.()}
            className="w-full"
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
