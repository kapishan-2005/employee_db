import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useToast } from '../hooks/useToast';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      showToast('Please enter your email address', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      
      setSubmitted(true);
      
      // In development, show the reset link
      if (response.resetLink) {
        console.log('Password Reset Link:', response.resetLink);
        showToast('Password reset link generated (check console in dev mode)', 'success');
      }
    } catch {
      // Don't show error to user (security - don't reveal if email exists)
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080a0f] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Success Card */}
          <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">
              Check Your Email
            </h1>
            
            <p className="text-white/60 mb-6">
              If an account exists with <span className="text-white font-medium">{email}</span>, 
              you will receive a password reset link shortly.
            </p>
            
            <p className="text-sm text-white/40 mb-8">
              Didn't receive an email? Check your spam folder or try again.
            </p>
            
            <Link to="/login">
              <Button variant="primary" className="w-full">
                <ArrowLeft size={18} className="mr-2" />
                Back to Login
              </Button>
            </Link>
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
            Forgot Password?
          </h2>
          
          <p className="text-white/60">
            No worries! Enter your email and we'll send you reset instructions.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email Address"
              type="email"
              name="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} className="mr-2" />
                  Send Reset Link
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

export default ForgotPasswordPage;
