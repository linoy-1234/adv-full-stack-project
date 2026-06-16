const Joi = require("joi");

const sendMessageSchema = Joi.object({
  text: Joi.string()
    .trim()
    .allow("")
    .max(2000)
    .default(""),
});

module.exports = {
  sendMessageSchema,
};