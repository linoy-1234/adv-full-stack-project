const PatientProfile = require("../models/PatientProfile");
const isValidId = require("./isValidId");

// Used by treatment/lab data: oncologist, patient, and lab_staff all get
// read access (lab_staff needs to enter results for any active patient).
const authorizePatientIncludingLabStaff = async (req, patientId) => {
  if (!isValidId(patientId)) {
    return null;
  }

  if (req.user.role === "oncologist") {
    return PatientProfile.findOne({
      _id: patientId,
      oncologist: req.user._id,
      isActive: true,
    });
  }

  if (req.user.role === "patient") {
    return PatientProfile.findOne({
      _id: patientId,
      user: req.user._id,
      isActive: true,
    });
  }

  if (req.user.role === "lab_staff") {
    return PatientProfile.findOne({
      _id: patientId,
      isActive: true,
    });
  }

  return null;
};

// Used by messages/symptoms/documents: only the assigned oncologist or the
// patient themself get access - lab_staff has no reason to read these.
const authorizePatientOwnerOnly = async (req, patientId) => {
  if (!isValidId(patientId)) {
    return null;
  }

  if (req.user.role === "oncologist") {
    return PatientProfile.findOne({
      _id: patientId,
      oncologist: req.user._id,
      isActive: true,
    });
  }

  if (req.user.role === "patient") {
    return PatientProfile.findOne({
      _id: patientId,
      user: req.user._id,
      isActive: true,
    });
  }

  return null;
};

module.exports = { authorizePatientIncludingLabStaff, authorizePatientOwnerOnly };
