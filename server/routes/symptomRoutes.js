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
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createSymptomLogSchema,
  updateSymptomLogSchema,
} = require("../utils/validators/symptomValidator");

const router = express.Router();

router.use(protect);

router
  .route("/my")
  .get(authorizeRoles("patient"), getMySymptomLogs)
  .post(authorizeRoles("patient"), validate(createSymptomLogSchema), createSymptomLog);

router.get("/patients/:patientId", getPatientSymptomLogs);

router.get("/:symptomLogId", getSymptomLogById);

router.put(
  "/:symptomLogId",
  authorizeRoles("patient"),
  validate(updateSymptomLogSchema),
  updateSymptomLog
);

router.delete("/:symptomLogId", authorizeRoles("patient"), deleteSymptomLog);

module.exports = router;