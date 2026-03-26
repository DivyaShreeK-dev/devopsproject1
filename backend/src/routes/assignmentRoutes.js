const express = require("express");
const {
  createAssignment,
  listAssignments,
  getAssignmentById
} = require("../controllers/assignmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", listAssignments);
router.get("/:id", getAssignmentById);
router.post("/", authorize("teacher"), createAssignment);

module.exports = router;
