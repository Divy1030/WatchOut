import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from './api';
import {
  LoginCredentials,
  RegisterCredentials,
  OtpVerification,
  PasswordResetRequest,
  PasswordUpdate,
  GoogleLogin,
  User
} from '../types/user';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hook to check if user is authenticated
export const useAuthStatus = () => {
  return useQuery({
    queryKey: ['authStatus'],
    queryFn: async () => {
      const token = await AsyncStorage.getItem('accessToken');
      const user = await AsyncStorage.getItem('user');
      return {
        isAuthenticated: !!token,
        user: user ? JSON.parse(user) as User : null
      };
    }
  });
};

// Register user
export const useRegister = () => {
  return useMutation({
    mutationFn: (credentials: RegisterCredentials) => authApi.register(credentials),
  });
};

// Verify registration OTP
export const useVerifyRegisterOtp = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: OtpVerification) => authApi.verifyRegisterOtp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authStatus'] });
    }
  });
};

// Login user
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authApi.login(credentials),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authStatus'] });
    }
  });
};

// Logout user
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authStatus'] });
    }
  });
};

// Forgot password
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data: PasswordResetRequest) => authApi.forgotPassword(data),
  });
};

// Verify reset OTP
export const useVerifyResetOtp = () => {
  return useMutation({
    mutationFn: (data: OtpVerification) => authApi.verifyResetOtp(data),
  });
};

// Update password
export const useUpdatePassword = () => {
  return useMutation({
    mutationFn: (data: PasswordUpdate) => authApi.updatePassword(data),
  });
};

// Google login
export const useGoogleLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: GoogleLogin) => authApi.googleLogin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authStatus'] });
    }
  });
};

// Get current user profile
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    // Don't fetch automatically - we'll trigger this manually when needed
    enabled: false,
  });
};

// Refresh token
export const useRefreshToken = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (!refreshToken) throw new Error('No refresh token available');
      return authApi.refreshToken(refreshToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['authStatus'] });
    }
  });
};