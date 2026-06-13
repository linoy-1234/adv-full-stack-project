const jwt = require("jsonwebtoken");
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn:
        process.env.JWT_EXPIRES_IN || process.env.JWT_EXPIRE || "7d",
    }
  );
};

const buildUserResponse = (user) => {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    patientProfile: user.patientProfile,
    isActive: user.isActive,
  };
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const patientProfile = await PatientProfile.findOne({
      email: normalizedEmail,
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message:
          "No patient profile was found for this email. Please contact your oncologist.",
      });
    }

    if (patientProfile.accountStatus === "linked" || patientProfile.user) {
      return res.status(409).json({
        success: false,
        message: "This patient profile is already linked to an account",
      });
    }

    const user = await User.create({
      fullName,
      email: normalizedEmail,
      password,
      role: "patient",
      patientProfile: patientProfile._id,
    });

    patientProfile.user = user._id;
    patientProfile.accountStatus = "linked";
    patientProfile.updatedBy = patientProfile.oncologist;

    await patientProfile.save();

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: buildUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("patientProfile");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: buildUserResponse(user),
      patientProfile: user.patientProfile || null,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};