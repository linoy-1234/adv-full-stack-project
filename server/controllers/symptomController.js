const PatientProfile = require("../models/PatientProfile");
const SymptomLog = require("../models/SymptomLog");
const isValidId = require("../utils/isValidId");

const getPatientProfileForCurrentUser = async (req) => {
  return PatientProfile.findOne({
    user: req.user._id,
    isActive: true,
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

const getAuthorizedSymptomLog = async (req, symptomLogId) => {
  if (!isValidId(symptomLogId)) {
    return null;
  }

  const symptomLog = await SymptomLog.findOne({
    _id: symptomLogId,
    isActive: true,
  });

  if (!symptomLog) {
    return null;
  }

  const patient = await getAuthorizedPatient(
    req,
    symptomLog.patient.toString()
  );

  if (!patient) {
    return null;
  }

  return symptomLog;
};

const createSymptomLog = async (req, res, next) => {
  try {
    const patient = await getPatientProfileForCurrentUser(req);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile was not found",
      });
    }

    const symptomLog = await SymptomLog.create({
      patient: patient._id,
      recordedBy: req.user._id,
      logDate: req.body.logDate,
      symptoms: req.body.symptoms,
      notes: req.body.notes,
    });

    await symptomLog.populate("recordedBy", "fullName email role");

    res.status(201).json({
      success: true,
      message: "Symptom log created successfully",
      symptomLog,
    });
  } catch (error) {
    next(error);
  }
};

const getMySymptomLogs = async (req, res, next) => {
  try {
    const patient = await getPatientProfileForCurrentUser(req);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile was not found",
      });
    }

    const symptomLogs = await SymptomLog.find({
      patient: patient._id,
      isActive: true,
    })
      .sort({ logDate: -1 })
      .populate("recordedBy", "fullName email role");

    res.status(200).json({
      success: true,
      count: symptomLogs.length,
      symptomLogs,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientSymptomLogs = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient was not found or access is denied",
      });
    }

    const symptomLogs = await SymptomLog.find({
      patient: patient._id,
      isActive: true,
    })
      .sort({ logDate: -1 })
      .populate("recordedBy", "fullName email role");

    res.status(200).json({
      success: true,
      count: symptomLogs.length,
      symptomLogs,
    });
  } catch (error) {
    next(error);
  }
};

const getSymptomLogById = async (req, res, next) => {
  try {
    const { symptomLogId } = req.params;

    const symptomLog = await getAuthorizedSymptomLog(req, symptomLogId);

    if (!symptomLog) {
      return res.status(404).json({
        success: false,
        message: "Symptom log was not found or access is denied",
      });
    }

    await symptomLog.populate("recordedBy", "fullName email role");

    res.status(200).json({
      success: true,
      symptomLog,
    });
  } catch (error) {
    next(error);
  }
};

const updateSymptomLog = async (req, res, next) => {
  try {
    const { symptomLogId } = req.params;

    const symptomLog = await getAuthorizedSymptomLog(req, symptomLogId);

    if (!symptomLog) {
      return res.status(404).json({
        success: false,
        message: "Symptom log was not found or access is denied",
      });
    }

    if (symptomLog.recordedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can update only symptom logs you created",
      });
    }

    const fieldsToUpdate = ["logDate", "symptoms", "notes"];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        symptomLog[field] = req.body[field];
      }
    });

    await symptomLog.save();

    await symptomLog.populate("recordedBy", "fullName email role");

    res.status(200).json({
      success: true,
      message: "Symptom log updated successfully",
      symptomLog,
    });
  } catch (error) {
    next(error);
  }
};

const deleteSymptomLog = async (req, res, next) => {
  try {
    const { symptomLogId } = req.params;

    const symptomLog = await getAuthorizedSymptomLog(req, symptomLogId);

    if (!symptomLog) {
      return res.status(404).json({
        success: false,
        message: "Symptom log was not found or access is denied",
      });
    }

    if (symptomLog.recordedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can delete only symptom logs you created",
      });
    }

    symptomLog.isActive = false;

    await symptomLog.save();

    res.status(200).json({
      success: true,
      message: "Symptom log deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSymptomLog,
  getMySymptomLogs,
  getPatientSymptomLogs,
  getSymptomLogById,
  updateSymptomLog,
  deleteSymptomLog,
};