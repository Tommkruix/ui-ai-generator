export interface ChatMessage {
  id: number;
  message_type?: string;
  user_id: number;
  chat_id: number;
  message: string;
  status?: number;
  vanilla?: string;
  context: number;
  rating?: number;
  group_id?: string;
  streaming?: number;
  created_at?: Date;
}
