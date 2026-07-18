import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowLeft, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useToast } from '../hooks/useToast';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // In a production app, you would verify the token here
    // For now, we'll assume it's valid if it exists
    if (token) {
      setTokenValid(true);
      setVerifying(false);
    } else {
      setTokenValid(false);
      setVerifying(false);
    }
  }, [token]);

  const validatePassword = () => {
    if (password.length < 8) {
      showToast('Password must be at least 8 characters long', 'warning');
      return false;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'warning');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePassword()) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: password
      });
      
      setSuccess(true);
      showToast('Password reset successfully! Redirecting to login...', 'success');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      showToast(error.message || 'Failed to reset password', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-white/40 text-sm">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-8">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Invalid Reset Link
            </h1>
            
            <p className="text-white/60 mb-6">
              This password reset link is invalid or has expired.
            </p>
            
            <Link to="/forgot-password">
              <Button variant="primary" className="w-full">
                Request New Link
              </Button>
            </Link>
            
            <Link 
              to="/login" 
              className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-2 mt-4"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Password Reset Successfully!
            </h1>
            
            <p className="text-white/60 mb-6">
              Your password has been reset. You can now login with your new password.
            </p>
            
            <div className="text-sm text-white/40">
              Redirecting to login in 3 seconds...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">EM</span>
            </div>
            <h1 className="text-2xl font-bold">
              Employee{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                Manager
              </span>
            </h1>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-2">
            Reset Your Password
          </h2>
          
          <p className="text-white/60">
            Enter your new password below
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-9 text-white/40 hover:text-white transition-colors"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Requirements */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
              <p className="text-xs text-white/50 font-medium mb-2">Password must:</p>
              <ul className="text-xs text-white/40 space-y-1">
                <li className={password.length >= 8 ? 'text-emerald-400' : ''}>
                  • Be at least 8 characters long
                </li>
                <li className={password === confirmPassword && password ? 'text-emerald-400' : ''}>
                  • Match the confirmation
                </li>
              </ul>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Resetting Password...
                </>
              ) : (
                <>
                  <Lock size={18} className="mr-2" />
                  Reset Password
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <Link 
            to="/login" 
            className="text-sm text-white/60 hover:text-white transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
