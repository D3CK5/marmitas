import apiClient from './api-client';
import { AUTH_ENDPOINTS } from './api-endpoints';

/**
 * Interface para o usuário autenticado
 */
export interface User {
  id: string;
  email: string;
  name: string;
}

/**
 * Interface para credenciais de login
 */
interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface para dados de registro
 */
interface RegisterData {
  email: string;
  password: string;
  name: string;
}

/**
 * Interface para a resposta da API de autenticação
 */
interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Serviço de autenticação
 * 
 * Este serviço fornece métodos para gerenciar a autenticação do usuário,
 * utilizando o API Client para comunicação com o backend.
 */
export const authService = {
  /**
   * Registra um novo usuário
   * @param data Dados do usuário
   * @returns Informações do usuário e token
   */
  async register(data: RegisterData): Promise<User> {
    const response = await apiClient.post<{ data: AuthResponse }>(AUTH_ENDPOINTS.REGISTER, data);
    const { user, token } = response.data;
    
    // Armazenar token de autenticação
    localStorage.setItem('auth_token', token);
    
    return user;
  },
  
  /**
   * Autentica um usuário existente
   * @param credentials Credenciais de login
   * @returns Informações do usuário
   */
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await apiClient.post<{ data: AuthResponse }>(AUTH_ENDPOINTS.LOGIN, credentials);
    const { user, token } = response.data;
    
    // Armazenar token de autenticação
    localStorage.setItem('auth_token', token);
    
    return user;
  },
  
  /**
   * Encerra a sessão do usuário atual
   */
  async logout(): Promise<void> {
    await apiClient.post<void>(AUTH_ENDPOINTS.LOGOUT, {});
    
    // Remover token de autenticação
    localStorage.removeItem('auth_token');
  },
  
  /**
   * Obtém o perfil do usuário atual
   * @returns Informações do usuário
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ data: User }>(AUTH_ENDPOINTS.PROFILE);
    return response.data;
  },
  
  /**
   * Verifica se o usuário está autenticado
   * @returns true se o usuário estiver autenticado
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },
  
  /**
   * Obtém o token de autenticação
   * @returns Token ou null se não estiver autenticado
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }
};

export default authService; 