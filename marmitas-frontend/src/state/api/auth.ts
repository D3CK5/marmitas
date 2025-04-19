import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { User } from '../stores/auth-store';
import { useAuthStore } from '../stores';

/**
 * API endpoint constants
 */
const ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  PROFILE: '/auth/profile',
  LOGOUT: '/auth/logout',
};

/**
 * Auth query keys
 */
export const authKeys = {
  profile: ['auth', 'profile'] as const,
};

/**
 * Login request interface
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Login response interface
 */
export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

/**
 * Registration request interface
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

/**
 * Registration response interface
 */
export interface RegisterResponse {
  user: User;
  token: string;
}

/**
 * Login API call
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    return await api.post<LoginResponse>(ENDPOINTS.LOGIN, credentials, {
      requiresAuth: false,
    });
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

/**
 * Register API call
 */
export const register = async (data: RegisterRequest): Promise<RegisterResponse> => {
  try {
    return await api.post<RegisterResponse>(ENDPOINTS.REGISTER, data, {
      requiresAuth: false,
    });
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

/**
 * Fetch user profile API call
 */
export const fetchUserProfile = async (): Promise<User> => {
  try {
    return await api.get<User>(ENDPOINTS.PROFILE);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

/**
 * Update user profile API call
 */
export const updateUserProfile = async (userData: Partial<User>): Promise<User> => {
  try {
    return await api.patch<User>(ENDPOINTS.PROFILE, userData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Logout API call
 */
export const logout = async (): Promise<void> => {
  try {
    await api.post<void>(ENDPOINTS.LOGOUT);
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with local logout even if API fails
  }
};

/**
 * Custom hook for login
 */
export const useLogin = () => {
  const { loginSuccess, loginError } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Update auth store with user data and token
      loginSuccess(data.user, data.token, data.expiresIn);
      
      // Cache user profile
      queryClient.setQueryData(authKeys.profile, data.user);
    },
    onError: (error) => {
      loginError(error as Error);
    },
  });
};

/**
 * Custom hook for registration
 */
export const useRegister = () => {
  const { registerSuccess, registerError } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: register,
    onSuccess: (data) => {
      // Update auth store with user data and token
      registerSuccess(data.user, data.token);
      
      // Cache user profile
      queryClient.setQueryData(authKeys.profile, data.user);
    },
    onError: (error) => {
      registerError(error as Error);
    },
  });
};

/**
 * Custom hook for fetching user profile
 */
export const useUserProfile = () => {
  const { isAuthenticated } = useAuthStore();
  
  return useQuery({
    queryKey: authKeys.profile,
    queryFn: fetchUserProfile,
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Custom hook for updating user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      // Update user profile in cache
      queryClient.setQueryData(authKeys.profile, updatedUser);
    },
  });
};

/**
 * Custom hook for logout
 */
export const useLogout = () => {
  const { logout: localLogout } = useAuthStore();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear local auth state
      localLogout();
      
      // Clear all queries from cache
      queryClient.clear();
    },
    onError: () => {
      // Even if API fails, clear local state
      localLogout();
      queryClient.clear();
    },
  });
}; 