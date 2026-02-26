import express from "express";
import * as controller from "../Controllers/employeeController.js";

const router = express.Router();

router.get("/", controller.getAllEmployees);
router.get("/:id", controller.getEmployeeById);
router.post("/", controller.createEmployee);
router.put("/:id", controller.updateEmployee);
router.patch("/:id", controller.patchEmployee);
router.delete("/:id", controller.deleteEmployee);

export default router;
