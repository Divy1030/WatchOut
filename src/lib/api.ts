import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_URL } from '../constants/config';
import {
  AuthResponse,
  GoogleLogin,
  LoginCredentials,
  OtpVerification,
  PasswordResetRequest,
  PasswordUpdate,
  RegisterCredentials
} from '../types/user';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // Add debugging
      console.log(`🔐 Token available for ${config.url}: ${token.substring(0, 15)}...`);
    } else {
      console.log(`⚠️ No token available for ${config.url}`);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle validation errors
    if (error.response?.status === 400 && error.response?.data?.errors) {
      console.log('❌ Validation errors:', error.response.data.errors);
      // You can emit an event or use a global error handler here
    }
    
    // Handle rate limiting
    if (error.response?.status === 429) {
      console.log('⚠️ Rate limited:', error.response.data.message);
      // You can show a toast or notification here
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('🔄 Token expired, attempting refresh...');
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.log('❌ No refresh token available');
          throw new Error('No refresh token available');
        }
        
        console.log('🔄 Refreshing token...');
        const response = await api.post('/users/refresh-token', { refreshToken });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        console.log('✅ Token refreshed successfully');
        
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log('❌ Token refresh failed:', refreshError);
        // If refresh token fails, clear storage and force logout
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        await AsyncStorage.removeItem('user');
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Authentication API endpoints
export const authApi = {
  // Register a new user
  register: async (credentials: RegisterCredentials) => {
    const response = await api.post('/users/register', credentials);
    return response.data;
  },
  
  // Verify registration OTP specifically for the registration flow
  verifyRegisterOtp: async (data: OtpVerification) => {
    const response = await api.post('/users/verify-registration-otp', data);
    
    // If verification is successful and returns user data with tokens
    if (response.data.data?.user && response.data.data?.accessToken) {
      const { accessToken, refreshToken, user } = response.data.data;
      
      // Store auth data
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },
  
  // Login a user
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<{ statusCode: number, data: AuthResponse, message: string }>('/users/login', credentials);
    
    if (response.data.data) {
      const { accessToken, refreshToken, user } = response.data.data;
      
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },
  
  // Logout a user
  logout: async () => {
    const response = await api.post('/users/logout');
    
    // Clear local storage
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    
    return response.data;
  },
  
  // Request password reset (forgot password)
  forgotPassword: async (data: PasswordResetRequest) => {
    const response = await api.post('/users/forgot-password', data);
    return response.data;
  },
  
  // Verify reset password OTP
  verifyResetOtp: async (data: OtpVerification) => {
    const response = await api.post('/users/verify-reset-password-otp', data);
    return response.data;
  },
  
  // Update password after verification
  updatePassword: async (data: PasswordUpdate) => {
    const response = await api.post('/users/update-password', data);
    return response.data;
  },
  
  // Google login
  googleLogin: async (data: GoogleLogin) => {
    const response = await api.post<{ statusCode: number, data: AuthResponse, message: string }>('/users/google', data);
    
    if (response.data.data) {
      const { accessToken, refreshToken, user } = response.data.data;
      
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },
  
  // Change password (when logged in)
  changePassword: async (oldPassword: string, newPassword: string) => {
    const response = await api.post('/users/change-password', { oldPassword, newPassword });
    return response.data;
  },

  // Get current user data
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Refresh tokens
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/users/refresh-token', { refreshToken });
    
    if (response.data.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
    }
    
    return response.data;
  }
};

// User profile and friends API endpoints
export const userApi = {
  // Get user profile
  getProfile: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update user status
  updateStatus: async (status: string, customStatus?: string) => {
    const response = await api.patch('/users/status', { status, customStatus });
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: { displayName?: string, avatarUrl?: string, theme?: 'dark' | 'light' }) => {
    const response = await api.patch('/users/profile', data);
    return response.data;
  },

  // Upload/update user profile photo
  updateProfilePhoto: async (formData: FormData) => {
    const response = await api.patch('/profile/photo', formData);
    return response.data;
  },

  // Get friends list
  getFriends: async () => {
    const response = await api.get('/users/friends');
    return response.data;
  },

  // Send friend request
  sendFriendRequest: async (targetUserId: string) => {
    const response = await api.post('/users/friends/request', { targetUserId });
    return response.data;
  },

  // Respond to friend request
  respondToFriendRequest: async (requesterId: string, action: 'accept' | 'reject') => {
    const response = await api.post('/users/friends/respond', { requesterId, action });
    return response.data;
  },

  // Remove friend
  removeFriend: async (friendId: string) => {
    const response = await api.delete(`/users/friends/${friendId}`);
    return response.data;
  },

  // Block user
  blockUser: async (userId: string) => {
    const response = await api.post(`/users/friends/block/${userId}`);
    return response.data;
  },

  // Unblock user
  unblockUser: async (userId: string) => {
    const response = await api.post(`/users/friends/unblock/${userId}`);
    return response.data;
  },

  // Search users
  searchUsers: async (query: string) => {
    const response = await api.get(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
};

// Server API endpoints
export const serverApi = {
  // Create server
  createServer: async (data: { name: string; description?: string; iconUrl?: string }) => {
    const response = await api.post('/servers', data);
    return response.data;
  },

  // Get user's servers
  getUserServers: async () => {
    const response = await api.get('/servers/me');
    return response.data;
  },

  // Join server by invite code only
  joinServerByCode: async (inviteCode: string) => {
    console.log('API: Joining server with code:', inviteCode);
    const response = await api.post(`/servers/join/${inviteCode}`);
    console.log('API: Join server response:', response.data);
    return response.data;
  },

  // Get server details
  getServerDetails: async (serverId: string) => {
    console.log('API: Getting server details for:', serverId);
    const response = await api.get(`/servers/${serverId}`);
    console.log('API: Server details response:', response.data);
    return response.data;
  },

  // Get server members
  getServerMembers: async (serverId: string) => {
    console.log('API: Getting server members for:', serverId);
    const response = await api.get(`/servers/${serverId}/members`);
    console.log('API: Server members response:', response.data);
    return response.data;
  },

  // Create server invite
  createInvite: async (serverId: string, data: { maxUses?: number; expiresIn?: number }) => {
    const response = await api.post(`/servers/${serverId}/invites`, data);
    return response.data;
  },

  // Get server invites
  getServerInvites: async (serverId: string) => {
    const response = await api.get(`/servers/${serverId}/invites`);
    return response.data;
  },

  // Revoke server invite
  revokeInvite: async (serverId: string, inviteCode: string) => {
    const response = await api.delete(`/servers/${serverId}/invites/${inviteCode}`);
    return response.data;
  },

  // Update server
  updateServer: async (serverId: string, data: any) => {
    const response = await api.patch(`/servers/${serverId}`, data);
    return response.data;
  },

  // Delete server
  deleteServer: async (serverId: string) => {
    const response = await api.delete(`/servers/${serverId}`);
    return response.data;
  },

  // Leave server
  leaveServer: async (serverId: string) => {
    const response = await api.post(`/servers/${serverId}/leave`);
    return response.data;
  },

  // Kick member
  kickMember: async (serverId: string, userId: string) => {
    const response = await api.post(`/servers/${serverId}/kick/${userId}`);
    return response.data;
  },

  // Update member roles
  updateMemberRoles: async (serverId: string, userId: string, roles: string[]) => {
    const response = await api.patch(`/servers/${serverId}/members/${userId}/roles`, { roles });
    return response.data;
  },

  // Channel management
  createChannel: async (serverId: string, data: { name: string; type?: 'text' | 'voice'; topic?: string; isPrivate?: boolean }) => {
    const response = await api.post(`/servers/${serverId}/channels`, data);
    return response.data;
  },

  updateChannel: async (serverId: string, channelId: string, data: { name?: string; topic?: string; position?: number }) => {
    const response = await api.patch(`/servers/${serverId}/channels/${channelId}`, data);
    return response.data;
  },

  deleteChannel: async (serverId: string, channelId: string) => {
    const response = await api.delete(`/servers/${serverId}/channels/${channelId}`);
    return response.data;
  },

  // Role management
  createRole: async (serverId: string, data: { name: string; color?: string; permissions?: string[]; position?: number }) => {
    const response = await api.post(`/servers/${serverId}/roles`, data);
    return response.data;
  },

  updateRole: async (serverId: string, roleId: string, data: { name?: string; color?: string; permissions?: string[]; position?: number }) => {
    const response = await api.patch(`/servers/${serverId}/roles/${roleId}`, data);
    return response.data;
  },

  deleteRole: async (serverId: string, roleId: string) => {
    const response = await api.delete(`/servers/${serverId}/roles/${roleId}`);
    return response.data;
  },
};

// Messaging API endpoints
export const messageApi = {
  // Get messages for a channel
  getChannelMessages: async (serverId: string, channelId: string, cursor?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());
    
    const response = await api.get(`/messages/channels/${serverId}/${channelId}?${params}`);
    return response.data;
  },

  // Send message to channel
  sendChannelMessage: async (
    serverId: string, 
    channelId: string, 
    content: string, 
    mentions?: string[], 
    replyTo?: string // Add this parameter
  ) => {
    const response = await api.post(`/servers/${serverId}/channels/${channelId}/messages`, {
      content,
      mentions,
      replyTo, // Include in the request body
    });
    return response.data;
  },

  // Get direct messages between users
  getDirectMessages: async (userId: string, cursor?: string, limit: number = 50) => {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());
    // Use /messages/direct/:userId
    const response = await api.get(`/messages/direct/${userId}?${params}`);
    return response.data;
  },

  // Send direct message
  sendDirectMessage: async (receiverId: string, content: string, replyTo?: string) => {
    const response = await api.post(`/messages/direct`, { receiverId, content, replyTo });
    return response.data;
  },

  // Edit message
  editMessage: async (messageId: string, content: string) => {
    const response = await api.patch(`/messages/${messageId}`, { content });
    return response.data;
  },

  // Delete message
  deleteMessage: async (messageId: string) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  // Add reaction to message
  addReaction: async (messageId: string, emoji: string) => {
    console.log(`Adding reaction ${emoji} to message ${messageId}`);
    const response = await api.post(`/messages/${messageId}/react`, { emoji });
    console.log('Reaction added response:', response.data);
    return response.data;
  },

  // Remove reaction from message
  removeReaction: async (messageId: string, emoji: string) => {
    console.log(`Removing reaction ${emoji} from message ${messageId}`);
    const response = await api.delete(`/messages/${messageId}/react/${encodeURIComponent(emoji)}`);
    console.log('Reaction removed response:', response.data);
    return response.data;
  },

  // Pin message
  pinMessage: async (messageId: string) => {
    const response = await api.post(`/messages/${messageId}/pin`);
    return response.data;
  },

  // Unpin message
  unpinMessage: async (messageId: string) => {
    const response = await api.post(`/messages/${messageId}/unpin`);
    return response.data;
  },

  // Get pinned messages
  getPinnedMessages: async (serverId?: string, channelId?: string, userId?: string) => {
    let endpoint = '';
    if (serverId && channelId) {
      endpoint = `/messages/pinned/channels/${serverId}/${channelId}`;
    } else if (userId) {
      endpoint = `/messages/pinned/dm/${userId}`;
    }
    
    const response = await api.get(endpoint);
    return response.data;
  },

  // Upload message attachment
  uploadAttachment: async (file: FormData) => {
    const response = await api.post('/messages/upload', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Send channel message with attachments
  sendChannelMessageWithAttachments: async (serverId: string, channelId: string, data: { content?: string; mentions?: string[]; attachments?: any[] }) => {
    const response = await api.post(`/messages/channels/${serverId}/${channelId}/attachments`, data);
    return response.data;
  },

  // Send direct message with attachments
  sendDirectMessageWithAttachments: async (userId: string, data: { content?: string; attachments?: any[] }) => {
    const response = await api.post(`/messages/dm/${userId}/attachments`, data);
    return response.data;
  },
};

// In-memory notification store (in production, use Redis or database)
export interface Notification {
  id: string;
  userId: string;
  type: 'mention' | 'friend_request' | 'direct_message' | 'server_invite';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

// Notification API endpoints
export const notificationApi = {
  // Get user notifications
  getUserNotifications: async (limit = 20, offset = 0) => {
    const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
    return response.data;
  },
  
  // Get notifications (alias for getUserNotifications for backward compatibility)
  getNotifications: async (limit: number = 20, offset: number = 0) => {
    const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
    return response.data;
  },
  
  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    // Using PATCH as the standard RESTful method for partial updates
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },
  
  // Mark all notifications as read
  markAllAsRead: async () => {
    // Using PATCH as the standard RESTful method for partial updates
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },
  
  // Delete notification
  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Clear all notifications
  clearAll: async () => {
    const response = await api.delete('/notifications/clear-all');
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (preferences: { mentions?: boolean; directMessages?: boolean; friendRequests?: boolean; serverInvites?: boolean }) => {
    const response = await api.patch('/notifications/preferences', preferences);
    return response.data;
  },
};