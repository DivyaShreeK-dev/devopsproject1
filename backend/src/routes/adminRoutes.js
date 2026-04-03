const express = require("express");
const {
  getAdminOverview,
  createUserByAdmin,
  updateUserRole,
  deleteUserByAdmin
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/overview", getAdminOverview);
router.post("/users", createUserByAdmin);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUserByAdmin);

module.exports = router;
