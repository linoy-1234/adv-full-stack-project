const express = require("express");

const {
  createPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deletePatient,
} = require("../controllers/patientController");

const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const {
  createPatientSchema,
  updatePatientSchema,
} = require("../utils/validators/patientValidator");

const router = express.Router();

router
  .route("/")
  .post(
    protect,
    authorizeRoles("oncologist"),
    validate(createPatientSchema),
    createPatient
  )
  .get(protect, authorizeRoles("oncologist", "lab_staff"), getPatients);

router
  .route("/:id")
  .get(
    protect,
    authorizeRoles("oncologist", "lab_staff", "patient"),
    getPatientById
  )
  .put(
    protect,
    authorizeRoles("oncologist"),
    validate(updatePatientSchema),
    updatePatient
  )
  .delete(protect, authorizeRoles("oncologist"), deletePatient);

module.exports = router;