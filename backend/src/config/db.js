const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://divyashree:Divya@3058@cluster0.hiqlka2.mongodb.net/mydb");
    console.log("MongoDB Atlas connected");
  } catch (error) {
    console.error("DB connection error:", error.message);
    process.exit(1);
  }
};


module.exports = connectDB;
