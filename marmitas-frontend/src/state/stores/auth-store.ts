import { create } from 'zustand';
import { logger, persist, withReset } from '../utils/store-utils';
import { AsyncStatus, AsyncState, createInitialAsyncState, setLoadingState, setSuccessState, setErrorState } from '../types';

/**
 * User interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'customer';
  avatarUrl?: string;
}

/**
 * Authentication state interface
 */
export interface AuthState {
  user: AsyncState<User>;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  expiresAt?: number;
}

/**
 * Authentication actions interface
 */
export interface AuthActions {
  // Login actions
  login: (email: string, password: string) => Promise<void>;
  loginSuccess: (user: User, token: string, expiresIn?: number) => void;
  loginError: (error: Error) => void;
  
  // Logout action
  logout: () => void;
  
  // Register actions
  register: (email: string, password: string, name: string) => Promise<void>;
  registerSuccess: (user: User, token: string) => void;
  registerError: (error: Error) => void;
  
  // Update profile action
  updateProfile: (userData: Partial<User>) => Promise<void>;
  
  // Check auth status
  checkAuthStatus: () => Promise<boolean>;
  
  // Set initialization
  setInitialized: (initialized: boolean) => void;
}

/**
 * Initial authentication state
 */
const initialState: AuthState = {
  user: createInitialAsyncState<User>(),
  token: null,
  isAuthenticated: false,
  isInitialized: false,
};

/**
 * Reset function for auth store
 */
const resetAuth = () => initialState;

/**
 * Authentication store
 */
export const useAuthStore = create<AuthState & AuthActions>()(
  logger(
    persist(
      withReset(
        (set, get) => ({
          ...initialState,
          
          // Login actions
          login: async (email: string, password: string) => {
            set(state => ({
              ...state,
              user: setLoadingState(state.user),
            }));
            
            try {
              // This would be an actual API call in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<{ user: User; token: string; expiresIn: number }>((resolve) => {
                setTimeout(() => {
                  resolve({
                    user: {
                      id: '1',
                      email,
                      name: 'Test User',
                      role: 'user',
                    },
                    token: 'mock-jwt-token',
                    expiresIn: 3600, // 1 hour in seconds
                  });
                }, 500);
              });
              
              const response = await mockApiCall();
              get().loginSuccess(response.user, response.token, response.expiresIn);
            } catch (error) {
              get().loginError(error as Error);
            }
          },
          
          loginSuccess: (user: User, token: string, expiresIn?: number) => {
            const expiresAt = expiresIn ? Date.now() + expiresIn * 1000 : undefined;
            
            set({
              user: setSuccessState(user),
              token,
              isAuthenticated: true,
              expiresAt,
            });
          },
          
          loginError: (error: Error) => {
            set({
              user: setErrorState(error),
              token: null,
              isAuthenticated: false,
            });
          },
          
          // Logout action
          logout: () => {
            set(resetAuth());
          },
          
          // Register actions
          register: async (email: string, password: string, name: string) => {
            set(state => ({
              ...state,
              user: setLoadingState(state.user),
            }));
            
            try {
              // This would be an actual API call in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<{ user: User; token: string }>((resolve) => {
                setTimeout(() => {
                  resolve({
                    user: {
                      id: '1',
                      email,
                      name,
                      role: 'user',
                    },
                    token: 'mock-jwt-token',
                  });
                }, 500);
              });
              
              const response = await mockApiCall();
              get().registerSuccess(response.user, response.token);
            } catch (error) {
              get().registerError(error as Error);
            }
          },
          
          registerSuccess: (user: User, token: string) => {
            set({
              user: setSuccessState(user),
              token,
              isAuthenticated: true,
            });
          },
          
          registerError: (error: Error) => {
            set({
              user: setErrorState(error),
              token: null,
              isAuthenticated: false,
            });
          },
          
          // Update profile action
          updateProfile: async (userData: Partial<User>) => {
            const { user } = get();
            
            if (user.status !== AsyncStatus.SUCCESS || !user.data) {
              throw new Error('User not authenticated');
            }
            
            set(state => ({
              ...state,
              user: setLoadingState(state.user),
            }));
            
            try {
              // This would be an actual API call in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<User>((resolve) => {
                setTimeout(() => {
                  resolve({
                    ...user.data,
                    ...userData,
                  });
                }, 500);
              });
              
              const updatedUser = await mockApiCall();
              
              set({
                user: setSuccessState(updatedUser),
              });
            } catch (error) {
              set({
                user: setErrorState(error as Error),
              });
            }
          },
          
          // Check auth status
          checkAuthStatus: async () => {
            const { token, expiresAt } = get();
            
            // If no token or expired token, user is not authenticated
            if (!token || (expiresAt && Date.now() > expiresAt)) {
              set({
                isAuthenticated: false,
                isInitialized: true,
              });
              return false;
            }
            
            try {
              // This would be an actual API call to validate token in a real application
              // Simulating API call for example purposes
              const mockApiCall = () => new Promise<User>((resolve) => {
                setTimeout(() => {
                  resolve({
                    id: '1',
                    email: 'user@example.com',
                    name: 'Test User',
                    role: 'user',
                  });
                }, 500);
              });
              
              const user = await mockApiCall();
              
              set({
                user: setSuccessState(user),
                isAuthenticated: true,
                isInitialized: true,
              });
              
              return true;
            } catch (error) {
              set({
                user: setErrorState(error as Error),
                token: null,
                isAuthenticated: false,
                isInitialized: true,
              });
              
              return false;
            }
          },
          
          // Set initialization
          setInitialized: (initialized: boolean) => {
            set({
              isInitialized: initialized,
            });
          },
        }),
        resetAuth
      ),
      'auth'
    )
  )
);

// Auth selectors
export const selectUser = (state: AuthState) => state.user;
export const selectIsAuthenticated = (state: AuthState) => state.isAuthenticated;
export const selectIsInitialized = (state: AuthState) => state.isInitialized;
export const selectToken = (state: AuthState) => state.token; 