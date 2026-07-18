import { Clock, Coffee, UtensilsCrossed, AlertCircle } from 'lucide-react';
import Checkbox from '../common/Checkbox';
import { getFieldError } from '../../utils/validation';

/**
 * Company Work Schedule Form
 * Reusable component for wizard and settings
 */
const CompanyWorkSchedule = ({ data, onChange, validationErrors = [] }) => {
  const readOnly = !onChange; // If onChange is undefined, form is read-only
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const workingDays = data.working_days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Get validation errors for specific fields
  const officeHoursError = getFieldError(validationErrors, 'office_hours');
  const breakTimeError = getFieldError(validationErrors, 'break_time');
  const lunchTimeError = getFieldError(validationErrors, 'lunch_time');
  const overlapError = getFieldError(validationErrors, 'overlap');

  const handleDayToggle = (day) => {
    if (!onChange) return;
    
    const newDays = workingDays.includes(day)
      ? workingDays.filter(d => d !== day)
      : [...workingDays, day];
    
    onChange({ ...data, working_days: newDays });
  };

  const handleChange = (e) => {
    if (onChange) {
      const { name, value } = e.target;
      onChange({ ...data, [name]: value });
    }
  };
  
  const applyPreset = (preset) => {
    if (!onChange) return;
    
    switch (preset) {
      case 'mon-fri':
        onChange({
          ...data,
          working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          office_hours_start: '09:00',
          office_hours_end: '17:00',
        });
        break;
      case 'mon-sat':
        onChange({
          ...data,
          working_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          office_hours_start: '09:00',
          office_hours_end: '17:00',
        });
        break;
      case 'all-week':
        onChange({
          ...data,
          working_days: allDays,
          office_hours_start: '00:00',
          office_hours_end: '23:59',
        });
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Working Day Presets */}
      {!readOnly && (
        <div>
          <label className="block text-xs font-medium text-white/50 mb-2 tracking-widest uppercase">
            Working Day Presets
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset('mon-fri')}
              className="px-4 py-2 bg-white/8 hover:bg-white/12 text-white/70 rounded-lg text-sm transition-colors"
            >
              Monday–Friday
            </button>
            
            <button
              type="button"
              onClick={() => applyPreset('mon-sat')}
              className="px-4 py-2 bg-white/8 hover:bg-white/12 text-white/70 rounded-lg text-sm transition-colors"
            >
              Monday–Saturday
            </button>
            
            <button
              type="button"
              onClick={() => applyPreset('all-week')}
              className="px-4 py-2 bg-white/8 hover:bg-white/12 text-white/70 rounded-lg text-sm transition-colors"
            >
              All Week
            </button>
          </div>
        </div>
      )}

      {/* Working Days */}
      <div>
        <label className="block text-xs font-medium text-white/50 mb-3 tracking-widest uppercase">
          Working Days
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {allDays.map(day => (
            <label
              key={day}
              className={`
                flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-all
                ${readOnly ? 'cursor-default' : 'cursor-pointer'}
                ${workingDays.includes(day)
                  ? 'bg-indigo-500/20 border-indigo-500 text-white'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/8'
                }
                ${readOnly && !workingDays.includes(day) ? 'opacity-40' : ''}
              `}
            >
              <input
                type="checkbox"
                checked={workingDays.includes(day)}
                onChange={() => handleDayToggle(day)}
                disabled={readOnly}
                className="hidden"
              />
              <span className="text-sm font-medium">{day.slice(0, 3)}</span>
            </label>
          ))}
        </div>
        <p className="text-xs text-white/40 mt-2">
          Select the days your company operates
        </p>
      </div>

      {/* Office Hours */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
            <Clock className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Office Hours</h3>
            <p className="text-xs text-white/40">Standard work hours for your company</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
              Start Time
            </label>
            <input
              type="time"
              name="office_hours_start"
              value={data.office_hours_start || '09:00'}
              onChange={handleChange}
              disabled={readOnly}
              className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                officeHoursError
                  ? 'border-red-500 focus:border-red-400 focus:ring-red-400/30'
                  : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-400/30'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
              End Time
            </label>
            <input
              type="time"
              name="office_hours_end"
              value={data.office_hours_end || '17:00'}
              onChange={handleChange}
              disabled={readOnly}
              className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                officeHoursError
                  ? 'border-red-500 focus:border-red-400 focus:ring-red-400/30'
                  : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-400/30'
              }`}
            />
          </div>
        </div>
        
        {/* Office Hours Error */}
        {officeHoursError && (
          <div className="mt-2 flex items-start gap-2 text-red-400 text-sm">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{officeHoursError}</span>
          </div>
        )}
      </div>

      {/* Break and Lunch Times (Optional) */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-medium">Break Times (Optional)</h3>
            <p className="text-xs text-white/40">Configure standard break and lunch times</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Break Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
                Morning Break Start
              </label>
              <input
                type="time"
                name="break_time_start"
                value={data.break_time_start || ''}
                onChange={handleChange}
                placeholder="10:30"
                disabled={readOnly}
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  breakTimeError || overlapError
                    ? 'border-red-500 focus:border-red-400 focus:ring-red-400/30'
                    : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-400/30'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
                Morning Break End
              </label>
              <input
                type="time"
                name="break_time_end"
                value={data.break_time_end || ''}
                onChange={handleChange}
                placeholder="10:45"
                disabled={readOnly}
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  breakTimeError || overlapError
                    ? 'border-red-500 focus:border-red-400 focus:ring-red-400/30'
                    : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-400/30'
                }`}
              />
            </div>
          </div>
          
          {/* Break Time Error */}
          {breakTimeError && (
            <div className="flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{breakTimeError}</span>
            </div>
          )}

          {/* Lunch Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
                Lunch Break Start
              </label>
              <input
                type="time"
                name="lunch_time_start"
                value={data.lunch_time_start || ''}
                onChange={handleChange}
                placeholder="12:00"
                disabled={readOnly}
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  lunchTimeError || overlapError
                    ? 'border-red-500 focus:border-red-400 focus:ring-red-400/30'
                    : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-400/30'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5 tracking-widest uppercase">
                Lunch Break End
              </label>
              <input
                type="time"
                name="lunch_time_end"
                value={data.lunch_time_end || ''}
                onChange={handleChange}
                placeholder="13:00"
                disabled={readOnly}
                className={`w-full bg-white/5 border rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-1 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                  lunchTimeError || overlapError
                    ? 'border-red-500 focus:border-red-400 focus:ring-red-400/30'
                    : 'border-white/10 focus:border-indigo-400 focus:ring-indigo-400/30'
                }`}
              />
            </div>
          </div>
          
          {/* Lunch Time Error */}
          {lunchTimeError && (
            <div className="flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{lunchTimeError}</span>
            </div>
          )}
          
          {/* Overlap Error */}
          {overlapError && (
            <div className="flex items-start gap-2 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{overlapError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyWorkSchedule;
