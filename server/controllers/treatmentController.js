const mongoose = require("mongoose");
const PatientProfile = require("../models/PatientProfile");
const TreatmentProtocol = require("../models/TreatmentProtocol");
const TreatmentCycle = require("../models/TreatmentCycle");
const {
  emptyDecision,
  resetCycleApproval,
  syncDerivedTreatmentStatus,
} = require("../utils/treatmentStatus");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const CHEMO_OVERLAP_MESSAGE =
  "This chemotherapy cycle overlaps with another chemotherapy cycle. Please choose different dates.";

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

  if (req.user.role === "lab_staff") {
    return PatientProfile.findOne({
      _id: patientId,
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

const normalizeMedications = (medications = []) =>
  medications.map((medication) => {
    const frequency = medication.frequency || "";
    const timing = medication.timing || "";

    return {
      ...medication,
      id: medication.id || new mongoose.Types.ObjectId().toString(),
      frequency,
      timing,
      schedule: medication.schedule || "",
      weekdays: (medication.weekdays || []).filter((day) => WEEKDAYS.includes(day)),
      asNeeded: Boolean(medication.asNeeded),
    };
  });

const toDateOnly = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

const rangesOverlap = (leftStart, leftEnd, rightStart, rightEnd) =>
  toDateOnly(leftStart) <= toDateOnly(rightEnd) &&
  toDateOnly(leftEnd) >= toDateOnly(rightStart);

const isSameDate = (a, b) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return toDateOnly(a).getTime() === toDateOnly(b).getTime();
};

const normalizeCycleDates = (cycle) => ({
  startDate: cycle.startDate || cycle.plannedDate,
  endDate: cycle.endDate || cycle.startDate || cycle.plannedDate,
});

const validateChemoOverlapInPayload = (cycles = []) => {
  const chemoCycles = cycles.filter(
    (cycle) => cycle.treatmentType === "chemotherapy"
  );

  for (let index = 0; index < chemoCycles.length; index += 1) {
    const current = chemoCycles[index];
    const currentDates = normalizeCycleDates(current);
    if (!currentDates.startDate || !currentDates.endDate) continue;

    for (let nextIndex = index + 1; nextIndex < chemoCycles.length; nextIndex += 1) {
      const next = chemoCycles[nextIndex];
      const nextDates = normalizeCycleDates(next);
      if (!nextDates.startDate || !nextDates.endDate) continue;

      if (
        rangesOverlap(
          currentDates.startDate,
          currentDates.endDate,
          nextDates.startDate,
          nextDates.endDate
        )
      ) {
        const error = new Error(CHEMO_OVERLAP_MESSAGE);
        error.statusCode = 400;
        throw error;
      }
    }
  }
};

const validateChemoOverlapForPatient = async ({
  patientId,
  startDate,
  endDate,
  excludeCycleId,
}) => {
  const query = {
    patient: patientId,
    treatmentType: "chemotherapy",
    isActive: true,
    startDate: { $lte: toDateOnly(endDate) },
    endDate: { $gte: toDateOnly(startDate) },
  };

  if (excludeCycleId) {
    query._id = { $ne: excludeCycleId };
  }

  const overlap = await TreatmentCycle.exists(query);
  if (overlap) {
    const error = new Error(CHEMO_OVERLAP_MESSAGE);
    error.statusCode = 400;
    throw error;
  }
};

const assertNoFinalChemoOverlap = async ({
  protocolId,
  patientId,
  updates = [],
  removedCycleIds = [],
}) => {
  const removedIds = new Set(removedCycleIds.map((id) => id.toString()));
  const updateMap = new Map(
    updates
      .filter((cycle) => cycle._id)
      .map((cycle) => [cycle._id.toString(), cycle])
  );
  const existingCycles = await TreatmentCycle.find({
    protocol: protocolId,
    patient: patientId,
    treatmentType: "chemotherapy",
    isActive: true,
    _id: { $nin: Array.from(removedIds) },
  });

  const finalCycles = existingCycles.map((cycle) => {
    const update = updateMap.get(cycle._id.toString()) || {};
    return {
      _id: cycle._id.toString(),
      treatmentType: "chemotherapy",
      startDate: update.startDate || cycle.startDate,
      endDate: update.endDate || cycle.endDate,
    };
  });

  validateChemoOverlapInPayload(finalCycles);
};

const countableTreatmentTypes = ["chemotherapy", "radiation", "surgery"];

const calculatePlannedCount = (type, cycles) => {
  if (type === "radiation") {
    return cycles
      .filter((cycle) => cycle.treatmentType === type)
      .reduce((sum, cycle) => sum + (cycle.totalSessions || 0), 0);
  }

  return cycles.filter((cycle) => cycle.treatmentType === type).length;
};

const syncProtocolPlannedCounts = async (protocol, updatedBy) => {
  const activeCycles = await TreatmentCycle.find({
    protocol: protocol._id,
    isActive: true,
  });

  const existingTypes = protocol.treatmentTypes.map((entry) =>
    typeof entry.toObject === "function" ? entry.toObject() : entry
  );

  protocol.treatmentTypes = existingTypes.map((existing) => {
    if (!countableTreatmentTypes.includes(existing.type)) {
      return existing;
    }

    return {
      ...existing,
      plannedCount: calculatePlannedCount(existing.type, activeCycles),
    };
  });

  protocol.updatedBy = updatedBy || protocol.updatedBy;
  await protocol.save();
};

const hydrateProtocolResponse = async (protocolId) => {
  const protocol = await TreatmentProtocol.findById(protocolId)
    .populate("patient", "fullName email nationalId diagnosis bloodType allergies")
    .populate("oncologist", "fullName email role")
    .populate("createdBy", "fullName email role")
    .populate("updatedBy", "fullName email role");

  const cycles = await TreatmentCycle.find({
    protocol: protocolId,
    isActive: true,
  })
    .sort({ startDate: 1, cycleNumber: 1 })
    .populate("decision.decidedBy", "fullName email role");

  for (const cycle of cycles) {
    syncDerivedTreatmentStatus(cycle);
    if (cycle.isModified("status") || cycle.isModified("decision")) {
      await cycle.save();
    }
  }

  return { protocol, cycles };
};

const createTreatmentProtocol = async (req, res, next) => {
  try {
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

    validateChemoOverlapInPayload(req.body.cycles);

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

    const cyclesToCreate = req.body.cycles.map((cycle) => {
      const cycleToCreate = {
        ...cycle,
        status: cycle.status || "upcoming",
        decision: cycle.decision || emptyDecision(),
      };

      syncDerivedTreatmentStatus(cycleToCreate);

      return {
        ...cycleToCreate,
        protocol: protocol._id,
        patient: patient._id,
        oncologist: req.user._id,
      };
    });

    if (cyclesToCreate.length > 0) {
      await TreatmentCycle.insertMany(cyclesToCreate);
    }
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
    })
      .sort({ startDate: 1, cycleNumber: 1 })
      .populate("decision.decidedBy", "fullName email role");

    for (const cycle of cycles) {
      syncDerivedTreatmentStatus(cycle);
      if (cycle.isModified("status") || cycle.isModified("decision")) {
        await cycle.save();
      }
    }

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
    const { protocolId } = req.params;

    const protocol = await getAuthorizedProtocol(req, protocolId);

    if (!protocol) {
      return res.status(404).json({
        success: false,
        message: "Treatment protocol was not found",
      });
    }

    const cycleData = {
      ...req.body,
      protocol: protocol._id,
      patient: protocol.patient,
      oncologist: req.user._id,
      decision: req.body.decision || emptyDecision(),
    };

    if (cycleData.treatmentType === "chemotherapy") {
      await validateChemoOverlapForPatient({
        patientId: protocol.patient,
        startDate: cycleData.startDate,
        endDate: cycleData.endDate,
      });
    }

    syncDerivedTreatmentStatus(cycleData);

    await TreatmentCycle.create(cycleData);
    await syncProtocolPlannedCounts(protocol, req.user._id);
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
    })
      .sort({ startDate: 1, cycleNumber: 1 })
      .populate("decision.decidedBy", "fullName email role");

    for (const cycle of cycles) {
      syncDerivedTreatmentStatus(cycle);
      if (cycle.isModified("status") || cycle.isModified("decision")) {
        await cycle.save();
      }
    }

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

    const datesChanged =
      (req.body.startDate !== undefined &&
        !isSameDate(req.body.startDate, cycle.startDate)) ||
      (req.body.endDate !== undefined &&
        !isSameDate(req.body.endDate, cycle.endDate));

    if (cycle.treatmentType === "chemotherapy" && datesChanged) {
      await validateChemoOverlapForPatient({
        patientId: cycle.patient,
        startDate: req.body.startDate || cycle.startDate,
        endDate: req.body.endDate || cycle.endDate,
        excludeCycleId: cycle._id,
      });
    }

    Object.assign(cycle, req.body);

    if (datesChanged && cycle.treatmentType === "chemotherapy") {
      resetCycleApproval(cycle);
    }

    syncDerivedTreatmentStatus(cycle);
    await cycle.save();
    await syncProtocolPlannedCounts(protocol, req.user._id);
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

const bulkUpdateCycles = async (req, res, next) => {
  try {
    const { protocolId } = req.params;
    const protocol = await getAuthorizedProtocol(req, protocolId);

    if (!protocol) {
      return res.status(404).json({
        success: false,
        message: "Treatment protocol was not found",
      });
    }

    const updates = req.body.cycles || [];
    const removedCycleIds = req.body.removedCycleIds || [];

    await assertNoFinalChemoOverlap({
      protocolId: protocol._id,
      patientId: protocol.patient,
      updates,
      removedCycleIds,
    });

    for (const cycleId of removedCycleIds) {
      if (!isValidId(cycleId)) continue;
      const cycle = await TreatmentCycle.findOne({
        _id: cycleId,
        protocol: protocol._id,
        isActive: true,
      });
      if (!cycle) continue;
      cycle.status = "cancelled";
      cycle.isActive = false;
      cycle.cancelledAt = new Date();
      cycle.cancelledBy = req.user._id;
      cycle.cancelReason = "Removed from roadmap";
      await cycle.save();
    }

    for (const update of updates) {
      const { _id, ...cycleUpdate } = update;
      const cycle = await TreatmentCycle.findOne({
        _id,
        protocol: protocol._id,
        isActive: true,
      });

      if (!cycle) continue;

      const datesChanged =
        (cycleUpdate.startDate !== undefined &&
          !isSameDate(cycleUpdate.startDate, cycle.startDate)) ||
        (cycleUpdate.endDate !== undefined &&
          !isSameDate(cycleUpdate.endDate, cycle.endDate));
      Object.assign(cycle, cycleUpdate);

      if (datesChanged && cycle.treatmentType === "chemotherapy") {
        resetCycleApproval(cycle);
      }

      syncDerivedTreatmentStatus(cycle);
      await cycle.save();
    }

    await syncProtocolPlannedCounts(protocol, req.user._id);
    const payload = await hydrateProtocolResponse(protocol._id);

    res.status(200).json({
      success: true,
      message: "Treatment cycles updated successfully",
      ...payload,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCycle = async (req, res, next) => {
  try {
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

    cycle.status = "cancelled";
    cycle.isActive = false;
    cycle.cancelledAt = new Date();
    cycle.cancelledBy = req.user._id;
    cycle.cancelReason = req.body?.cancelReason || "Removed from roadmap";
    await cycle.save();
    await syncProtocolPlannedCounts(protocol, req.user._id);

    res.status(200).json({
      success: true,
      message: "Treatment item removed from roadmap",
    });
  } catch (error) {
    next(error);
  }
};

const approveCycle = async (req, res, next) => {
  try {
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

    syncDerivedTreatmentStatus(cycle);

    if (cycle.treatmentType !== "chemotherapy" || cycle.status !== "waiting_for_review") {
      return res.status(400).json({
        success: false,
        message: "Cycle cannot be approved from its current status.",
      });
    }

    cycle.decision = {
      decisionStatus: "approved",
      decidedBy: req.user._id,
      decidedAt: new Date(),
      decisionNotes: req.body.decisionNotes || "",
    };
    syncDerivedTreatmentStatus(cycle);

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

    syncDerivedTreatmentStatus(cycle);

    if (cycle.treatmentType !== "chemotherapy" || cycle.status !== "waiting_for_review") {
      return res.status(400).json({
        success: false,
        message: "Cycle cannot be postponed from its current status.",
      });
    }

    await validateChemoOverlapForPatient({
      patientId: cycle.patient,
      startDate: req.body.newStartDate,
      endDate: req.body.newEndDate,
      excludeCycleId: cycle._id,
    });

    cycle.startDate = req.body.newStartDate;
    cycle.endDate = req.body.newEndDate;
    resetCycleApproval(cycle);
    syncDerivedTreatmentStatus(cycle);

    await cycle.save();
    const payload = await hydrateProtocolResponse(protocol._id);

    res.status(200).json({
      success: true,
      message: "Cycle postponed successfully",
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
  bulkUpdateCycles,
  deleteCycle,
  approveCycle,
  delayCycle,
};
