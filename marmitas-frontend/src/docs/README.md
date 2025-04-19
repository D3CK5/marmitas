# Documentação Frontend do Sistema Marmitas

## Visão Geral

Esta documentação abrange os aspectos específicos do frontend do sistema Marmitas, detalhando a arquitetura, padrões de desenvolvimento, fluxo de comunicação com a API e outros aspectos importantes para desenvolvedores frontend.

## Índice de Documentos Frontend

| Documento | Descrição |
|-----------|-----------|
| [Arquitetura Frontend-Backend](./architecture.md) | Detalhamento da separação entre frontend e backend, responsabilidades de cada camada e padrões de comunicação |
| [Fluxo de API](./api-flow.md) | Documentação completa dos endpoints da API, formatos de requisição/resposta e implementação do cliente API no frontend |

## Documentação Backend Relacionada

Para entender o sistema como um todo, consulte também a documentação backend disponível em `marmitas-backend/docs`:

| Documento | Descrição |
|-----------|-----------|
| [Arquitetura](../../../marmitas-backend/docs/architecture.md) | Visão geral da arquitetura completa do sistema |
| [Segurança](../../../marmitas-backend/docs/security.md) | Estratégias de segurança implementadas |
| [Performance](../../../marmitas-backend/docs/performance.md) | Otimizações de performance, incluindo estratégias de frontend |
| [Banco de Dados](../../../marmitas-backend/docs/database-schema.md) | Esquema do banco de dados e modelo de dados |
| [Testes](../../../marmitas-backend/docs/testing.md) | Estratégias de testes, incluindo testes de frontend |

## Estrutura do Frontend

O frontend do sistema Marmitas segue uma estrutura organizada:

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

## Principais Tecnologias

O frontend do Marmitas é construído com:

- **React**: Biblioteca principal para construção de UI
- **TypeScript**: Superset tipado de JavaScript
- **React Router**: Gerenciamento de navegação
- **Redux Toolkit** ou **Context API**: Gerenciamento de estado
- **Styled Components** ou **Tailwind CSS**: Estilização
- **Axios**: Cliente HTTP para comunicação com API
- **React Query**: Gerenciamento de estado de servidor e cache
- **Formik + Yup**: Validação de formulários
- **Jest + React Testing Library**: Testes

## Diretrizes de Desenvolvimento

### Nomenclatura e Padrões

- **Componentes**: PascalCase (ex: `ProductCard.tsx`)
- **Hooks**: camelCase com prefixo "use" (ex: `useCart.ts`)
- **Utilitários**: camelCase (ex: `formatCurrency.ts`)
- **Estilos**: Sufixo `.styles.ts` para arquivos Styled Components

### Padronização de Código

O projeto utiliza ESLint e Prettier para garantir a consistência do código:

```bash
# Verificar problemas de linting
$ npm run lint

# Corrigir problemas de linting automaticamente
$ npm run lint:fix

# Formatar código com Prettier
$ npm run format
```

### Fluxo de Trabalho

1. **Desenvolvimento de novos componentes**:
   - Criar o componente na pasta apropriada seguindo Atomic Design
   - Adicionar testes unitários
   - Documentar no Storybook (se aplicável)

2. **Desenvolvimento de novas páginas**:
   - Criar o componente de página
   - Configurar rota
   - Conectar com serviços de API
   - Adicionar testes de integração

## Construção e Deploy

### Ambiente de Desenvolvimento

```bash
# Instalar dependências
$ npm install

# Iniciar servidor de desenvolvimento
$ npm run dev
```

### Build para Produção

```bash
# Gerar build otimizado
$ npm run build

# Previsualizar build
$ npm run preview
```

### Ambientes

- **Desenvolvimento**: `http://localhost:3000`
- **Staging**: `https://staging.marmitas.com.br`
- **Produção**: `https://marmitas.com.br`

## Contribuindo para a Documentação

A documentação é um projeto vivo e deve ser mantida atualizada. Ao fazer alterações significativas no código frontend:

1. Identifique quais documentos precisam ser atualizados
2. Faça as alterações necessárias, mantendo o mesmo estilo e formato
3. Submeta um pull request com suas alterações
4. Mencione na descrição do PR quais documentos foram atualizados e por quê

## Histórico de Versões

| Versão | Data | Descrição das Alterações |
|--------|------|--------------------------|
| 1.0 | 2023-08-01 | Documentação inicial |

---

Para dúvidas ou sugestões sobre a documentação frontend, entre em contato com a equipe de desenvolvimento. 