import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthProvider';
import { getSocket, initializeSocket } from '../lib/socket';
import { Notification } from '../lib/api';
import { useNotifications, useMarkNotificationAsRead } from '../lib/queries';
import { Alert, Platform } from 'react-native';

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  isLoading: boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationsContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within a NotificationProvider');
  }
  return context;
};

type NotificationProviderProps = {
  children: ReactNode;
};

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: fetchedNotifications, isLoading } = useNotifications();
  // Always initialize as an empty array
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const markAsReadMutation = useMarkNotificationAsRead();

  // Update notifications when fetched from API
  useEffect(() => {
    if (Array.isArray(fetchedNotifications?.data)) {
      setNotifications(fetchedNotifications.data);
    } else {
      setNotifications([]); // fallback to empty array
    }
  }, [fetchedNotifications]);

  // Listen for real-time notifications
  useEffect(() => {
    if (!user) return;

    let cleanupFn: (() => void) | undefined;

    const setupSocketListeners = async () => {
      await initializeSocket();
      const socketInstance = getSocket();
      if (!socketInstance) return;

      const handleNewNotification = (notification: Notification) => {
        setNotifications(prev => [notification, ...(prev || [])]);
        if (Platform.OS !== 'web') {
          Alert.alert(
            'New Notification',
            notification.message,
            [{ text: 'OK' }]
          );
        }
      };

      socketInstance.on('notification', handleNewNotification);

      cleanupFn = () => {
        socketInstance.off('notification', handleNewNotification);
      };
    };

    setupSocketListeners();

    return () => {
      if (cleanupFn) cleanupFn();
    };
  }, [user, queryClient]);

  const markAsRead = (id: string) => {
    markAsReadMutation.mutate(id, {
      onSuccess: () => {
        setNotifications(prev =>
          (prev || []).map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
          )
        );
      },
    });
  };

  // Always use fallback to array for safety
  const unreadCount = (notifications || []).filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications || [],
        unreadCount,
        markAsRead,
        isLoading,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export default useNotifications;