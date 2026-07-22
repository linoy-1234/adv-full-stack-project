const mongoose = require("mongoose");

const cloudinary = require("../config/cloudinary");
const ClinicalDocument = require("../models/ClinicalDocument");
const PatientProfile = require("../models/PatientProfile");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const getAuthorizedPatient = async (req, patientId) => {
  if (!isValidId(patientId)) return null;

  if (req.user.role === "oncologist") {
    return PatientProfile.findOne({
      _id: patientId,
      oncologist: req.user._id,
      isActive: true,
    });
  }

  if (req.user.role === "patient") {
    return PatientProfile.findOne({
      _id: patientId,
      user: req.user._id,
      isActive: true,
    });
  }

  return null;
};

const uploadToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });

const uploadDocument = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or access denied",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "A file is required",
      });
    }

    const { title, documentType, description } = req.body;

    const cloudResult = await uploadToCloudinary(req.file.buffer, {
      folder: "clinical-documents",
      resource_type: "auto",
      public_id: `${patientId}/${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    });

    const doc = await ClinicalDocument.create({
      patient: patient._id,
      uploadedBy: req.user._id,
      title: title.trim(),
      documentType: documentType || "other",
      description: description ? description.trim() : "",
      originalName: req.file.originalname,
      publicId: cloudResult.public_id,
      fileUrl: cloudResult.secure_url,
      mimeType: req.file.mimetype,
      size: req.file.size,
    });

    await doc.populate("uploadedBy", "fullName email role");

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: doc,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientDocuments = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found or access denied",
      });
    }

    const query = { patient: patient._id, isActive: true };

    const { documentType } = req.query;
    if (documentType && documentType !== "all") {
      query.documentType = documentType;
    }

    const documents = await ClinicalDocument.find(query)
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "fullName email role");

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents,
    });
  } catch (error) {
    next(error);
  }
};

const updateDocumentMetadata = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    if (!isValidId(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const doc = await ClinicalDocument.findOne({
      _id: documentId,
      isActive: true,
    }).populate("patient", "_id");

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const patient = await getAuthorizedPatient(
      req,
      doc.patient._id.toString()
    );

    if (!patient) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { title, documentType, description } = req.body;

    if (title !== undefined) doc.title = title.trim();
    if (documentType !== undefined) doc.documentType = documentType;
    if (description !== undefined) doc.description = description.trim();

    await doc.save();
    await doc.populate("uploadedBy", "fullName email role");

    return res.status(200).json({
      success: true,
      message: "Document updated successfully",
      document: doc,
    });
  } catch (error) {
    next(error);
  }
};

const softDeleteDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    if (!isValidId(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const doc = await ClinicalDocument.findOne({
      _id: documentId,
      isActive: true,
    }).populate("patient", "_id");

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const patient = await getAuthorizedPatient(
      req,
      doc.patient._id.toString()
    );

    if (!patient) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    doc.isActive = false;
    doc.deletedAt = new Date();
    doc.deletedBy = req.user._id;

    await doc.save();

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getDocumentUrl = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    if (!isValidId(documentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document ID",
      });
    }

    const doc = await ClinicalDocument.findOne({
      _id: documentId,
      isActive: true,
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const patient = await getAuthorizedPatient(req, doc.patient.toString());

    if (!patient) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      fileUrl: doc.fileUrl,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getPatientDocuments,
  updateDocumentMetadata,
  softDeleteDocument,
  getDocumentUrl,
};
