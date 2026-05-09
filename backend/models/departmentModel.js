/**
 * Department Model
 * 
 * Handles all database operations for departments.
 * Departments replace the free-text 'course' field with structured data.
 * 
 * Phase 1: Basic CRUD operations
 * Future phases will add:
 * - Department head management
 * - Employee count statistics
 * - Department-based reporting
 */

import { pool } from "../config/db.js";

const Department = {
  /**
   * Get all departments
   * @param {Object} options - Query options (filters, pagination)
   * @returns {Promise<Array>} Array of department objects
   */
  findAll: async (options = {}) => {
    try {
      let query = 'SELECT * FROM departments';
      const params = [];

      // Filter by active status if specified
      if (options.isActive !== undefined) {
        query += ' WHERE is_active = ?';
        params.push(options.isActive);
      }

      // Add ordering
      query += ' ORDER BY name ASC';

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching departments: ${error.message}`);
    }
  },

  // Alias for backward compatibility
  find: async (options = {}) => {
    return Department.findAll(options);
  },

  /**
   * Get department by ID
   * @param {number} id - Department ID
   * @returns {Promise<Object|null>} Department object or null if not found
   */
  findById: async (id) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM departments WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching department by ID: ${error.message}`);
    }
  },

  /**
   * Get department by name
   * @param {string} name - Department name
   * @returns {Promise<Object|null>} Department object or null if not found
   */
  findByName: async (name) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM departments WHERE name = ?',
        [name]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error fetching department by name: ${error.message}`);
    }
  },

  /**
   * Create new department
   * @param {Object} data - Department data
   * @returns {Promise<Object>} Created department object
   */
  create: async (data) => {
    try {
      const { name, description, is_active = true } = data;
      
      const [result] = await pool.execute(
        'INSERT INTO departments (name, description, is_active) VALUES (?, ?, ?)',
        [name, description || null, is_active]
      );

      return {
        id: result.insertId,
        name,
        description: description || null,
        is_active
      };
    } catch (error) {
      // Handle duplicate name error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Department with this name already exists');
      }
      throw new Error(`Error creating department: ${error.message}`);
    }
  },

  /**
   * Update department by ID
   * @param {number} id - Department ID
   * @param {Object} data - Updated department data
   * @param {Object} options - Options (e.g., { new: true } to return updated record)
   * @returns {Promise<Object|null>} Updated department object or null if not found
   */
  update: async (id, data, options = {}) => {
    try {
      const { name, description, head_id, is_active } = data;
      
      // Build dynamic update query
      const updates = [];
      const params = [];

      if (name !== undefined) {
        updates.push('name = ?');
        params.push(name);
      }
      if (description !== undefined) {
        updates.push('description = ?');
        params.push(description);
      }
      if (head_id !== undefined) {
        updates.push('head_id = ?');
        params.push(head_id);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(is_active);
      }

      if (updates.length === 0) {
        throw new Error('No fields to update');
      }

      params.push(id);

      const [result] = await pool.execute(
        `UPDATE departments SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return null;
      }

      // Return updated record if requested
      if (options.new) {
        return await Department.findById(id);
      }

      return { id: parseInt(id), ...data };
    } catch (error) {
      // Handle duplicate name error
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Department with this name already exists');
      }
      throw new Error(`Error updating department: ${error.message}`);
    }
  },

  // Alias for backward compatibility
  findByIdAndUpdate: async (id, data, options = {}) => {
    return Department.update(id, data, options);
  },

  /**
   * Delete department by ID
   * Note: This sets department_id to NULL for associated employees (ON DELETE SET NULL)
   * @param {number} id - Department ID
   * @returns {Promise<Object|null>} Deleted department info or null if not found
   */
  delete: async (id) => {
    try {
      // Check if department has employees
      const employeeCount = await Department.getEmployeeCount(id);
      if (employeeCount > 0) {
        throw new Error(`Cannot delete department with ${employeeCount} assigned employee(s). Please reassign employees first.`);
      }

      const [result] = await pool.execute(
        'DELETE FROM departments WHERE id = ?',
        [id]
      );

      return result.affectedRows > 0 ? { id: parseInt(id) } : null;
    } catch (error) {
      throw error;
    }
  },

  // Alias for backward compatibility
  findByIdAndDelete: async (id) => {
    return Department.delete(id);
  },

  /**
   * Get all employees in a department
   * @param {number} departmentId - Department ID
   * @returns {Promise<Array>} Array of employee objects
   */
  getEmployees: async (departmentId) => {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM employees WHERE department_id = ? ORDER BY name ASC',
        [departmentId]
      );
      return rows;
    } catch (error) {
      throw new Error(`Error fetching department employees: ${error.message}`);
    }
  },

  /**
   * Get employee count for a department
   * @param {number} departmentId - Department ID
   * @returns {Promise<number>} Number of employees
   */
  getEmployeeCount: async (departmentId) => {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM employees WHERE department_id = ?',
        [departmentId]
      );
      return rows[0].count;
    } catch (error) {
      throw new Error(`Error counting department employees: ${error.message}`);
    }
  },

  /**
   * Get department statistics including employee counts and status breakdown
   * @param {number} departmentId - Department ID (optional, if provided returns stats for specific department)
   * @returns {Promise<Object>} Department statistics
   */
  getStats: async (departmentId) => {
    try {
      if (departmentId) {
        // Get stats for specific department
        const [rows] = await pool.execute(`
          SELECT 
            d.id,
            d.name,
            d.description,
            d.is_active,
            COUNT(e.id) as total_employees,
            SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as active_employees,
            SUM(CASE WHEN e.status = 'inactive' THEN 1 ELSE 0 END) as inactive_employees,
            SUM(CASE WHEN e.status = 'on_leave' THEN 1 ELSE 0 END) as on_leave_employees,
            AVG(e.salary) as average_salary
          FROM departments d
          LEFT JOIN employees e ON d.id = e.department_id
          WHERE d.id = ?
          GROUP BY d.id, d.name, d.description, d.is_active
        `, [departmentId]);
        
        if (rows.length === 0) {
          return null;
        }
        
        return {
          ...rows[0],
          average_salary: rows[0].average_salary ? parseFloat(rows[0].average_salary).toFixed(2) : null
        };
      } else {
        // Get stats for all departments
        const [rows] = await pool.execute(`
          SELECT 
            d.id,
            d.name,
            d.is_active,
            COUNT(e.id) as employee_count,
            SUM(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as active_employees
          FROM departments d
          LEFT JOIN employees e ON d.id = e.department_id
          GROUP BY d.id, d.name, d.is_active
          ORDER BY d.name ASC
        `);
        return rows;
      }
    } catch (error) {
      throw new Error(`Error fetching department statistics: ${error.message}`);
    }
  },

  /**
   * Get department statistics (legacy method)
   * @returns {Promise<Array>} Array of departments with employee counts
   */
  getStatistics: async () => {
    try {
      const [rows] = await pool.execute(`
        SELECT 
          d.id,
          d.name,
          d.is_active,
          COUNT(e.id) as employee_count
        FROM departments d
        LEFT JOIN employees e ON d.id = e.department_id
        GROUP BY d.id, d.name, d.is_active
        ORDER BY d.name ASC
      `);
      return rows;
    } catch (error) {
      throw new Error(`Error fetching department statistics: ${error.message}`);
    }
  }
};

export default Department;
