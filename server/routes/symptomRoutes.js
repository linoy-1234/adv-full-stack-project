const express = require("express");

const {
  createSymptomLog,
  getMySymptomLogs,
  getPatientSymptomLogs,
  getSymptomLogById,
  updateSymptomLog,
  deleteSymptomLog,
} = require("../controllers/symptomController");

const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");

const {
  createSymptomLogSchema,
  updateSymptomLogSchema,
} = require("../utils/validators/symptomValidator");

const router = express.Router();

router.use(protect);

router
  .route("/my")
  .get(getMySymptomLogs)
  .post(validate(createSymptomLogSchema), createSymptomLog);

router.get("/patients/:patientId", getPatientSymptomLogs);

router.get("/:symptomLogId", getSymptomLogById);

router.put(
  "/:symptomLogId",
  validate(updateSymptomLogSchema),
  updateSymptomLog
);

router.delete("/:symptomLogId", deleteSymptomLog);

module.exports = router;