import api from "./api";
import type { ApiMessageResponse, TreatmentProtocolResponse, WeekdayKey } from "../types/api";

export interface TreatmentTypePayload {
  type: "chemotherapy" | "radiation" | "surgery" | "supportive";
  plannedCount: number;
  notes?: string;
}

export interface MedicationPayload {
  id?: string;
  name: string;
  dose?: string;
  route?: string;
  frequency?: string;
  timing?: string;
  schedule?: string;
  weekdays?: WeekdayKey[];
  asNeeded?: boolean;
  category?: "chemotherapy" | "supportive" | "chronic" | "other";
  notes?: string;
}

export interface CyclePayload {
  treatmentType: "chemotherapy" | "radiation" | "surgery";
  cycleNumber: number;
  title: string;
  startDate: string;
  endDate: string;
  plannedDate?: string;
  totalSessions?: number;
  completedSessions?: number;
  weekdays?: WeekdayKey[];
  medications?: string[];
  status?:
    | "upcoming"
    | "waiting_for_labs"
    | "waiting_for_review"
    | "pending_review"
    | "approved"
    | "active"
    | "completed"
    | "delayed"
    | "cancelled"
    | "in_progress"
    | "postponed";
  notes?: string;
}

export interface ProtocolPayload {
  protocolName: string;
  diagnosis: string;
  treatmentTypes: TreatmentTypePayload[];
  medications?: MedicationPayload[];
  drugs?: string[];
  notes?: string;
  cycles?: CyclePayload[];
}

export interface DelayCyclePayload {
  newStartDate: string;
  newEndDate: string;
  delayReason?: string;
  decisionNotes?: string;
}

export interface BulkCycleUpdatePayload {
  cycles: Array<Partial<CyclePayload> & { _id: string }>;
  removedCycleIds?: string[];
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

export const bulkUpdateCycles = async (
  protocolId: string,
  payload: BulkCycleUpdatePayload
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.put<TreatmentProtocolResponse>(
    `/treatments/protocols/${protocolId}/cycles/bulk`,
    payload
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

export const postponeCycle = async (
  cycleId: string,
  delayData: DelayCyclePayload
): Promise<TreatmentProtocolResponse> => {
  const { data } = await api.patch<TreatmentProtocolResponse>(
    `/treatments/cycles/${cycleId}/delay`,
    delayData
  );

  return data;
};

export const delayCycle = postponeCycle;

//the protocol of the treatment,(approve,deny treatment, CRUD protocol, CRUD rounds)
