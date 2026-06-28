const express = require("express");

const { protect } = require("../middleware/authMiddleware");
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
  uploadCloud.single("file"),
  validate(uploadDocumentSchema),
  uploadDocument
);

router.get("/patients/:patientId", getPatientDocuments);

router.put("/:documentId", validate(updateDocumentSchema), updateDocumentMetadata);

router.delete("/:documentId", softDeleteDocument);

router.get("/:documentId/url", getDocumentUrl);

module.exports = router;
