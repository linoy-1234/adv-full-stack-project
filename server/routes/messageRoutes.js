const express = require("express");

const {
  sendMessage,
  getPatientMessages,
  getMyMessages,
  markMessageAsRead,
  deleteMessage,
} = require("../controllers/messageController");

const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const {
  sendMessageSchema,
} = require("../utils/validators/messageValidator");

const router = express.Router();

router.use(protect);

router.get("/my", getMyMessages);

router.get("/patients/:patientId", getPatientMessages);

router.post(
  "/patients/:patientId",
  upload.array("attachments", 5),
  validate(sendMessageSchema),
  sendMessage
);

router.patch("/:messageId/read", markMessageAsRead);

router.delete("/:messageId", deleteMessage);

module.exports = router;