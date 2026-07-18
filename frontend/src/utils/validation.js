/**
 * Validation Utilities
 * 
 * Reusable validation functions for company settings
 */

/**
 * Convert time string to minutes since midnight for comparison
 */
const timeToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Validate working hours configuration
 * 
 * @param {Object} data - Form data containing time fields
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export const validateWorkingHours = (data) => {
  const errors = [];
  
  const officeStart = timeToMinutes(data.office_hours_start);
  const officeEnd = timeToMinutes(data.office_hours_end);
  const breakStart = timeToMinutes(data.break_time_start);
  const breakEnd = timeToMinutes(data.break_time_end);
  const lunchStart = timeToMinutes(data.lunch_time_start);
  const lunchEnd = timeToMinutes(data.lunch_time_end);

  // Validate office hours
  if (officeStart !== null && officeEnd !== null) {
    if (officeEnd <= officeStart) {
      errors.push({
        field: 'office_hours',
        message: 'Office end time must be later than start time'
      });
    }
  }

  // Validate morning break (both or neither)
  const hasBreakStart = !!data.break_time_start;
  const hasBreakEnd = !!data.break_time_end;
  
  if (hasBreakStart !== hasBreakEnd) {
    errors.push({
      field: 'break_time',
      message: 'Both break start and end times must be provided together'
    });
  } else if (hasBreakStart && hasBreakEnd) {
    // Both provided, validate them
    if (breakEnd <= breakStart) {
      errors.push({
        field: 'break_time',
        message: 'Break end time must be later than start time'
      });
    }
    
    // Break must be within office hours
    if (officeStart !== null && officeEnd !== null) {
      if (breakStart < officeStart || breakEnd > officeEnd) {
        errors.push({
          field: 'break_time',
          message: 'Morning break must be within office hours'
        });
      }
    }
  }

  // Validate lunch time (both or neither)
  const hasLunchStart = !!data.lunch_time_start;
  const hasLunchEnd = !!data.lunch_time_end;
  
  if (hasLunchStart !== hasLunchEnd) {
    errors.push({
      field: 'lunch_time',
      message: 'Both lunch start and end times must be provided together'
    });
  } else if (hasLunchStart && hasLunchEnd) {
    // Both provided, validate them
    if (lunchEnd <= lunchStart) {
      errors.push({
        field: 'lunch_time',
        message: 'Lunch end time must be later than start time'
      });
    }
    
    // Lunch must be within office hours
    if (officeStart !== null && officeEnd !== null) {
      if (lunchStart < officeStart || lunchEnd > officeEnd) {
        errors.push({
          field: 'lunch_time',
          message: 'Lunch break must be within office hours'
        });
      }
    }
  }

  // Check for overlap between break and lunch
  if (hasBreakStart && hasBreakEnd && hasLunchStart && hasLunchEnd) {
    // Check if intervals overlap
    const breaksOverlap = (
      (breakStart < lunchEnd && breakEnd > lunchStart) ||
      (lunchStart < breakEnd && lunchEnd > breakStart)
    );
    
    if (breaksOverlap) {
      errors.push({
        field: 'overlap',
        message: 'Morning break and lunch time must not overlap'
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get user-friendly error message for a specific field
 */
export const getFieldError = (errors, field) => {
  const error = errors.find(e => e.field === field);
  return error ? error.message : null;
};
