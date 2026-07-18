import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Button from '../common/Button';

/**
 * Reusable Multi-Step Wizard Component
 * 
 * @param {Array} steps - Array of step objects { title, description, component }
 * @param {Object} data - Form data object
 * @param {Function} onDataChange - Callback when data changes
 * @param {Function} onComplete - Callback when wizard is completed
 * @param {boolean} loading - Loading state
 */
const Wizard = ({ steps, data, onDataChange, onComplete, loading = false }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    }
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Steps - Responsive */}
      <div className="mb-12">
        {/* Desktop: Horizontal Stepper */}
        <div className="hidden sm:flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={index} className="flex-1 flex items-center">
                {/* Step Circle */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                      transition-all duration-300
                      ${isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-indigo-500 text-white ring-4 ring-indigo-500/20'
                        : 'bg-white/5 text-white/40 border border-white/10'
                      }
                    `}
                  >
                    {isCompleted ? <Check size={18} /> : index + 1}
                  </div>
                  
                  {/* Step Label */}
                  <div className="mt-2 text-center">
                    <p
                      className={`
                        text-xs font-medium
                        ${isCurrent ? 'text-white' : 'text-white/50'}
                      `}
                    >
                      {step.title}
                    </p>
                  </div>
                </div>

                {/* Progress Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-3 mt-[-2rem]">
                    <div
                      className={`
                        h-full transition-all duration-300
                        ${isCompleted ? 'bg-emerald-500' : 'bg-white/10'}
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile: Compact Stepper */}
        <div className="sm:hidden flex items-center justify-center gap-2">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;

            return (
              <div key={index} className="flex items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
                    transition-all duration-300
                    ${isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-indigo-500 text-white ring-2 ring-indigo-500/20'
                      : 'bg-white/5 text-white/40 border border-white/10'
                    }
                  `}
                >
                  {isCompleted ? <Check size={14} /> : index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-4 h-0.5 ${isCompleted ? 'bg-emerald-500' : 'bg-white/10'}`} />
                )}
              </div>
            );
          })}
        </div>
        
        {/* Mobile: Current Step Label */}
        <div className="sm:hidden text-center mt-4">
          <p className="text-sm text-white font-medium">{steps[currentStep].title}</p>
          <p className="text-xs text-white/40 mt-1">{steps[currentStep].description}</p>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-[#0f1117] border border-white/10 rounded-2xl p-4 sm:p-8">
        {/* Step Header - Hidden on mobile since we show it above */}
        <div className="hidden sm:block mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {steps[currentStep].title}
          </h2>
          {steps[currentStep].description && (
            <p className="text-white/60 text-sm">
              {steps[currentStep].description}
            </p>
          )}
        </div>

        {/* Step Component */}
        <div className="mb-8">
          <CurrentStepComponent 
            data={data} 
            onChange={onDataChange}
            {...(steps[currentStep].props || {})}
          />
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={isFirstStep || loading}
          >
            <ChevronLeft size={18} className="mr-2" />
            Back
          </Button>

          {isLastStep ? (
            <Button
              variant="success"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Completing...
                </>
              ) : (
                <>
                  <Check size={18} className="mr-2" />
                  Finish Setup
                </>
              )}
            </Button>
          ) : (
            <Button variant="primary" onClick={handleNext} disabled={loading}>
              Next
              <ChevronRight size={18} className="ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Step Counter */}
      <div className="text-center mt-6 text-white/40 text-sm">
        Step {currentStep + 1} of {steps.length}
      </div>
    </div>
  );
};

export default Wizard;
