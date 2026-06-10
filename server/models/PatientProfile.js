const mongoose = require("mongoose");

const allergySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Allergy name is required"],
      trim: true,
    },

    severity: {
      type: String,
      enum: ["mild", "moderate", "severe", "unknown"],
      default: "unknown",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const patientProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    oncologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Assigned oncologist is required"],
    },

    fullName: {
      type: String,
      required: [true, "Patient full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [80, "Full name cannot exceed 80 characters"],
    },

    email: {
      type: String,
      required: [true, "Patient email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },

    nationalId: {
      type: String,
      required: [true, "National ID is required"],
      unique: true,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
    },

    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
    },

    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      default: "unknown",
    },

    allergies: {
      type: [allergySchema],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    accountStatus: {
      type: String,
      enum: ["waiting_for_registration", "linked"],
      default: "waiting_for_registration",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator oncologist is required"],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PatientProfile", patientProfileSchema);

//the profile is first created by the oncologyst. after that the user registers with the same email