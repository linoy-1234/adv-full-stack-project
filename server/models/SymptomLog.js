const mongoose = require("mongoose");

const symptomItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "nausea",
        "fatigue",
        "pain",
        "vomiting",
        "appetite_loss",
        "mouth_sores",
        "other",
      ],
      required: [true, "Symptom type is required"],
    },

    severity: {
      type: Number,
      required: [true, "Symptom severity is required"],
      min: [1, "Severity must be at least 1"],
      max: [10, "Severity cannot exceed 10"],
    },

    customSymptom: {
      type: String,
      trim: true,
      maxlength: [120, "Custom symptom cannot exceed 120 characters"],
      default: "",
    },
  },
  { _id: false }
);

const symptomLogSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: [true, "Patient is required"],
    },

    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Recording user is required"],
    },

    logDate: {
      type: Date,
      required: [true, "Log date is required"],
      default: Date.now,
    },

    symptoms: {
      type: [symptomItemSchema],
      required: true,
      validate: {
        validator: function (value) {
          return value.length > 0;
        },
        message: "At least one symptom is required",
      },
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

symptomLogSchema.index({ patient: 1, logDate: -1 });
symptomLogSchema.index({ recordedBy: 1 });

module.exports = mongoose.model("SymptomLog", symptomLogSchema);

//saves the symptom log of the pateint
//it doesnt say fever! reminder to delete it in the client side!