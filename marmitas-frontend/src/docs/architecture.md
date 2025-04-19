# Arquitetura Frontend-Backend

## Visão Geral

A aplicação Marmitas segue uma arquitetura de separação clara entre o frontend e o backend, implementando o padrão cliente-servidor com comunicação via API REST.

## Princípios Arquiteturais

1. **Separação de Responsabilidades**
   - Frontend: Interface do usuário, experiência e interação
   - Backend: Lógica de negócio, acesso a dados e segurança

2. **Comunicação via API**
   - Toda comunicação entre frontend e backend ocorre exclusivamente via API REST
   - Endpoints bem definidos com contratos claros
   - Respostas padronizadas para sucesso e erro

3. **Segurança de Dados**
   - Nenhum acesso direto ao banco de dados pelo frontend
   - Credenciais de banco de dados presentes apenas no backend
   - Autenticação e autorização gerenciadas pelo backend

4. **Padrão de Comunicação**
   ```
   Frontend (React) → API Client → HTTP Request → 
   Backend API → Service Layer → Database Access → Database
   ```

## Componentes Principais

### Frontend

1. **API Client** (`src/lib/api-client.ts`)
   - Cliente HTTP para comunicação com o backend
   - Gerenciamento de requisições e respostas
   - Tratamento de erros padronizado

2. **API Endpoints** (`src/lib/api-endpoints.ts`)
   - Definição centralizada de todos os endpoints da API
   - Organização por domínio (auth, products, orders, etc.)

3. **Serviços** (`src/lib/auth-service.ts`, etc.)
   - Encapsulamento de chamadas à API relacionadas a um domínio
   - Gerenciamento de estado e cache local quando necessário

### Backend

1. **Controladores API** (`src/controllers/`)
   - Processamento de requisições e respostas HTTP
   - Validação de entradas e formatação de saídas

2. **Serviços** (`src/services/`)
   - Lógica de negócio
   - Orquestração de operações de dados

3. **Acesso a Dados** (`src/services/database.service.ts`)
   - Encapsulamento de todas as operações de banco de dados
   - Implementação de políticas de segurança

## Fluxo de Dados

1. **Leitura de Dados**
   - Frontend faz requisição GET para endpoint da API
   - Backend valida a requisição (autenticação, autorização)
   - Backend processa a requisição, busca dados no banco
   - Backend retorna resposta formatada
   - Frontend exibe os dados para o usuário

2. **Escrita de Dados**
   - Frontend coleta dados do usuário
   - Frontend valida dados localmente
   - Frontend envia dados via POST/PUT/DELETE para a API
   - Backend valida a requisição e os dados
   - Backend processa a operação no banco de dados
   - Backend retorna resposta de sucesso ou erro
   - Frontend atualiza a UI conforme resposta

## Segurança

1. **Autenticação**
   - Baseada em tokens JWT
   - Token armazenado no localStorage do navegador
   - Token incluído no cabeçalho Authorization de cada requisição
   - Backend valida token antes de processar requisições protegidas

2. **Autorização**
   - Backend verifica permissões do usuário para cada operação
   - Implementação de Row Level Security no banco de dados
   - Frontend exibe ou oculta elementos conforme permissões do usuário

3. **Proteção de Dados**
   - Apenas o backend tem acesso direto ao banco de dados
   - Credenciais sensíveis não são expostas ao frontend
   - Políticas de segurança implementadas em nível de banco de dados

## Benefícios desta Arquitetura

1. **Segurança Aprimorada**
   - Isolamento de credenciais sensíveis no backend
   - Controle granular sobre acesso aos dados

2. **Manutenibilidade**
   - Frontends e backends podem evoluir independentemente
   - Contratos claros de API facilitam a colaboração

3. **Escalabilidade**
   - Componentes podem ser escalados independentemente
   - Permite refatoração ou substituição de componentes sem afetar o sistema inteiro

4. **Testabilidade**
   - Frontends e backends podem ser testados isoladamente
   - Interfaces bem definidas simplificam testes de integração 