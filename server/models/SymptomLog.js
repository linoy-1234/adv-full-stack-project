const mongoose = require("mongoose");

const symptomEntrySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Symptom name is required"],
      trim: true,
    },

    severity: {
      type: Number,
      required: [true, "Symptom severity is required"],
      min: [1, "Severity must be at least 1"],
      max: [10, "Severity cannot exceed 10"],
    },
  },
  { _id: true }
);

const symptomLogSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: [true, "Patient is required"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient user is required"],
    },

    loggedAt: {
      type: Date,
      required: [true, "Log date is required"],
      default: Date.now,
    },

    symptoms: {
      type: [symptomEntrySchema],
      required: [true, "At least one symptom is required"],
      validate: {
        validator: function (value) {
          return Array.isArray(value) && value.length > 0;
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
  },
  { timestamps: true }
);

symptomLogSchema.index({ patient: 1, loggedAt: -1 });

module.exports = mongoose.model("SymptomLog", symptomLogSchema);

//saves the symptom log of the pateint
//it doesnt say fever! reminder to delete it in the client side!