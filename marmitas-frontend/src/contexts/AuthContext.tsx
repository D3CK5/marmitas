import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/ui/useToast';

// User type definition
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

// Auth context interface
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  signOutAll: () => Promise<void>;
  clearError: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  accessToken: null,
  isAuthenticated: false,
  signIn: async () => false,
  signUp: async () => false,
  signOut: async () => {},
  signOutAll: async () => {},
  clearError: () => {},
});

// Hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Auth provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Create the Auth Provider component
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Set up axios interceptor for token refresh
  useEffect(() => {
    // Intercept 401 responses and try to refresh token
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If error is 401 (Unauthorized) and not from the refresh endpoint
        // and we haven't already tried to refresh
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          !originalRequest.url?.includes('/auth/refresh')
        ) {
          originalRequest._retry = true;
          
          try {
            // Attempt to refresh the token
            const response = await api.post('/auth/refresh');
            const newAccessToken = response.data.data.accessToken;
            
            // Update state with new token
            setAccessToken(newAccessToken);
            
            // Update the original request with new token
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            
            // Retry the original request
            return api(originalRequest);
          } catch (refreshError) {
            // Token refresh failed, sign out
            await signOut();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    // Add token to every request if available
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Clean up interceptors on unmount
    return () => {
      api.interceptors.response.eject(responseInterceptor);
      api.interceptors.request.eject(requestInterceptor);
    };
  }, [accessToken]);

  // Initialize authentication state
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        
        // Try to get user profile using refresh token (if exists)
        try {
          // First try to refresh token if we have a refresh token cookie
          const refreshResponse = await api.post('/auth/refresh');
          const newAccessToken = refreshResponse.data.data.accessToken;
          setAccessToken(newAccessToken);
          
          // Now get user profile
          const profileResponse = await api.get('/auth/profile', {
            headers: { Authorization: `Bearer ${newAccessToken}` }
          });
          
          setUser(profileResponse.data.data);
        } catch (error) {
          // Silent failure is ok here - user is just not logged in
          setUser(null);
          setAccessToken(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data.data;
      
      setUser(user);
      setAccessToken(accessToken);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.name}!`,
        variant: "default",
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to sign in';
      setError(errorMessage);
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sign up function
  const signUp = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/auth/register', { name, email, password });
      const { user, accessToken } = response.data.data;
      
      setUser(user);
      setAccessToken(accessToken);
      
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.name}!`,
        variant: "default",
      });
      
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to sign up';
      setError(errorMessage);
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Call logout endpoint to invalidate refresh token
      await api.post('/auth/logout');
      
      // Clear auth state
      setUser(null);
      setAccessToken(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
        variant: "default",
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if API call fails, clear local state
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Sign out from all devices
  const signOutAll = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Need to be authenticated for this
      if (accessToken) {
        await api.post('/auth/logout-all', null, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
      }
      
      // Clear auth state
      setUser(null);
      setAccessToken(null);
      
      toast({
        title: "Logged out from all devices",
        description: "You have been successfully logged out from all devices.",
        variant: "default",
      });
    } catch (error) {
      console.error('Logout all error:', error);
      
      // Even if API call fails, clear local state
      setUser(null);
      setAccessToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Auth context value
  const value = {
    user,
    loading,
    error,
    accessToken,
    isAuthenticated: !!user && !!accessToken,
    signIn,
    signUp,
    signOut,
    signOutAll,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}; 