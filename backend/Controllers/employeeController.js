import Employee from "../Models/employeeModel.js";


// GET ALL
export const getAllEmployees = async (req, res) => {
  const employees = await Employee.find();
  res.json(employees);
};

// GET BY ID
export const getEmployeeById = async (req, res) => {
  const { id } = req.params;

  const employee = await Employee.findById(id);

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
};

// CREATE
export const createEmployee = async (req, res) => {
  const { name, course, roll_no } = req.body;

  if (!name || !course || !roll_no) {
    return res.status(400).json({ message: "All fields required" });
  }

  const employee = await Employee.create({
    name,
    course,
    roll_no
  });

  res.status(201).json(employee);
};

// PUT
export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  const { name, course, roll_no } = req.body;

  if (!name || !course || !roll_no) {
    return res.status(400).json({ message: "All fields required" });
  }

  const employee = await Employee.findByIdAndUpdate(
    id,
    { name, course, roll_no },
    { new: true }
  );

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
};

// PATCH
export const patchEmployee = async (req, res) => {
  const { id } = req.params;

  const employee = await Employee.findByIdAndUpdate(
    id,
    req.body,
    { new: true }
  );

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json(employee);
};

// DELETE
export const deleteEmployee = async (req, res) => {
  const { id } = req.params;

  const employee = await Employee.findByIdAndDelete(id);

  if (!employee) {
    return res.status(404).json({ message: "Employee not found" });
  }

  res.json({ message: "Employee deleted successfully" });
};
