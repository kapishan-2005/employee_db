import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication and optionally specific roles.
 * Redirects to /login if user is not authenticated.
 * Shows access denied if user doesn't have required role.
 * 
 * @param {Array} allowedRoles - Optional array of roles that can access this route
 */
const ProtectedRoute = ({ children, allowedRoles = null }) => {
  const { isAuthenticated, loading, currentUser } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if allowedRoles is specified
  if (allowedRoles && currentUser) {
    const hasRequiredRole = allowedRoles.includes(currentUser.role);
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
          <div className="max-w-md mx-auto text-center px-6">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
            <p className="text-white/60 mb-6">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-white/40 mb-6">
              Required role: {allowedRoles.join(' or ')}
              <br />
              Your role: {currentUser.role}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // Render protected content
  return children;
};

export default ProtectedRoute;
