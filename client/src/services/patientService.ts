import api from "./api";
import type {
  ApiMessageResponse,
  PatientListResponse,
  PatientResponse,
} from "../types/api";

export interface PatientPayload {
  fullName: string;
  email: string;
  nationalId: string;
  dateOfBirth: string;
  diagnosis: string;
  bloodType?: string;
  notes?: string;
}

export const getPatients = async (): Promise<PatientListResponse> => {
  const { data } = await api.get<PatientListResponse>("/patients");
  return data;
};

export const getPatientById = async (
  patientId: string
): Promise<PatientResponse> => {
  const { data } = await api.get<PatientResponse>(`/patients/${patientId}`);
  return data;
};

export const createPatient = async (
  patientData: PatientPayload
): Promise<PatientResponse> => {
  const { data } = await api.post<PatientResponse>("/patients", patientData);
  return data;
};

export const updatePatient = async (
  patientId: string,
  patientData: Partial<PatientPayload>
): Promise<PatientResponse> => {
  const { data } = await api.put<PatientResponse>(
    `/patients/${patientId}`,
    patientData
  );

  return data;
};

export const deletePatient = async (
  patientId: string
): Promise<ApiMessageResponse> => {
  const { data } = await api.delete<ApiMessageResponse>(
    `/patients/${patientId}`
  );

  return data;
};

//all the stuff related to the patients (patient list, id patient, CRUD...)