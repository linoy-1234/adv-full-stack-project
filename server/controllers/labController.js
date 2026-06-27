const mongoose = require("mongoose");
const PatientProfile = require("../models/PatientProfile");
const TreatmentCycle = require("../models/TreatmentCycle");
const LabResult = require("../models/LabResult");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const requireLabStaff = (req, res) => {
  if (req.user.role !== "lab_staff") {
    res.status(403).json({
      success: false,
      message: "Only lab staff can perform this action",
    });

    return false;
  }

  return true;
};

const getAuthorizedPatient = async (req, patientId) => {
  if (!isValidId(patientId)) {
    return null;
  }

  if (req.user.role === "lab_staff") {
    return PatientProfile.findOne({
      _id: patientId,
      isActive: true,
    });
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

const getAuthorizedLabResult = async (req, labResultId) => {
  if (!isValidId(labResultId)) {
    return null;
  }

  const labResult = await LabResult.findOne({
    _id: labResultId,
    isActive: true,
  });

  if (!labResult) {
    return null;
  }

  const patient = await getAuthorizedPatient(
    req,
    labResult.patient.toString()
  );

  if (!patient) {
    return null;
  }

  return labResult;
};

const findLinkedCycle = async (cycleId, patientId) => {
  if (!cycleId) {
    return null;
  }

  if (!isValidId(cycleId)) {
    return "invalid";
  }

  return TreatmentCycle.findOne({
    _id: cycleId,
    patient: patientId,
    isActive: true,
  });
};

const dateKey = (value) => {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString().slice(0, 10);
};

const getEffectiveCycleStartDate = (cycle) => {
  if (
    cycle.decision?.delayedToStartDate &&
    ["delayed", "approved", "pending_review", "waiting_for_labs"].includes(cycle.status)
  ) {
    return cycle.decision.delayedToStartDate;
  }

  return cycle.startDate || cycle.plannedDate;
};

const getAttemptDayRange = (cycle) => {
  const effectiveStartKey = dateKey(getEffectiveCycleStartDate(cycle));

  if (!effectiveStartKey) {
    return null;
  }

  const start = new Date(`${effectiveStartKey}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
};

const countValidAttemptLabs = async (cycle) => {
  const attemptRange = getAttemptDayRange(cycle);

  if (!attemptRange) {
    return 0;
  }

  return LabResult.countDocuments({
    cycle: cycle._id,
    isActive: true,
    testDate: {
      $gte: attemptRange.start,
      $lt: attemptRange.end,
    },
  });
};

const reconcileCycleLabReviewStatus = async (cycle) => {
  if (!cycle) {
    return;
  }

  if (["approved", "cancelled", "completed", "active"].includes(cycle.status)) {
    return;
  }

  const validLabsCount = await countValidAttemptLabs(cycle);

  if (
    validLabsCount > 0 &&
    ["waiting_for_labs", "upcoming", "delayed"].includes(cycle.status)
  ) {
    cycle.status = "pending_review";
    await cycle.save();
    return;
  }

  if (validLabsCount === 0 && cycle.status === "pending_review") {
    cycle.status = "waiting_for_labs";
    await cycle.save();
  }
};

const createLabResult = async (req, res, next) => {
  try {
    if (!requireLabStaff(req, res)) return;

    const { patientId } = req.params;

    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient was not found",
      });
    }

    const cycleId = req.body.cycleId || null;
    const linkedCycle = await findLinkedCycle(cycleId, patient._id);

    if (linkedCycle === "invalid") {
      return res.status(400).json({
        success: false,
        message: "Invalid cycle id",
      });
    }

    if (cycleId && !linkedCycle) {
      return res.status(404).json({
        success: false,
        message: "Linked treatment cycle was not found for this patient",
      });
    }

    const labResult = await LabResult.create({
      patient: patient._id,
      cycle: linkedCycle ? linkedCycle._id : null,
      enteredBy: req.user._id,
      updatedBy: req.user._id,
      testDate: req.body.testDate,
      wbc: req.body.wbc,
      neutrophils: req.body.neutrophils,
      hemoglobin: req.body.hemoglobin,
      platelets: req.body.platelets,
      alt: req.body.alt,
      creatinine: req.body.creatinine,
      notes: req.body.notes,
    });

    await reconcileCycleLabReviewStatus(linkedCycle);

    res.status(201).json({
      success: true,
      message: "Lab result created successfully",
      labResult,
    });
  } catch (error) {
    next(error);
  }
};

const getPatientLabResults = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await getAuthorizedPatient(req, patientId);

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient was not found or access is denied",
      });
    }

    const labResults = await LabResult.find({
      patient: patient._id,
      isActive: true,
    })
      .sort({ testDate: -1 })
      .populate("enteredBy", "fullName email role")
      .populate("updatedBy", "fullName email role")
      .populate("cycle", "title cycleNumber treatmentType status startDate endDate");

    res.status(200).json({
      success: true,
      count: labResults.length,
      labResults,
    });
  } catch (error) {
    next(error);
  }
};

const getMyLabResults = async (req, res, next) => {
  try {
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Only patients can access their own lab results here",
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

    return getPatientLabResults(req, res, next);
  } catch (error) {
    next(error);
  }
};

const getLabResultById = async (req, res, next) => {
  try {
    const { labResultId } = req.params;

    const labResult = await getAuthorizedLabResult(req, labResultId);

    if (!labResult) {
      return res.status(404).json({
        success: false,
        message: "Lab result was not found or access is denied",
      });
    }

    await labResult.populate("enteredBy", "fullName email role");
    await labResult.populate("updatedBy", "fullName email role");
    await labResult.populate("cycle", "title cycleNumber treatmentType status startDate endDate");

    res.status(200).json({
      success: true,
      labResult,
    });
  } catch (error) {
    next(error);
  }
};

const updateLabResult = async (req, res, next) => {
  try {
    if (!requireLabStaff(req, res)) return;

    const { labResultId } = req.params;

    const labResult = await getAuthorizedLabResult(req, labResultId);

    if (!labResult) {
      return res.status(404).json({
        success: false,
        message: "Lab result was not found",
      });
    }

    const previousCycleId = labResult.cycle;

    if (req.body.cycleId !== undefined) {
      const cycleId = req.body.cycleId || null;
      const linkedCycle = await findLinkedCycle(cycleId, labResult.patient);

      if (linkedCycle === "invalid") {
        return res.status(400).json({
          success: false,
          message: "Invalid cycle id",
        });
      }

      if (cycleId && !linkedCycle) {
        return res.status(404).json({
          success: false,
          message: "Linked treatment cycle was not found for this patient",
        });
      }

      labResult.cycle = linkedCycle ? linkedCycle._id : null;
    }

    const fieldsToUpdate = [
      "testDate",
      "wbc",
      "neutrophils",
      "hemoglobin",
      "platelets",
      "alt",
      "creatinine",
      "notes",
    ];

    fieldsToUpdate.forEach((field) => {
      if (req.body[field] !== undefined) {
        labResult[field] = req.body[field];
      }
    });

    labResult.updatedBy = req.user._id;

    await labResult.save();

    const cycleIdsToReconcile = [
      previousCycleId,
      labResult.cycle,
    ]
      .filter(Boolean)
      .map((cycleId) => cycleId.toString());
    const uniqueCycleIds = Array.from(new Set(cycleIdsToReconcile));

    for (const cycleId of uniqueCycleIds) {
      const cycle = await TreatmentCycle.findById(cycleId);
      await reconcileCycleLabReviewStatus(cycle);
    }

    res.status(200).json({
      success: true,
      message: "Lab result updated successfully",
      labResult,
    });
  } catch (error) {
    next(error);
  }
};

const deleteLabResult = async (req, res, next) => {
  try {
    if (!requireLabStaff(req, res)) return;

    const { labResultId } = req.params;

    const labResult = await getAuthorizedLabResult(req, labResultId);

    if (!labResult) {
      return res.status(404).json({
        success: false,
        message: "Lab result was not found",
      });
    }

    const linkedCycleId = labResult.cycle;

    labResult.isActive = false;
    labResult.updatedBy = req.user._id;

    await labResult.save();

    if (linkedCycleId) {
      const cycle = await TreatmentCycle.findById(linkedCycleId);
      await reconcileCycleLabReviewStatus(cycle);
    }

    res.status(200).json({
      success: true,
      message: "Lab result deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLabResult,
  getPatientLabResults,
  getMyLabResults,
  getLabResultById,
  updateLabResult,
  deleteLabResult,
};
