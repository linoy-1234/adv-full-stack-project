const express = require("express");

const {
  register,
  login,
  googleSignIn,
  getMe,
} = require("../controllers/authController");

const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");

const {
  registerSchema,
  loginSchema,
  googleAuthSchema,
} = require("../utils/validators/authValidator");

const router = express.Router();


router.post("/register", validate(registerSchema), register);

router.post("/login", validate(loginSchema), login);

router.post("/google", validate(googleAuthSchema), googleSignIn);

router.get("/me", protect, getMe);

module.exports = router;
