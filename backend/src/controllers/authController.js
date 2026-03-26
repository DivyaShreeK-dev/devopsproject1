const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const generateToken = require("../utils/generateToken");

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
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

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch || (role && user.role !== role)) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { signup, login, getMe };
