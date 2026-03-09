import api from "./axios";

export const startConversation = (receiverId) =>
  api.post("/chat/start", { receiverId });

export const getConversations = () =>
  api.get("/chat");

export const getMessages = (id) =>
  api.get(`/chat/${id}`);


export const sendMessage = (conversationId, text, replyTo = null) =>
  api.post(`/chat/${conversationId}`, {
    text,
    ...(replyTo ? { replyTo } : {}),
  });