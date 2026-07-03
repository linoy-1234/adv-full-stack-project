const express = require("express");

const {
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
} = require("../controllers/treatmentController");

const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");

const {
  createTreatmentProtocolSchema,
  updateTreatmentProtocolSchema,
  createCycleSchema,
  updateCycleSchema,
  bulkUpdateCycleSchema,
  approveCycleSchema,
  delayCycleSchema,
} = require("../utils/validators/treatmentValidator");

const router = express.Router();

router.use(protect);

router.post(
  "/patients/:patientId/protocol",
  validate(createTreatmentProtocolSchema),
  createTreatmentProtocol
);

router.get(
  "/patients/:patientId/protocol",
  getPatientTreatmentProtocol
);

router.get(
  "/my/protocol",
  getMyTreatmentProtocol
);

router.put(
  "/protocols/:protocolId",
  validate(updateTreatmentProtocolSchema),
  updateTreatmentProtocol
);

router.delete(
  "/protocols/:protocolId",
  deleteTreatmentProtocol
);

router.post(
  "/protocols/:protocolId/cycles",
  validate(createCycleSchema),
  createCycle
);

router.get(
  "/protocols/:protocolId/cycles",
  getProtocolCycles
);

router.put(
  "/protocols/:protocolId/cycles/bulk",
  validate(bulkUpdateCycleSchema),
  bulkUpdateCycles
);

router.put(
  "/cycles/:cycleId",
  validate(updateCycleSchema),
  updateCycle
);

router.delete(
  "/cycles/:cycleId",
  deleteCycle
);

router.patch(
  "/cycles/:cycleId/approve",
  validate(approveCycleSchema),
  approveCycle
);

router.patch(
  "/cycles/:cycleId/delay",
  validate(delayCycleSchema),
  delayCycle
);

module.exports = router;
