import api from "./api";
import type {
  DocumentsResponse,
  DocumentResponse,
  DocumentUrlResponse,
  ApiMessageResponse,
} from "../types/api";

export const getPatientDocuments = async (
  patientId: string,
  documentType?: string
): Promise<DocumentsResponse> => {
  const params: Record<string, string> = {};
  if (documentType && documentType !== "all") {
    params.documentType = documentType;
  }

  const { data } = await api.get<DocumentsResponse>(
    `/documents/patients/${patientId}`,
    { params }
  );

  return data;
};

export const uploadDocument = async (
  patientId: string,
  formData: FormData
): Promise<DocumentResponse> => {
  const { data } = await api.post<DocumentResponse>(
    `/documents/patients/${patientId}`,
    formData
  );

  return data;
};

export const updateDocumentMetadata = async (
  documentId: string,
  payload: { title?: string; documentType?: string; description?: string }
): Promise<DocumentResponse> => {
  const { data } = await api.put<DocumentResponse>(
    `/documents/${documentId}`,
    payload
  );

  return data;
};

export const deleteDocument = async (
  documentId: string
): Promise<ApiMessageResponse> => {
  const { data } = await api.delete<ApiMessageResponse>(
    `/documents/${documentId}`
  );

  return data;
};

export const getDocumentUrl = async (
  documentId: string
): Promise<DocumentUrlResponse> => {
  const { data } = await api.get<DocumentUrlResponse>(
    `/documents/${documentId}/url`
  );

  return data;
};
