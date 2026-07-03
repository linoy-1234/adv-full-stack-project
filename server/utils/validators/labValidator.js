const Joi = require("joi");

const createLabResultSchema = Joi.object({
  testDate: Joi.date()
    .required(),

  wbc: Joi.number()
    .min(0)
    .required(),

  neutrophils: Joi.number()
    .min(0)
    .required(),

  hemoglobin: Joi.number()
    .min(0)
    .required(),

  platelets: Joi.number()
    .min(0)
    .required(),

  alt: Joi.number()
    .min(0)
    .required(),

  creatinine: Joi.number()
    .min(0)
    .required(),

  notes: Joi.string()
    .allow("")
    .max(1000)
    .default(""),
});

const updateLabResultSchema = Joi.object({
  testDate: Joi.date(),

  wbc: Joi.number()
    .min(0),

  neutrophils: Joi.number()
    .min(0),

  hemoglobin: Joi.number()
    .min(0),

  platelets: Joi.number()
    .min(0),

  alt: Joi.number()
    .min(0),

  creatinine: Joi.number()
    .min(0),

  notes: Joi.string()
    .allow("")
    .max(1000),
}).min(1);

module.exports = {
  createLabResultSchema,
  updateLabResultSchema,
};
