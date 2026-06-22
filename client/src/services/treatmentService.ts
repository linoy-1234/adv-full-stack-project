import api from "./api";
import type { ApiMessageResponse, TreatmentProtocolResponse } from "../types/api";

export interface TreatmentTypePayload {
  type: "chemotherapy" | "radiation" | "surgery";
  plannedCount: number;
  notes?: string;
}

export interface MedicationPayload {
  name: string;
  dose?: string;
  route?: string;
  schedule?: string;
  category?: "chemotherapy" | "supportive" | "chronic" | "other";
  notes?: string;
}

export interface CyclePayload {
  treatmentType: "chemotherapy" | "radiation" | "surgery";
  cycleNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  medications?: string[];
  status?:
    | "upcoming"
    | "waiting_for_labs"
    | "pending_review"
    | "approved"
    | "active"
    | "completed"
    | "delayed";
  notes?: string;
}

export interface ProtocolPayload {
  protocolName: string;
  diagnosis: string;
  treatmentTypes: TreatmentTypePayload[];
  medications?: MedicationPayload[];
  notes?: string;
  cycles?: CyclePayload[];
}

export interface DelayCyclePayload {
  newStartDate: string;
  newEndDate: string;
  delayReason: string;
  decisionNotes?: string;
}

export const getPatientProtocol = async (
  patientId: string
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.get<TreatmentProtocolResponse>(
    `/treatments/patients/${patientId}/protocol`
  );

  return data;
};

export const getMyProtocol = async (): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.get<TreatmentProtocolResponse>(
    "/treatments/my/protocol"
  );

  return data;
};

export const createProtocol = async (
  patientId: string,
  protocolData: ProtocolPayload
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.post<TreatmentProtocolResponse>(
    `/treatments/patients/${patientId}/protocol`,
    protocolData
  );

  return data;
};

export const updateProtocol = async (
  protocolId: string,
  protocolData: Partial<ProtocolPayload>
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.put<TreatmentProtocolResponse>(
    `/treatments/protocols/${protocolId}`,
    protocolData
  );

  return data;
};

export const deleteProtocol = async (
  protocolId: string
): Promise<ApiMessageResponse> => {
  const { data } = await api.delete<ApiMessageResponse>(
    `/treatments/protocols/${protocolId}`
  );

  return data;
};

export const createCycle = async (
  protocolId: string,
  cycleData: CyclePayload
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.post<TreatmentProtocolResponse>(
    `/treatments/protocols/${protocolId}/cycles`,
    cycleData
  );

  return data;
};

export const getProtocolCycles = async (
  protocolId: string
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.get<TreatmentProtocolResponse>(
    `/treatments/protocols/${protocolId}/cycles`
  );

  return data;
};

export const updateCycle = async (
  cycleId: string,
  cycleData: Partial<CyclePayload>
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.put<TreatmentProtocolResponse>(
    `/treatments/cycles/${cycleId}`,
    cycleData
  );

  return data;
};

export const deleteCycle = async (
  cycleId: string
): Promise<ApiMessageResponse> => {
  const { data } = await api.delete<ApiMessageResponse>(
    `/treatments/cycles/${cycleId}`
  );

  return data;
};

export const approveCycle = async (
  cycleId: string,
  decisionNotes = ""
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.patch<TreatmentProtocolResponse>(
    `/treatments/cycles/${cycleId}/approve`,
    {
      decisionNotes,
    }
  );

  return data;
};

export const delayCycle = async (
  cycleId: string,
  delayData: DelayCyclePayload
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.patch<TreatmentProtocolResponse>(
    `/treatments/cycles/${cycleId}/delay`,
    delayData
  );

  return data;
};

//the protocol of the treatment,(approve,deny treatment, CRUD protocol, CRUD rounds)