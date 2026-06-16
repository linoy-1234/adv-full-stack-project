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

const {
  createLabResultSchema,
  updateLabResultSchema,
} = require("../utils/validators/labValidator");

const router = express.Router();

router.use(protect);

router.get("/my", getMyLabResults);

router.get("/patients/:patientId", getPatientLabResults);

router.get("/:labResultId", getLabResultById);

router.post(
  "/patients/:patientId",
  validate(createLabResultSchema),
  createLabResult
);

router.put(
  "/:labResultId",
  validate(updateLabResultSchema),
  updateLabResult
);

router.delete("/:labResultId", deleteLabResult);

module.exports = router;