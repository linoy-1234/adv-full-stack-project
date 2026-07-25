const User = require("../models/User");
const TreatmentProtocol = require("../models/TreatmentProtocol");
const TreatmentCycle = require("../models/TreatmentCycle");
const LabResult = require("../models/LabResult");
const Message = require("../models/Message");
const SymptomLog = require("../models/SymptomLog");
const ClinicalDocument = require("../models/ClinicalDocument");

// Soft-deactivates every record linked to a patient once their profile is
// deactivated, so no orphaned "active" records reference an inactive patient.
const cascadeDeactivatePatient = async (patient, actingUserId) => {
  const cascadeDeletedAt = new Date();

  await Promise.all([
    patient.user
      ? User.findByIdAndUpdate(patient.user, { isActive: false })
      : Promise.resolve(),

    TreatmentProtocol.updateMany(
      { patient: patient._id, isActive: true },
      { $set: { isActive: false, updatedBy: actingUserId } }
    ),

    TreatmentCycle.updateMany(
      { patient: patient._id, isActive: true },
      { $set: { isActive: false } }
    ),

    LabResult.updateMany(
      { patient: patient._id, isActive: true },
      { $set: { isActive: false, updatedBy: actingUserId } }
    ),

    Message.updateMany(
      { patient: patient._id, isActive: true },
      { $set: { isActive: false } }
    ),

    SymptomLog.updateMany(
      { patient: patient._id, isActive: true },
      { $set: { isActive: false } }
    ),

    ClinicalDocument.updateMany(
      { patient: patient._id, isActive: true },
      {
        $set: {
          isActive: false,
          deletedAt: cascadeDeletedAt,
          deletedBy: actingUserId,
        },
      }
    ),
  ]);
};

module.exports = cascadeDeactivatePatient;
