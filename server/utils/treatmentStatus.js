const dateKey = (value) => {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
};

const emptyDecision = () => ({
  decisionStatus: "none",
  decidedBy: null,
  decidedAt: null,
  decisionNotes: "",
});

const isCycleApproved = (cycle) =>
  cycle?.decision?.decisionStatus === "approved";

const resetCycleApproval = (cycle) => {
  cycle.decision = emptyDecision();
};

const deriveChemotherapyStatus = (cycle, today = new Date()) => {
  if (cycle?.isActive === false || cycle.status === "cancelled") {
    return "cancelled";
  }

  const todayValue = dateKey(today);
  const startDate = dateKey(cycle.startDate || cycle.plannedDate);
  const endDate = dateKey(cycle.endDate || cycle.startDate || cycle.plannedDate);
  const approved = isCycleApproved(cycle);

  if (!approved) {
    return startDate && todayValue < startDate ? "upcoming" : "waiting_for_review";
  }

  if (startDate && todayValue < startDate) return "upcoming";

  if (endDate && todayValue > endDate) {
    return "completed";
  }

  return "active";
};

const deriveRadiationStatus = (cycle, today = new Date()) => {
  if (cycle?.isActive === false || cycle.status === "cancelled") {
    return "cancelled";
  }

  const todayValue = dateKey(today);
  const startDate = dateKey(cycle.startDate || cycle.plannedDate);
  const endDate = dateKey(cycle.endDate || cycle.startDate || cycle.plannedDate);

  if (startDate && todayValue < startDate) {
    return "upcoming";
  }

  if (endDate && todayValue > endDate) {
    return "completed";
  }

  return "active";
};

const deriveTreatmentStatus = (cycle, today = new Date()) => {
  if (cycle?.treatmentType === "chemotherapy") {
    return deriveChemotherapyStatus(cycle, today);
  }

  if (cycle?.treatmentType === "radiation") {
    return deriveRadiationStatus(cycle, today);
  }

  return cycle?.status || "upcoming";
};

const syncDerivedTreatmentStatus = (cycle, today = new Date()) => {
  const status = deriveTreatmentStatus(cycle, today);
  if (cycle && status && cycle.status !== status) {
    cycle.status = status;
  }
  return status;
};

module.exports = {
  dateKey,
  emptyDecision,
  isCycleApproved,
  resetCycleApproval,
  deriveTreatmentStatus,
  syncDerivedTreatmentStatus,
};
