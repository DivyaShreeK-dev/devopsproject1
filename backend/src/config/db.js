const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Try backend/.env first, then project-root .env
dotenv.config({ path: path.resolve(__dirname, "../.env") });
if (!process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, "../../.env") });
}

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("DB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
