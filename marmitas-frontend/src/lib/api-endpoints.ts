/**
 * Definições de endpoints da API
 * 
 * Este arquivo contém os endpoints da API que o frontend pode chamar.
 * Todas as chamadas à API devem ser feitas através do apiClient.
 */

/**
 * Endpoints de autenticação
 */
export const AUTH_ENDPOINTS = {
  /** Registra um novo usuário */
  REGISTER: '/auth/register',
  /** Autentica um usuário existente */
  LOGIN: '/auth/login',
  /** Encerra a sessão do usuário atual */
  LOGOUT: '/auth/logout',
  /** Obtém o perfil do usuário autenticado */
  PROFILE: '/auth/profile',
};

/**
 * Endpoints de produtos
 */
export const PRODUCT_ENDPOINTS = {
  /** Lista todos os produtos */
  LIST: '/products',
  /** Obtém detalhes de um produto específico */
  DETAIL: (id: string | number) => `/products/${id}`,
};

/**
 * Endpoints de pedidos
 */
export const ORDER_ENDPOINTS = {
  /** Lista todos os pedidos do usuário atual */
  LIST: '/orders',
  /** Obtém detalhes de um pedido específico */
  DETAIL: (id: string | number) => `/orders/${id}`,
  /** Cria um novo pedido */
  CREATE: '/orders',
  /** Atualiza o status de um pedido */
  UPDATE: (id: string | number) => `/orders/${id}`,
};

/**
 * Endpoints de categorias
 */
export const CATEGORY_ENDPOINTS = {
  /** Lista todas as categorias */
  LIST: '/categories',
  /** Obtém detalhes de uma categoria específica */
  DETAIL: (id: string | number) => `/categories/${id}`,
};

/**
 * Endpoints de endereços do usuário
 */
export const ADDRESS_ENDPOINTS = {
  /** Lista todos os endereços do usuário atual */
  LIST: '/addresses',
  /** Obtém detalhes de um endereço específico */
  DETAIL: (id: string | number) => `/addresses/${id}`,
  /** Cria um novo endereço */
  CREATE: '/addresses',
  /** Atualiza um endereço existente */
  UPDATE: (id: string | number) => `/addresses/${id}`,
  /** Remove um endereço */
  DELETE: (id: string | number) => `/addresses/${id}`,
}; 