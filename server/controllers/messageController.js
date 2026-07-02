const mongoose = require("mongoose");

const PatientProfile = require("../models/PatientProfile");
const Message = require("../models/Message");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Shared helpers ───────────────────────────────────────────────────────────

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

const getAuthorizedMessage = async (req, messageId) => {
  if (!isValidId(messageId)) return null;

  const message = await Message.findOne({ _id: messageId, isActive: true });
  if (!message) return null;

  const patient = await getAuthorizedPatient(req, message.patient.toString());
  if (!patient) return null;

  return message;
};

// ─── Controllers ─────────────────────────────────────────────────────────────

const sendMessage = async (req, res, next) => {
  try {
    if (!["patient", "oncologist"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only patients and oncologists can send messages",
      });
    }

    const { patientId } = req.params;
    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient was not found or access is denied",
      });
    }

    const text = req.body.text ? req.body.text.trim() : "";

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Message text is required",
      });
    }

    const message = await Message.create({
      patient: patient._id,
      sender: req.user._id,
      senderRole: req.user.role,
      text,
      readByPatient: req.user.role === "patient",
      readByOncologist: req.user.role === "oncologist",
    });

    await message.populate("sender", "fullName email role");

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      messageRecord: message,
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

    const messages = await Message.find({ patient: patient._id, isActive: true })
      .sort({ createdAt: 1 })
      .populate("sender", "fullName email role");

    res.status(200).json({ success: true, count: messages.length, messages });
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

// Returns the count of unread messages from the oncologist side for the logged-in patient
const getMyUnreadCount = async (req, res, next) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can access this endpoint",
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

    const count = await Message.countDocuments({
      patient: patient._id,
      senderRole: "oncologist",
      readByPatient: false,
      isActive: true,
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

// Returns { [PatientProfile._id]: count } for every patient with unread messages from patients
const getOncologistUnreadCounts = async (req, res, next) => {
  try {
    if (req.user.role !== "oncologist") {
      return res.status(403).json({
        success: false,
        message: "Only oncologists can access this endpoint",
      });
    }

    const patients = await PatientProfile.find({
      oncologist: req.user._id,
      isActive: true,
    }).select("_id");

    const patientIds = patients.map((p) => p._id);

    const unreadAgg = await Message.aggregate([
      {
        $match: {
          patient: { $in: patientIds },
          senderRole: "patient",
          readByOncologist: false,
          isActive: true,
        },
      },
      {
        $group: { _id: "$patient", count: { $sum: 1 } },
      },
    ]);

    const counts = {};
    for (const entry of unreadAgg) {
      counts[entry._id.toString()] = entry.count;
    }

    res.status(200).json({ success: true, counts });
  } catch (error) {
    next(error);
  }
};

// Bulk-marks all incoming messages as read for the current user
const markAllMessagesRead = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient was not found or access is denied",
      });
    }

    if (req.user.role === "patient") {
      await Message.updateMany(
        {
          patient: patient._id,
          senderRole: "oncologist",
          readByPatient: false,
          isActive: true,
        },
        { $set: { readByPatient: true } }
      );
    } else if (req.user.role === "oncologist") {
      await Message.updateMany(
        {
          patient: patient._id,
          senderRole: "patient",
          readByOncologist: false,
          isActive: true,
        },
        { $set: { readByOncologist: true } }
      );
    }

    res.status(200).json({ success: true, message: "Messages marked as read" });
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

    if (req.user.role === "patient") message.readByPatient = true;
    if (req.user.role === "oncologist") message.readByOncologist = true;

    await message.save();
    await message.populate("sender", "fullName email role");

    res.status(200).json({
      success: true,
      message: "Message marked as read",
      messageRecord: message,
    });
  } catch (error) {
    next(error);
  }
};

// Edit own message — only allowed while the other side has not yet read it
const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const message = await getAuthorizedMessage(req, messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message was not found or access is denied",
      });
    }

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit messages you sent",
      });
    }

    const alreadyRead =
      req.user.role === "patient"
        ? message.readByOncologist
        : message.readByPatient;

    if (alreadyRead) {
      return res.status(403).json({
        success: false,
        message: "Cannot edit a message that has already been read",
      });
    }

    message.text = req.body.text.trim();
    await message.save();
    await message.populate("sender", "fullName email role");

    res.status(200).json({
      success: true,
      message: "Message edited successfully",
      messageRecord: message,
    });
  } catch (error) {
    next(error);
  }
};

// Soft-delete own message — only allowed while the other side has not yet read it
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

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete messages you sent",
      });
    }

    const alreadyRead =
      req.user.role === "patient"
        ? message.readByOncologist
        : message.readByPatient;

    if (alreadyRead) {
      return res.status(403).json({
        success: false,
        message: "Cannot delete a message that has already been read",
      });
    }

    message.isActive = false;
    await message.save();

    res.status(200).json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendMessage,
  getPatientMessages,
  getMyMessages,
  getMyUnreadCount,
  getOncologistUnreadCounts,
  markAllMessagesRead,
  markMessageAsRead,
  editMessage,
  deleteMessage,
};
