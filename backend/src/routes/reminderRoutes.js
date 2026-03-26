const express = require("express");
const { getUpcomingReminders } = require("../controllers/reminderController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/upcoming", protect, getUpcomingReminders);

module.exports = router;
