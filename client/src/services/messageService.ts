import api from "./api";
import type {
  ApiMessageResponse,
  MessageRecordResponse,
  MessagesResponse,
  UnreadCountResponse,
  UnreadCountsResponse,
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

export const getMyUnreadCount = async (): Promise<UnreadCountResponse> => {
  const { data } = await api.get<UnreadCountResponse>(
    "/messages/my/unread-count"
  );
  return data;
};

export const getOncologistUnreadCounts =
  async (): Promise<UnreadCountsResponse> => {
    const { data } = await api.get<UnreadCountsResponse>(
      "/messages/unread-counts"
    );
    return data;
  };

export const sendMessage = async (
  patientId: string,
  text: string,
  attachments: File[] = []
): Promise<unknown> => {
  const formData = new FormData();
  formData.append("text", text);
  attachments.forEach((file) => formData.append("attachments", file));

  const { data } = await api.post<MessageRecordResponse>(
    `/messages/patients/${patientId}`,
    formData
  );
  return data.messageRecord;
};

export const markAllRead = async (
  patientId: string
): Promise<ApiMessageResponse> => {
  const { data } = await api.patch<ApiMessageResponse>(
    `/messages/patients/${patientId}/mark-all-read`
  );
  return data;
};

export const markMessageAsRead = async (
  messageId: string
): Promise<unknown> => {
  const { data } = await api.patch<MessageRecordResponse>(
    `/messages/${messageId}/read`
  );
  return data.messageRecord;
};

export const editMessage = async (
  messageId: string,
  text: string
): Promise<MessageRecordResponse> => {
  const { data } = await api.patch<MessageRecordResponse>(
    `/messages/${messageId}/edit`,
    { text }
  );
  return data;
};

export const deleteMessage = async (
  messageId: string
): Promise<ApiMessageResponse> => {
  const { data } = await api.delete<ApiMessageResponse>(
    `/messages/${messageId}`
  );
  return data;
};
