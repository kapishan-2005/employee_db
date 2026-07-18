/**
 * PendingInvitationsTable Component
 * 
 * Displays pending invitations with email, role, invited by, and expiration
 */

import { Mail, Clock, User } from 'lucide-react';

const PendingInvitationsTable = ({ invitations = [] }) => {
  if (!invitations || invitations.length === 0) {
    return (
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Mail size={18} className="text-sky-300" />
          Pending Invitations
        </h3>
        <div className="text-center py-12 text-white/40 text-sm">
          No pending invitations.
        </div>
      </div>
    );
  }

  const formatExpiryDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((date - now) / (1000 * 60 * 60));
    
    if (diffInHours < 0) return 'Expired';
    if (diffInHours < 24) return `${diffInHours}h left`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d left`;
  };

  const roleColors = {
    hr: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
    manager: 'text-sky-300 bg-sky-500/10 border-sky-500/20',
    employee: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
  };

  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Mail size={18} className="text-sky-300" />
        Pending Invitations
      </h3>

      <div className="space-y-3">
        {invitations.map((invitation) => {
          const expiryText = formatExpiryDate(invitation.expiresAt);
          const isExpired = expiryText === 'Expired';

          return (
            <div
              key={invitation.id}
              className="flex items-center gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.02] transition-colors"
            >
              {/* Email and Role */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Mail size={14} className="text-white/40 shrink-0" />
                  <p className="text-sm text-white/90 font-medium truncate">
                    {invitation.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium border ${
                      roleColors[invitation.role] || roleColors.employee
                    }`}
                  >
                    {invitation.role.toUpperCase()}
                  </span>
                  {invitation.invitedBy && (
                    <span className="text-xs text-white/40 flex items-center gap-1">
                      <User size={10} />
                      by {invitation.invitedBy}
                    </span>
                  )}
                </div>
              </div>

              {/* Expiration */}
              <div className="shrink-0 text-right">
                <div
                  className={`flex items-center gap-1.5 text-xs ${
                    isExpired ? 'text-red-300' : 'text-orange-300'
                  }`}
                >
                  <Clock size={12} />
                  <span>{expiryText}</span>
                </div>
                <p className="text-[10px] text-white/30 mt-1">
                  {new Date(invitation.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-white/5 text-center">
        <p className="text-xs text-white/40">
          {invitations.length} pending {invitations.length === 1 ? 'invitation' : 'invitations'}
        </p>
      </div>
    </div>
  );
};

export default PendingInvitationsTable;
