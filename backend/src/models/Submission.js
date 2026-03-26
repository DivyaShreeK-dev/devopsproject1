const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    fileName: {
      type: String,
      default: ""
    },
    fileUrl: {
      type: String,
      default: ""
    },
    fileType: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["pending", "submitted", "graded"],
      default: "pending"
    },
    marks: {
      type: Number,
      default: null
    },
    feedback: {
      type: String,
      default: ""
    },
    submittedAt: {
      type: Date,
      default: null
    },
    gradedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("Submission", submissionSchema);
