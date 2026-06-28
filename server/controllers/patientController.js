const User = require("../models/User");
const PatientProfile = require("../models/PatientProfile");
const TreatmentProtocol = require("../models/TreatmentProtocol");
const TreatmentCycle = require("../models/TreatmentCycle");
const Message = require("../models/Message");

const buildPatientResponse = (patient) => {
  return {
    _id: patient._id,
    user: patient.user,
    oncologist: patient.oncologist,
    fullName: patient.fullName,
    email: patient.email,
    nationalId: patient.nationalId,
    dateOfBirth: patient.dateOfBirth,
    diagnosis: patient.diagnosis,
    bloodType: patient.bloodType,
    allergies: patient.allergies,
    notes: patient.notes,
    accountStatus: patient.accountStatus,
    isActive: patient.isActive,
    createdBy: patient.createdBy,
    updatedBy: patient.updatedBy,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
  };
};

const createPatient = async (req, res, next) => {
  try {
    const normalizedEmail = req.body.email.toLowerCase().trim();
    const normalizedNationalId = req.body.nationalId.trim();

    const existingPatientByEmail = await PatientProfile.findOne({
      email: normalizedEmail,
    });

    if (existingPatientByEmail) {
      return res.status(409).json({
        success: false,
        message: "A patient profile with this email already exists",
      });
    }

    const existingPatientByNationalId = await PatientProfile.findOne({
      nationalId: normalizedNationalId,
    });

    if (existingPatientByNationalId) {
      return res.status(409).json({
        success: false,
        message: "A patient profile with this national ID already exists",
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user account with this email already exists. Use a different patient email.",
      });
    }

    const patient = await PatientProfile.create({
      ...req.body,
      email: normalizedEmail,
      nationalId: normalizedNationalId,
      oncologist: req.user._id,
      createdBy: req.user._id,
      updatedBy: req.user._id,
      accountStatus: "waiting_for_registration",
    });

    res.status(201).json({
      success: true,
      message: "Patient profile created successfully",
      patient: buildPatientResponse(patient),
    });
  } catch (error) {
    next(error);
  }
};

const getPatients = async (req, res, next) => {
  try {
    let filter = { isActive: true };

    if (req.user.role === "oncologist") {
      filter.oncologist = req.user._id;
    }

    const patients = await PatientProfile.find(filter)
      .populate("oncologist", "fullName email role")
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role")
      .sort({ createdAt: -1 });

    const patientIds = patients.map((p) => p._id);

    const [protocols, actionableCycles, unreadMsgAgg] = await Promise.all([
      TreatmentProtocol.find({
        patient: { $in: patientIds },
        isActive: true,
      }).select("patient protocolName treatmentTypes"),

      TreatmentCycle.find({
        patient: { $in: patientIds },
        isActive: true,
        status: { $in: ["waiting_for_labs", "pending_review", "delayed"] },
      }).select("patient status"),

      Message.aggregate([
        {
          $match: {
            patient: { $in: patientIds },
            senderRole: "patient",
            readByOncologist: false,
            isActive: true,
          },
        },
        { $group: { _id: "$patient", count: { $sum: 1 } } },
      ]),
    ]);

    const protocolMap = {};
    for (const protocol of protocols) {
      protocolMap[protocol.patient.toString()] = {
        protocolName: protocol.protocolName,
        treatmentTypes: protocol.treatmentTypes.map((t) => t.type),
      };
    }

    // Higher number = higher priority; keeps the most urgent status per patient
    const CYCLE_PRIORITY = { pending_review: 3, waiting_for_labs: 2, delayed: 1 };
    const cycleStatusMap = {};
    for (const cycle of actionableCycles) {
      const pid = cycle.patient.toString();
      const incoming = CYCLE_PRIORITY[cycle.status] ?? 0;
      const current = CYCLE_PRIORITY[cycleStatusMap[pid]] ?? 0;
      if (incoming > current) cycleStatusMap[pid] = cycle.status;
    }

    const patientsWithUnread = new Set(
      unreadMsgAgg.filter((e) => e.count > 0).map((e) => e._id.toString())
    );

    const computePendingAction = (patientId) => {
      const pid = patientId.toString();
      if (patientsWithUnread.has(pid)) return "unread_message";
      const cycleStatus = cycleStatusMap[pid];
      if (cycleStatus === "pending_review") return "cycle_ready_review";
      if (cycleStatus === "waiting_for_labs") return "waiting_labs";
      if (cycleStatus === "delayed") return "treatment_delayed";
      return "none";
    };

    const result = patients.map((patient) => ({
      ...buildPatientResponse(patient),
      treatmentSummary: protocolMap[patient._id.toString()] || null,
      pendingAction: computePendingAction(patient._id),
    }));

    res.status(200).json({
      success: true,
      count: result.length,
      patients: result,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientById = async (req, res, next) => {
  try {
    const patient = await PatientProfile.findById(req.params.id)
      .populate("oncologist", "fullName email role")
      .populate("user", "fullName email role isActive")
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role");

    if (!patient || !patient.isActive) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    if (
      req.user.role === "oncologist" &&
      patient.oncologist._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: this patient is not assigned to you",
      });
    }

    if (
      req.user.role === "patient" &&
      (!req.user.patientProfile ||
        req.user.patientProfile.toString() !== patient._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: you can only access your own profile",
      });
    }

    res.status(200).json({
      success: true,
      patient: buildPatientResponse(patient),
    });
  } catch (error) {
    next(error);
  }
};

const updatePatient = async (req, res, next) => {
  try {
    const patient = await PatientProfile.findById(req.params.id);

    if (!patient || !patient.isActive) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    if (patient.oncologist.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: this patient is not assigned to you",
      });
    }

    if (req.body.email) {
      const normalizedEmail = req.body.email.toLowerCase().trim();

      const existingPatient = await PatientProfile.findOne({
        email: normalizedEmail,
        _id: { $ne: patient._id },
      });

      if (existingPatient) {
        return res.status(409).json({
          success: false,
          message: "A patient profile with this email already exists",
        });
      }

      const existingUser = await User.findOne({
        email: normalizedEmail,
        _id: { $ne: patient.user },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "A user account with this email already exists",
        });
      }

      patient.email = normalizedEmail;
    }

    if (req.body.nationalId) {
      const normalizedNationalId = req.body.nationalId.trim();

      const existingPatientByNationalId = await PatientProfile.findOne({
        nationalId: normalizedNationalId,
        _id: { $ne: patient._id },
      });

      if (existingPatientByNationalId) {
        return res.status(409).json({
          success: false,
          message: "A patient profile with this national ID already exists",
        });
      }

      patient.nationalId = normalizedNationalId;
    }

    const editableFields = [
      "fullName",
      "dateOfBirth",
      "diagnosis",
      "bloodType",
      "allergies",
      "notes",
    ];

    editableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        patient[field] = req.body[field];
      }
    });

    patient.updatedBy = req.user._id;

    await patient.save();

    res.status(200).json({
      success: true,
      message: "Patient profile updated successfully",
      patient: buildPatientResponse(patient),
    });
  } catch (error) {
    next(error);
  }
};

const deletePatient = async (req, res, next) => {
  try {
    const patient = await PatientProfile.findById(req.params.id);

    if (!patient || !patient.isActive) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    if (patient.oncologist.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: this patient is not assigned to you",
      });
    }

    patient.isActive = false;
    patient.updatedBy = req.user._id;

    await patient.save();

    if (patient.user) {
      await User.findByIdAndUpdate(patient.user, { isActive: false });
    }

    res.status(200).json({
      success: true,
      message: "Patient profile deactivated successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
};

//the oncologist is creating the patient profile, returns patients list, returns one patient, only the oncologist can updates a patient profile, and he can "delete" the profile patient by making him isActive = false
