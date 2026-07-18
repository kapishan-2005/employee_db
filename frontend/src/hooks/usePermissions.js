import { useAuth } from '../context/AuthContext';

/**
 * Custom hook for checking user permissions based on role
 * 
 * Roles hierarchy:
 * - admin: Full access to everything
 * - manager: Can manage employees and attendance, view departments
 * - employee: Can only view own attendance
 */
export const usePermissions = () => {
  const { currentUser } = useAuth();

  const role = currentUser?.role || 'employee';

  return {
    // Role checks
    isCEO: role === 'ceo',
    isHR: role === 'hr',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    isHROrManager: role === 'hr' || role === 'manager',
    isCEOOrHR: role === 'ceo' || role === 'hr',
    isCEOHROrManager: role === 'ceo' || role === 'hr' || role === 'manager',

    // Employee permissions
    canCreateEmployee: role === 'ceo' || role === 'hr',
    canEditEmployee: role === 'ceo' || role === 'hr',
    canDeleteEmployee: role === 'ceo',
    canViewEmployees: true, // All authenticated users (filtered by role)
    canViewAllEmployees: role === 'ceo' || role === 'hr',
    canViewDepartmentEmployees: role === 'manager',
    canViewOwnProfile: true,

    // Department permissions
    canCreateDepartment: role === 'ceo' || role === 'hr',
    canEditDepartment: role === 'ceo' || role === 'hr',
    canDeleteDepartment: role === 'ceo',
    canAssignManager: role === 'ceo',
    canToggleStatus: role === 'ceo',
    canViewDepartments: true, // All authenticated users
    canViewDepartmentStats: role === 'ceo' || role === 'hr',

    // Attendance permissions
    canCheckIn: true, // All authenticated users
    canCheckOut: true, // All authenticated users
    canEditAttendance: role === 'ceo' || role === 'hr' || role === 'manager',
    canViewAllAttendance: role === 'ceo' || role === 'hr' || role === 'manager',
    canViewOwnAttendance: true, // All authenticated users
    canViewReports: role === 'ceo' || role === 'hr' || role === 'manager',

    // AI permissions
    canGenerateInsights: role === 'ceo' || role === 'hr',
    canAnalyzePerformance: role === 'ceo' || role === 'hr' || role === 'manager',
    canUseRecruitmentAI: role === 'ceo' || role === 'hr',

    // Current user info
    currentRole: role,
    employeeId: currentUser?.employee_id,
  };
};

export default usePermissions;
