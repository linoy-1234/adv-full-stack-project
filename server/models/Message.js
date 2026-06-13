const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PatientProfile",
      required: [true, "Patient is required"],
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Sender is required"],
    },

    senderRole: {
      type: String,
      enum: ["patient", "oncologist"],
      required: [true, "Sender role is required"],
    },

    text: {
      type: String,
      trim: true,
      maxlength: [2000, "Message cannot exceed 2000 characters"],
      default: "",
    },

    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ClinicalDocument",
      },
    ],

    readByPatient: {
      type: Boolean,
      default: false,
    },

    readByOncologist: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

messageSchema.pre("validate", function (next) {
  const hasText = this.text && this.text.trim().length > 0;
  const hasAttachments = this.attachments && this.attachments.length > 0;

  if (!hasText && !hasAttachments) {
    this.invalidate("text", "Message must include text or an attachment");
  }

  next();
});

messageSchema.index({ patient: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model("Message", messageSchema);

//saves the messages between the patient and the oncologist