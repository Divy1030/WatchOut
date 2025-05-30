import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../providers/AuthProvider';
import { authApi, messageApi, serverApi, userApi } from './api';

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
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['userServers'],
    queryFn: () => serverApi.getUserServers(),
    enabled: isAuthenticated
  });
};

export const useServerDetails = (serverId: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['serverDetails', serverId],
    queryFn: () => serverApi.getServerDetails(serverId),
    enabled: isAuthenticated && !!serverId,
    select: (data) => data?.data // Make sure to select the data property
  });
};

export const useCreateServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string, description?: string, iconUrl?: string }) => 
      serverApi.createServer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    }
  });
};

export const useUpdateServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serverId, data }: { 
      serverId: string, 
      data: { name?: string, description?: string, iconUrl?: string } 
    }) => serverApi.updateServer(serverId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
      queryClient.invalidateQueries({ queryKey: ['serverDetails', variables.serverId] });
    }
  });
};

export const useDeleteServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (serverId: string) => serverApi.deleteServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    }
  });
};

export const useServerMembers = (serverId: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['serverMembers', serverId],
    queryFn: () => serverApi.getServerMembers(serverId),
    enabled: isAuthenticated && !!serverId
  });
};

export const useJoinServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serverId, inviteCode }: { serverId: string, inviteCode: string }) => 
      serverApi.joinServer(serverId, inviteCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    }
  });
};

export const useLeaveServer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (serverId: string) => serverApi.leaveServer(serverId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userServers'] });
    }
  });
};

export const useCreateChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serverId, data }: {
      serverId: string,
      data: {
        name: string,
        type: 'text' | 'voice',
        topic?: string,
        isPrivate?: boolean,
        allowedRoles?: string[],
        allowedUsers?: string[]
      }
    }) => serverApi.createChannel(serverId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serverDetails', variables.serverId] });
    }
  });
};

export const useUpdateChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serverId, channelId, data }: {
      serverId: string,
      channelId: string,
      data: {
        name?: string,
        topic?: string,
        position?: number,
        isPrivate?: boolean,
        allowedRoles?: string[],
        allowedUsers?: string[]
      }
    }) => serverApi.updateChannel(serverId, channelId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serverDetails', variables.serverId] });
    }
  });
};

export const useDeleteChannel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serverId, channelId }: { serverId: string, channelId: string }) => 
      serverApi.deleteChannel(serverId, channelId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serverDetails', variables.serverId] });
    }
  });
};

export const useCreateInvite = () => {
  return useMutation({
    mutationFn: ({ serverId, data }: { 
      serverId: string, 
      data?: { maxUses?: number, expiresIn?: number } 
    }) => serverApi.createInvite(serverId, data)
  });
};

// Messages queries and mutations
export const useChannelMessages = (serverId: string, channelId: string) => {
  const { isAuthenticated } = useAuth();
  
  return useQuery({
    queryKey: ['channelMessages', serverId, channelId],
    queryFn: () => messageApi.getChannelMessages(serverId, channelId),
    enabled: isAuthenticated && !!serverId && !!channelId,
    select: (data) => data?.data // Make sure to select the data property
  });
};

export const useSendChannelMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serverId, channelId, content, mentions = [] }: {
      serverId: string,
      channelId: string,
      content: string,
      mentions?: string[]
    }) => messageApi.sendChannelMessage(serverId, channelId, content, mentions),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['channelMessages', variables.serverId, variables.channelId] 
      });
    }
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
    mutationFn: ({ userId, content }: { userId: string, content: string }) => 
      messageApi.sendDirectMessage(userId, content),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['directMessages', variables.userId] });
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