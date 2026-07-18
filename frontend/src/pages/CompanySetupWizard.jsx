import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Check, ChevronRight } from 'lucide-react';
import Wizard from '../components/wizard/Wizard';
import CompanyBasicInfo from '../components/company/CompanyBasicInfo';
import CompanyLocation from '../components/company/CompanyLocation';
import CompanyWorkSchedule from '../components/company/CompanyWorkSchedule';
import { api } from '../services/api';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { validateWorkingHours } from '../utils/validation';

/**
 * Company Setup Wizard
 * 
 * Multi-step wizard that appears once after CEO first login
 * Collects company configuration and settings
 */
const CompanySetupWizard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentUser, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [formData, setFormData] = useState({
    name: currentUser?.companyName || '',
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

  const wizardSteps = [
    {
      title: 'Company Info',
      description: 'Tell us about your company',
      component: CompanyBasicInfo,
      props: {},
    },
    {
      title: 'Location',
      description: 'Where is your company located?',
      component: CompanyLocation,
      props: {},
    },
    {
      title: 'Work Schedule',
      description: 'Set your working days and hours',
      component: CompanyWorkSchedule,
      props: { validationErrors },
    },
  ];

  const handleDataChange = (newData) => {
    setFormData(newData);
    
    // Clear validation errors when data changes
    if (validationErrors.length > 0) {
      const validation = validateWorkingHours(newData);
      setValidationErrors(validation.errors);
    }
  };

  const handleComplete = async () => {
    // Validate working hours before submission
    const validation = validateWorkingHours(formData);
    
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      showToast('Please fix validation errors before continuing', 'error');
      return;
    }
    
    setLoading(true);

    try {
      await api.post('/organization/complete-setup', formData);
      
      // Update user's setupComplete status in AuthContext
      if (currentUser) {
        updateUser({
          ...currentUser,
          setupComplete: true,
        });
      }
      
      // Show completion screen instead of immediate redirect
      setCompleted(true);
    } catch (error) {
      showToast(error.message || 'Failed to complete setup', 'error');
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate('/ceo/dashboard', { replace: true });
  };

  // Show completion screen
  if (completed) {
    return (
      <div className="min-h-screen bg-[#080a0f] text-white flex items-center justify-center py-12 px-4">
        {/* Background effects */}
        <div className="pointer-events-none fixed inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
        <div className="pointer-events-none fixed top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl" />
        <div className="pointer-events-none fixed bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full mb-8 animate-[scale-in_0.5s_ease-out]">
            <Check className="w-12 h-12 text-white" />
          </div>
          
          {/* Success Message */}
          <h1 className="text-4xl font-bold tracking-tight mb-4 animate-[fade-in_0.6s_ease-out_0.2s_both]">
            Company Setup Completed!
          </h1>
          
          <p className="text-white/60 text-lg mb-8 animate-[fade-in_0.6s_ease-out_0.4s_both]">
            Your workspace is ready. You can now start managing your organization.
          </p>
          
          {/* Action Button */}
          <button
            onClick={handleGoToDashboard}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white font-semibold rounded-xl transition-all transform hover:scale-105 animate-[fade-in_0.6s_ease-out_0.6s_both]"
          >
            Go to Dashboard
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0f] text-white py-12 px-4">
      {/* Background effects */}
      <div className="pointer-events-none fixed inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
      <div className="pointer-events-none fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />

      <div className="relative max-w-5xl mx-auto">
        {/* Exit link */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-8 transition-colors"
        >
          <ChevronRight size={16} className="rotate-180" />
          Exit to Home
        </button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Employee Manager
            </span>
          </h1>
          
          <p className="text-white/60 text-lg">
            Let's set up your company in just 3 easy steps
          </p>
        </div>

        {/* Wizard */}
        <Wizard
          steps={wizardSteps}
          data={formData}
          onDataChange={handleDataChange}
          onComplete={handleComplete}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CompanySetupWizard;
