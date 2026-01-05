const express= require("express");
const {protect, adminOnly} = require ("../middlewares/authMiddleware");
const { exportTasksReport, exportUsersReport } = require("../controllers/reportController");

const router = express.Router();

// Admin can export all tasks
router.get("/export/tasks", protect, adminOnly, exportTasksReport);

// Both admin and members can export user reports (members get filtered data)
router.get("/export/users", protect, exportUsersReport);

module.exports=router;