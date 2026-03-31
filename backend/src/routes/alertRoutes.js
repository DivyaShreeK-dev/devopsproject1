const express = require("express");
const { createAlert, getAlertsForCurrentUser } = require("../controllers/alertController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getAlertsForCurrentUser);
router.post("/", protect, authorize("admin"), createAlert);

module.exports = router;
