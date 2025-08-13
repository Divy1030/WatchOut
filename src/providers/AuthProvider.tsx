import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../lib/api';
import { disconnectSocket, initializeSocket, joinUserRoom } from '../lib/socket';
import { User } from '../types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  refreshAuthState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for existing session on app load
  useEffect(() => {
    refreshAuthState();
  }, []);

  const refreshAuthState = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const storedUser = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('accessToken');
      
      if (storedUser && token) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        // Initialize socket connection and join user room
        await initializeSocket();
        await joinUserRoom(userData._id);
        
        // Verify token and get fresh user data
        try {
          const { data } = await authApi.getCurrentUser();
          if (data.user) {
            setUser(data.user);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
          }
        } catch (error) {
          // Token might be expired, try to refresh
          const refreshToken = await AsyncStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              await authApi.refreshToken(refreshToken);
              const { data } = await authApi.getCurrentUser();
              if (data.user) {
                setUser(data.user);
                await AsyncStorage.setItem('user', JSON.stringify(data.user));
              }
            } catch (refreshError) {
              // If refresh fails, log out
              await performLogout();
            }
          } else {
            await performLogout();
          }
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
      await performLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const performLogout = async (): Promise<void> => {
    setUser(null);
    setIsAuthenticated(false);
    
    // Clear stored data
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    
    // Disconnect socket
    disconnectSocket();
  };

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authApi.login({ email, password });
      
      if (response.data) {
        const { user } = response.data;
        setUser(user);
        setIsAuthenticated(true);
        
        // Initialize socket and join user room
        await initializeSocket();
        await joinUserRoom(user._id);
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      await authApi.register({ username, email, password });
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authApi.verifyRegisterOtp({ email, otp });
      
      if (response.data) {
        setUser(response.data);
        setIsAuthenticated(true);
        
        // Initialize socket and join user room
        await initializeSocket();
        await joinUserRoom(response.data._id);
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authApi.logout();
      await performLogout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the server request fails, log out locally
      await performLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = async (idToken: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authApi.googleLogin({ idToken });
      
      if (response.data) {
        const { user } = response.data;
        setUser(user);
        setIsAuthenticated(true);
        
        // Initialize socket and join user room
        await initializeSocket();
        await joinUserRoom(user._id);
      }
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    verifyOtp,
    logout,
    googleLogin,
    refreshAuthState
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};