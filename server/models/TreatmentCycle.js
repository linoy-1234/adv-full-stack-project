const mongoose = require("mongoose");

const delayInfoSchema = new mongoose.Schema(
  {
    delayedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    delayedAt: {
      type: Date,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: [500, "Delay reason cannot exceed 500 characters"],
      default: "",
    },

    previousStartDate: {
      type: Date,
    },

    previousEndDate: {
      type: Date,
    },
  },
  { _id: false }
);

const approvalInfoSchema = new mongoose.Schema(
  {
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: {
      type: Date,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Approval notes cannot exceed 500 characters"],
      default: "",
    },
  },
  { _id: false }
);

const treatmentCycleSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: [true, "Patient is required"],
    },

    protocol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreatmentProtocol",
      required: [true, "Treatment protocol is required"],
    },

    cycleNumber: {
      type: Number,
      required: [true, "Cycle number is required"],
      min: [1, "Cycle number must be at least 1"],
    },

    treatmentType: {
      type: String,
      enum: ["chemotherapy", "radiation", "surgery", "immunotherapy", "other"],
      required: [true, "Treatment type is required"],
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    status: {
      type: String,
      enum: [
        "upcoming",
        "waiting_for_labs",
        "approved",
        "completed",
        "delayed",
        "cancelled",
      ],
      default: "upcoming",
    },

    approvalInfo: {
      type: approvalInfoSchema,
      default: undefined,
    },

    delayInfo: {
      type: delayInfoSchema,
      default: undefined,
    },

    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "Notes cannot exceed 1000 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

treatmentCycleSchema.index({ patient: 1, cycleNumber: 1, treatmentType: 1 });
treatmentCycleSchema.index({ protocol: 1, cycleNumber: 1 });

module.exports = mongoose.model("TreatmentCycle", treatmentCycleSchema);

//the whole cycles of treatments