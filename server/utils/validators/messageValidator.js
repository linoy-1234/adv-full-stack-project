const Joi = require("joi");

const sendMessageSchema = Joi.object({
  text: Joi.string()
    .trim()
    .allow("")
    .max(2000)
    .default(""),
});

const editMessageSchema = Joi.object({
  text: Joi.string().trim().max(2000).required(),
});

module.exports = {
  sendMessageSchema,
  editMessageSchema,
};
