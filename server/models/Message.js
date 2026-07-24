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
      maxlength: [2000, "Message text cannot exceed 2000 characters"],
      default: "",
    },

    readByPatient: {
      type: Boolean,
      default: false,
    },

    readByOncologist: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ patient: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });

module.exports = mongoose.model("Message", messageSchema);

//saves the messages between the patient and the oncologist