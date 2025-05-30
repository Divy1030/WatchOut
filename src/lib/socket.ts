import AsyncStorage from '@react-native-async-storage/async-storage';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '../constants/config';

let socket: Socket | null = null;

export const initializeSocket = async (): Promise<Socket> => {
  if (socket && socket.connected) return socket;

  const token = await AsyncStorage.getItem('accessToken');
  
  socket = io(API_URL, {
    auth: {
      token
    },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 3000
  });

  socket.on('connect', () => {
    console.log('Socket.IO connected with ID:', socket?.id);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket.IO disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });

  // Setup reconnection logic
  socket.on('reconnect', (attemptNumber) => {
    console.log(`Socket reconnected after ${attemptNumber} attempts`);
  });

  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Join user's personal room for notifications
export const joinUserRoom = async (userId: string): Promise<void> => {
  if (!socket || !socket.connected) await initializeSocket();
  socket?.emit('join-user', userId);
  console.log(`Joined user room: user:${userId}`);
};

// Join server to receive server-related events
export const joinServer = (serverId: string): void => {
  socket?.emit('join-server', serverId);
  console.log(`Joined server room: server:${serverId}`);
};

// Join specific channel in a server
export const joinChannel = (serverId: string, channelId: string): void => {
  socket?.emit('join-channel', serverId, channelId);
  console.log(`Joined channel room: channel:${channelId}`);
};

// Join direct message room
export const joinDirectMessageRoom = (conversationId: string): void => {
  socket?.emit('join-dm', conversationId);
  console.log(`Joined DM room: dm:${conversationId}`);
};

// Send typing indicator
export const sendTypingIndicator = (data: {
  userId: string;
  username: string;
  isTyping: boolean;
  channelId?: string;
  serverId?: string;
  directMessageId?: string;
}): void => {
  socket?.emit('typing', data);
};

// Socket event listeners
export const onNewMessage = (callback: (message: any) => void): void => {
  socket?.on('newMessage', callback);
};

export const onNewDirectMessage = (callback: (message: any) => void): void => {
  socket?.on('newDirectMessage', callback);
};

export const onMessageUpdated = (callback: (message: any) => void): void => {
  socket?.on('messageUpdated', callback);
};

export const onMessageDeleted = (callback: (messageId: string) => void): void => {
  socket?.on('messageDeleted', callback);
};

export const onMessageReaction = (callback: (message: any) => void): void => {
  socket?.on('messageReaction', callback);
};

export const onMessagePinned = (callback: (message: any) => void): void => {
  socket?.on('messagePinned', callback);
};

export const onMessageUnpinned = (callback: (message: any) => void): void => {
  socket?.on('messageUnpinned', callback);
};

export const onMention = (callback: (data: {
  message: any;
  server: string;
  channel: string;
}) => void): void => {
  socket?.on('mention', callback);
};

export const onTypingIndicator = (callback: (data: {
  userId: string;
  username: string;
  isTyping: boolean;
}) => void): void => {
  socket?.on('typing', callback);
};

// Remove listeners when no longer needed
export const removeListener = (event: string): void => {
  socket?.off(event);
};

// Remove all listeners
export const removeAllListeners = (): void => {
  if (!socket) return;
  
  const events = [
    'newMessage', 
    'newDirectMessage', 
    'messageUpdated', 
    'messageDeleted',
    'messageReaction',
    'messagePinned',
    'messageUnpinned',
    'mention',
    'typing'
  ];
  
  events.forEach(event => socket?.off(event));
};