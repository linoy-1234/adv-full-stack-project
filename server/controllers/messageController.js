const mongoose = require("mongoose");
const fs = require("fs");

const PatientProfile = require("../models/PatientProfile");
const Message = require("../models/Message");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const cleanupUploadedFiles = (files) => {
  if (!files || files.length === 0) return;

  files.forEach((file) => {
    fs.unlink(file.path, () => {});
  });
};

const getAuthorizedPatient = async (req, patientId) => {
  if (!isValidId(patientId)) {
    return null;
  }

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

const getAuthorizedMessage = async (req, messageId) => {
  if (!isValidId(messageId)) {
    return null;
  }

  const message = await Message.findOne({
    _id: messageId,
    isActive: true,
  });

  if (!message) {
    return null;
  }

  const patient = await getAuthorizedPatient(
    req,
    message.patient.toString()
  );

  if (!patient) {
    return null;
  }

  return message;
};

const buildAttachments = (files) => {
  if (!files || files.length === 0) {
    return [];
  }

  return files.map((file) => ({
    originalName: file.originalname,
    storedName: file.filename,
    fileUrl: `/uploads/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size,
    uploadedAt: new Date(),
  }));
};

const sendMessage = async (req, res, next) => {
  try {
    const uploadedFiles = req.files || [];

    if (!["patient", "oncologist"].includes(req.user.role)) {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(403).json({
        success: false,
        message: "Only patients and oncologists can send messages",
      });
    }

    const { patientId } = req.params;

    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(404).json({
        success: false,
        message: "Patient was not found or access is denied",
      });
    }

    if (uploadedFiles.length > 0 && req.user.role !== "oncologist") {
      cleanupUploadedFiles(uploadedFiles);

      return res.status(403).json({
        success: false,
        message: "Only oncologists can attach clinical documents",
      });
    }

    const text = req.body.text ? req.body.text.trim() : "";
    const attachments = buildAttachments(uploadedFiles);

    if (!text && attachments.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Message text or attachment is required",
      });
    }

    const message = await Message.create({
      patient: patient._id,
      sender: req.user._id,
      senderRole: req.user.role,
      text,
      attachments,
      readByPatient: req.user.role === "patient",
      readByOncologist: req.user.role === "oncologist",
    });

    await message.populate("sender", "fullName email role");

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientMessages = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient was not found or access is denied",
      });
    }

    const messages = await Message.find({
      patient: patient._id,
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName email role");

    res.status(200).json({
      success: true,
      count: messages.length,
      messages,
    });
  } catch (error) {
    next(error);
  }
};

const getMyMessages = async (req, res, next) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can access their own messages here",
      });
    }

    const patient = await PatientProfile.findOne({
      user: req.user._id,
      isActive: true,
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile was not found",
      });
    }

    req.params.patientId = patient._id.toString();

    return getPatientMessages(req, res, next);
  } catch (error) {
    next(error);
  }
};

const markMessageAsRead = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await getAuthorizedMessage(req, messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message was not found or access is denied",
      });
    }

    if (req.user.role === "patient") {
      message.readByPatient = true;
    }

    if (req.user.role === "oncologist") {
      message.readByOncologist = true;
    }

    await message.save();

    await message.populate("sender", "fullName email role");

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message,
    });
  } catch (error) {
    next(error);
  }
};

const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await getAuthorizedMessage(req, messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message was not found or access is denied",
      });
    }

    if (
      req.user.role === "patient" &&
      message.sender.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Patients can delete only messages they sent",
      });
    }

    message.isActive = false;

    await message.save();

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getPatientMessages,
  getMyMessages,
  markMessageAsRead,
  deleteMessage,
};