# Fluxo de Dados e API

## Visão Geral

Este documento descreve o fluxo de dados entre o frontend e o backend na aplicação Marmitas, detalhando os endpoints da API, formatos de requisição/resposta, e melhores práticas para a comunicação entre as camadas.

## Estrutura da API REST

### Base URL

- **Desenvolvimento**: `http://localhost:3001/api`
- **Produção**: `https://api.marmitas.com.br/api`

### Estrutura de Endpoints

A API segue uma estrutura RESTful com recursos claramente definidos:

```
/api
  /auth
    POST /login
    POST /register
    POST /refresh-token
    POST /logout
  /users
    GET /
    GET /:id
    PUT /:id
    DELETE /:id
  /products
    GET /
    GET /:id
    POST /
    PUT /:id
    DELETE /:id
  /orders
    GET /
    GET /:id
    POST /
    PUT /:id
    DELETE /:id
  /categories
    GET /
    GET /:id
```

## Padrões de Requisição e Resposta

### Formato de Requisição

```json
{
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer {jwt_token}"
  },
  "body": {
    // Dados específicos do endpoint
  }
}
```

### Formato de Resposta

Todas as respostas seguem o formato padronizado:

```json
{
  "success": true,
  "data": {
    // Dados da resposta
  },
  "error": null
}
```

Em caso de erro:

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensagem detalhada do erro"
  }
}
```

### Códigos HTTP

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Erro na requisição do cliente
- `401 Unauthorized`: Autenticação necessária
- `403 Forbidden`: Sem permissão para o recurso
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro no servidor

## Detalhamento de Endpoints

### Autenticação

#### POST /api/auth/login

**Requisição:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJ...",
    "refreshToken": "eyJhbGciOiJ...",
    "user": {
      "id": "123",
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "role": "customer"
    }
  },
  "error": null
}
```

#### POST /api/auth/refresh-token

**Requisição:**
```json
{
  "refreshToken": "eyJhbGciOiJ..."
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJ...",
    "refreshToken": "eyJhbGciOiJ..."
  },
  "error": null
}
```

### Produtos

#### GET /api/products

**Parâmetros de Query:**
- `page`: Número da página (default: 1)
- `limit`: Itens por página (default: 10)
- `category`: Filtrar por categoria
- `search`: Termo de busca

**Resposta:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "1",
        "name": "Marmita Fit",
        "description": "Refeição balanceada com proteínas e legumes",
        "price": 15.90,
        "imageUrl": "https://...",
        "categoryId": "2"
      },
      // mais produtos...
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  },
  "error": null
}
```

#### POST /api/products

**Requisição:**
```json
{
  "name": "Marmita Low Carb",
  "description": "Refeição com baixo teor de carboidratos",
  "price": 18.90,
  "imageUrl": "https://...",
  "categoryId": "3"
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "10",
    "name": "Marmita Low Carb",
    "description": "Refeição com baixo teor de carboidratos",
    "price": 18.90,
    "imageUrl": "https://...",
    "categoryId": "3",
    "createdAt": "2023-09-15T10:30:00Z"
  },
  "error": null
}
```

### Pedidos

#### GET /api/orders

**Resposta:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "1",
        "userId": "123",
        "status": "delivered",
        "totalAmount": 32.80,
        "items": [
          {
            "productId": "1",
            "quantity": 2,
            "unitPrice": 15.90,
            "subtotal": 31.80
          },
          // mais itens...
        ],
        "deliveryAddress": {
          "street": "Rua Exemplo",
          "number": "123",
          "complement": "Apto 45",
          "city": "São Paulo",
          "state": "SP",
          "zipCode": "01234-567"
        },
        "createdAt": "2023-09-10T15:30:00Z",
        "updatedAt": "2023-09-10T18:45:00Z"
      },
      // mais pedidos...
    ]
  },
  "error": null
}
```

#### POST /api/orders

**Requisição:**
```json
{
  "items": [
    {
      "productId": "1",
      "quantity": 2
    },
    {
      "productId": "5",
      "quantity": 1
    }
  ],
  "deliveryAddress": {
    "street": "Rua Exemplo",
    "number": "123",
    "complement": "Apto 45",
    "city": "São Paulo",
    "state": "SP",
    "zipCode": "01234-567"
  },
  "paymentMethod": "credit_card",
  "paymentDetails": {
    "cardToken": "tok_visa"
  }
}
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "15",
    "status": "pending",
    "totalAmount": 50.70,
    "items": [
      {
        "productId": "1",
        "quantity": 2,
        "unitPrice": 15.90,
        "subtotal": 31.80
      },
      {
        "productId": "5",
        "quantity": 1,
        "unitPrice": 18.90,
        "subtotal": 18.90
      }
    ],
    "deliveryAddress": {
      "street": "Rua Exemplo",
      "number": "123",
      "complement": "Apto 45",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    },
    "paymentStatus": "approved",
    "createdAt": "2023-09-15T16:45:00Z"
  },
  "error": null
}
```

## Implementação no Frontend

### Cliente de API

O frontend implementa um cliente de API centralizado para lidar com todas as requisições:

```typescript
// src/services/api.ts
import axios from 'axios';
import { getToken, refreshToken } from './auth';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token a todas as requisições
api.interceptors.request.use(async (config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para lidar com erros e renovação de token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await refreshToken();
        // Tenta novamente a requisição original
        return api.request(error.config);
      } catch (refreshError) {
        // Falha ao renovar token, redirecionar para login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Serviços Específicos

Serviços por domínio encapsulam a lógica de chamadas API:

```typescript
// src/services/products.ts
import api from './api';

export const ProductService = {
  getAll: async (params) => {
    const response = await api.get('/products', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  
  create: async (productData) => {
    const response = await api.post('/products', productData);
    return response.data;
  },
  
  update: async (id, productData) => {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  },
  
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  }
};
```

## Tratamento de Erros

### Backend

O backend implementa um sistema centralizado de tratamento de erros:

```typescript
// src/middleware/errorHandler.ts
export const errorHandler = (err, req, res, next) => {
  console.error(err);
  
  // Erros conhecidos com código específico
  if (err.code) {
    return res.status(err.statusCode || 400).json({
      success: false,
      data: null,
      error: {
        code: err.code,
        message: err.message
      }
    });
  }
  
  // Erro interno não esperado
  return res.status(500).json({
    success: false,
    data: null,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Erro interno do servidor'
    }
  });
};
```

### Frontend

O frontend implementa um tratamento global de erros de API:

```typescript
// src/utils/errorHandler.ts
import { toast } from 'react-toastify';

export const handleApiError = (error) => {
  const errorData = error.response?.data?.error;
  
  // Mensagens de erro específicas por código
  const errorMessages = {
    'INVALID_CREDENTIALS': 'Email ou senha inválidos',
    'PRODUCT_NOT_FOUND': 'Produto não encontrado',
    'PERMISSION_DENIED': 'Você não tem permissão para esta ação',
    // outros códigos de erro...
  };
  
  const message = errorData?.code 
    ? (errorMessages[errorData.code] || errorData.message)
    : 'Ocorreu um erro. Tente novamente mais tarde.';
    
  toast.error(message);
  return Promise.reject(error);
};
```

## Boas Práticas

### Cache e Otimização

- Implementação de cache no cliente para dados que não mudam frequentemente
- Uso de estratégias como stale-while-revalidate
- Paginação e filtragem no servidor para lidar com grandes conjuntos de dados

### Versionamento de API

A API suporta versionamento para mudanças futuras:

```
/api/v1/products
/api/v2/products
```

### Logs e Monitoramento

- Todas as requisições são registradas para auditoria
- Tempos de resposta são monitorados para identificar gargalos
- Erros são registrados com contexto completo para facilitar depuração

## Diagrama de Fluxo de Dados

```
+----------------+        +----------------+        +----------------+
|                |        |                |        |                |
|   Frontend     |<------>|     API        |<------>|   Database     |
|   React        |   HTTP |   Express.js   |   SQL  |   Supabase     |
|                |        |                |        |                |
+----------------+        +----------------+        +----------------+
      ^                          ^
      |                          |
      v                          v
+----------------+        +----------------+
|                |        |                |
|  Local Storage |        |   Cache Layer  |
|  JWT Tokens    |        |   Redis        |
|                |        |                |
+----------------+        +----------------+
```

## Evolução e Manutenção

### Depreciação de Endpoints

Ao substituir ou modificar endpoints:

1. Anunciar com antecedência (via changelog, documentação)
2. Manter o endpoint antigo funcionando com aviso de depreciação
3. Remover apenas após período de transição

### Documentação Automática

A API é documentada automaticamente usando Swagger:

- Desenvolvimento: `http://localhost:3001/api-docs`
- Produção: `https://api.marmitas.com.br/api-docs` 