import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, endpoints } from '../../services/api';

/**
 * SetupGuard Component
 *
 * Ensures CEO users complete setup before accessing CEO dashboard.
 * Prevents non-CEO users from accessing the setup wizard.
 * Allows completed CEOs to access all routes normally.
 *
 * Setup completion is fetched live from the backend (organizations.setup_completed)
 * rather than trusted from the JWT/localStorage user object, which never carries it.
 */
const SetupGuard = ({ children, requireSetup = false, requireCompleted = false }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  const isCEO = currentUser?.role === 'ceo';
  const needsCheck = isCEO && (requireSetup || requireCompleted);

  const [checking, setChecking] = useState(needsCheck);
  const [setupComplete, setSetupComplete] = useState(null);

  useEffect(() => {
    if (!needsCheck) {
      return;
    }

    let cancelled = false;

    api
      .get(endpoints.organization.setupStatus)
      .then((res) => {
        if (!cancelled) setSetupComplete(!!res.setupCompleted);
      })
      .catch(() => {
        // If the check fails, don't trap the user in a loop \u2014 assume complete.
        if (!cancelled) setSetupComplete(true);
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [needsCheck]);

  if (loading || checking) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // /setup route itself
  if (requireSetup) {
    if (!isCEO) {
      return <Navigate to="/dashboard" replace />;
    }
    if (setupComplete) {
      return <Navigate to="/ceo/dashboard" replace />;
    }
    return children;
  }

  // CEO dashboard / other setup-gated routes
  if (requireCompleted && isCEO && setupComplete === false) {
    return <Navigate to="/setup" replace state={{ from: location }} />;
  }

  return children;
};

export default SetupGuard;
