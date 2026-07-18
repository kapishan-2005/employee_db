import Employee from "../models/employeeModel.js";
import User from "../models/userModel.js";
import { pool } from "../config/db.js";

// Validation helper
const validateEmail = (email) => {
  if (!email) return true; // Optional field
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validateStatus = (status) => {
  if (!status) return true; // Optional field
  return ['active', 'inactive', 'on_leave'].includes(status);
};

const validatePhone = (phone) => {
  if (!phone) return true; // Optional field
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.length >= 7 && phone.length <= 20;
};

/**
 * GET ALL EMPLOYEES
 * 
 * Role-based filtering:
 * - CEO/HR: View all employees in organization
 * - Manager: View employees in their assigned department only
 * - Employee: View only themselves
 */
export const getAllEmployees = async (req, res) => {
  try {
    const { page, limit, search, status, department_id } = req.query;
    const { role, id: userId, organization_id } = req.user;
    
    // Validate query parameters
    if (status && !validateStatus(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: active, inactive, or on_leave"
      });
    }
    
    if (department_id && isNaN(department_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department_id. Must be a number"
      });
    }
    
    // Build query options
    const options = {
      page: page || 1,
      limit: limit || 10,
      search: search || '',
      status: status || '',
      department_id: department_id || '',
      organization_id
    };
    
    // Role-based filtering
    if (role === 'manager') {
      // Manager: only employees in their department
      // First, find which department(s) they manage
      const [deptRows] = await pool.execute(
        'SELECT id FROM departments WHERE manager_id = ? AND organization_id = ?',
        [userId, organization_id]
      );
      
      if (deptRows.length === 0) {
        // Manager not assigned to any department, return empty
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
            total: 0,
            totalPages: 0
          }
        });
      }
      
      // Override department_id filter with manager's department
      options.department_id = deptRows[0].id;
    } else if (role === 'employee') {
      // Employee: only view themselves
      // Find their employee record
      const user = await User.findById(userId);
      if (!user || !user.employee_id) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: parseInt(options.page),
            limit: parseInt(options.limit),
            total: 0,
            totalPages: 0
          }
        });
      }
      
      // Return only their own record
      const employee = await Employee.findById(user.employee_id, organization_id);
      if (!employee) {
        return res.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 1,
            total: 0,
            totalPages: 0
          }
        });
      }
      
      return res.json({
        success: true,
        data: [employee],
        pagination: {
          page: 1,
          limit: 1,
          total: 1,
          totalPages: 1
        }
      });
    }
    // CEO and HR see all employees
    
    const result = await Employee.find(options);
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET EMPLOYEE BY ID
 * 
 * Role-based access:
 * - CEO/HR: View any employee in organization
 * - Manager: View employees in their department only
 * - Employee: View only themselves
 */
export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId, organization_id } = req.user;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee ID"
      });
    }

    const employee = await Employee.findById(id, organization_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // Role-based access control
    if (role === 'manager') {
      // Manager can only view employees in their department
      const [deptRows] = await pool.execute(
        'SELECT id FROM departments WHERE manager_id = ? AND organization_id = ?',
        [userId, organization_id]
      );
      
      if (deptRows.length === 0 || !deptRows.some(d => d.id === employee.department_id)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only view employees in your department."
        });
      }
    } else if (role === 'employee') {
      // Employee can only view themselves
      const user = await User.findById(userId);
      if (!user || user.employee_id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only view your own profile."
        });
      }
    }
    // CEO and HR can view any employee

    res.json({
      success: true,
      data: employee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// CREATE - supports both old (name, course, roll_no) and new fields
export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      course,
      roll_no,
      email,
      phone,
      department_id,
      position,
      hire_date,
      salary,
      status,
      address,
      profile_picture
    } = req.body;

    // Required fields validation (backward compatible)
    if (!name || !course || !roll_no) {
      return res.status(400).json({
        success: false,
        error: "Required fields: name, course, roll_no"
      });
    }

    // Optional field validations
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone format"
      });
    }

    if (status && !validateStatus(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: active, inactive, or on_leave"
      });
    }

    if (department_id && isNaN(department_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department_id. Must be a number"
      });
    }

    if (salary && (isNaN(salary) || salary < 0)) {
      return res.status(400).json({
        success: false,
        error: "Invalid salary. Must be a positive number"
      });
    }

    if (hire_date && isNaN(Date.parse(hire_date))) {
      return res.status(400).json({
        success: false,
        error: "Invalid hire_date format. Use YYYY-MM-DD"
      });
    }

    const employee = await Employee.create({
      name,
      course,
      roll_no,
      email,
      phone,
      department_id,
      position,
      hire_date,
      salary,
      status,
      address,
      profile_picture,
      organization_id: req.user.organization_id
    });

    res.status(201).json({
      success: true,
      data: employee,
      message: "Employee created successfully"
    });
  } catch (error) {
    // Handle duplicate entry errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: "Employee with this roll_no or email already exists"
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// PUT - full update (backward compatible)
export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      course,
      roll_no,
      email,
      phone,
      department_id,
      position,
      hire_date,
      salary,
      status,
      address,
      profile_picture
    } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee ID"
      });
    }

    // Required fields validation (backward compatible)
    if (!name || !course || !roll_no) {
      return res.status(400).json({
        success: false,
        error: "Required fields: name, course, roll_no"
      });
    }

    // Optional field validations
    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone format"
      });
    }

    if (status && !validateStatus(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: active, inactive, or on_leave"
      });
    }

    if (department_id && isNaN(department_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department_id. Must be a number"
      });
    }

    if (salary && (isNaN(salary) || salary < 0)) {
      return res.status(400).json({
        success: false,
        error: "Invalid salary. Must be a positive number"
      });
    }

    if (hire_date && isNaN(Date.parse(hire_date))) {
      return res.status(400).json({
        success: false,
        error: "Invalid hire_date format. Use YYYY-MM-DD"
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        name,
        course,
        roll_no,
        email,
        phone,
        department_id,
        position,
        hire_date,
        salary,
        status,
        address,
        profile_picture
      },
      { new: true },
      req.user.organization_id
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    res.json({
      success: true,
      data: employee,
      message: "Employee updated successfully"
    });
  } catch (error) {
    // Handle duplicate entry errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: "Employee with this roll_no or email already exists"
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// PATCH - partial update (only updates provided fields)
export const patchEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee ID"
      });
    }

    // Validate provided fields
    if (updateData.email && !validateEmail(updateData.email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format"
      });
    }

    if (updateData.phone && !validatePhone(updateData.phone)) {
      return res.status(400).json({
        success: false,
        error: "Invalid phone format"
      });
    }

    if (updateData.status && !validateStatus(updateData.status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: active, inactive, or on_leave"
      });
    }

    if (updateData.department_id && isNaN(updateData.department_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department_id. Must be a number"
      });
    }

    if (updateData.salary && (isNaN(updateData.salary) || updateData.salary < 0)) {
      return res.status(400).json({
        success: false,
        error: "Invalid salary. Must be a positive number"
      });
    }

    if (updateData.hire_date && isNaN(Date.parse(updateData.hire_date))) {
      return res.status(400).json({
        success: false,
        error: "Invalid hire_date format. Use YYYY-MM-DD"
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
      req.user.organization_id
    );

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    res.json({
      success: true,
      data: employee,
      message: "Employee updated successfully"
    });
  } catch (error) {
    // Handle duplicate entry errors
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: "Employee with this roll_no or email already exists"
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// DELETE
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee ID"
      });
    }

    const employee = await Employee.findByIdAndDelete(id, req.user.organization_id);

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
