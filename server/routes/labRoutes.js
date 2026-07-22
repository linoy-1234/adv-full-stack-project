const express = require("express");

const {
  createLabResult,
  getPatientLabResults,
  getMyLabResults,
  getLabResultById,
  updateLabResult,
  deleteLabResult,
} = require("../controllers/labController");

const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createLabResultSchema,
  updateLabResultSchema,
} = require("../utils/validators/labValidator");

const router = express.Router();

router.use(protect);

router.get("/my", authorizeRoles("patient"), getMyLabResults);

router.get(
  "/patients/:patientId",
  authorizeRoles("oncologist", "patient", "lab_staff"),
  getPatientLabResults
);

router.get(
  "/:labResultId",
  authorizeRoles("oncologist", "patient", "lab_staff"),
  getLabResultById
);

router.post(
  "/patients/:patientId",
  authorizeRoles("lab_staff"),
  validate(createLabResultSchema),
  createLabResult
);

router.put(
  "/:labResultId",
  authorizeRoles("lab_staff"),
  validate(updateLabResultSchema),
  updateLabResult
);

router.delete("/:labResultId", authorizeRoles("lab_staff"), deleteLabResult);

module.exports = router;