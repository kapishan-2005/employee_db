import Department from "../models/departmentModel.js";

// Validation helper
const validateDepartmentName = (name) => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  return name.trim().length > 0 && name.trim().length <= 100;
};

// GET ALL DEPARTMENTS
export const getAllDepartments = async (req, res) => {
  try {
    const { is_active } = req.query;
    
    const options = { organization_id: req.user.organization_id };
    if (is_active !== undefined) {
      options.isActive = is_active === 'true' || is_active === '1';
    }
    
    const departments = await Department.findAll(options);
    
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

// GET DEPARTMENT BY ID
export const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    const department = await Department.findById(id, req.user.organization_id);

    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

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

// CREATE DEPARTMENT
export const createDepartment = async (req, res) => {
  try {
    const { name, description, is_active } = req.body;

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
    const existing = await Department.findByName(name.trim(), req.user.organization_id);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "Department with this name already exists"
      });
    }

    const department = await Department.create({
      name: name.trim(),
      description: description ? description.trim() : null,
      is_active: is_active !== undefined ? is_active : true,
      organization_id: req.user.organization_id
    });

    // Fetch the complete created department
    const created = await Department.findById(department.id, req.user.organization_id);

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

// UPDATE DEPARTMENT
export const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, head_id, is_active } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    // Check if department exists
    const existing = await Department.findById(id, req.user.organization_id);
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
      const duplicate = await Department.findByName(name.trim(), req.user.organization_id);
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
    if (is_active !== undefined) updateData.is_active = is_active;

    const department = await Department.update(id, updateData, { new: true }, req.user.organization_id);

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

// DELETE DEPARTMENT
export const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    // Check if department exists
    const existing = await Department.findById(id, req.user.organization_id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    // Check if department has employees
    const employeeCount = await Department.getEmployeeCount(id, req.user.organization_id);
    if (employeeCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete department with ${employeeCount} assigned employee(s). Please reassign employees first.`,
        employee_count: employeeCount
      });
    }

    await Department.delete(id, req.user.organization_id);

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

// GET DEPARTMENT EMPLOYEES
export const getDepartmentEmployees = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department ID"
      });
    }

    // Check if department exists
    const department = await Department.findById(id, req.user.organization_id);
    if (!department) {
      return res.status(404).json({
        success: false,
        error: "Department not found"
      });
    }

    const employees = await Department.getEmployees(id, req.user.organization_id);

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
