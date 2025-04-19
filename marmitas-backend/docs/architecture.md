# Arquitetura do Sistema

## Visão Geral

Este documento descreve a arquitetura do sistema Marmitas, detalhando as camadas, componentes, padrões de design e tecnologias utilizadas, bem como as decisões arquiteturais que guiaram o desenvolvimento.

## Arquitetura de Alto Nível

O sistema Marmitas segue uma arquitetura de microsserviços distribuídos, organizada em camadas claramente definidas:

```
+------------------+
|                  |
|     Frontend     |
|     (React)      |
|                  |
+--------+---------+
         |
         | HTTP/REST
         |
+--------+---------+     +------------------+
|                  |     |                  |
|  API Gateway     |---->|  Auth Service    |
|  (Express.js)    |     |  (JWT, Supabase) |
|                  |     |                  |
+--------+---------+     +------------------+
         |
         |
         v
+--------+---------+     +------------------+
|                  |     |                  |
|  Core Services   |---->|  Database        |
|  (Node.js)       |     |  (Supabase/PG)   |
|                  |     |                  |
+------------------+     +------------------+
         |
         |
         v
+--------+---------+
|                  |
|  External APIs   |
|  (Pagamentos,    |
|   Notificações)  |
+------------------+
```

## Tecnologias Principais

### Frontend
- **Framework**: React com TypeScript
- **Gerenciamento de Estado**: Redux Toolkit ou Context API
- **Roteamento**: React Router
- **Estilização**: Styled Components / Tailwind CSS
- **Comunicação com API**: Axios
- **Validação de Formulários**: Formik + Yup

### Backend
- **API**: Node.js + Express
- **Autenticação**: JWT + Supabase Auth
- **ORM**: Prisma ou TypeORM
- **Banco de Dados**: PostgreSQL (via Supabase)
- **Cache**: Redis
- **Filas**: Bull/Redis para processamento assíncrono
- **Documentação API**: Swagger / OpenAPI
- **Testes**: Jest, Supertest

### DevOps
- **CI/CD**: GitHub Actions
- **Hospedagem**: Vercel (Frontend), Railway/Render (Backend)
- **Monitoramento**: Sentry, LogRocket
- **Containers**: Docker (desenvolvimento e produção)

## Camadas da Aplicação

### 1. Frontend (Presentation Layer)

A camada de apresentação é construída como uma Single Page Application (SPA) em React, seguindo os princípios de Atomic Design para componentes e Container/Presenter para separação de lógica e UI.

#### Estrutura de Diretórios
```
src/
├── assets/          # Recursos estáticos (imagens, fontes)
├── components/      # Componentes reutilizáveis (Atomic Design)
│   ├── atoms/
│   ├── molecules/
│   ├── organisms/
│   └── templates/
├── context/         # Context API para estado global
├── hooks/           # Custom hooks
├── pages/           # Componentes de página
├── routes/          # Configuração de rotas
├── services/        # Serviços de API e integração externa
├── store/           # Estado global (Redux)
├── styles/          # Estilos globais e temas
└── utils/           # Funções utilitárias
```

### 2. API Gateway

O API Gateway serve como ponto de entrada centralizado para todas as requisições, gerenciando:

- Roteamento para serviços internos
- Autenticação e autorização
- Rate limiting e throttling
- Logging e monitoramento
- Transformação de resposta/solicitação

#### Estrutura de Diretórios (Backend)
```
src/
├── config/          # Configurações da aplicação
├── controllers/     # Controladores da API
├── middleware/      # Middlewares (auth, logging, etc)
├── models/          # Modelos de dados
├── routes/          # Definição de rotas
├── services/        # Lógica de negócios
├── utils/           # Funções utilitárias
└── validation/      # Esquemas de validação
```

### 3. Serviços Core

Os serviços core implementam a lógica de negócios principal, organizados por domínio:

- **User Service**: Gerenciamento de usuários e perfis
- **Product Service**: Cadastro e gerenciamento de produtos
- **Order Service**: Processamento de pedidos e pagamentos
- **Delivery Service**: Gerenciamento de entregas e logística

Cada serviço segue uma arquitetura Clean/Hexagonal que separa:
- **Domain Layer**: Entidades e regras de negócio
- **Application Layer**: Casos de uso e lógica de aplicação
- **Infrastructure Layer**: Implementações técnicas (banco de dados, cache, etc)

### 4. Persistence Layer

A camada de persistência é gerenciada pelo Supabase (PostgreSQL), com:

- Modelagem relacional normalizada
- Políticas de RLS (Row Level Security)
- Triggers e funções para lógica de banco
- Índices otimizados para performance

## Padrões Arquiteturais

### Padrão MVC no Backend

O backend segue uma arquitetura MVC adaptada:

- **Models**: Representação das entidades de dados e regras de negócio
- **Controllers**: Manipulação de requisições HTTP e respostas
- **Services**: Lógica de negócios e operações complexas

### Domain-Driven Design (DDD)

Utilizamos conceitos de DDD para modelar domínios complexos:

- **Entidades**: Objetos com identidade própria e ciclo de vida
- **Value Objects**: Objetos imutáveis sem identidade
- **Agregados**: Coleções de entidades tratadas como uma unidade
- **Repositories**: Abstrações para acesso a dados
- **Domain Services**: Operações que não pertencem naturalmente a uma entidade

### Repository Pattern

A camada de acesso a dados implementa o padrão Repository para:

- Abstrair a tecnologia de persistência
- Facilitar testes unitários através de mocks
- Centralizar lógica de queries
- Simplificar a migração entre tecnologias de banco

```typescript
// Exemplo de Repository
interface ProductRepository {
  findAll(filters?: ProductFilters): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
  create(product: ProductCreateDTO): Promise<Product>;
  update(id: string, product: ProductUpdateDTO): Promise<Product>;
  delete(id: string): Promise<void>;
}

// Implementação com Prisma
class PrismaProductRepository implements ProductRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findAll(filters?: ProductFilters): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        ...(filters?.category && { categoryId: filters.category }),
        ...(filters?.search && { 
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
          ]
        })
      },
      orderBy: { createdAt: 'desc' }
    });
  }
  
  // Outros métodos...
}
```

## Fluxo de Dados e Comunicação

### Comunicação Síncrona (REST API)

A comunicação entre frontend e backend é feita via REST API, com:

- Endpoints RESTful seguindo boas práticas
- Autenticação via JWT
- Validação de dados com schema
- Respostas padronizadas e códigos HTTP apropriados

### Comunicação Assíncrona (Filas)

Para operações de longa duração, utilizamos processamento assíncrono:

- Filas de mensagens baseadas em Redis
- Workers para processamento em background
- Processamento de pagamentos
- Envio de notificações
- Geração de relatórios

```typescript
// Exemplo de job worker
const orderQueue = new Queue('order-processing', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

orderQueue.process(async (job) => {
  const { orderId } = job.data;
  // Processar pedido
  await orderService.processPayment(orderId);
  await notificationService.sendOrderConfirmation(orderId);
});
```

## Escalabilidade e Performance

### Estratégias de Cache

- **Cache de Aplicação**: Redis para dados frequentemente acessados
- **Cache de Resposta HTTP**: Cache-Control headers para recursos estáticos
- **Cache no Cliente**: Estratégia stale-while-revalidate para UX melhorada

### Otimização de Banco de Dados

- Índices estrategicamente posicionados
- Queries otimizadas e analisadas
- Paginação e filtragem no servidor
- Normalizações apropriadas e desnormalizações estratégicas

### Horizontal Scaling

- Serviços sem estado para permitir escala horizontal
- Balanceamento de carga para distribuir tráfego
- Sessões gerenciadas por tokens JWT para independência de servidor

## Segurança

### Autenticação e Autorização

- JWT para autenticação stateless
- Refresh tokens para renovação segura
- RBAC (Role-Based Access Control) para autorização
- RLS (Row Level Security) no banco de dados

### Proteção de Dados

- Criptografia em trânsito (HTTPS)
- Criptografia em repouso para dados sensíveis
- Sanitização de entrada em todos os endpoints
- Parâmetros vinculados em queries SQL

## Observabilidade

### Logging

- Logs estruturados em formato JSON
- Níveis de log diferenciados (info, warn, error)
- Contexto de requisição (request ID) preservado
- Retenção e rotação de logs configuráveis

### Monitoramento

- Métricas de aplicação (latência, throughput, erro)
- Alertas para condições anômalas
- Dashboards para visualização de performance
- Traces para análise de requisições complexas

## Estratégia de Deployment

### Ambientes

- **Desenvolvimento**: Ambiente local com Docker Compose
- **Staging**: Ambiente de teste pré-produção
- **Produção**: Ambiente de produção isolado e seguro

### CI/CD Pipeline

```
+---------------+     +---------------+     +---------------+
|               |     |               |     |               |
|   Commit/PR   |---->|   CI Tests    |---->|   CD Deploy   |
|               |     |               |     |               |
+---------------+     +---------------+     +---------------+
```

1. Push para branch de feature
2. Execução de linters e testes automatizados
3. Build de imagens Docker (se aplicável)
4. Deploy para ambiente de staging
5. Testes de integração e aceitação
6. Aprovação manual para produção
7. Deploy para produção (blue/green ou canary)

## Decisões Arquiteturais

### Monolito vs Microsserviços

Iniciamos com uma arquitetura monolítica modular para velocidade de desenvolvimento, mas com design que permite evolução para microsserviços conforme necessidade de escala.

### Backend Framework

Escolhemos Express.js pela:
- Maturidade e comunidade ativa
- Flexibilidade de configuração
- Performance adequada para nossa escala
- Disponibilidade de desenvolvedores familiarizados

### Banco de Dados

Optamos pelo PostgreSQL (Supabase) por:
- Suporte a modelos relacionais complexos
- Recursos avançados (JSON, triggers, etc)
- Capacidade de escala horizontal
- Integração nativa com Supabase para autenticação

### ORM vs SQL Nativo

Adotamos um ORM (Prisma) para:
- Maior produtividade de desenvolvimento
- Type safety com TypeScript
- Migrações gerenciadas
- Sem sacrificar a possibilidade de usar SQL raw quando necessário

## Evolução Arquitetural

### Atual (Monolito Modular)

Atualmente operamos com uma arquitetura monolítica modular para:
- Simplificar o desenvolvimento inicial
- Reduzir overhead operacional
- Facilitar debugging e troubleshooting

### Futuro (Microsserviços)

Plano de evolução para microsserviços:

1. Identificar limites de domínio claros
2. Extrair serviços autônomos gradualmente
3. Implementar comunicação entre serviços (REST/gRPC)
4. Adotar padrões de resiliência (Circuit Breaker, Retry)
5. Implementar service discovery e gestão de configuração

## Considerações Técnicas Adicionais

### Estratégia de Migração de Dados

Para atualizações de schema:
- Migrações incrementais e versionadas
- Scripts de rollback para cada migração
- Testes automatizados para migrações
- Janelas de manutenção planejadas quando necessário

### Gestão de Dependências

- Versionamento semântico para bibliotecas
- Auditoria regular de segurança
- Lock files para garantir builds determinísticos
- Dependências com mínimo de "transitive dependencies"

### Documentação Técnica

- Documentação como código, versionada junto com codebase
- Diagramas de arquitetura (C4 model)
- Documentação de API automática (Swagger/OpenAPI)
- Runbooks para operações comuns e troubleshooting

## Conclusão

A arquitetura do sistema Marmitas foi projetada para equilibrar velocidade de desenvolvimento, manutenibilidade e capacidade de evolução. Através de padrões modernos e tecnologias comprovadas, construímos uma base sólida que permite escalabilidade horizontal e vertical conforme o crescimento do negócio. 