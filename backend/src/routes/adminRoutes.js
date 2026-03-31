const express = require("express");
const { getAdminOverview, updateUserRole } = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/overview", getAdminOverview);
router.patch("/users/:id/role", updateUserRole);

module.exports = router;
