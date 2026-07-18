import { useState, useEffect } from 'react';
import { Settings, Save, Building2, MapPin, Clock, Palette, Shield } from 'lucide-react';
import CompanyBasicInfo from '../components/company/CompanyBasicInfo';
import CompanyLocation from '../components/company/CompanyLocation';
import CompanyWorkSchedule from '../components/company/CompanyWorkSchedule';
import Button from '../components/common/Button';
import PageHeader from '../components/common/PageHeader';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { api } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { validateWorkingHours } from '../utils/validation';

const TABS = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'location', label: 'Location', icon: MapPin },
  { id: 'working-hours', label: 'Working Hours', icon: Clock },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
];

/**
 * Company Settings Page
 * 
 * Allows CEO to edit company settings, HR to view only
 * Settings organized into tabs for better UX
 */
const CompanySettingsPage = () => {
  const { showToast } = useToast();
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    address: '',
    city: '',
    state: '',
    country: 'United States',
    postal_code: '',
    timezone: 'America/New_York',
    industry: '',
    company_size: '',
    working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    office_hours_start: '09:00',
    office_hours_end: '17:00',
    break_time_start: '',
    break_time_end: '',
    lunch_time_start: '',
    lunch_time_end: '',
    description: '',
  });

  // Check if user is CEO
  const isCEO = currentUser?.role === 'ceo';
  const isHR = currentUser?.role === 'hr';

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/organization/settings');
      
      // Map organization data to form
      const org = response.organization;
      setFormData({
        name: org.name || '',
        logo_url: org.logo_url || '',
        address: org.address || '',
        city: org.city || '',
        state: org.state || '',
        country: org.country || 'United States',
        postal_code: org.postal_code || '',
        timezone: org.timezone || 'America/New_York',
        industry: org.industry || '',
        company_size: org.company_size || '',
        working_days: org.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        office_hours_start: org.office_hours_start || '09:00',
        office_hours_end: org.office_hours_end || '17:00',
        break_time_start: org.break_time_start || '',
        break_time_end: org.break_time_end || '',
        lunch_time_start: org.lunch_time_start || '',
        lunch_time_end: org.lunch_time_end || '',
        description: org.description || '',
      });
    } catch (error) {
      showToast(error.message || 'Failed to load settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isCEO) {
      showToast('Only CEOs can modify company settings', 'error');
      return;
    }

    // Validate working hours before submission
    const validation = validateWorkingHours(formData);
    
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      setActiveTab('working-hours'); // Switch to the tab with errors
      showToast('Please fix validation errors before saving', 'error');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    
    try {
      await api.put('/organization/settings', formData);
      setValidationErrors([]);
      setSaveSuccess(true);
      showToast('Company settings updated successfully!', 'success');
      
      // Reset success state after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      showToast(error.message || 'Failed to update settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <p className="text-white/60 text-sm">
              Basic company information and industry details
            </p>
            <CompanyBasicInfo 
              data={formData} 
              onChange={isCEO ? setFormData : undefined} 
            />
          </div>
        );
      
      case 'location':
        return (
          <div className="space-y-6">
            <p className="text-white/60 text-sm">
              Company location, address, and timezone settings
            </p>
            <CompanyLocation 
              data={formData} 
              onChange={isCEO ? setFormData : undefined} 
            />
          </div>
        );
      
      case 'working-hours':
        return (
          <div className="space-y-6">
            <p className="text-white/60 text-sm">
              Configure working days, office hours, and break times
            </p>
            <CompanyWorkSchedule 
              data={formData} 
              onChange={isCEO ? setFormData : undefined}
              validationErrors={validationErrors}
            />
          </div>
        );
      
      case 'branding':
        return (
          <div className="space-y-6">
            <p className="text-white/60 text-sm">
              Company logo and visual identity
            </p>
            
            {/* Current Logo */}
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <label className="block text-xs font-medium text-white/50 mb-3 tracking-widest uppercase">
                Company Logo
              </label>
              
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden">
                  {formData.logo_url ? (
                    <img
                      src={formData.logo_url}
                      alt="Company Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-12 h-12 text-white/20" />
                  )}
                </div>
                
                <div>
                  <p className="text-white/80 font-medium mb-1">{formData.name || 'Company Name'}</p>
                  <p className="text-white/60 text-sm mb-2">
                    Logo is displayed in the application header and on reports
                  </p>
                  <p className="text-xs text-white/40">
                    To upload or change the logo, go to the General tab
                  </p>
                </div>
              </div>
            </div>
            
            {/* Future Branding Options */}
            <div className="space-y-4">
              <h3 className="text-white/80 font-medium text-sm">Brand Colors (Coming Soon)</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <label className="block text-xs font-medium text-white/50 mb-2 tracking-widest uppercase">
                    Primary Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-500 rounded-lg border border-white/10" />
                    <div className="text-white/40 text-sm">
                      #6366F1
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <label className="block text-xs font-medium text-white/50 mb-2 tracking-widest uppercase">
                    Secondary Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-violet-500 rounded-lg border border-white/10" />
                    <div className="text-white/40 text-sm">
                      #8B5CF6
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <label className="block text-xs font-medium text-white/50 mb-2 tracking-widest uppercase">
                  Company Theme
                </label>
                <div className="text-white/40 text-sm">
                  Dark theme (default)
                </div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <Palette className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-blue-200 font-medium text-sm mb-1">
                      Customization Coming Soon
                    </h3>
                    <p className="text-blue-200/70 text-sm">
                      Future releases will allow you to customize brand colors, themes, and visual elements
                      to match your company's identity.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'security':
        return (
          <div className="space-y-6">
            <p className="text-white/60 text-sm">
              Security and access control settings
            </p>
            
            {!isCEO && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-amber-200 font-medium text-sm mb-1">
                      CEO Access Only
                    </h3>
                    <p className="text-amber-200/70 text-sm">
                      Security settings can only be modified by the CEO. This includes password policies,
                      two-factor authentication, and session management.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Coming Soon Features */}
            <div className="space-y-4">
              <h3 className="text-white/80 font-medium text-sm">Security Features (Coming Soon)</h3>
              
              {/* Password Policy */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-white/40" />
                  <h4 className="text-white font-medium">Password Policy</h4>
                </div>
                <p className="text-white/40 text-sm">
                  Configure password requirements, expiration, and complexity rules
                </p>
              </div>
              
              {/* Two-Factor Authentication */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-white/40" />
                  <h4 className="text-white font-medium">Two-Factor Authentication</h4>
                </div>
                <p className="text-white/40 text-sm">
                  Require 2FA for all users or specific roles for enhanced security
                </p>
              </div>
              
              {/* Session Timeout */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-white/40" />
                  <h4 className="text-white font-medium">Session Timeout</h4>
                </div>
                <p className="text-white/40 text-sm">
                  Automatically log out inactive users after a specified period
                </p>
              </div>
              
              {/* Email Domain Restrictions */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-white/40" />
                  <h4 className="text-white font-medium">Email Domain Restrictions</h4>
                </div>
                <p className="text-white/40 text-sm">
                  Restrict user invitations to specific email domains
                </p>
              </div>
              
              {/* Audit Logs */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-white/40" />
                  <h4 className="text-white font-medium">Audit Logs</h4>
                </div>
                <p className="text-white/40 text-sm">
                  Track and review all system activities and user actions
                </p>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      <PageHeader
        title="Company Settings"
        subtitle={isCEO 
          ? "Manage your company information and preferences" 
          : "View company information (editing restricted to CEO)"
        }
        icon={Settings}
      />

      {/* Role Warning for HR */}
      {isHR && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-blue-200 font-medium text-sm mb-1">
                View-Only Access
              </h3>
              <p className="text-blue-200/70 text-sm">
                As an HR user, you can view company settings but cannot modify them. 
                Only the CEO can edit company settings.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl">
        {/* Tabs */}
        <div className="bg-[#0f1117] border border-white/10 rounded-2xl overflow-hidden">
          {/* Tab Headers */}
          <div className="flex border-b border-white/10 overflow-x-auto">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap
                    ${isActive
                      ? 'text-white bg-white/5 border-b-2 border-indigo-500'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-5 sm:p-8">
            {renderTabContent()}
          </div>
        </div>

        {/* Save Button (CEO Only) */}
        {isCEO && (
          <div className="flex justify-end mt-6">
            <Button
              variant={saveSuccess ? "success" : "primary"}
              onClick={handleSave}
              disabled={saving || saveSuccess}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : saveSuccess ? (
                <>
                  <Save size={18} className="mr-2" />
                  Saved
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanySettingsPage;
