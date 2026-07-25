import type { PatientAllergy, PatientProfile as ApiPatientProfile } from "../types/patient";

type PersonLike = string | { _id?: string; fullName?: string; email?: string } | null | undefined;

export const getPersonName = (value: PersonLike, fallback = "") => {
  if (typeof value === "object" && value?.fullName) return value.fullName;
  return fallback;
};

export const getPersonId = (value: PersonLike, fallback = "") => {
  if (typeof value === "string") return value;
  if (typeof value === "object" && value?._id) return value._id;
  return fallback;
};

export const getAllergyNames = (allergies?: PatientAllergy[]) =>
  (allergies ?? []).map((allergy) => allergy.name).filter(Boolean);

export const getOncologistName = (profile: ApiPatientProfile) => {
  if (typeof profile.oncologist === "object") {
    return profile.oncologist.fullName;
  }
  return "Assigned oncologist";
};
