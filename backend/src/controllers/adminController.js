const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Alert = require("../models/Alert");

const getAdminOverview = async (req, res) => {
  try {
    const [users, totalAssignments, submissions, activeAlerts] = await Promise.all([
      User.find().select("-password").sort({ createdAt: -1 }),
      Assignment.countDocuments(),
      Submission.find().populate("assignment").populate("student", "name email"),
      Alert.find({
        $or: [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }]
      })
        .populate("createdBy", "name role")
        .sort({ createdAt: -1 })
        .limit(6)
    ]);

    const stats = {
      totalUsers: users.length,
      totalStudents: users.filter((item) => item.role === "student").length,
      totalTeachers: users.filter((item) => item.role === "teacher").length,
      totalAdmins: users.filter((item) => item.role === "admin").length,
      totalAssignments,
      submittedCount: submissions.filter((item) => item.status === "submitted").length,
      gradedCount: submissions.filter((item) => item.status === "graded").length,
      pendingCount: submissions.filter((item) => item.status === "pending").length
    };

    const recentSubmissions = submissions
      .filter((item) => item.fileUrl || item.status === "graded")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 8);

    res.json({
      success: true,
      stats,
      users,
      recentSubmissions,
      alerts: activeAlerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.role = role;
    await user.save();

    res.json({ success: true, message: "User role updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAdminOverview, updateUserRole };
