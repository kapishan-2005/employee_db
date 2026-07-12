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
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    isAdminOrManager: role === 'admin' || role === 'manager',
    isCEOOrAdmin: role === 'ceo' || role === 'admin',
    isCEOAdminOrManager: role === 'ceo' || role === 'admin' || role === 'manager',

    // Employee permissions
    canCreateEmployee: role === 'ceo' || role === 'admin' || role === 'manager',
    canEditEmployee: role === 'ceo' || role === 'admin' || role === 'manager',
    canDeleteEmployee: role === 'ceo' || role === 'admin',
    canViewEmployees: true, // All authenticated users

    // Department permissions
    canCreateDepartment: role === 'ceo' || role === 'admin',
    canEditDepartment: role === 'ceo' || role === 'admin',
    canDeleteDepartment: role === 'ceo' || role === 'admin',
    canViewDepartments: true, // All authenticated users

    // Attendance permissions
    canCheckIn: true, // All authenticated users
    canCheckOut: true, // All authenticated users
    canEditAttendance: role === 'ceo' || role === 'admin' || role === 'manager',
    canViewAllAttendance: role === 'ceo' || role === 'admin' || role === 'manager',
    canViewOwnAttendance: true, // All authenticated users
    canViewReports: role === 'ceo' || role === 'admin' || role === 'manager',

    // AI permissions
    canGenerateInsights: role === 'ceo' || role === 'admin',
    canAnalyzePerformance: role === 'ceo' || role === 'admin' || role === 'manager',
    canUseRecruitmentAI: role === 'ceo' || role === 'admin',

    // Current user info
    currentRole: role,
    employeeId: currentUser?.employee_id,
  };
};

export default usePermissions;
