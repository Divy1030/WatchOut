import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { authApi, messageApi, notificationApi, serverApi, userApi } from './api';

// Auth queries and mutations
export const useAuthStatus = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  return {
    isLoading, 
    data: { isAuthenticated, user }
  };
};

export const useLogin = () => {
  const { login } = useAuth();
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string, password: string }) => 
      login(email, password)
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: ({ username, email, password }: { username: string, email: string, password: string }) => 
      authApi.register({ username, email, password })
  });
};

export const useVerifyRegisterOtp = () => {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string, otp: string }) => 
      authApi.verifyRegisterOtp({ email, otp })
  });
};

export const useVerifyOtp = () => {
  const { verifyOtp } = useAuth();
  
  return useMutation({
    mutationFn: ({ email, otp }: { email: string, otp: string }) => 
      verifyOtp(email, otp)
  });
};

export const useLogout = () => {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
    }
  });
};

export const useGoogleLogin = () => {
  const { googleLogin } = useAuth();
  
  return useMutation({
    mutationFn: (idToken: string) => googleLogin(idToken)
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => 
      authApi.forgotPassword({ email })
  });
};

export const useVerifyResetOtp = () => {
  return useMutation({
    mutationFn: ({ email, otp }: { email: string, otp: string }) => 
      authApi.verifyResetOtp({ email, otp })
  });
};

export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: ({ email, newPassword }: { email: string, newPassword: string }) => 
      authApi.updatePassword({ email, newPassword })
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string, newPassword: string }) => 
      authApi.changePassword(oldPassword, newPassword)
  });
};

// Notification queries and mutations
export const useNotifications = (limit = 20, offset = 0) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['notifications', limit, offset],
    queryFn: () => notificationApi.getUserNotifications(limit, offset),
    enabled: isAuthenticated,
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.deleteNotification(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });
};

// User profile and friends queries/mutations
export const useUserProfile = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['userProfile'],
    queryFn: () => userApi.getProfile(),
    enabled: isAuthenticated
  });
};

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ status, customStatus }: { status: string, customStatus?: string }) => 
      userApi.updateStatus(status, customStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    }
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { displayName?: string, avatarUrl?: string, theme?: 'dark' | 'light' }) => 
      userApi.updateProfile(data),
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      // Update the stored user data
      if (response.data?.user) {
        await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
      }
    }
  });
};

export const useUpdateProfilePhoto = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => userApi.updateProfilePhoto(formData),
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      // Optionally update stored user data if needed
      if (response.avatarUrl) {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          user.avatarUrl = response.avatarUrl;
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
      }
    }
  });
};

export const useFriendsList = () => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['friends'],
    queryFn: () => userApi.getFriends(),
    enabled: isAuthenticated
  });
};

export const useSendFriendRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (targetUserId: string) => userApi.sendFriendRequest(targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });
};

export const useRespondToFriendRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requesterId, action }: { requesterId: string, action: 'accept' | 'reject' }) => 
      userApi.respondToFriendRequest(requesterId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });
};

export const useRemoveFriend = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (friendId: string) => userApi.removeFriend(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => userApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => userApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    }
  });
};

// Server queries and mutations
export const useUserServers = () => {
  return useQuery({
    queryKey: ['userServers'],
    queryFn: async () => {
      console.log('🔍 Fetching user servers...');
      const result = await serverApi.getUserServers();
      console.log('📊 Server query result:', result);
      console.log('📊 Servers data:', result.data);
      return result;
    },
  });
};

export const useServerDetails = (serverId: string) => {
  return useQuery({
    queryKey: ['serverDetails', serverId],
    queryFn: async () => {
      console.log('🔍 Fetching server details for:', serverId);
      const result = await serverApi.getServerDetails(serverId);
      console.log('📊 Server details result:', result);
      return result;
    },
    enabled: !!serverId,
  });
};

export const useServerMembers = (serverId: string) => {
  return useQuery({
    queryKey: ['serverMembers', serverId],
    queryFn: async () => {
      console.log('🔍 Fetching server members for:', serverId);
      const result = await serverApi.getServerMembers(serverId);
      console.log('📊 Server members result:', result);
      return result;
    },
    enabled: !!serverId,
  });
};

export const useCreateServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; description?: string; iconUrl?: string }) => {
      console.log('🏗️ Creating server with data:', data);
      return serverApi.createServer(data);
    },
    onSuccess: (result) => {
      console.log('✅ Server created successfully:', result);
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    },
    onError: (error) => {
      console.error('❌ Server creation failed:', error);
    }
  });
};

export const useJoinServerByCode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (inviteCode: string) => {
      console.log('🔗 Joining server with invite code:', inviteCode);
      return serverApi.joinServerByCode(inviteCode);
    },
    onSuccess: (result) => {
      console.log('✅ Successfully joined server:', result);
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    },
    onError: (error: any) => {
      console.error('❌ Failed to join server:', error);
      console.error('Error details:', error.response?.data);
    }
  });
};

export const useCreateInvite = () => {
  return useMutation({
    mutationFn: ({ serverId, data }: { serverId: string; data: { maxUses?: number; expiresIn?: number } }) =>
      serverApi.createInvite(serverId, data),
  });
};

export const useUpdateServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serverId, data }: { serverId: string; data: any }) =>
      serverApi.updateServer(serverId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serverDetails', variables.serverId] });
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    },
  });
};

export const useDeleteServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (serverId: string) => serverApi.deleteServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    },
  });
};

export const useLeaveServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (serverId: string) => serverApi.leaveServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    },
  });
};

// Channel message queries
export const useChannelMessages = (serverId: string, channelId: string) => {
  return useQuery({
    queryKey: ['channelMessages', serverId, channelId],
    queryFn: () => messageApi.getChannelMessages(serverId, channelId),
    enabled: !!serverId && !!channelId,
  });
};

export const useSendChannelMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serverId, channelId, content, mentions = [] }: {
      serverId: string;
      channelId: string;
      content: string;
      mentions?: string[];
    }) => messageApi.sendChannelMessage(serverId, channelId, content, mentions),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['channelMessages', variables.serverId, variables.channelId] 
      });
    },
  });
};

export const useDirectMessages = (userId: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['directMessages', userId],
    queryFn: () => messageApi.getDirectMessages(userId),
    enabled: isAuthenticated && !!userId,
    select: (data) => data?.data // Make sure to select the data property
  });
};

export const useSendDirectMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ receiverId, content, replyTo }: { receiverId: string, content: string, replyTo?: string }) =>
      messageApi.sendDirectMessage(receiverId, content, replyTo),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['directMessages', variables.receiverId] });
    }
  });
};

export const useEditMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string, content: string }) => 
      messageApi.editMessage(messageId, content),
    onSuccess: (_data, _variables) => {
      // This will be more selective in a real app based on where the message is from
      queryClient.invalidateQueries({ queryKey: ['channelMessages'] });
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    }
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: string) => messageApi.deleteMessage(messageId),
    onSuccess: () => {
      // Same as above, would be more selective in a real app
      queryClient.invalidateQueries({ queryKey: ['channelMessages'] });
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    }
  });
};

export const useAddReaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string, emoji: string }) => 
      messageApi.addReaction(messageId, emoji),
    onSuccess: () => {
      // Would be more selective in a real app
      queryClient.invalidateQueries({ queryKey: ['channelMessages'] });
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    }
  });
};

export const useRemoveReaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string, emoji: string }) => 
      messageApi.removeReaction(messageId, emoji),
    onSuccess: () => {
      // Would be more selective in a real app
      queryClient.invalidateQueries({ queryKey: ['channelMessages'] });
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    }
  });
};

export const usePinMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: string) => messageApi.pinMessage(messageId),
    onSuccess: () => {
      // Would be more selective in a real app
      queryClient.invalidateQueries({ queryKey: ['channelMessages'] });
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
      queryClient.invalidateQueries({ queryKey: ['pinnedMessages'] });
    }
  });
};

export const useUnpinMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (messageId: string) => messageApi.unpinMessage(messageId),
    onSuccess: () => {
      // Would be more selective in a real app
      queryClient.invalidateQueries({ queryKey: ['channelMessages'] });
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
      queryClient.invalidateQueries({ queryKey: ['pinnedMessages'] });
    }
  });
};

export const usePinnedMessages = (serverId?: string, channelId?: string, userId?: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['pinnedMessages', serverId, channelId, userId],
    queryFn: () => messageApi.getPinnedMessages(serverId, channelId, userId),
    enabled: isAuthenticated && !!(serverId && channelId || userId)
  });
};

export const useSearchUsers = (query: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => userApi.searchUsers(query),
    enabled: isAuthenticated && query.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });
};

// The notification hooks (useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification)
// are already defined above, so we don't need to redefine them here.