const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/User");

const getStudentStats = async (req, res) => {
  try {
    const totalAssignments = await Assignment.countDocuments();
    const submissions = await Submission.find({ student: req.user._id }).populate("assignment");

    const completed = submissions.filter((item) => item.status === "submitted" || item.status === "graded").length;
    const pending = Math.max(totalAssignments - completed, 0);
    const gradedSubmissions = submissions.filter((item) => item.status === "graded" && item.marks !== null);
    const totalMarks = gradedSubmissions.reduce((sum, item) => sum + item.marks, 0);
    const averageMarks = gradedSubmissions.length ? (totalMarks / gradedSubmissions.length).toFixed(1) : "0.0";

    res.json({
      success: true,
      stats: {
        totalAssignments,
        completed,
        pending,
        gradedCount: gradedSubmissions.length,
        averageMarks,
        marksOverview: gradedSubmissions.map((item) => ({
          assignmentTitle: item.assignment.title,
          marks: item.marks,
          feedback: item.feedback
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTeacherStats = async (req, res) => {
  try {
    const [totalAssignments, totalStudents, submissions] = await Promise.all([
      Assignment.countDocuments(),
      User.countDocuments({ role: "student" }),
      Submission.find().populate("assignment")
    ]);

    const submittedCount = submissions.filter((item) => item.status === "submitted").length;
    const gradedCount = submissions.filter((item) => item.status === "graded").length;
    const pendingReview = submissions.filter((item) => item.status === "submitted").length;
    const recentActivity = submissions
      .filter((item) => item.fileUrl || item.status === "graded")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map((item) => ({
        id: item._id,
        assignmentTitle: item.assignment ? item.assignment.title : "Assignment",
        status: item.status,
        updatedAt: item.updatedAt,
        marks: item.marks
      }));

    res.json({
      success: true,
      stats: {
        totalAssignments,
        totalStudents,
        submittedCount,
        gradedCount,
        pendingReview,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStudentStats, getTeacherStats };
