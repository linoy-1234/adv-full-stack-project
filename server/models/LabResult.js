const mongoose = require("mongoose");

const labResultSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: [true, "Patient is required"],
    },

    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Lab staff user is required"],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    testDate: {
      type: Date,
      required: [true, "Test date is required"],
    },

    wbc: {
      type: Number,
      required: [true, "WBC value is required"],
      min: [0, "WBC cannot be negative"],
    },

    neutrophils: {
      type: Number,
      required: [true, "Neutrophils value is required"],
      min: [0, "Neutrophils cannot be negative"],
    },

    hemoglobin: {
      type: Number,
      required: [true, "Hemoglobin value is required"],
      min: [0, "Hemoglobin cannot be negative"],
    },

    platelets: {
      type: Number,
      required: [true, "Platelets value is required"],
      min: [0, "Platelets cannot be negative"],
    },

    alt: {
      type: Number,
      required: [true, "ALT value is required"],
      min: [0, "ALT cannot be negative"],
    },

    creatinine: {
      type: Number,
      required: [true, "Creatinine value is required"],
      min: [0, "Creatinine cannot be negative"],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

labResultSchema.index({ patient: 1, testDate: -1 });

module.exports = mongoose.model("LabResult", labResultSchema);

//saves the lab results