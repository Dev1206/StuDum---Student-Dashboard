import axios from 'axios';

const API_URL = 'https://studum-student-dashboard.onrender.com/api';

export const chatService = {
  // Get all chats for a user
  getUserChats: async (userEmail) => {
    const response = await axios.get(`${API_URL}/chat/chats/${userEmail}`);
    return response.data;
  },

  // Create a direct chat
  createDirectChat: async (participant1, participant2) => {
    const response = await axios.post(`${API_URL}/chat/chats/direct`, {
      participant1,
      participant2
    });
    return response.data;
  },

  // Create a group chat
  createGroupChat: async (name, participants) => {
    const response = await axios.post(`${API_URL}/chat/chats/group`, {
      name,
      participants
    });
    return response.data;
  },

  // Delete a group chat
  deleteGroupChat: async (chatId, userEmail) => {
    const response = await axios.delete(`${API_URL}/chat/chats/group/${chatId}?userEmail=${userEmail}`);
    return response.data;
  },

  // Update group members
  updateGroupMembers: async (chatId, userEmail, participants) => {
    const response = await axios.put(`${API_URL}/chat/chats/group/${chatId}/members`, {
      userEmail,
      participants
    });
    return response.data;
  },

  // Update group name
  updateGroupName: async (chatId, userEmail, name) => {
    const response = await axios.put(`${API_URL}/chat/chats/group/${chatId}/name`, {
      userEmail,
      name
    });
    return response.data;
  },

  // Get messages for a chat
  getChatMessages: async (chatId) => {
    const response = await axios.get(`${API_URL}/chat/messages/${chatId}`);
    return response.data;
  },

  // Send a message
  sendMessage: async (chatId, sender, content) => {
    const response = await axios.post(`${API_URL}/chat/messages`, {
      chatId,
      sender,
      content
    });
    return response.data;
  },

  // Mark messages as read
  markMessagesAsRead: async (chatId, userEmail) => {
    const response = await axios.put(`${API_URL}/chat/messages/read`, {
      chatId,
      userEmail
    });
    return response.data;
  }
};
