// services/chatService.ts

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  chatId: string;
}

export interface ChatHistory {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

/**
 * Send a message to the AI chat backend
 * @param message - The user message
 * @param chatId - The chat conversation ID
 * @returns Bot response message
 */
export async function sendMessage(
  message: string,
  chatId: string
): Promise<string> {
  try {
    const response = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        message,
        chatId,
        timestamp: new Date()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
}

/**
 * Get chat history for a conversation
 * @param chatId - The chat conversation ID
 * @returns Array of messages
 */
export async function getChatHistory(chatId: string): Promise<Message[]> {
  try {
    const response = await fetch(`/api/chat/${chatId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chat history');
    }

    const data = await response.json();
    return data.messages;
  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
}

/**
 * Get all chat conversations for the user
 * @returns Array of chat histories
 */
export async function getAllChats(): Promise<ChatHistory[]> {
  try {
    const response = await fetch('/api/chat/all', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch chats');
    }

    const data = await response.json();
    return data.chats;
  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
}

/**
 * Create a new chat conversation
 * @param title - Title for the new chat
 * @returns New chat ID
 */
export async function createNewChat(title: string): Promise<string> {
  try {
    const response = await fetch('/api/chat/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        title,
        createdAt: new Date()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create chat');
    }

    const data = await response.json();
    return data.chatId;
  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
}

/**
 * Delete a chat conversation
 * @param chatId - The chat ID to delete
 */
export async function deleteChat(chatId: string): Promise<void> {
  try {
    const response = await fetch(`/api/chat/${chatId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete chat');
    }
  } catch (error) {
    console.error('Chat service error:', error);
    throw error;
  }
}

/**
 * Logout the user
 */
export async function logout(): Promise<void> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to logout');
    }

    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userSession');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Get user profile
 */
export async function getUserProfile() {
  try {
    const response = await fetch('/api/user/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }

    return await response.json();
  } catch (error) {
    console.error('Profile service error:', error);
    throw error;
  }
}

/**
 * Update user settings
 */
export async function updateSettings(settings: any): Promise<void> {
  try {
    const response = await fetch('/api/user/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error('Failed to update settings');
    }
  } catch (error) {
    console.error('Settings service error:', error);
    throw error;
  }
}