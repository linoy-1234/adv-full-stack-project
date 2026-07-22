const express = require("express");

const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const validate = require("../middleware/validate");
const uploadCloud = require("../middleware/uploadCloud");
const {
  uploadDocument,
  getPatientDocuments,
  updateDocumentMetadata,
  softDeleteDocument,
  getDocumentUrl,
} = require("../controllers/documentController");
const {
  uploadDocumentSchema,
  updateDocumentSchema,
} = require("../utils/validators/documentValidator");

const router = express.Router();

router.use(protect);

router.post(
  "/patients/:patientId",
  authorizeRoles("oncologist"),
  uploadCloud.single("file"),
  validate(uploadDocumentSchema),
  uploadDocument
);

router.get("/patients/:patientId", getPatientDocuments);

router.put(
  "/:documentId",
  authorizeRoles("oncologist"),
  validate(updateDocumentSchema),
  updateDocumentMetadata
);

router.delete("/:documentId", authorizeRoles("oncologist"), softDeleteDocument);

router.get("/:documentId/url", getDocumentUrl);

module.exports = router;
