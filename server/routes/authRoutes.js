const express = require("express");

const {
  register,
  login,
  getMe,
} = require("../controllers/authController");

const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");

const {
  registerSchema,
  loginSchema,
} = require("../utils/validators/authValidator");

const router = express.Router();


router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.get("/me", protect, getMe);

module.exports = router;