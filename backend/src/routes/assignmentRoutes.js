const express = require("express");
const {
  createAssignment,
  listAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
} = require("../controllers/assignmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", listAssignments);
router.get("/:id", getAssignmentById);
router.post("/", authorize("teacher"), createAssignment);
router.patch("/:id", authorize("teacher"), updateAssignment);
router.delete("/:id", authorize("teacher"), deleteAssignment);

module.exports = router;
