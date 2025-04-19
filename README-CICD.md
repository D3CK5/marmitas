# CI/CD Unificado - Projeto Marmitas

Este documento fornece instruções para configurar e utilizar o pipeline de Integração Contínua e Entrega Contínua (CI/CD) unificado para o projeto Marmitas.

## Visão Geral

O projeto Marmitas utiliza um pipeline CI/CD unificado implementado com GitHub Actions para garantir a qualidade do código e automatizar o processo de implantação. O pipeline coordena os componentes frontend e backend para garantir uma implantação sincronizada.

## Estrutura do Projeto

```
marmitas/
├── .github/
│   └── workflows/
│       └── ci-cd.yml        # Pipeline CI/CD unificado
├── docs/
│   └── cicd-process.md      # Documentação do processo CI/CD unificado
├── scripts/
│   ├── setup-github-secrets.sh        # Script para configurar segredos no GitHub
│   └── check-cicd-prerequisites.js    # Script para verificar pré-requisitos do CI/CD
├── marmitas-backend/       # Código do backend
│   ├── Dockerfile          # Configuração Docker para produção
│   ├── Dockerfile.dev      # Configuração Docker para desenvolvimento
│   └── ...
└── marmitas-frontend/      # Código do frontend
    ├── Dockerfile          # Configuração Docker para produção
    ├── Dockerfile.dev      # Configuração Docker para desenvolvimento
    └── ...
```

## Configuração

### Pré-requisitos

- Conta no GitHub com permissões para o repositório
- Git instalado localmente
- Node.js versão 20 ou superior
- Docker e Docker Compose instalados
- GitHub CLI (para configuração de segredos)

### Verificação dos Pré-requisitos

Para verificar se o ambiente está corretamente configurado para o CI/CD:

```bash
# No diretório raiz do projeto
node scripts/check-cicd-prerequisites.js
```

### Configuração dos Segredos

Os segredos do GitHub são necessários para que o pipeline CI/CD acesse ambientes externos. Use o script de configuração para adicioná-los:

```bash
# No diretório raiz do projeto
./scripts/setup-github-secrets.sh
```

Este script irá guiá-lo no processo de configuração dos seguintes segredos:

- **Ambiente de Teste**:
  - `SUPABASE_TEST_URL` e `SUPABASE_TEST_KEY`

- **Ambiente de Desenvolvimento**:
  - `SUPABASE_DEV_URL` e `SUPABASE_DEV_KEY`
  - `DEV_SSH_KEY`, `DEV_HOST`, e `DEV_USER`

- **Ambiente de Produção**:
  - `SUPABASE_PROD_URL` e `SUPABASE_PROD_KEY`
  - `PROD_SSH_KEY`, `PROD_HOST`, e `PROD_USER`

## Fluxo de Trabalho

### Desenvolvimento Local

1. Desenvolva no branch de feature/bug
2. Execute testes localmente
3. Crie um Pull Request para o branch `develop`

#### Utilizando Docker para Desenvolvimento

Para facilitar o desenvolvimento local, você pode usar o Docker Compose:

```bash
# Iniciar ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml up -d

# Parar ambiente de desenvolvimento
docker-compose -f docker-compose.dev.yml down
```

Isso iniciará o frontend na porta 3000 e o backend na porta 3001, com hot-reloading ativado para ambos.

### Integração Contínua

Ao criar um Pull Request ou fazer push para os branches `develop` ou `main`:

1. O pipeline CI/CD é acionado automaticamente
2. O código é lintado e testado
3. As migrações do banco de dados são testadas
4. O build é gerado

### Entrega Contínua

Quando o código é mergeado nos branches principais:

- **Branch `develop`**: O código é implantado automaticamente no ambiente de desenvolvimento
- **Branch `main`**: O código é implantado automaticamente no ambiente de produção

## Containerização

O projeto utiliza Docker para containerização dos componentes:

### Ambientes de Produção

```bash
# Construir e iniciar os contêineres de produção
docker-compose up -d --build

# Parar os contêineres
docker-compose down
```

### Configuração de Contêineres

- **Frontend**: Nginx servindo arquivos estáticos do React/Vite
- **Backend**: Node.js com Express
- **Ambos**: Incluem verificações de saúde e configuração de variáveis de ambiente

## Monitoramento

Você pode monitorar as execuções do pipeline na aba "Actions" do GitHub:

```
https://github.com/[dono]/[repo]/actions
```

## Solução de Problemas

Se o pipeline falhar, verifique:

1. **Logs do GitHub Actions**: Examine os logs de execução no GitHub para identificar o erro específico
2. **Pré-requisitos**: Execute o script de verificação de pré-requisitos
3. **Segredos**: Verifique se todos os segredos necessários estão configurados
4. **Configurações do Ambiente**: Verifique se os ambientes estão configurados corretamente
5. **Problemas de Docker**: Verifique os logs dos contêineres usando `docker logs`

### Problemas Comuns

- **Falha na migração do banco de dados**: Verifique as credenciais do Supabase e o formato dos arquivos SQL
- **Falha no build**: Verifique por erros de dependências ou problemas de sintaxe no código
- **Falha na implantação**: Verifique as credenciais SSH e permissões do servidor

## Documentação Adicional

Para mais detalhes, consulte:

- [Documentação do CI/CD Unificado](docs/cicd-process.md)
- [Documentação do CI/CD do Backend](marmitas-backend/docs/cicd-process.md)
- [Documentação do CI/CD do Frontend](marmitas-frontend/docs/cicd-process.md)
- [Documentação de Containerização](docs/containerization.md)

## Manutenção

### Atualizar Workflow

Se precisar atualizar o workflow do CI/CD:

1. Edite o arquivo `.github/workflows/ci-cd.yml`
2. Teste as alterações usando validadores de YAML
3. Faça commit e push para ver as alterações em ação

### Gerenciar Ambientes de Implantação

Os ambientes de implantação podem ser gerenciados na seção "Settings > Environments" do repositório GitHub. Você pode configurar:

- Proteções de branch
- Revisores necessários
- Tempo de espera antes da implantação

### Remover Workflows Duplicados

Para evitar execuções duplicadas, mantenha apenas o workflow unificado:

```bash
# Se necessário remover workflows individuais
git rm marmitas-backend/.github/workflows/ci-cd.yml
git rm marmitas-frontend/.github/workflows/ci-cd.yml
git commit -m "Remover workflows individuais em favor do workflow unificado"
git push
```

## Contribuições

Ao contribuir com o projeto, respeite o fluxo de CI/CD:

1. Não ignore falhas nos testes
2. Não faça merge de PRs que falham na verificação de CI
3. Teste migrações de banco de dados localmente antes de enviar
4. Garanta que as mudanças de infraestrutura sejam testadas através de contêineres Docker 