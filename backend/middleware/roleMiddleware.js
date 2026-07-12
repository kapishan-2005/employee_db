/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Restricts access to routes based on user roles.
 * Must be used AFTER authMiddleware (requires req.user to be set).
 * 
 * Usage:
 * - Add after authMiddleware to restrict by role
 * - Specify allowed roles as arguments
 * 
 * Example:
 * router.delete('/employees/:id', authMiddleware, requireRole('admin'), controller.delete);
 * router.post('/employees', authMiddleware, requireRole('admin', 'manager'), controller.create);
 */

/**
 * Require specific role(s) to access route
 * @param {...string} allowedRoles - Roles that are allowed (admin, manager, employee)
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Only admin can access
 * router.delete('/users/:id', authMiddleware, requireRole('admin'), deleteUser);
 * 
 * @example
 * // Admin or manager can access
 * router.post('/employees', authMiddleware, requireRole('admin', 'manager'), createEmployee);
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated (set by authMiddleware)
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
          error: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
        });
      }

      // User has required role, continue
      next();
    } catch (error) {
      return res.status(500).json({ 
        error: error.message || 'Error checking role permissions' 
      });
    }
  };
};

/**
 * Require admin role
 * Shorthand for requireRole('admin')
 */
export const requireAdmin = requireRole('admin');

/**
 * Require CEO role only
 * Shorthand for requireRole('ceo')
 */
export const requireCEO = requireRole('ceo');

/**
 * Require CEO or admin role
 * Shorthand for requireRole('ceo', 'admin')
 */
export const requireCEOOrAdmin = requireRole('ceo', 'admin');

/**
 * Require admin or manager role
 * Shorthand for requireRole('admin', 'manager')
 */
export const requireAdminOrManager = requireRole('admin', 'manager');

/**
 * Require CEO, admin, or manager role
 * Shorthand for requireRole('ceo', 'admin', 'manager')
 */
export const requireCEOAdminOrManager = requireRole('ceo', 'admin', 'manager');

/**
 * Check if user is accessing their own resource
 * Useful for routes like /users/:id where users can only access their own data
 * 
 * @param {string} paramName - Name of the route parameter (default: 'id')
 * @returns {Function} Express middleware function
 * 
 * @example
 * // User can only access their own profile
 * router.get('/users/:id', authMiddleware, requireSelfOrAdmin('id'), getUser);
 */
export const requireSelfOrAdmin = (paramName = 'id') => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          error: 'Authentication required' 
        });
      }

      const resourceId = parseInt(req.params[paramName]);
      const userId = req.user.id;

      // Allow if user is ceo/admin or accessing their own resource
      if (req.user.role === 'ceo' || req.user.role === 'admin' || userId === resourceId) {
        return next();
      }

      return res.status(403).json({ 
        error: 'Access denied. You can only access your own resources.' 
      });
    } catch (error) {
      return res.status(500).json({ 
        error: error.message || 'Error checking permissions' 
      });
    }
  };
};

/**
 * Check if user is accessing their own employee record
 * Useful for employee routes where employees can only access their own data
 * 
 * @example
 * // Employee can only view their own attendance
 * router.get('/attendance/:employeeId', authMiddleware, requireOwnEmployeeOrAdmin, getAttendance);
 */
export const requireOwnEmployeeOrAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    const employeeId = parseInt(req.params.employeeId || req.params.id);
    const userEmployeeId = req.user.employee_id;

    // Allow if user is ceo/admin/manager or accessing their own employee record
    if (
      req.user.role === 'ceo' ||
      req.user.role === 'admin' || 
      req.user.role === 'manager' || 
      userEmployeeId === employeeId
    ) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Access denied. You can only access your own employee data.' 
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message || 'Error checking permissions' 
    });
  }
};

export default requireRole;
