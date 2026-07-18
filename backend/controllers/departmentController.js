import Department from "../models/departmentModel.js";
import User from "../models/userModel.js";

// Validation helper
const validateDepartmentName = (name) => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  return name.trim().length > 0 && name.trim().length <= 100;
};

/**
 * GET ALL DEPARTMENTS
 * 
 * Role-based filtering:
 * - CEO/HR: View all departments
 * - Manager: View their assigned department only
 * - Employee: View their own department only
 */
export const getAllDepartments = async (req, res) => {
  try {
    const { is_active } = req.query;
    const { role, id: userId, organization_id } = req.user;
    
    const options = { organization_id };
    if (is_active !== undefined) {
      options.isActive = is_active === 'true' || is_active === '1';
    }
    
    let departments = await Department.findAll(options);
    
    // Filter based on role
    if (role === 'manager') {
      // Manager can only see their assigned department
      departments = departments.filter(dept => dept.manager_id === userId);
    } else if (role === 'employee') {
      // Employee can only see their own department
      const user = await User.findById(userId);
      if (user && user.employee_id) {
        const Employee = await import('../models/employeeModel.js');
        const employee = await Employee.default.findById(user.employee_id, organization_id);
        if (employee && employee.department_id) {
          departments = departments.filter(dept => dept.id === employee.department_id);
        } else {
          departments = [];
        }
      } else {
        departments = [];
      }
    }
    // CEO and HR see all departments (no filtering)
    
    res.json({
      success: true,
      data: departments,
      count: departments.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET DEPARTMENT BY ID
 * 
 * Role-based access:
 * - CEO/HR: View any department
 * - Manager: View their assigned department only
 * - Employee: View their own department only
 */
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId, organization_id } = req.user;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    const department = await Department.findById(id, organization_id);

    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    // Check access permissions
    if (role === 'manager') {
      // Manager can only view their assigned department
      if (department.manager_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only view your assigned department."
        });
      }
    } else if (role === 'employee') {
      // Employee can only view their own department
      const user = await User.findById(userId);
      if (!user || !user.employee_id) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Employee record not found."
        });
      }
      
      const Employee = await import('../models/employeeModel.js');
      const employee = await Employee.default.findById(user.employee_id, organization_id);
      
      if (!employee || employee.department_id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only view your own department."
        });
      }
    }
    // CEO and HR can view any department

    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * CREATE DEPARTMENT
 * CEO and HR only
 */
export const createDepartment = async (req, res) => {
  try {
    const { name, description, is_active, manager_id } = req.body;
    const { organization_id } = req.user;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Department name is required"
      });
    }

    if (!validateDepartmentName(name)) {
      return res.status(400).json({
        success: false,
        error: "Department name must be between 1 and 100 characters"
      });
    }

    // Check if department with same name already exists
    const existing = await Department.findByName(name.trim(), organization_id);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Department with this name already exists"
      });
    }

    // Validate manager_id if provided
    if (manager_id) {
      const manager = await User.findById(manager_id);
      if (!manager) {
        return res.status(400).json({
          success: false,
          error: "Invalid manager ID. Manager not found."
        });
      }
      if (manager.organization_id !== organization_id) {
        return res.status(400).json({
          success: false,
          error: "Manager must belong to the same organization."
        });
      }
      if (manager.role !== 'manager') {
        return res.status(400).json({
          success: false,
          error: "User must have 'manager' role to be assigned as department manager."
        });
      }
    }

    const department = await Department.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      is_active: is_active !== undefined ? is_active : true,
      manager_id: manager_id || null,
      organization_id
    });

    // Fetch the complete created department
    const created = await Department.findById(department.id, organization_id);

    res.status(201).json({
      success: true,
      data: created,
      message: "Department created successfully"
    });
  } catch (error) {
    // Handle duplicate entry errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * UPDATE DEPARTMENT
 * CEO and HR only
 */
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, head_id, is_active } = req.body;
    const { organization_id, role } = req.user;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    // Check if department exists
    const existing = await Department.findById(id, organization_id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    // Validate name if provided
    if (name !== undefined) {
      if (!validateDepartmentName(name)) {
        return res.status(400).json({
          success: false,
          error: "Department name must be between 1 and 100 characters"
        });
      }

      // Check if another department has this name
      const duplicate = await Department.findByName(name.trim(), organization_id);
      if (duplicate && duplicate.id !== parseInt(id)) {
        return res.status(409).json({
          success: false,
          error: "Department with this name already exists"
        });
      }
    }

    // Validate head_id if provided
    if (head_id !== undefined && head_id !== null && isNaN(head_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid head_id. Must be a number"
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (head_id !== undefined) updateData.head_id = head_id;
    
    // Only CEO can change activation status via PUT
    // Use PATCH /api/departments/:id/status for explicit status changes
    if (is_active !== undefined && role === 'ceo') {
      updateData.is_active = is_active;
    }

    const department = await Department.update(id, updateData, { new: true }, organization_id);

    res.json({
      success: true,
      data: department,
      message: "Department updated successfully"
    });
  } catch (error) {
    // Handle duplicate entry errors
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * DELETE DEPARTMENT
 * CEO only
 */
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { organization_id } = req.user;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    // Check if department exists
    const existing = await Department.findById(id, organization_id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    // Check if department has employees
    const employeeCount = await Department.getEmployeeCount(id, organization_id);
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department with ${employeeCount} assigned employee(s). Please reassign employees first.`,
        employee_count: employeeCount
      });
    }

    await Department.delete(id, organization_id);

    res.json({
      success: true,
      message: "Department deleted successfully"
    });
  } catch (error) {
    // Handle constraint errors
    if (error.message.includes('Cannot delete department')) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * ASSIGN MANAGER TO DEPARTMENT
 * CEO only
 * PATCH /api/departments/:id/manager
 */
export const assignManager = async (req, res) => {
  try {
    const { id } = req.params;
    const { manager_id } = req.body;
    const { organization_id } = req.user;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    // Check if department exists
    const department = await Department.findById(id, organization_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    // Validate manager_id
    if (manager_id !== null && manager_id !== undefined) {
      if (isNaN(manager_id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid manager ID"
        });
      }

      const manager = await User.findById(manager_id);
      if (!manager) {
        return res.status(404).json({
          success: false,
          error: "Manager not found"
        });
      }

      if (manager.organization_id !== organization_id) {
        return res.status(400).json({
          success: false,
          error: "Manager must belong to the same organization"
        });
      }

      if (manager.role !== 'manager') {
        return res.status(400).json({
          success: false,
          error: "User must have 'manager' role to be assigned as department manager"
        });
      }
    }

    // Update department with new manager
    const updated = await Department.update(
      id, 
      { manager_id: manager_id || null }, 
      { new: true }, 
      organization_id
    );

    res.json({
      success: true,
      data: updated,
      message: manager_id 
        ? "Manager assigned successfully" 
        : "Manager removed successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * TOGGLE DEPARTMENT STATUS (ACTIVATE/DEACTIVATE)
 * CEO only
 * PATCH /api/departments/:id/status
 */
export const toggleStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const { organization_id } = req.user;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    if (is_active === undefined || typeof is_active !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: "is_active field is required and must be a boolean"
      });
    }

    // Check if department exists
    const department = await Department.findById(id, organization_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    // Update department status
    const updated = await Department.update(
      id, 
      { is_active }, 
      { new: true }, 
      organization_id
    );

    res.json({
      success: true,
      data: updated,
      message: `Department ${is_active ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET DEPARTMENT EMPLOYEES
 * 
 * Role-based access:
 * - CEO/HR: View employees from any department
 * - Manager: View employees from their assigned department only
 * - Employee: View employees from their own department only
 */
export const getDepartmentEmployees = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId, organization_id } = req.user;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    // Check if department exists
    const department = await Department.findById(id, organization_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    // Check access permissions
    if (role === 'manager') {
      // Manager can only view employees from their assigned department
      if (department.manager_id !== userId) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only view employees from your assigned department."
        });
      }
    } else if (role === 'employee') {
      // Employee can only view employees from their own department
      const user = await User.findById(userId);
      if (!user || !user.employee_id) {
        return res.status(403).json({
          success: false,
          error: "Access denied. Employee record not found."
        });
      }
      
      const Employee = await import('../models/employeeModel.js');
      const employee = await Employee.default.findById(user.employee_id, organization_id);
      
      if (!employee || employee.department_id !== parseInt(id)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only view employees from your own department."
        });
      }
    }
    // CEO and HR can view employees from any department

    const employees = await Department.getEmployees(id, organization_id);

    res.json({
      success: true,
      data: {
        department: {
          id: department.id,
          name: department.name
        },
        employees: employees,
        count: employees.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET DEPARTMENT STATS
export const getDepartmentStats = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    const stats = await Department.getStats(id, req.user.organization_id);

    if (!stats) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
