import type { UserRole } from "./auth";

export interface MessageRecord {
  _id: string;
  patient: string;
  sender:
    | { _id: string; fullName: string; email: string; role: UserRole }
    | string;
  senderRole: "patient" | "oncologist";
  text: string;
  readByPatient: boolean;
  readByOncologist: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MessagesResponse {
  success: boolean;
  count: number;
  messages: MessageRecord[];
}

export interface MessageRecordResponse {
  success: boolean;
  message: string;
  messageRecord: MessageRecord;
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}

export interface UnreadCountsResponse {
  success: boolean;
  counts: Record<string, number>;
}
