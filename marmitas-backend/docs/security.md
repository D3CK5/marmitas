# Documentação de Segurança

## Visão Geral

O sistema de Marmitas implementa múltiplas camadas de segurança para proteger dados sensíveis, garantir a autenticação adequada dos usuários e aplicar controles de acesso apropriados. Esta documentação descreve as medidas de segurança implementadas em todos os níveis da aplicação.

## Autenticação

### JWT (JSON Web Tokens)

- **Implementação**: Uso de tokens JWT para gerenciar sessões de usuário.
- **Fluxo de Autenticação**:
  1. Usuário fornece credenciais (email/senha)
  2. Backend valida credenciais contra banco de dados
  3. Backend gera token JWT contendo ID do usuário e perfil
  4. Token é enviado ao cliente e armazenado localmente
  5. Requisições subsequentes incluem o token no cabeçalho Authorization

- **Segurança do Token**:
  - Assinado com chave secreta armazenada apenas no servidor
  - Configurado com tempo de expiração apropriado
  - Tokens inválidos ou expirados são rejeitados automaticamente

### Refresh Tokens

- **Implementação**: Sistema de refresh tokens para renovação de sessões.
- **Funcionamento**:
  1. Quando o token de acesso expira, o cliente envia o refresh token
  2. Se válido, o backend gera um novo par de tokens (acesso + refresh)
  3. O cliente substitui os tokens antigos pelos novos

## Autorização

### RBAC (Role-Based Access Control)

- **Perfis de Usuário**:
  - `admin`: Acesso completo ao sistema
  - `manager`: Gerenciamento de produtos, pedidos e relatórios
  - `customer`: Acesso apenas aos próprios pedidos e catálogo de produtos

- **Middleware de Autorização**:
  - Implementado em `src/middlewares/auth.middleware.ts`
  - Verifica perfil do usuário contido no token JWT
  - Bloqueia acesso não autorizado a rotas protegidas

### Row Level Security (RLS)

- **Implementação**: Políticas de RLS aplicadas diretamente no banco de dados Supabase.
- **Script de Aplicação**: `scripts/apply-rls.js` para configurar políticas no ambiente de desenvolvimento.
- **Políticas Implementadas**:
  - `orders`: Usuários só podem ver seus próprios pedidos
  - `products`: Leitura permitida a todos, modificação apenas por admin/manager
  - `users`: Usuários só podem ver/editar seus próprios dados

## Proteção de Dados

### Separação Frontend-Backend

- **Princípio**: O frontend nunca acessa diretamente o banco de dados.
- **Implementação**:
  - Credenciais de banco ausentes do código frontend
  - Toda interação com dados ocorre via API REST
  - Backend valida e sanitiza todas as entradas antes de operações no banco

### Variáveis de Ambiente

- **Gestão de Segredos**:
  - Credenciais sensíveis armazenadas em variáveis de ambiente
  - Arquivos `.env` nunca são commitados no controle de versão
  - Uso de `.env.example` para documentar variáveis necessárias

- **Variáveis Críticas**:
  - `SUPABASE_URL`: URL do projeto Supabase
  - `SUPABASE_KEY`: Chave de serviço para acesso administrativo
  - `JWT_SECRET`: Chave para assinatura de tokens JWT

## Proteções Contra Ataques Comuns

### Injeção SQL

- **Medidas de Proteção**:
  - Uso de ORM/query builder com parameterização
  - Validação e sanitização de todas as entradas de usuário
  - Implementação de tipos fortes (TypeScript) para validação de dados

### XSS (Cross-Site Scripting)

- **Medidas de Proteção**:
  - Sanitização de dados antes da renderização
  - Content Security Policy apropriada
  - Escape automático de conteúdo HTML no React

### CSRF (Cross-Site Request Forgery)

- **Medidas de Proteção**:
  - Tokens JWT transmitidos via cabeçalhos Authorization
  - Validação de origem da requisição
  - SameSite cookies quando aplicável

## Validação de Dados

- **Implementação**: Validação em múltiplas camadas.
- **Camadas**:
  1. **Frontend**: Validação de formulários antes do envio
  2. **API**: Validação completa de todas as entradas (usando biblioteca como Joi/Zod)
  3. **Serviços**: Validação adicional baseada em regras de negócio
  4. **Banco de Dados**: Constraints e triggers para garantir integridade

## Monitoramento e Auditoria

- **Logs de Segurança**:
  - Registro de tentativas de login (sucesso/falha)
  - Registro de operações sensíveis (alteração de perfil, exclusão de conta)
  - Timestamping de todas as alterações de dados críticos

## Melhores Práticas Implementadas

1. **Princípio do Menor Privilégio**:
   - Cada componente tem apenas as permissões mínimas necessárias
   - Tokens JWT contêm apenas as informações essenciais

2. **Defesa em Profundidade**:
   - Múltiplas camadas de segurança independentes
   - Falha em uma camada não compromete todo o sistema

3. **Segurança por Design**:
   - Considerações de segurança desde o início do desenvolvimento
   - Revisões regulares de código focadas em segurança

## Procedimentos de Segurança

### Rotação de Credenciais

- Procedimento documentado para rotação periódica de:
  - Chaves de serviço Supabase
  - Segredos JWT
  - Outras credenciais sensíveis

### Resposta a Incidentes

- Plano de resposta incluindo:
  - Procedimentos para isolamento de sistemas comprometidos
  - Processo de investigação e remediação
  - Responsabilidades e pontos de contato

## Evolução da Segurança

- Plano de evolução contínua incluindo:
  - Revisões periódicas de segurança
  - Testes de penetração
  - Atualização de dependências para versões seguras 