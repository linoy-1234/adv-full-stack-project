import api from "./api";
import type {
  ApiMessageResponse,
  MessageRecordResponse,
  MessagesResponse,
} from "../types/api";

export const getPatientMessages = async (
  patientId: string
): Promise<MessagesResponse> => {
  const { data } = await api.get<MessagesResponse>(
    `/messages/patients/${patientId}`
  );

  return data;
};

export const getMyMessages = async (): Promise<MessagesResponse> => {
  const { data } = await api.get<MessagesResponse>("/messages/my");
  return data;
};

export const sendMessage = async (
  patientId: string,
  text: string,
  attachments: File[] = []
): Promise<unknown> => {
  const formData = new FormData();

  formData.append("text", text);

  attachments.forEach((file) => {
    formData.append("attachments", file);
  });

  const { data } = await api.post<MessageRecordResponse>(
    `/messages/patients/${patientId}`,
    formData
  );

  return data.messageRecord;
};

export const markMessageAsRead = async (
  messageId: string
): Promise<unknown> => {
  const { data } = await api.patch<MessageRecordResponse>(
    `/messages/${messageId}/read`
  );

  return data.messageRecord;
};

export const deleteMessage = async (
  messageId: string
): Promise<ApiMessageResponse> => {
  const { data } = await api.delete<ApiMessageResponse>(
    `/messages/${messageId}`
  );

  return data;
};

//messages