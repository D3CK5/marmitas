# Frontend CI/CD Process Documentation

Este documento descreve o processo de Integração Contínua e Entrega Contínua (CI/CD) para o frontend da aplicação Marmitas.

## Pipeline de CI/CD

O pipeline de CI/CD do frontend é implementado usando GitHub Actions e consiste em várias etapas que são executadas em sequência para garantir a qualidade do código e automatizar o processo de implantação.

### Estrutura do Pipeline

O pipeline está definido no arquivo `.github/workflows/ci-cd.yml` e inclui os seguintes jobs:

1. **Lint** - Verifica a qualidade do código usando ESLint
2. **Test** - Executa testes automatizados usando Vitest
3. **Build** - Compila o código para produção usando Vite
4. **Deploy to Development** - Implanta o código no ambiente de desenvolvimento (quando o código é mergeado na branch `develop`)
5. **Deploy to Production** - Implanta o código no ambiente de produção (quando o código é mergeado na branch `main`)

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

Os testes automatizados são executados usando Vitest e React Testing Library. A configuração de teste está definida nos seguintes arquivos:

- `vite.config.ts` - Contém a configuração do Vitest
- `src/test/setup.ts` - Configuração global para os testes
- `src/components/__tests__/*.test.tsx` - Testes dos componentes

### Execução Local dos Testes

Para executar os testes localmente:

```bash
# Executar todos os testes uma vez
npm test

# Executar testes em modo watch
npm run test:watch
```

## Processo de Build

O processo de build gera os artefatos otimizados para diferentes ambientes:

- **Desenvolvimento**: `npm run build:dev`
- **Teste**: `npm run build:test`
- **Produção**: `npm run build:prod`

Cada ambiente usa seu próprio conjunto de variáveis de ambiente definidas nos arquivos `.env.development`, `.env.test` e `.env.production`.

### Análise de Bundle

Para analisar o tamanho do bundle:

```bash
npm run analyze
```

## Processo de Implantação

O processo de implantação é automatizado pelo pipeline CI/CD:

1. Os artefatos de build são armazenados como artefatos do GitHub Actions
2. Os artefatos são baixados no job de implantação
3. A implantação é realizada no ambiente apropriado com base na branch (develop = desenvolvimento, main = produção)

### Implantação Manual

Se necessário, a implantação manual pode ser realizada usando os seguintes comandos:

```bash
# Build para o ambiente desejado
npm run build:dev  # ou build:test ou build:prod

# A pasta dist contém os arquivos a serem implantados
```

## Solução de Problemas

Se o pipeline falhar, verifique:

1. **Falhas de Lint** - Verifique os problemas de estilo de código usando `npm run lint`
2. **Falhas de Teste** - Execute os testes localmente com `npm test` para ver os erros detalhados
3. **Falhas de Build** - Execute o build localmente para verificar erros de compilação
4. **Falhas de Implantação** - Verifique as credenciais e permissões do ambiente de implantação 