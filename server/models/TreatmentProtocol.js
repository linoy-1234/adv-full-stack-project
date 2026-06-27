const mongoose = require("mongoose");

const treatmentTypeSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["chemotherapy", "radiation", "surgery", "supportive"],
      required: [true, "Treatment type is required"],
    },

    plannedCount: {
      type: Number,
      min: [0, "Planned count cannot be negative"],
      default: 0,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const medicationSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      trim: true,
      default: "",
    },

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

    frequency: {
      type: String,
      trim: true,
      default: "",
    },

    timing: {
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
      minlength: [2, "Protocol name must be at least 2 characters"],
      maxlength: [120, "Protocol name cannot exceed 120 characters"],
    },

    diagnosis: {
      type: String,
      required: [true, "Diagnosis is required"],
      trim: true,
    },

    treatmentTypes: {
      type: [treatmentTypeSchema],
      default: [],
    },

    medications: {
      type: [medicationSchema],
      default: [],
    },

    drugs: {
      type: [String],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
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

treatmentProtocolSchema.index({ patient: 1, isActive: 1 });

module.exports = mongoose.model("TreatmentProtocol", treatmentProtocolSchema);

//the whole protocol of the patient will be here
