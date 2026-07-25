const Joi = require("joi");

const sendMessageSchema = Joi.object({
  text: Joi.string()
    .trim()
    .min(1)
    .max(2000)
    .required(),
});

const editMessageSchema = Joi.object({
  text: Joi.string().trim().max(2000).required(),
});

module.exports = {
  sendMessageSchema,
  editMessageSchema,
};
