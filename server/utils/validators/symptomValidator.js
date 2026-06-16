const Joi = require("joi");

const symptomItemSchema = Joi.object({
  type: Joi.string()
    .valid(
      "nausea",
      "fatigue",
      "pain",
      "vomiting",
      "appetite_loss",
      "mouth_sores",
      "other"
    )
    .required(),

  severity: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .required(),

  customSymptom: Joi.string()
    .trim()
    .allow("")
    .max(120)
    .default(""),
});

const createSymptomLogSchema = Joi.object({
  logDate: Joi.date()
    .default(() => new Date()),

  symptoms: Joi.array()
    .items(symptomItemSchema)
    .min(1)
    .required(),

  notes: Joi.string()
    .trim()
    .allow("")
    .max(1000)
    .default(""),
});

const updateSymptomLogSchema = Joi.object({
  logDate: Joi.date(),

  symptoms: Joi.array()
    .items(symptomItemSchema)
    .min(1),

  notes: Joi.string()
    .trim()
    .allow("")
    .max(1000),
}).min(1);

module.exports = {
  createSymptomLogSchema,
  updateSymptomLogSchema,
};