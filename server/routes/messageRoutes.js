const express = require("express");

const {
  sendMessage,
  getPatientMessages,
  getMyMessages,
  getMyUnreadCount,
  getOncologistUnreadCounts,
  markAllMessagesRead,
  markMessageAsRead,
  editMessage,
  deleteMessage,
} = require("../controllers/messageController");

const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");
const { sendMessageSchema, editMessageSchema } = require("../utils/validators/messageValidator");

const router = express.Router();

router.use(protect);

// Patient-scoped fixed-segment routes (must come before /:messageId wildcards)
router.get("/my", getMyMessages);
router.get("/my/unread-count", getMyUnreadCount);

// Oncologist-scoped fixed-segment route
router.get("/unread-counts", getOncologistUnreadCounts);

// Patient-id-scoped routes
router.get("/patients/:patientId", getPatientMessages);
router.post("/patients/:patientId", validate(sendMessageSchema), sendMessage);
router.patch("/patients/:patientId/mark-all-read", markAllMessagesRead);

// Single-message routes (dynamic :messageId — keep below all fixed-segment routes)
router.patch("/:messageId/read", markMessageAsRead);
router.patch("/:messageId/edit", validate(editMessageSchema), editMessage);
router.delete("/:messageId", deleteMessage);

module.exports = router;
