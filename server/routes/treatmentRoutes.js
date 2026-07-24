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
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createTreatmentProtocolSchema,
  updateTreatmentProtocolSchema,
  createCycleSchema,
  updateCycleSchema,
  bulkUpdateCycleSchema,
  delayCycleSchema,
} = require("../utils/validators/treatmentValidator");

const router = express.Router();

router.use(protect);

router.post(
  "/patients/:patientId/protocol",
  authorizeRoles("oncologist"),
  validate(createTreatmentProtocolSchema),
  createTreatmentProtocol
);

router.get(
  "/patients/:patientId/protocol",
  authorizeRoles("oncologist", "patient", "lab_staff"),
  getPatientTreatmentProtocol
);

router.get(
  "/my/protocol",
  authorizeRoles("patient"),
  getMyTreatmentProtocol
);

router.put(
  "/protocols/:protocolId",
  authorizeRoles("oncologist"),
  validate(updateTreatmentProtocolSchema),
  updateTreatmentProtocol
);

router.delete(
  "/protocols/:protocolId",
  authorizeRoles("oncologist"),
  deleteTreatmentProtocol
);

router.post(
  "/protocols/:protocolId/cycles",
  authorizeRoles("oncologist"),
  validate(createCycleSchema),
  createCycle
);

router.get(
  "/protocols/:protocolId/cycles",
  authorizeRoles("oncologist", "patient", "lab_staff"),
  getProtocolCycles
);

router.put(
  "/protocols/:protocolId/cycles/bulk",
  authorizeRoles("oncologist"),
  validate(bulkUpdateCycleSchema),
  bulkUpdateCycles
);

router.put(
  "/cycles/:cycleId",
  authorizeRoles("oncologist"),
  validate(updateCycleSchema),
  updateCycle
);

router.delete(
  "/cycles/:cycleId",
  authorizeRoles("oncologist"),
  deleteCycle
);

router.patch(
  "/cycles/:cycleId/approve",
  authorizeRoles("oncologist"),
  approveCycle
);

router.patch(
  "/cycles/:cycleId/delay",
  authorizeRoles("oncologist"),
  validate(delayCycleSchema),
  delayCycle
);

module.exports = router;
