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
    isAdmin: role === 'admin',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    isAdminOrManager: role === 'admin' || role === 'manager',

    // Employee permissions
    canCreateEmployee: role === 'admin' || role === 'manager',
    canEditEmployee: role === 'admin' || role === 'manager',
    canDeleteEmployee: role === 'admin',
    canViewEmployees: true, // All authenticated users

    // Department permissions
    canCreateDepartment: role === 'admin',
    canEditDepartment: role === 'admin',
    canDeleteDepartment: role === 'admin',
    canViewDepartments: true, // All authenticated users

    // Attendance permissions
    canCheckIn: true, // All authenticated users
    canCheckOut: true, // All authenticated users
    canEditAttendance: role === 'admin' || role === 'manager',
    canViewAllAttendance: role === 'admin' || role === 'manager',
    canViewOwnAttendance: true, // All authenticated users
    canViewReports: role === 'admin' || role === 'manager',

    // Current user info
    currentRole: role,
    employeeId: currentUser?.employee_id,
  };
};

export default usePermissions;
