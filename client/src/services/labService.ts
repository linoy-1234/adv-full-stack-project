import api from "./api";
import type { ApiMessageResponse, LabResultsResponse, LabResultResponse } from "../types/api";

export interface LabResultPayload {
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
): Promise<LabResultResponse> => {
  const { data } = await api.post<LabResultResponse>(
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
): Promise<LabResultResponse> => {
  const { data } = await api.put<LabResultResponse>(
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
