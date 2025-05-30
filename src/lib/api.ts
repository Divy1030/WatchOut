import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';
import { 
  User, 
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  OtpVerification,
  PasswordResetRequest,
  PasswordUpdate,
  GoogleLogin
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
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await api.post('/user/refresh-token', { refreshToken });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
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
    const response = await api.post('/user/register', credentials);
    return response.data;
  },
  
  // Verify registration OTP
  verifyRegisterOtp: async (data: OtpVerification) => {
    const response = await api.post('/user/v', data);
    const user = response.data.data;
    
    if (user) {
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },
  
  // Login a user
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<{ statusCode: number, data: AuthResponse, message: string }>('/user/login', credentials);
    
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
    const response = await api.post('/user/logout');
    
    // Clear local storage
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    
    return response.data;
  },
  
  // Request password reset (forgot password)
  forgotPassword: async (data: PasswordResetRequest) => {
    const response = await api.post('/user/forgot-password', data);
    return response.data;
  },
  
  // Verify reset password OTP
  verifyResetOtp: async (data: OtpVerification) => {
    const response = await api.post('/user/verify-reset-password-otp', data);
    return response.data;
  },
  
  // Update password after verification
  updatePassword: async (data: PasswordUpdate) => {
    const response = await api.post('/user/update-password', data);
    return response.data;
  },
  
  // Google login
  googleLogin: async (data: GoogleLogin) => {
    const response = await api.post<{ statusCode: number, data: AuthResponse, message: string }>('/user/google', data);
    
    if (response.data.data) {
      const { accessToken, refreshToken, user } = response.data.data;
      
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
    }
    
    return response.data;
  },
  
  // Get current user data
  getCurrentUser: async () => {
    const response = await api.get('/user/current');
    return response.data;
  },

  // Refresh tokens
  refreshToken: async (refreshToken: string) => {
    const response = await api.post('/user/refresh-token', { refreshToken });
    
    if (response.data.data) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', newRefreshToken);
    }
    
    return response.data;
  }
};