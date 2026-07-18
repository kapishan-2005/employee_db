import { useState } from 'react';
import { Lock, Eye, EyeOff, X } from 'lucide-react';
import { api } from '../../services/api';
import Button from '../common/Button';
import Input from '../common/Input';
import { useToast } from '../../hooks/useToast';

/**
 * Change Password Modal
 * 
 * Allows authenticated users to change their password
 * 
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onSuccess - Callback when password is changed successfully
 */
const ChangePasswordModal = ({ onClose, onSuccess }) => {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = () => {
    if (!formData.currentPassword) {
      showToast('Please enter your current password', 'warning');
      return false;
    }
    
    if (formData.newPassword.length < 8) {
      showToast('New password must be at least 8 characters long', 'warning');
      return false;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      showToast('New passwords do not match', 'warning');
      return false;
    }
    
    if (formData.currentPassword === formData.newPassword) {
      showToast('New password must be different from current password', 'warning');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      
      showToast('Password changed successfully!', 'success');
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      showToast(error.message || 'Failed to change password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-50 w-full max-w-md bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-8 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-indigo-400" />
            </div>
            <h2 className="text-xl font-semibold text-white">Change Password</h2>
          </div>
          
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div className="relative">
            <Input
              label="Current Password"
              type={showPasswords.current ? 'text' : 'password'}
              name="currentPassword"
              placeholder="Enter current password"
              value={formData.currentPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('current')}
              className="absolute right-3 top-9 text-white/40 hover:text-white transition-colors"
            >
              {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* New Password */}
          <div className="relative">
            <Input
              label="New Password"
              type={showPasswords.new ? 'text' : 'password'}
              name="newPassword"
              placeholder="Enter new password"
              value={formData.newPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('new')}
              className="absolute right-3 top-9 text-white/40 hover:text-white transition-colors"
            >
              {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm New Password */}
          <div className="relative">
            <Input
              label="Confirm New Password"
              type={showPasswords.confirm ? 'text' : 'password'}
              name="confirmPassword"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirm')}
              className="absolute right-3 top-9 text-white/40 hover:text-white transition-colors"
            >
              {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Requirements */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <p className="text-xs text-white/50 font-medium mb-2">Password must:</p>
            <ul className="text-xs text-white/40 space-y-1">
              <li className={formData.newPassword.length >= 8 ? 'text-emerald-400' : ''}>
                • Be at least 8 characters long
              </li>
              <li className={formData.newPassword && formData.newPassword === formData.confirmPassword ? 'text-emerald-400' : ''}>
                • Match the confirmation
              </li>
              <li className={formData.currentPassword && formData.newPassword && formData.currentPassword !== formData.newPassword ? 'text-emerald-400' : ''}>
                • Be different from current password
              </li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              className="flex-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Changing...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
