const express = require("express");
const { getStudentStats, getTeacherStats } = require("../controllers/statsController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/student", protect, authorize("student"), getStudentStats);
router.get("/teacher", protect, authorize("teacher"), getTeacherStats);

module.exports = router;
