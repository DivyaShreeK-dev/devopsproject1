const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const User = require("../models/User");
const { validateAssignmentInput } = require("../utils/validators");

const createAssignment = async (req, res) => {
  try {
    const { title, description, subject, dueDate } = req.body;

    const validationError = validateAssignmentInput({ title, description, subject, dueDate });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const assignment = await Assignment.create({
      title,
      description,
      subject,
      dueDate,
      createdBy: req.user._id
    });

    const students = await User.find({ role: "student" }).select("_id");
    if (students.length) {
      const docs = students.map((student) => ({
        assignment: assignment._id,
        student: student._id
      }));

      await Submission.insertMany(docs, { ordered: false }).catch(() => null);
    }

    const populated = await Assignment.findById(assignment._id).populate("createdBy", "name email");

    res.status(201).json({
      success: true,
      message: "Assignment created successfully",
      assignment: populated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateAssignment = async (req, res) => {
  try {
    const { title, description, subject, dueDate } = req.body;
    const validationError = validateAssignmentInput({ title, description, subject, dueDate });
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (String(assignment.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "You can edit only your own assignments" });
    }

    assignment.title = title;
    assignment.description = description;
    assignment.subject = subject;
    assignment.dueDate = dueDate;
    await assignment.save();

    const populated = await Assignment.findById(assignment._id).populate("createdBy", "name email");
    res.json({ success: true, message: "Assignment updated successfully", assignment: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (String(assignment.createdBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "You can delete only your own assignments" });
    }

    await Submission.deleteMany({ assignment: assignment._id });
    await assignment.deleteOne();

    res.json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const listAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("createdBy", "name email")
      .sort({ dueDate: 1 });

    if (req.user.role === "teacher") {
      return res.json({ success: true, assignments });
    }

    const submissions = await Submission.find({ student: req.user._id });
    const submissionMap = new Map(
      submissions.map((submission) => [String(submission.assignment), submission])
    );

    const enrichedAssignments = assignments.map((assignment) => {
      const submission = submissionMap.get(String(assignment._id));
      return {
        ...assignment.toObject(),
        submissionStatus: submission ? submission.status : "pending",
        submission
      };
    });

    res.json({ success: true, assignments: enrichedAssignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("createdBy", "name email");
    if (!assignment) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    if (req.user.role === "teacher") {
      const submissions = await Submission.find({ assignment: assignment._id })
        .populate("student", "name email")
        .sort({ updatedAt: -1 });
      return res.json({ success: true, assignment, submissions });
    }

    const submission = await Submission.findOne({
      assignment: assignment._id,
      student: req.user._id
    });

    res.json({ success: true, assignment, submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAssignment,
  listAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
};
