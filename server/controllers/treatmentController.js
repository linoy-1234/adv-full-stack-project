const mongoose = require("mongoose");
const PatientProfile = require("../models/PatientProfile");
const TreatmentProtocol = require("../models/TreatmentProtocol");
const TreatmentCycle = require("../models/TreatmentCycle");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

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

const getAuthorizedProtocol = async (req, protocolId) => {
  if (!isValidId(protocolId)) {
    return null;
  }

  const protocol = await TreatmentProtocol.findOne({
    _id: protocolId,
    isActive: true,
  });

  if (!protocol) {
    return null;
  }

  const patient = await getAuthorizedPatient(req, protocol.patient);

  if (!patient) {
    return null;
  }

  return protocol;
};

const requireOncologist = (req, res) => {
  if (req.user.role !== "oncologist") {
    res.status(403).json({
      success: false,
      message: "Only oncologists can perform this action",
    });

    return false;
  }

  return true;
};

const normalizeMedications = (medications = []) =>
  medications.map((medication) => {
    const frequency = medication.frequency || medication.schedule || "";
    const timing = medication.timing || "";

    return {
      ...medication,
      id: medication.id || new mongoose.Types.ObjectId().toString(),
      frequency,
      timing,
      schedule: medication.schedule || [frequency, timing].filter(Boolean).join(" - "),
    };
  });

const hydrateProtocolResponse = async (protocolId) => {
  const protocol = await TreatmentProtocol.findById(protocolId)
    .populate("patient", "fullName email nationalId diagnosis bloodType allergies")
    .populate("oncologist", "fullName email role")
    .populate("createdBy", "fullName email role")
    .populate("updatedBy", "fullName email role");

  const cycles = await TreatmentCycle.find({
    protocol: protocolId,
    isActive: true,
  }).sort({ startDate: 1, cycleNumber: 1 });

  return { protocol, cycles };
};

const createTreatmentProtocol = async (req, res, next) => {
  try {
    if (!requireOncologist(req, res)) return;

    const { patientId } = req.params;

    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient was not found under this oncologist",
      });
    }

    const existingProtocol = await TreatmentProtocol.findOne({
      patient: patient._id,
      isActive: true,
    });

    if (existingProtocol) {
      return res.status(409).json({
        success: false,
        message: "This patient already has an active treatment protocol",
      });
    }

    const protocol = await TreatmentProtocol.create({
      patient: patient._id,
      oncologist: req.user._id,
      protocolName: req.body.protocolName,
      diagnosis: req.body.diagnosis,
      treatmentTypes: req.body.treatmentTypes,
      medications: normalizeMedications(req.body.medications),
      drugs: req.body.drugs,
      notes: req.body.notes,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    const cyclesToCreate = req.body.cycles.map((cycle) => ({
      ...cycle,
      protocol: protocol._id,
      patient: patient._id,
      oncologist: req.user._id,
    }));

    await TreatmentCycle.insertMany(cyclesToCreate);
    const payload = await hydrateProtocolResponse(protocol._id);

    res.status(201).json({
      success: true,
      message: "Treatment protocol created successfully",
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientTreatmentProtocol = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient was not found or access is denied",
      });
    }

    const protocol = await TreatmentProtocol.findOne({
      patient: patient._id,
      isActive: true,
    })
      .populate("patient", "fullName email nationalId diagnosis bloodType allergies")
      .populate("oncologist", "fullName email role")
      .populate("createdBy", "fullName email role")
      .populate("updatedBy", "fullName email role");

    if (!protocol) {
      return res.status(404).json({
        success: false,
        message: "Treatment protocol was not found for this patient",
      });
    }

    const cycles = await TreatmentCycle.find({
      protocol: protocol._id,
      isActive: true,
    }).sort({ startDate: 1, cycleNumber: 1 });

    res.status(200).json({
      success: true,
      protocol,
      cycles,
    });
  } catch (error) {
    next(error);
  }
};

const getMyTreatmentProtocol = async (req, res, next) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can access their own treatment protocol here",
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

    return getPatientTreatmentProtocol(req, res, next);
  } catch (error) {
    next(error);
  }
};

const updateTreatmentProtocol = async (req, res, next) => {
  try {
    if (!requireOncologist(req, res)) return;

    const { protocolId } = req.params;

    const protocol = await getAuthorizedProtocol(req, protocolId);

    if (!protocol) {
      return res.status(404).json({
        success: false,
        message: "Treatment protocol was not found",
      });
    }

    const updates = { ...req.body };

    if (updates.medications) {
      updates.medications = normalizeMedications(updates.medications);
    }

    Object.assign(protocol, {
      ...updates,
      updatedBy: req.user._id,
    });

    await protocol.save();
    const payload = await hydrateProtocolResponse(protocol._id);

    res.status(200).json({
      success: true,
      message: "Treatment protocol updated successfully",
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

const deleteTreatmentProtocol = async (req, res, next) => {
  try {
    if (!requireOncologist(req, res)) return;

    const { protocolId } = req.params;

    const protocol = await getAuthorizedProtocol(req, protocolId);

    if (!protocol) {
      return res.status(404).json({
        success: false,
        message: "Treatment protocol was not found",
      });
    }

    protocol.isActive = false;
    protocol.updatedBy = req.user._id;
    await protocol.save();

    await TreatmentCycle.updateMany(
      { protocol: protocol._id },
      { $set: { isActive: false } }
    );

    res.status(200).json({
      success: true,
      message: "Treatment protocol deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const createCycle = async (req, res, next) => {
  try {
    if (!requireOncologist(req, res)) return;

    const { protocolId } = req.params;

    const protocol = await getAuthorizedProtocol(req, protocolId);

    if (!protocol) {
      return res.status(404).json({
        success: false,
        message: "Treatment protocol was not found",
      });
    }

    const cycle = await TreatmentCycle.create({
      ...req.body,
      protocol: protocol._id,
      patient: protocol.patient,
      oncologist: req.user._id,
    });
    const payload = await hydrateProtocolResponse(protocol._id);

    res.status(201).json({
      success: true,
      message: "Treatment cycle created successfully",
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

const getProtocolCycles = async (req, res, next) => {
  try {
    const { protocolId } = req.params;

    const protocol = await getAuthorizedProtocol(req, protocolId);

    if (!protocol) {
      return res.status(404).json({
        success: false,
        message: "Treatment protocol was not found or access is denied",
      });
    }

    const cycles = await TreatmentCycle.find({
      protocol: protocol._id,
      isActive: true,
    }).sort({ startDate: 1, cycleNumber: 1 });

    res.status(200).json({
      success: true,
      count: cycles.length,
      cycles,
    });
  } catch (error) {
    next(error);
  }
};

const updateCycle = async (req, res, next) => {
  try {
    if (!requireOncologist(req, res)) return;

    const { cycleId } = req.params;

    if (!isValidId(cycleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cycle id",
      });
    }

    const cycle = await TreatmentCycle.findOne({
      _id: cycleId,
      isActive: true,
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: "Treatment cycle was not found",
      });
    }

    const protocol = await getAuthorizedProtocol(req, cycle.protocol);

    if (!protocol) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    Object.assign(cycle, req.body);
    await cycle.save();
    const payload = await hydrateProtocolResponse(protocol._id);

    res.status(200).json({
      success: true,
      message: "Treatment cycle updated successfully",
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCycle = async (req, res, next) => {
  try {
    if (!requireOncologist(req, res)) return;

    const { cycleId } = req.params;

    if (!isValidId(cycleId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid cycle id",
      });
    }

    const cycle = await TreatmentCycle.findOne({
      _id: cycleId,
      isActive: true,
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: "Treatment cycle was not found",
      });
    }

    const protocol = await getAuthorizedProtocol(req, cycle.protocol);

    if (!protocol) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    cycle.isActive = false;
    await cycle.save();

    res.status(200).json({
      success: true,
      message: "Treatment cycle deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const approveCycle = async (req, res, next) => {
  try {
    if (!requireOncologist(req, res)) return;

    const { cycleId } = req.params;

    const cycle = await TreatmentCycle.findOne({
      _id: cycleId,
      isActive: true,
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: "Treatment cycle was not found",
      });
    }

    const protocol = await getAuthorizedProtocol(req, cycle.protocol);

    if (!protocol) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (cycle.status !== "pending_review") {
      return res.status(400).json({
        success: false,
        message:
          "Cycle cannot be approved yet. It must be pending review after lab results are available.",
      });
    }

    cycle.status = "approved";
    cycle.decision = {
      decisionStatus: "approved",
      decidedBy: req.user._id,
      decidedAt: new Date(),
      decisionNotes: req.body.decisionNotes || "",
      delayReason: "",
      delayedToStartDate: null,
      delayedToEndDate: null,
    };

    await cycle.save();
    const payload = await hydrateProtocolResponse(protocol._id);

    res.status(200).json({
      success: true,
      message: "Cycle approved successfully",
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

const delayCycle = async (req, res, next) => {
  try {
    if (!requireOncologist(req, res)) return;

    const { cycleId } = req.params;

    const cycle = await TreatmentCycle.findOne({
      _id: cycleId,
      isActive: true,
    });

    if (!cycle) {
      return res.status(404).json({
        success: false,
        message: "Treatment cycle was not found",
      });
    }

    const protocol = await getAuthorizedProtocol(req, cycle.protocol);

    if (!protocol) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (cycle.status !== "pending_review") {
      return res.status(400).json({
        success: false,
        message:
          "Cycle cannot be delayed from this status. It must be pending review first.",
      });
    }

    cycle.status = "delayed";
    cycle.startDate = req.body.newStartDate;
    cycle.endDate = req.body.newEndDate;
    cycle.decision = {
      decisionStatus: "delayed",
      decidedBy: req.user._id,
      decidedAt: new Date(),
      decisionNotes: req.body.decisionNotes || "",
      delayReason: req.body.delayReason,
      delayedToStartDate: req.body.newStartDate,
      delayedToEndDate: req.body.newEndDate,
    };

    await cycle.save();
    const payload = await hydrateProtocolResponse(protocol._id);

    res.status(200).json({
      success: true,
      message: "Cycle delayed successfully",
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTreatmentProtocol,
  getPatientTreatmentProtocol,
  getMyTreatmentProtocol,
  updateTreatmentProtocol,
  deleteTreatmentProtocol,
  createCycle,
  getProtocolCycles,
  updateCycle,
  deleteCycle,
  approveCycle,
  delayCycle,
};
