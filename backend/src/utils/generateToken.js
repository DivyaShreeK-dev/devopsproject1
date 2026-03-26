const jwt = require("jsonwebtoken");

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET || "change_this_secret",
    { expiresIn: "7d" }
  );

module.exports = generateToken;
