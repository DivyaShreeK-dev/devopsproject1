const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");

const uploadSubmission = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId);

    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a file" });
    }

    const submission = await Submission.findOneAndUpdate(
      { assignment: assignment._id, student: req.user._id },
      {
        assignment: assignment._id,
        student: req.user._id,
        fileName: req.file.originalname,
        fileUrl: `/uploads/${req.file.filename}`,
        fileType: req.file.mimetype,
        status: "submitted",
        submittedAt: new Date()
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
      .populate("assignment")
      .populate("student", "name email");

    res.json({
      success: true,
      message: "Assignment submitted successfully",
      submission
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const gradeSubmission = async (req, res) => {
  try {
    const { marks, feedback } = req.body;
    const submission = await Submission.findById(req.params.submissionId)
      .populate("assignment")
      .populate("student", "name email");

    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    if (!submission.fileUrl) {
      return res.status(400).json({
        success: false,
        message: "Cannot grade a submission before the student uploads a file"
      });
    }

    submission.marks = Number(marks);
    submission.feedback = feedback || "";
    submission.status = "graded";
    submission.gradedAt = new Date();
    await submission.save();

    res.json({
      success: true,
      message: "Submission graded successfully",
      submission
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user._id })
      .populate("assignment")
      .sort({ updatedAt: -1 });

    res.json({ success: true, submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const exportSubmissionsReport = async (req, res) => {
  try {
    const submissions = await Submission.find()
      .populate("assignment")
      .populate("student", "name email")
      .sort({ updatedAt: -1 });

    const rows = [
      [
        "Assignment Title",
        "Student Name",
        "Student Email",
        "Status",
        "Marks",
        "Feedback",
        "Submitted At",
        "Updated At"
      ],
      ...submissions.map((item) => [
        item.assignment ? item.assignment.title : "",
        item.student ? item.student.name : "",
        item.student ? item.student.email : "",
        item.status,
        item.marks ?? "",
        (item.feedback || "").replace(/"/g, '""'),
        item.submittedAt ? new Date(item.submittedAt).toISOString() : "",
        item.updatedAt ? new Date(item.updatedAt).toISOString() : ""
      ])
    ];

    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="submission-report.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadSubmission,
  gradeSubmission,
  getStudentSubmissions,
  exportSubmissionsReport
};
