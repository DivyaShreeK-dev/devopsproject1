const Alert = require("../models/Alert");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

const createAlert = async (req, res) => {
  try {
    const { title, message, type, targetRole, expiresAt } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: "Title and message are required" });
    }

    const alert = await Alert.create({
      title,
      message,
      type: type || "announcement",
      targetRole: targetRole || "student",
      expiresAt: expiresAt || null,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, message: "Alert created", alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAlertsForCurrentUser = async (req, res) => {
  try {
    const now = new Date();
    const baseAlerts = await Alert.find({
      targetRole: { $in: [req.user.role, "all"] },
      $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }]
    })
      .sort({ createdAt: -1 })
      .limit(10);

    if (req.user.role !== "student") {
      return res.json({ success: true, alerts: baseAlerts });
    }

    const assignments = await Assignment.find({
      dueDate: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
    });

    const submissions = await Submission.find({
      student: req.user._id,
      assignment: { $in: assignments.map((item) => item._id) }
    }).populate("assignment");

    const dynamicAlerts = [];

    submissions.forEach((submission) => {
      if (submission.status === "graded") {
        dynamicAlerts.push({
          _id: `graded-${submission._id}`,
          title: "Assignment Graded",
          message: `${submission.assignment.title} has been graded. Marks: ${submission.marks ?? "-"}.`,
          type: "graded",
          createdAt: submission.gradedAt || submission.updatedAt
        });
      }

      if (submission.status === "pending" && submission.assignment) {
        const hoursLeft =
          (new Date(submission.assignment.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursLeft <= 24 && hoursLeft >= -24) {
          dynamicAlerts.push({
            _id: `deadline-${submission._id}`,
            title: hoursLeft < 0 ? "Assignment Overdue" : "Deadline Reminder",
            message:
              hoursLeft < 0
                ? `${submission.assignment.title} is overdue. Please contact your teacher if needed.`
                : `${submission.assignment.title} is due within 24 hours.`,
            type: hoursLeft < 0 ? "warning" : "deadline",
            createdAt: submission.assignment.dueDate
          });
        }
      }
    });

    const alerts = [...dynamicAlerts, ...baseAlerts]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 12);

    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createAlert, getAlertsForCurrentUser };
