const Joi = require("joi");

const DOCUMENT_TYPES = [
  "visit_summary",
  "medical_certificate",
  "prescription",
  "other",
];

const uploadDocumentSchema = Joi.object({
  title: Joi.string().trim().max(120).required(),
  documentType: Joi.string()
    .valid(...DOCUMENT_TYPES)
    .required(),
  description: Joi.string().trim().max(1000).allow("").optional(),
});

const updateDocumentSchema = Joi.object({
  title: Joi.string().trim().max(120).optional(),
  documentType: Joi.string()
    .valid(...DOCUMENT_TYPES)
    .optional(),
  description: Joi.string().trim().max(1000).allow("").optional(),
}).min(1);

module.exports = { uploadDocumentSchema, updateDocumentSchema };
