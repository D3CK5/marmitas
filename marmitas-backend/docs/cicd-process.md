# Backend CI/CD Process Documentation

Este documento descreve o processo de Integração Contínua e Entrega Contínua (CI/CD) para o backend da aplicação Marmitas.

## Pipeline de CI/CD

O pipeline de CI/CD do backend é implementado usando GitHub Actions e consiste em várias etapas que são executadas em sequência para garantir a qualidade do código e automatizar o processo de implantação.

### Estrutura do Pipeline

O pipeline está definido no arquivo `.github/workflows/ci-cd.yml` e inclui os seguintes jobs:

1. **Lint** - Verifica a qualidade do código usando ESLint
2. **Test** - Executa testes automatizados usando Jest
3. **DB Migration Test** - Testa migrações de banco de dados em um ambiente isolado
4. **Build** - Compila o código TypeScript para JavaScript
5. **Deploy to Development** - Implanta o código no ambiente de desenvolvimento (quando o código é mergeado na branch `develop`)
6. **Deploy to Production** - Implanta o código no ambiente de produção (quando o código é mergeado na branch `main`)

### Gatilhos do Pipeline

O pipeline é acionado nas seguintes situações:

- Quando um push é feito para as branches `main` ou `develop`
- Quando um pull request é aberto ou atualizado para as branches `main` ou `develop`
- Manualmente, através da opção "workflow_dispatch" no GitHub

### Ambientes

O pipeline suporta implantação em diferentes ambientes:

- **Ambiente de Desenvolvimento** - Usado para testes internos, acionado quando o código é mergeado na branch `develop`
- **Ambiente de Produção** - Ambiente de produção, acionado quando o código é mergeado na branch `main`

## Processo de Teste

Os testes automatizados são executados usando Jest. A configuração de teste está definida nos seguintes arquivos:

- `package.json` - Contém a configuração do Jest
- `src/test/*.test.ts` - Arquivos de teste para os componentes do backend

### Execução Local dos Testes

Para executar os testes localmente:

```bash
# Executar todos os testes uma vez
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage
```

## Processo de Build

O processo de build compila o código TypeScript para JavaScript otimizado:

- **Desenvolvimento**: `npm run build:dev`
- **Teste**: `npm run build:test`
- **Produção**: `npm run build:prod`

Cada ambiente usa seu próprio conjunto de variáveis de ambiente definidas nos arquivos `.env.development`, `.env.test` e `.env.production`.

## Processo de Migração de Banco de Dados

O pipeline CI/CD inclui etapas para testar e aplicar migrações de banco de dados:

### Estrutura dos Arquivos de Banco de Dados

A estrutura de diretórios do banco de dados é organizada como segue:

```
marmitas-backend/
  └── supabase/
      ├── migrations/
      │   ├── 001_initial_schema.sql
      │   ├── 002_feature_x.sql
      │   └── ...
      └── seeds/
          ├── 001_test_data.sql
          └── ...
```

- **migrations/** - Contém arquivos SQL para evolução do esquema do banco de dados
- **seeds/** - Contém dados iniciais para popular o banco de dados

### Scripts de Migração

Os seguintes scripts estão disponíveis para gerenciar migrações de banco de dados:

- `db:setup:test` - Configura o banco de dados de teste (executa em `scripts/db-setup.js`)
- `db:migration:test` - Testa as migrações em um ambiente isolado (executa em `scripts/test-migrations.js`)
- `db:migrate` - Aplica migrações no ambiente atual (executa em `scripts/run-migrations.js`)

### Processo de Teste de Migrações

1. O pipeline executa `npm run db:setup:test` para inicializar o banco de dados de teste
2. Em seguida, executa `npm run db:migration:test` para testar todas as migrações
3. As migrações são analisadas em um ambiente isolado para verificar se são válidas
4. Se alguma migração falhar, o pipeline irá parar com um erro

### Rastreamento de Migrações

- O sistema mantém uma tabela `schema_migrations` para rastrear quais migrações já foram aplicadas
- Cada migração é identificada pelo nome do arquivo
- Apenas migrações não aplicadas são executadas durante o processo de migração

### Adicionar Novas Migrações

Para adicionar uma nova migração:

1. Crie um novo arquivo SQL em `supabase/migrations/`, seguindo a convenção de nomenclatura `NNN_nome_descritivo.sql`
2. Escreva as instruções SQL necessárias para a migração
3. Inclua tanto as instruções para aplicar a migração quanto para revertê-la (quando aplicável)

### Dados de Teste (Seeds)

Os arquivos em `supabase/seeds/` contêm dados iniciais para popular o banco de dados:

- São executados automaticamente durante o `db:setup:test`
- Podem ser usados para configurar dados necessários para testes
- Seguem a convenção de nomenclatura `NNN_descrição.sql`

## Processo de Implantação

O processo de implantação é automatizado pelo pipeline CI/CD:

1. Os artefatos de build são armazenados como artefatos do GitHub Actions
2. Os artefatos são baixados no job de implantação
3. As migrações de banco de dados são executadas (quando aplicável)
4. A implantação é realizada no ambiente apropriado com base na branch (develop = desenvolvimento, main = produção)

### Implantação Manual

Se necessário, a implantação manual pode ser realizada usando os seguintes comandos:

```bash
# Build para o ambiente desejado
npm run build:dev  # ou build:test ou build:prod

# Executar migrações de banco de dados
npm run db:migrate

# Iniciar a aplicação
npm run start:dev  # ou start:test ou start:prod
```

## Solução de Problemas

Se o pipeline falhar, verifique:

1. **Falhas de Lint** - Verifique os problemas de estilo de código usando `npm run lint`
2. **Falhas de Teste** - Execute os testes localmente com `npm test` para ver os erros detalhados
3. **Falhas de Migração** - Execute `npm run db:migration:test` para verificar problemas nas migrações
   - Verifique a sintaxe SQL em seus arquivos de migração
   - Confirme se as dependências entre tabelas estão corretas
4. **Falhas de Build** - Execute o build localmente para verificar erros de compilação
5. **Falhas de Implantação** - Verifique as credenciais e permissões do ambiente de implantação 