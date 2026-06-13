const mongoose = require("mongoose");

const clinicalDocumentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: [true, "Patient is required"],
    },

    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Uploader is required"],
    },

    message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    title: {
      type: String,
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
      default: "",
    },

    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },

    fileName: {
      type: String,
      required: [true, "Stored file name is required"],
      trim: true,
    },

    filePath: {
      type: String,
      required: [true, "File path is required"],
      trim: true,
    },

    mimeType: {
      type: String,
      required: [true, "File type is required"],
      trim: true,
    },

    size: {
      type: Number,
      required: [true, "File size is required"],
      min: [0, "File size cannot be negative"],
    },

    documentType: {
      type: String,
      enum: [
        "visit_summary",
        "care_instructions",
        "treatment_document",
        "lab_document",
        "other",
      ],
      default: "other",
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

clinicalDocumentSchema.index({ patient: 1, createdAt: -1 });
clinicalDocumentSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model("ClinicalDocument", clinicalDocumentSchema);

//saves the information on the file, not the file itself (for example: the name of the file, file type, his size...)