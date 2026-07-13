const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const normalizeEmail = require("../utils/normalizeEmail");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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

const sendAuthResponse = (res, statusCode, message, user) => {
  const token = generateToken(user);

  return res.status(statusCode).json({
    success: true,
    message,
    token,
    user: buildUserResponse(user),
  });
};

const verifyGoogleCredential = async (credential) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    const error = new Error("Google sign-in is not configured");
    error.statusCode = 500;
    throw error;
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    return ticket.getPayload();
  } catch {
    const error = new Error("Invalid Google credential");
    error.statusCode = 401;
    throw error;
  }
};

const validateExistingUserForGoogle = async (user) => {
  if (!user.isActive) {
    return {
      status: 403,
      message: "This account is inactive. Please contact support.",
    };
  }

  if (!["patient", "oncologist", "lab_staff"].includes(user.role)) {
    return {
      status: 403,
      message: "This account has an invalid role or account state.",
    };
  }

  if (user.role !== "patient") {
    return null;
  }

  if (!user.patientProfile) {
    return {
      status: 403,
      message: "This patient account is not linked to a patient profile.",
    };
  }

  const patientProfile = await PatientProfile.findById(user.patientProfile);

  if (!patientProfile || !patientProfile.isActive) {
    return {
      status: 403,
      message: "This patient account is inactive or unavailable.",
    };
  }

  if (
    patientProfile.accountStatus !== "linked" ||
    !patientProfile.user ||
    patientProfile.user.toString() !== user._id.toString()
  ) {
    return {
      status: 409,
      message: "This patient account has an invalid linked profile state.",
    };
  }

  return null;
};

const register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);

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

    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password"
    );

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: "This account uses Google sign-in. Please continue with Google.",
      });
    }

    const isPasswordCorrect = await user.matchPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    sendAuthResponse(res, 200, "Login successful", user);
  } catch (error) {
    next(error);
  }
};

const googleSignIn = async (req, res, next) => {
  try {
    const { credential } = req.body;
    const payload = await verifyGoogleCredential(credential);

    if (!payload?.email) {
      return res.status(401).json({
        success: false,
        message: "Google account email was not provided",
      });
    }

    if (payload.email_verified !== true) {
      return res.status(401).json({
        success: false,
        message: "Google email is not verified",
      });
    }

    const normalizedEmail = normalizeEmail(payload.email);
    const googleSubject = payload.sub || null;
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      const accountError = await validateExistingUserForGoogle(existingUser);

      if (accountError) {
        return res.status(accountError.status).json({
          success: false,
          message: accountError.message,
        });
      }

      if (
        googleSubject &&
        existingUser.googleSubject &&
        existingUser.googleSubject !== googleSubject
      ) {
        return res.status(403).json({
          success: false,
          message: "This Google account does not match the linked user account.",
        });
      }

      if (googleSubject && !existingUser.googleSubject) {
        existingUser.googleSubject = googleSubject;
        await existingUser.save();
      }

      return sendAuthResponse(
        res,
        200,
        "Google sign-in successful",
        existingUser
      );
    }

    const invitedProfile = await PatientProfile.findOne({
      email: normalizedEmail,
    }).populate("createdBy", "role");

    if (!invitedProfile) {
      return res.status(404).json({
        success: false,
        message:
          "No matching account or patient invitation was found for this Google email.",
      });
    }

    if (!invitedProfile.isActive) {
      return res.status(403).json({
        success: false,
        message: "This patient profile is inactive or unavailable.",
      });
    }

    if (
      invitedProfile.accountStatus !== "waiting_for_registration" ||
      invitedProfile.user
    ) {
      return res.status(409).json({
        success: false,
        message: "This patient invitation is already linked or unavailable.",
      });
    }

    if (!invitedProfile.createdBy || invitedProfile.createdBy.role !== "oncologist") {
      return res.status(403).json({
        success: false,
        message: "This patient invitation has an invalid account state.",
      });
    }

    let createdUser;

    try {
      const freshProfile = await PatientProfile.findOne({
        _id: invitedProfile._id,
        email: normalizedEmail,
      });

      if (!freshProfile || !freshProfile.isActive) {
        const error = new Error("This patient profile is inactive or unavailable.");
        error.statusCode = 403;
        throw error;
      }

      if (
        freshProfile.accountStatus !== "waiting_for_registration" ||
        freshProfile.user
      ) {
        const error = new Error(
          "This patient invitation is already linked or unavailable."
        );
        error.statusCode = 409;
        throw error;
      }

      const duplicateUser = await User.findOne({
        email: normalizedEmail,
      });

      if (duplicateUser) {
        const error = new Error("A user account with this email already exists.");
        error.statusCode = 409;
        throw error;
      }

      createdUser = await User.create({
        fullName: freshProfile.fullName,
        email: normalizedEmail,
        role: "patient",
        patientProfile: freshProfile._id,
        googleSubject,
      });

      const linkedProfile = await PatientProfile.findOneAndUpdate(
        {
          _id: freshProfile._id,
          email: normalizedEmail,
          user: null,
          accountStatus: "waiting_for_registration",
          isActive: true,
        },
        {
          user: createdUser._id,
          accountStatus: "linked",
          updatedBy: freshProfile.oncologist,
        },
        { new: true }
      );

      if (!linkedProfile) {
        const error = new Error(
          "This patient invitation is already linked or unavailable."
        );
        error.statusCode = 409;
        throw error;
      }
    } catch (error) {
      if (createdUser?._id) {
        try {
          await User.findByIdAndDelete(createdUser._id);
        } catch (rollbackError) {
          console.error(
            "Failed to roll back Google patient user creation",
            rollbackError
          );
        }
      }

      throw error;
    }

    return sendAuthResponse(
      res,
      201,
      "Patient account activated with Google",
      createdUser
    );
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
  googleSignIn,
  getMe,
};
