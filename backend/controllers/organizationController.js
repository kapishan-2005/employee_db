/**
 * Organization Controller
 * 
 * Handles company/organization settings operations
 */

import Organization from '../models/organizationModel.js';
import { validateWorkingHours } from '../utils/timeValidation.js';

/**
 * Get organization settings
 * GET /api/organization/settings
 * 
 * Requires authentication (CEO/HR)
 */
export const getSettings = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    const organization = await Organization.findById(organizationId);

    if (!organization) {
      return res.status(404).json({
        error: 'Organization not found'
      });
    }

    // Parse working_days JSON if it's a string
    if (typeof organization.working_days === 'string') {
      try {
        organization.working_days = JSON.parse(organization.working_days);
      } catch (e) {
        organization.working_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      }
    }

    res.json({
      success: true,
      organization
    });
  } catch (error) {
    console.error('Get organization settings error:', error);
    res.status(500).json({
      error: error.message || 'Error fetching organization settings'
    });
  }
};

/**
 * Update organization settings
 * PUT /api/organization/settings
 * 
 * Requires authentication (CEO only)
 */
export const updateSettings = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const {
      name,
      logo_url,
      address,
      city,
      state,
      country,
      postal_code,
      timezone,
      industry,
      company_size,
      working_days,
      office_hours_start,
      office_hours_end,
      break_time_start,
      break_time_end,
      lunch_time_start,
      lunch_time_end,
      description,
    } = req.body;

    // Normalize optional time fields (convert empty strings to null)
    const normalizeTime = (value) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      return value;
    };

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (postal_code !== undefined) updateData.postal_code = postal_code;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (industry !== undefined) updateData.industry = industry;
    if (company_size !== undefined) updateData.company_size = company_size;
    if (working_days !== undefined) updateData.working_days = working_days;
    if (office_hours_start !== undefined) updateData.office_hours_start = office_hours_start;
    if (office_hours_end !== undefined) updateData.office_hours_end = office_hours_end;
    if (break_time_start !== undefined) updateData.break_time_start = normalizeTime(break_time_start);
    if (break_time_end !== undefined) updateData.break_time_end = normalizeTime(break_time_end);
    if (lunch_time_start !== undefined) updateData.lunch_time_start = normalizeTime(lunch_time_start);
    if (lunch_time_end !== undefined) updateData.lunch_time_end = normalizeTime(lunch_time_end);
    if (description !== undefined) updateData.description = description;

    // Validate working hours if any time fields are being updated
    if (office_hours_start !== undefined || office_hours_end !== undefined ||
        break_time_start !== undefined || break_time_end !== undefined ||
        lunch_time_start !== undefined || lunch_time_end !== undefined) {
      
      // Get current organization data to fill in missing fields
      const currentOrg = await Organization.findById(organizationId);
      
      const dataToValidate = {
        office_hours_start: updateData.office_hours_start ?? currentOrg.office_hours_start,
        office_hours_end: updateData.office_hours_end ?? currentOrg.office_hours_end,
        break_time_start: updateData.break_time_start ?? currentOrg.break_time_start,
        break_time_end: updateData.break_time_end ?? currentOrg.break_time_end,
        lunch_time_start: updateData.lunch_time_start ?? currentOrg.lunch_time_start,
        lunch_time_end: updateData.lunch_time_end ?? currentOrg.lunch_time_end,
      };
      
      const validation = validateWorkingHours(dataToValidate);
      
      if (!validation.valid) {
        return res.status(400).json({
          error: 'Validation failed',
          validationErrors: validation.errors
        });
      }
    }

    const organization = await Organization.updateSettings(organizationId, updateData);

    // Parse working_days JSON if it's a string
    if (typeof organization.working_days === 'string') {
      try {
        organization.working_days = JSON.parse(organization.working_days);
      } catch (e) {
        organization.working_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      }
    }

    res.json({
      success: true,
      message: 'Organization settings updated successfully',
      organization
    });
  } catch (error) {
    console.error('Update organization settings error:', error);
    res.status(500).json({
      error: error.message || 'Error updating organization settings'
    });
  }
};

/**
 * Complete organization setup
 * POST /api/organization/complete-setup
 * 
 * Marks the initial setup wizard as completed
 * Requires authentication (CEO only)
 */
export const completeSetup = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const settingsData = req.body;

    // Normalize optional time fields (convert empty strings to null)
    const normalizeTime = (value) => {
      if (value === '' || value === null || value === undefined) {
        return null;
      }
      return value;
    };

    // Normalize time fields before validation
    const normalizedData = {
      ...settingsData,
      break_time_start: normalizeTime(settingsData.break_time_start),
      break_time_end: normalizeTime(settingsData.break_time_end),
      lunch_time_start: normalizeTime(settingsData.lunch_time_start),
      lunch_time_end: normalizeTime(settingsData.lunch_time_end),
    };

    // Validate working hours before completing setup
    const validation = validateWorkingHours(normalizedData);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Validation failed',
        validationErrors: validation.errors
      });
    }

    // Update all settings first (with normalized data)
    await Organization.updateSettings(organizationId, normalizedData);

    // Mark setup as complete
    await Organization.markSetupComplete(organizationId);

    const organization = await Organization.findById(organizationId);

    // Parse working_days JSON if it's a string
    if (typeof organization.working_days === 'string') {
      try {
        organization.working_days = JSON.parse(organization.working_days);
      } catch (e) {
        organization.working_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
      }
    }

    res.json({
      success: true,
      message: 'Company setup completed successfully! Welcome aboard.',
      organization
    });
  } catch (error) {
    console.error('Complete setup error:', error);
    res.status(500).json({
      error: error.message || 'Error completing setup'
    });
  }
};

/**
 * Check setup status
 * GET /api/organization/setup-status
 * 
 * Returns whether the organization has completed initial setup
 * Requires authentication
 */
export const getSetupStatus = async (req, res) => {
  try {
    const organizationId = req.user.organization_id;

    const isComplete = await Organization.isSetupComplete(organizationId);

    res.json({
      success: true,
      setupCompleted: isComplete
    });
  } catch (error) {
    console.error('Get setup status error:', error);
    res.status(500).json({
      error: error.message || 'Error checking setup status'
    });
  }
};
