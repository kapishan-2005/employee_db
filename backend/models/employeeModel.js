import { pool } from "../config/db.js";

const Employee = {
  // Get all employees with pagination, search, and filters (organization-scoped)
  find: async (options = {}) => {
    const { page = 1, limit = 10, search = '', status = '', department_id = '', organization_id } = options;
    
    // Build WHERE clause — organization_id is always required (multi-tenant isolation)
    const conditions = ['organization_id = ?'];
    const params = [organization_id];
    
    if (search) {
      conditions.push('(name LIKE ? OR roll_no LIKE ? OR email LIKE ? OR course LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (department_id) {
      conditions.push('department_id = ?');
      params.push(department_id);
    }
    
    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM employees ${whereClause}`;
    const [countResult] = await pool.execute(countQuery, params);
    const total = countResult[0].total;
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const dataQuery = `SELECT * FROM employees ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`;
    const [rows] = await pool.execute(dataQuery, [...params, parseInt(limit), parseInt(offset)]);
    
    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Get employee by ID, scoped to organization so no cross-tenant access is possible
  findById: async (id, organization_id) => {
    const [rows] = await pool.execute(
      'SELECT * FROM employees WHERE id = ? AND organization_id = ?',
      [id, organization_id]
    );
    return rows[0] || null;
  },

  // Create new employee - supports both old and new fields (organization-scoped)
  create: async (data) => {
    const {
      name,
      course,
      roll_no,
      organization_id,
      email = null,
      phone = null,
      department_id = null,
      position = null,
      hire_date = null,
      salary = null,
      status = 'active',
      address = null,
      profile_picture = null
    } = data;
    
    // Build dynamic INSERT query
    const fields = ['name', 'course', 'roll_no', 'organization_id'];
    const values = [name, course, roll_no, organization_id];
    const placeholders = ['?', '?', '?', '?'];
    
    // Add optional fields if provided
    if (email !== null && email !== undefined) {
      fields.push('email');
      values.push(email);
      placeholders.push('?');
    }
    if (phone !== null && phone !== undefined) {
      fields.push('phone');
      values.push(phone);
      placeholders.push('?');
    }
    if (department_id !== null && department_id !== undefined) {
      fields.push('department_id');
      values.push(department_id);
      placeholders.push('?');
    }
    if (position !== null && position !== undefined) {
      fields.push('position');
      values.push(position);
      placeholders.push('?');
    }
    if (hire_date !== null && hire_date !== undefined) {
      fields.push('hire_date');
      values.push(hire_date);
      placeholders.push('?');
    }
    if (salary !== null && salary !== undefined) {
      fields.push('salary');
      values.push(salary);
      placeholders.push('?');
    }
    if (status !== null && status !== undefined) {
      fields.push('status');
      values.push(status);
      placeholders.push('?');
    }
    if (address !== null && address !== undefined) {
      fields.push('address');
      values.push(address);
      placeholders.push('?');
    }
    if (profile_picture !== null && profile_picture !== undefined) {
      fields.push('profile_picture');
      values.push(profile_picture);
      placeholders.push('?');
    }
    
    const query = `INSERT INTO employees (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`;
    const [result] = await pool.execute(query, values);
    
    return await Employee.findById(result.insertId, organization_id);
  },

  // Update employee by ID - only updates provided fields (organization-scoped)
  findByIdAndUpdate: async (id, data, options = {}, organization_id) => {
    // Check if employee exists within this organization
    const existing = await Employee.findById(id, organization_id);
    if (!existing) return null;
    
    // Build dynamic UPDATE query with only provided fields
    const updates = [];
    const values = [];
    
    // Check each field and add to update if provided
    if (data.name !== undefined) {
      updates.push('name = ?');
      values.push(data.name);
    }
    if (data.course !== undefined) {
      updates.push('course = ?');
      values.push(data.course);
    }
    if (data.roll_no !== undefined) {
      updates.push('roll_no = ?');
      values.push(data.roll_no);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.department_id !== undefined) {
      updates.push('department_id = ?');
      values.push(data.department_id);
    }
    if (data.position !== undefined) {
      updates.push('position = ?');
      values.push(data.position);
    }
    if (data.hire_date !== undefined) {
      updates.push('hire_date = ?');
      values.push(data.hire_date);
    }
    if (data.salary !== undefined) {
      updates.push('salary = ?');
      values.push(data.salary);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      values.push(data.address);
    }
    if (data.profile_picture !== undefined) {
      updates.push('profile_picture = ?');
      values.push(data.profile_picture);
    }
    
    // If no fields to update, return existing
    if (updates.length === 0) {
      return existing;
    }
    
    // Add id to values
    values.push(id);
    
    const query = `UPDATE employees SET ${updates.join(', ')} WHERE id = ? AND organization_id = ?`;
    values.push(organization_id);
    await pool.execute(query, values);
    
    if (options.new) {
      return await Employee.findById(id, organization_id);
    }
    
    return { ...existing, ...data, id: parseInt(id) };
  },

  // Delete employee by ID (organization-scoped)
  findByIdAndDelete: async (id, organization_id) => {
    const [result] = await pool.execute(
      'DELETE FROM employees WHERE id = ? AND organization_id = ?',
      [id, organization_id]
    );
    return result.affectedRows > 0 ? { id: parseInt(id) } : null;
  }
};

export default Employee;
