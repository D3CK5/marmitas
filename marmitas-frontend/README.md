# Marmitas Frontend

Frontend application for the Marmitas system, built with React, TypeScript, and Vite.

## Arquitetura

Este frontend segue a arquitetura de separação clara entre frontend e backend, onde:

- O frontend é responsável apenas pela interface do usuário e experiência
- Toda a comunicação com o backend é feita via API REST
- Não há acesso direto ao banco de dados a partir do frontend
- A autenticação é gerenciada via tokens JWT

## Setup and Installation

1. Clone the repository:
   ```bash
   git clone <frontend-repository-url>
   cd marmitas-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   VITE_API_URL=http://localhost:3001/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

- `src/components/` - Reusable UI components
- `src/pages/` - Page components that correspond to routes
- `src/hooks/` - Custom React hooks
- `src/contexts/` - React context providers
- `src/lib/` - Utility functions and shared code
  - `api-client.ts` - Client for making API requests
  - `api-endpoints.ts` - Definitions of API endpoints
  - `auth-service.ts` - Service for authentication
- `src/routes/` - Routing configuration
- `src/types/` - TypeScript type definitions

## Comunicação com o Backend

Toda a comunicação com o backend é realizada através do API Client (`src/lib/api-client.ts`). Este cliente fornece métodos para fazer requisições HTTP para o backend, incluindo:

- GET - Para buscar dados
- POST - Para criar novos recursos
- PUT - Para atualizar recursos existentes
- DELETE - Para remover recursos

Exemplo de uso:

```typescript
import { apiClient } from '@/lib/api-client';
import { PRODUCT_ENDPOINTS } from '@/lib/api-endpoints';

// Buscar produtos
const getProducts = async () => {
  const response = await apiClient.get(PRODUCT_ENDPOINTS.LIST);
  return response.data;
};

// Criar novo pedido
const createOrder = async (orderData) => {
  const response = await apiClient.post(ORDER_ENDPOINTS.CREATE, orderData);
  return response.data;
};
```

## Build

To build the application for production:

```bash
npm run build
```

## Preview

To preview the production build locally:

```bash
npm run preview
```

## Linting

To lint the codebase:

```bash
npm run lint
``` 