export type UserRole = "patient" | "oncologist" | "lab_staff";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  patientProfile?: string | { _id: string; fullName?: string; email?: string } | null;
  isActive?: boolean;
  googleSubject?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}
