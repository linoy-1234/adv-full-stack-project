const Joi = require("joi");

const weekdaySchema = Joi.string().valid(
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat"
);

const treatmentTypeSchema = Joi.object({
  type: Joi.string()
    .valid("chemotherapy", "radiation", "surgery", "supportive")
    .required(),

  plannedCount: Joi.number()
    .integer()
    .min(0)
    .default(0),

  notes: Joi.string()
    .allow("")
    .max(500)
    .default(""),
});

const medicationSchema = Joi.object({
  id: Joi.string()
    .allow("")
    .max(80)
    .default(""),

  name: Joi.string()
    .min(2)
    .max(100)
    .required(),

  dose: Joi.string()
    .allow("")
    .max(80)
    .default(""),

  route: Joi.string()
    .allow("")
    .max(80)
    .default(""),

  schedule: Joi.string()
    .allow("")
    .max(160)
    .default(""),

  frequency: Joi.string()
    .allow("")
    .max(160)
    .default(""),

  timing: Joi.string()
    .allow("")
    .max(160)
    .default(""),

  weekdays: Joi.array()
    .items(weekdaySchema)
    .unique()
    .default([]),

  asNeeded: Joi.boolean()
    .default(false),

  category: Joi.string()
    .valid("chemotherapy", "supportive", "chronic", "other")
    .default("other"),

  notes: Joi.string()
    .allow("")
    .max(500)
    .default(""),
});

const cycleSchema = Joi.object({
  treatmentType: Joi.string()
    .valid("chemotherapy", "radiation", "surgery")
    .required(),

  cycleNumber: Joi.number()
    .integer()
    .min(1)
    .required(),

  title: Joi.string()
    .min(2)
    .max(120)
    .required(),

  startDate: Joi.date()
    .required(),

  endDate: Joi.date()
    .min(Joi.ref("startDate"))
    .required(),

  medications: Joi.array()
    .items(Joi.string().max(100))
    .default([]),

  plannedDate: Joi.date()
    .allow(null),

  totalSessions: Joi.number()
    .integer()
    .min(0)
    .default(0),

  completedSessions: Joi.number()
    .integer()
    .min(0)
    .default(0),

  weekdays: Joi.array()
    .items(weekdaySchema)
    .unique()
    .default([]),

  status: Joi.string()
    .valid(
      "upcoming",
      "waiting_for_labs",
      "waiting_for_review",
      "pending_review",
      "approved",
      "active",
      "completed",
      "delayed",
      "cancelled",
      "in_progress",
      "postponed"
    )
    .default("upcoming"),

  notes: Joi.string()
    .allow("")
    .max(500)
    .default(""),
});

const createTreatmentProtocolSchema = Joi.object({
  protocolName: Joi.string()
    .min(2)
    .max(120)
    .required(),

  diagnosis: Joi.string()
    .min(2)
    .max(160)
    .required(),

  treatmentTypes: Joi.array()
    .items(treatmentTypeSchema)
    .min(1)
    .required(),

  medications: Joi.array()
    .items(medicationSchema)
    .default([]),

  drugs: Joi.array()
    .items(Joi.string().max(100))
    .default([]),

  notes: Joi.string()
    .allow("")
    .max(1000)
    .default(""),

  cycles: Joi.array()
    .items(cycleSchema)
    .min(1)
    .required(),
});

const updateTreatmentProtocolSchema = Joi.object({
  protocolName: Joi.string()
    .min(2)
    .max(120),

  diagnosis: Joi.string()
    .min(2)
    .max(160),

  treatmentTypes: Joi.array()
    .items(treatmentTypeSchema)
    .min(1),

  medications: Joi.array()
    .items(medicationSchema),

  drugs: Joi.array()
    .items(Joi.string().max(100)),

  notes: Joi.string()
    .allow("")
    .max(1000),
}).min(1);

const createCycleSchema = cycleSchema;

const updateCycleSchema = Joi.object({
  treatmentType: Joi.string()
    .valid("chemotherapy", "radiation", "surgery"),

  cycleNumber: Joi.number()
    .integer()
    .min(1),

  title: Joi.string()
    .min(2)
    .max(120),

  startDate: Joi.date(),

  endDate: Joi.date(),

  medications: Joi.array()
    .items(Joi.string().max(100)),

  plannedDate: Joi.date()
    .allow(null),

  totalSessions: Joi.number()
    .integer()
    .min(0),

  completedSessions: Joi.number()
    .integer()
    .min(0),

  weekdays: Joi.array()
    .items(weekdaySchema)
    .unique(),

  status: Joi.string()
    .valid(
      "upcoming",
      "waiting_for_labs",
      "waiting_for_review",
      "pending_review",
      "approved",
      "active",
      "completed",
      "delayed",
      "cancelled",
      "in_progress",
      "postponed"
    ),

  notes: Joi.string()
    .allow("")
    .max(500),
}).min(1);

const approveCycleSchema = Joi.object({
  decisionNotes: Joi.string()
    .allow("")
    .max(500)
    .default(""),
});

const delayCycleSchema = Joi.object({
  newStartDate: Joi.date()
    .required(),

  newEndDate: Joi.date()
    .min(Joi.ref("newStartDate"))
    .required(),

  delayReason: Joi.string()
    .max(500)
    .allow("")
    .optional(),

  decisionNotes: Joi.string()
    .allow("")
    .max(500)
    .default(""),
});

const bulkUpdateCycleSchema = Joi.object({
  cycles: Joi.array()
    .items(
      updateCycleSchema.keys({
        _id: Joi.string()
          .required(),
      })
    )
    .min(1)
    .required(),

  removedCycleIds: Joi.array()
    .items(Joi.string())
    .default([]),
});

module.exports = {
  createTreatmentProtocolSchema,
  updateTreatmentProtocolSchema,
  createCycleSchema,
  updateCycleSchema,
  bulkUpdateCycleSchema,
  approveCycleSchema,
  delayCycleSchema,
};
