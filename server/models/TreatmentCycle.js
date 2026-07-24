const mongoose = require("mongoose");

const decisionSchema = new mongoose.Schema(
  {
    decisionStatus: {
      type: String,
      enum: ["none", "approved"],
      default: "none",
    },

    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    decidedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const treatmentCycleSchema = new mongoose.Schema(
  {
    protocol: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TreatmentProtocol",
      required: [true, "Treatment protocol is required"],
    },

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

    treatmentType: {
      type: String,
      enum: ["chemotherapy", "radiation", "surgery"],
      required: [true, "Treatment type is required"],
    },

    cycleNumber: {
      type: Number,
      required: [true, "Cycle number is required"],
      min: [1, "Cycle number must be at least 1"],
    },

    title: {
      type: String,
      required: [true, "Cycle title is required"],
      trim: true,
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"],
    },

    medications: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "upcoming",
        "waiting_for_review",
        "active",
        "completed",
        "cancelled",
      ],
      default: "upcoming",
    },

    plannedDate: {
      type: Date,
      default: null,
    },

    totalSessions: {
      type: Number,
      min: [0, "Total sessions cannot be negative"],
      default: 0,
    },

    completedSessions: {
      type: Number,
      min: [0, "Completed sessions cannot be negative"],
      default: 0,
    },

    weekdays: {
      type: [String],
      enum: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    decision: {
      type: decisionSchema,
      default: () => ({}),
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
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

treatmentCycleSchema.index({ patient: 1, startDate: 1 });
treatmentCycleSchema.index({ protocol: 1, cycleNumber: 1 });

module.exports = mongoose.model("TreatmentCycle", treatmentCycleSchema);

//the whole cycles of treatments
