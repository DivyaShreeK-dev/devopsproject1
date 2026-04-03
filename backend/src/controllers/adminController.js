const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Alert = require("../models/Alert");
const { validateSignupInput } = require("../utils/validators");

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

    const activityChart = [
      { label: "Students", value: stats.totalStudents },
      { label: "Teachers", value: stats.totalTeachers },
      { label: "Admins", value: stats.totalAdmins },
      { label: "Submitted", value: stats.submittedCount },
      { label: "Graded", value: stats.gradedCount },
      { label: "Pending", value: stats.pendingCount }
    ];

    const recentSubmissions = submissions
      .filter((item) => item.fileUrl || item.status === "graded")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 8);

    res.json({
      success: true,
      stats,
      activityChart,
      users,
      recentSubmissions,
      alerts: activeAlerts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const validationError = validateSignupInput({ name, email, password, role });

    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    if (!["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role selected" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const user = await User.create({ name, email, password, role });

    if (role === "student") {
      const assignments = await Assignment.find().select("_id");
      if (assignments.length) {
        const pendingSubmissions = assignments.map((assignment) => ({
          assignment: assignment._id,
          student: user._id
        }));
        await Submission.insertMany(pendingSubmissions, { ordered: false }).catch(() => null);
      }
    }

    res.status(201).json({
      success: true,
      message: `${role} added successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
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

const deleteUserByAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Admin cannot delete the current logged-in account" });
    }

    if (user.role === "student") {
      await Submission.deleteMany({ student: user._id });
    }

    if (user.role === "teacher") {
      const assignments = await Assignment.find({ createdBy: user._id }).select("_id");
      const assignmentIds = assignments.map((item) => item._id);
      if (assignmentIds.length) {
        await Submission.deleteMany({ assignment: { $in: assignmentIds } });
        await Assignment.deleteMany({ _id: { $in: assignmentIds } });
      }
    }

    await Alert.deleteMany({ createdBy: user._id });
    await user.deleteOne();

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminOverview,
  createUserByAdmin,
  updateUserRole,
  deleteUserByAdmin
};
