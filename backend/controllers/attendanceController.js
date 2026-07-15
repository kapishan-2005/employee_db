import Attendance from "../models/attendanceModel.js";
import Employee from "../models/employeeModel.js";

// Validation helpers
const validateStatus = (status) => {
  return ['present', 'absent', 'late', 'half_day', 'leave'].includes(status);
};

const validateDate = (dateString) => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// GET ALL ATTENDANCE RECORDS
export const getAllAttendance = async (req, res) => {
  try {
    const { employee_id, start_date, end_date, date, status, department_id } = req.query;

    // Validate filters
    if (employee_id && isNaN(employee_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee_id. Must be a number"
      });
    }

    if (department_id && isNaN(department_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department_id. Must be a number"
      });
    }

    if (status && !validateStatus(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: present, absent, late, half_day, or leave"
      });
    }

    if (start_date && !validateDate(start_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid start_date format. Use YYYY-MM-DD"
      });
    }

    if (end_date && !validateDate(end_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid end_date format. Use YYYY-MM-DD"
      });
    }

    const filters = { organization_id: req.user.organization_id };
    if (employee_id) filters.employee_id = employee_id;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (date) filters.date = date;
    if (status) filters.status = status;
    if (department_id) filters.department_id = department_id;

    // RBAC: If user is employee role, only show their own attendance
    if (req.user && req.user.role === 'employee' && req.user.employee_id) {
      filters.employee_id = req.user.employee_id;
    }

    const records = await Attendance.findAll(filters);

    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET ATTENDANCE BY ID
export const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid attendance ID"
      });
    }

    const record = await Attendance.findById(id, req.user.organization_id);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found"
      });
    }

    res.json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// CHECK IN
export const checkIn = async (req, res) => {
  try {
    const { employee_id, notes } = req.body;

    // Validate required fields
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: "employee_id is required"
      });
    }

    if (isNaN(employee_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee_id. Must be a number"
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employee_id, req.user.organization_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // Perform check-in
    const record = await Attendance.checkIn(employee_id, notes, req.user.organization_id);

    res.status(201).json({
      success: true,
      data: record,
      message: `${employee.name} checked in successfully`
    });
  } catch (error) {
    // Handle specific errors
    if (error.message.includes('already checked in')) {
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

// CHECK OUT
export const checkOut = async (req, res) => {
  try {
    const { employee_id, notes } = req.body;

    // Validate required fields
    if (!employee_id) {
      return res.status(400).json({
        success: false,
        error: "employee_id is required"
      });
    }

    if (isNaN(employee_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee_id. Must be a number"
      });
    }

    // Check if employee exists
    const employee = await Employee.findById(employee_id, req.user.organization_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // Perform check-out
    const record = await Attendance.checkOut(employee_id, notes, req.user.organization_id);

    res.json({
      success: true,
      data: record,
      message: `${employee.name} checked out successfully`
    });
  } catch (error) {
    // Handle specific errors
    if (error.message.includes('No check-in record') || 
        error.message.includes('Cannot check out') ||
        error.message.includes('already checked out')) {
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

// GET EMPLOYEE ATTENDANCE
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { start_date, end_date, status, limit } = req.query;

    if (isNaN(employeeId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee ID"
      });
    }

    // RBAC: If user is employee role, only allow viewing their own attendance
    if (req.user && req.user.role === 'employee') {
      if (req.user.employee_id !== parseInt(employeeId)) {
        return res.status(403).json({
          success: false,
          error: "Access denied. You can only view your own attendance."
        });
      }
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId, req.user.organization_id);
    if (!employee) {
      return res.status(404).json({
        success: false,
        error: "Employee not found"
      });
    }

    // Validate filters
    if (status && !validateStatus(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: present, absent, late, half_day, or leave"
      });
    }

    if (start_date && !validateDate(start_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid start_date format. Use YYYY-MM-DD"
      });
    }

    if (end_date && !validateDate(end_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid end_date format. Use YYYY-MM-DD"
      });
    }

    const filters = { organization_id: req.user.organization_id };
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (status) filters.status = status;
    if (limit) filters.limit = limit;

    const records = await Attendance.getEmployeeAttendance(employeeId, filters);

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          name: employee.name,
          roll_no: employee.roll_no
        },
        attendance: records,
        count: records.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// GET ATTENDANCE REPORT
export const getAttendanceReport = async (req, res) => {
  try {
    const { employee_id, start_date, end_date, status, department_id } = req.query;

    // Validate filters
    if (employee_id && isNaN(employee_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid employee_id. Must be a number"
      });
    }

    if (department_id && isNaN(department_id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid department_id. Must be a number"
      });
    }

    if (status && !validateStatus(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: present, absent, late, half_day, or leave"
      });
    }

    if (start_date && !validateDate(start_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid start_date format. Use YYYY-MM-DD"
      });
    }

    if (end_date && !validateDate(end_date)) {
      return res.status(400).json({
        success: false,
        error: "Invalid end_date format. Use YYYY-MM-DD"
      });
    }

    const filters = { organization_id: req.user.organization_id };
    if (employee_id) filters.employee_id = employee_id;
    if (start_date) filters.start_date = start_date;
    if (end_date) filters.end_date = end_date;
    if (status) filters.status = status;
    if (department_id) filters.department_id = department_id;

    const report = await Attendance.getReport(filters);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// UPDATE ATTENDANCE
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { check_in, check_out, status, notes } = req.body;

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid attendance ID"
      });
    }

    // Check if record exists
    const existing = await Attendance.findById(id, req.user.organization_id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: "Attendance record not found"
      });
    }

    // Validate status if provided
    if (status && !validateStatus(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status. Must be: present, absent, late, half_day, or leave"
      });
    }

    const updateData = {};
    if (check_in !== undefined) updateData.check_in = check_in;
    if (check_out !== undefined) updateData.check_out = check_out;
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const record = await Attendance.update(id, updateData, { new: true }, req.user.organization_id);

    res.json({
      success: true,
      data: record,
      message: "Attendance record updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
