const mongoose = require("mongoose");

const DOCUMENT_TYPES = [
  "visit_summary",
  "medical_certificate",
  "prescription",
  "other",
];

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

    title: {
      type: String,
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
      required: [true, "Title is required"],
    },

    originalName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },

    publicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
      trim: true,
    },

    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
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
      enum: DOCUMENT_TYPES,
      default: "other",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    deletedAt: {
      type: Date,
      default: null,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

clinicalDocumentSchema.index({ patient: 1, createdAt: -1 });
clinicalDocumentSchema.index({ uploadedBy: 1 });

module.exports = mongoose.model("ClinicalDocument", clinicalDocumentSchema);
