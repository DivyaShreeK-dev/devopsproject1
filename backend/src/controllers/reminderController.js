const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");

const getUpcomingReminders = async (req, res) => {
  try {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const assignments = await Assignment.find({
      dueDate: { $gte: now, $lte: cutoff }
    }).sort({ dueDate: 1 });

    if (req.user.role === "teacher") {
      return res.json({ success: true, reminders: assignments });
    }

    const submissions = await Submission.find({
      student: req.user._id,
      assignment: { $in: assignments.map((item) => item._id) }
    });

    const submittedIds = new Set(
      submissions
        .filter((item) => item.status === "submitted" || item.status === "graded")
        .map((item) => String(item.assignment))
    );

    const reminders = assignments
      .filter((assignment) => !submittedIds.has(String(assignment._id)))
      .map((assignment) => ({
        _id: assignment._id,
        title: assignment.title,
        subject: assignment.subject,
        dueDate: assignment.dueDate,
        message: `Reminder: "${assignment.title}" is due soon.`
      }));

    res.json({ success: true, reminders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUpcomingReminders };
