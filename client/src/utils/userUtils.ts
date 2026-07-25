import type { User } from "../types/auth";

export const getUserPatientProfileId = (user: User | null | undefined) => {
  const patientProfile = user?.patientProfile;

  if (!patientProfile) return "";
  if (typeof patientProfile === "string") return patientProfile;
  return patientProfile._id || "";
};
