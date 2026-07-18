/**
 * QuickActions Component
 * 
 * CEO quick action buttons for common tasks
 */

import { useNavigate } from 'react-router-dom';
import { UserPlus, Building2, Users, FolderKanban, Settings } from 'lucide-react';

const QuickActions = ({ actions: customActions }) => {
  const navigate = useNavigate();

  const defaultActions = [
    {
      id: 'invite-hr',
      label: 'Invite HR',
      icon: UserPlus,
      color: 'indigo',
      onClick: () => navigate('/invitations'),
      description: 'Send invitation to HR staff',
    },
    {
      id: 'create-department',
      label: 'Create Department',
      icon: Building2,
      color: 'violet',
      onClick: () => navigate('/departments'),
      description: 'Add new department',
    },
    {
      id: 'view-employees',
      label: 'View Employees',
      icon: Users,
      color: 'emerald',
      onClick: () => navigate('/employees'),
      description: 'Manage employee records',
    },
    {
      id: 'view-projects',
      label: 'View Projects',
      icon: FolderKanban,
      color: 'sky',
      onClick: () => navigate('/projects'),
      description: 'Track company projects',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'orange',
      onClick: () => navigate('/settings'),
      description: 'Company settings',
    },
  ];

  const colorClasses = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/15 text-indigo-300',
    violet: 'bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/15 text-violet-300',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15 text-emerald-300',
    sky: 'bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/15 text-sky-300',
    orange: 'bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/15 text-orange-300',
  };

  // Legacy callers (Employee/Manager/HR DashboardPage) pass a simple
  // { label, icon, variant, path } array — normalize it to this component's
  // { id, label, icon, color, onClick, description } shape.
  const variantToColor = {
    primary: 'indigo',
    secondary: 'sky',
    success: 'emerald',
    warning: 'orange',
  };

  const actions = customActions
    ? customActions.map((a, i) => ({
        id: a.id || `${a.label}-${i}`,
        label: a.label,
        icon: () => a.icon, // a.icon is already a rendered <Icon /> element from callers
        iconElement: a.icon,
        color: variantToColor[a.variant] || 'indigo',
        onClick: a.path ? () => navigate(a.path) : a.onClick,
        description: a.label,
      }))
    : defaultActions;

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {actions.map((action) => {
          const colorClass = colorClasses[action.color] || colorClasses.indigo;
          const Icon = action.icon;

          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`p-4 rounded-xl border ${colorClass} transition-all hover:scale-105 active:scale-95 flex flex-col items-center gap-2 text-center`}
              title={action.description}
            >
              {action.iconElement ? action.iconElement : <Icon size={24} />}
              <span className="text-xs font-medium text-white/90">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActions;
