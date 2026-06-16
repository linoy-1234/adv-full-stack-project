const Joi = require("joi");

const allergySchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required().messages({
    "string.empty": "Allergy name is required",
    "string.min": "Allergy name must be at least 2 characters",
    "string.max": "Allergy name cannot exceed 80 characters",
    "any.required": "Allergy name is required",
  }),

  severity: Joi.string()
    .valid("mild", "moderate", "severe", "unknown")
    .default("unknown"),

  notes: Joi.string().trim().max(500).allow("").default(""),
});

const createPatientSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(80).required().messages({
    "string.empty": "Patient full name is required",
    "string.min": "Patient full name must be at least 2 characters",
    "string.max": "Patient full name cannot exceed 80 characters",
    "any.required": "Patient full name is required",
  }),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      "string.empty": "Patient email is required",
      "string.email": "Please enter a valid patient email",
      "any.required": "Patient email is required",
    }),

  nationalId: Joi.string().trim().min(5).max(20).required().messages({
    "string.empty": "National ID is required",
    "string.min": "National ID must be at least 5 characters",
    "string.max": "National ID cannot exceed 20 characters",
    "any.required": "National ID is required",
  }),

  dateOfBirth: Joi.date().required().messages({
    "date.base": "Date of birth must be a valid date",
    "any.required": "Date of birth is required",
  }),

  diagnosis: Joi.string().trim().min(2).max(200).required().messages({
    "string.empty": "Diagnosis is required",
    "string.min": "Diagnosis must be at least 2 characters",
    "string.max": "Diagnosis cannot exceed 200 characters",
    "any.required": "Diagnosis is required",
  }),

  bloodType: Joi.string()
    .valid("A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown")
    .default("unknown"),

  allergies: Joi.array().items(allergySchema).default([]),

  notes: Joi.string().trim().max(1000).allow("").default(""),
});

const updatePatientSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(80),

  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } }),

  nationalId: Joi.string().trim().min(5).max(20),

  dateOfBirth: Joi.date(),

  diagnosis: Joi.string().trim().min(2).max(200),

  bloodType: Joi.string().valid(
    "A+",
    "A-",
    "B+",
    "B-",
    "AB+",
    "AB-",
    "O+",
    "O-",
    "unknown"
  ),

  allergies: Joi.array().items(allergySchema),

  notes: Joi.string().trim().max(1000).allow(""),
}).min(1).messages({
  "object.min": "At least one field is required for update",
});

module.exports = {
  createPatientSchema,
  updatePatientSchema,
};


//making sure the information the oncologist sent the database(for the user data) is validated, meaning if something is missing or not good 400 will appear