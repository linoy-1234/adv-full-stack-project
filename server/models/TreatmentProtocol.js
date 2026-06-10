const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medication name is required"],
      trim: true,
    },

    dose: {
      type: String,
      trim: true,
      default: "",
    },

    route: {
      type: String,
      trim: true,
      default: "",
    },

    schedule: {
      type: String,
      trim: true,
      default: "",
    },

    category: {
      type: String,
      enum: ["chemotherapy", "supportive", "chronic", "other"],
      default: "other",
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const treatmentTypeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["chemotherapy", "radiation", "surgery", "immunotherapy", "other"],
      required: [true, "Treatment type is required"],
    },

    plannedCount: {
      type: Number,
      min: [0, "Planned count cannot be negative"],
      default: 0,
    },

    label: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const treatmentProtocolSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: [true, "Patient is required"],
    },

    oncologist: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Oncologist is required"],
    },

    protocolName: {
      type: String,
      required: [true, "Protocol name is required"],
      trim: true,
      maxlength: [120, "Protocol name cannot exceed 120 characters"],
    },

    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
      maxlength: [200, "Diagnosis cannot exceed 200 characters"],
    },

    treatmentTypes: {
      type: [treatmentTypeSchema],
      default: [],
    },

    medications: {
      type: [medicationSchema],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },

    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TreatmentProtocol", treatmentProtocolSchema);

//the whole protocol of the patient will be here