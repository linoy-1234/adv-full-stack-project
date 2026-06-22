import api from "./api";
import type { ApiMessageResponse, SymptomLogsResponse } from "../types/api";

export type SymptomType =
  | "nausea"
  | "fatigue"
  | "pain"
  | "vomiting"
  | "appetite_loss"
  | "mouth_sores"
  | "other";

export interface SymptomItemPayload {
  type: SymptomType;
  severity: number;
  customSymptom?: string;
}

export interface SymptomLogPayload {
  logDate?: string;
  symptoms: SymptomItemPayload[];
  notes?: string;
}

export const getMySymptoms = async (): Promise<SymptomLogsResponse> => {
  const { data } = await api.get<SymptomLogsResponse>("/symptoms/my");
  return data;
};

export const createSymptomLog = async (
  symptomData: SymptomLogPayload
): Promise<SymptomLogsResponse> => {
  const { data } = await api.post<SymptomLogsResponse>(
    "/symptoms/my",
    symptomData
  );

  return data;
};

export const getPatientSymptoms = async (
  patientId: string
): Promise<SymptomLogsResponse> => {
  const { data } = await api.get<SymptomLogsResponse>(
    `/symptoms/patients/${patientId}`
  );

  return data;
};

export const getSymptomLogById = async (
  symptomLogId: string
): Promise<SymptomLogsResponse> => {
  const { data } = await api.get<SymptomLogsResponse>(
    `/symptoms/${symptomLogId}`
  );

  return data;
};

export const updateSymptomLog = async (
  symptomLogId: string,
  symptomData: Partial<SymptomLogPayload>
): Promise<SymptomLogsResponse> => {
  const { data } = await api.put<SymptomLogsResponse>(
    `/symptoms/${symptomLogId}`,
    symptomData
  );

  return data;
};

export const deleteSymptomLog = async (
  symptomLogId: string
): Promise<ApiMessageResponse> => {
  const { data } = await api.delete<ApiMessageResponse>(
    `/symptoms/${symptomLogId}`
  );

  return data;
};

//symptom journal CRUD patient create oncologoist sees