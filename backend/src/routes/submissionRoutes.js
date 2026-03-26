const express = require("express");
const {
  uploadSubmission,
  gradeSubmission,
  getStudentSubmissions
} = require("../controllers/submissionController");
const upload = require("../config/multer");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/student", authorize("student"), getStudentSubmissions);
router.post("/:assignmentId/upload", authorize("student"), upload.single("assignmentFile"), uploadSubmission);
router.patch("/:submissionId/grade", authorize("teacher"), gradeSubmission);

module.exports = router;
