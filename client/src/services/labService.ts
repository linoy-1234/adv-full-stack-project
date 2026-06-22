import api from "./api";
import type { ApiMessageResponse, LabResultsResponse } from "../types/api";

export interface LabResultPayload {
  cycleId?: string | null;
  testDate: string;
  wbc: number;
  neutrophils: number;
  hemoglobin: number;
  platelets: number;
  alt: number;
  creatinine: number;
  notes?: string;
}

export const getPatientLabs = async (
  patientId: string
): Promise<LabResultsResponse> => {
  const { data } = await api.get<LabResultsResponse>(
    `/labs/patients/${patientId}`
  );

  return data;
};

export const getMyLabs = async (): Promise<LabResultsResponse> => {
  const { data } = await api.get<LabResultsResponse>("/labs/my");
  return data;
};

export const createLabResult = async (
  patientId: string,
  labData: LabResultPayload
): Promise<LabResultsResponse> => {
  const { data } = await api.post<LabResultsResponse>(
    `/labs/patients/${patientId}`,
    labData
  );

  return data;
};

export const getLabResultById = async (
  labResultId: string
): Promise<LabResultsResponse> => {
  const { data } = await api.get<LabResultsResponse>(`/labs/${labResultId}`);
  return data;
};

export const updateLabResult = async (
  labResultId: string,
  labData: Partial<LabResultPayload>
): Promise<LabResultsResponse> => {
  const { data } = await api.put<LabResultsResponse>(
    `/labs/${labResultId}`,
    labData
  );

  return data;
};

export const deleteLabResult = async (
  labResultId: string
): Promise<ApiMessageResponse> => {
  const { data } = await api.delete<ApiMessageResponse>(
    `/labs/${labResultId}`
  );

  return data;
};

//CRUD blood tests