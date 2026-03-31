const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Alert = require("../models/Alert");

dotenv.config();

const seed = async () => {
  await connectDB();

  await Submission.deleteMany({});
  await Assignment.deleteMany({});
  await Alert.deleteMany({});
  await User.deleteMany({});

  const [admin, teacher, studentOne, studentTwo] = await User.create([
    {
      name: "System Admin",
      email: "admin1@example.com",
      password: "password123",
      role: "admin"
    },
    {
      name: "Asha Teacher",
      email: "teacher1@example.com",
      password: "password123",
      role: "teacher"
    },
    {
      name: "Ravi Student",
      email: "student1@example.com",
      password: "password123",
      role: "student"
    },
    {
      name: "Meera Student",
      email: "student2@example.com",
      password: "password123",
      role: "student"
    }
  ]);

  const assignments = await Assignment.create([
    {
      title: "Database Modeling Assignment",
      description: "Design an ER diagram and convert it into MongoDB collections.",
      subject: "Database Systems",
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdBy: teacher._id
    },
    {
      title: "JavaScript File Handling Report",
      description: "Prepare a short report explaining file upload and preview flows.",
      subject: "Web Technology",
      dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000),
      createdBy: teacher._id
    }
  ]);

  await Submission.create([
    {
      assignment: assignments[0]._id,
      student: studentOne._id,
      status: "graded",
      fileName: "sample-assignment.pdf",
      fileUrl: "/uploads/sample-assignment.pdf",
      fileType: "application/pdf",
      submittedAt: new Date(),
      gradedAt: new Date(),
      marks: 91,
      feedback: "Clear explanation and good schema design."
    },
    {
      assignment: assignments[1]._id,
      student: studentOne._id,
      status: "pending"
    },
    {
      assignment: assignments[0]._id,
      student: studentTwo._id,
      status: "pending"
    },
    {
      assignment: assignments[1]._id,
      student: studentTwo._id,
      status: "pending"
    }
  ]);

  await Alert.create([
    {
      title: "Welcome to OAS",
      message: "Check upcoming deadlines regularly and upload your files before the due date.",
      type: "announcement",
      targetRole: "student",
      createdBy: admin._id
    }
  ]);

  console.log("Sample data seeded successfully");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
