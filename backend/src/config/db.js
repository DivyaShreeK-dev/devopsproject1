const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/oas_system";

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
};

module.exports = connectDB;
