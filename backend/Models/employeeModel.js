import { pool } from "../config/db.js";

const Employee = {
  // Get all employees
  find: async () => {
    const [rows] = await pool.execute('SELECT * FROM employees');
    return rows;
  },

  // Get employee by ID
  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM employees WHERE id = ?', [id]);
    return rows[0] || null;
  },

  // Create new employee
  create: async (data) => {
    const { name, course, roll_no } = data;
    const [result] = await pool.execute(
      'INSERT INTO employees (name, course, roll_no) VALUES (?, ?, ?)',
      [name, course, roll_no]
    );
    return { id: result.insertId, name, course, roll_no };
  },

  // Update employee by ID
  findByIdAndUpdate: async (id, data, options = {}) => {
    const { name, course, roll_no } = data;
    const [result] = await pool.execute(
      'UPDATE employees SET name = ?, course = ?, roll_no = ? WHERE id = ?',
      [name, course, roll_no, id]
    );
    if (result.affectedRows === 0) return null;
    if (options.new) {
      return await Employee.findById(id);
    }
    return { id: parseInt(id), name, course, roll_no };
  },

  // Delete employee by ID
  findByIdAndDelete: async (id) => {
    const [result] = await pool.execute('DELETE FROM employees WHERE id = ?', [id]);
    return result.affectedRows > 0 ? { id: parseInt(id) } : null;
  }
};

export default Employee;
