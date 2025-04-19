# Documentação do Sistema Marmitas

## Visão Geral

Bem-vindo à documentação do sistema Marmitas. Esta documentação é destinada a desenvolvedores, administradores e outros stakeholders que precisam entender a arquitetura, funcionamento e manutenção do sistema.

## Índice de Documentos

### Arquitetura e Design

| Documento | Descrição |
|-----------|-----------|
| [Arquitetura](./architecture.md) | Visão geral da arquitetura do sistema, padrões de design e decisões técnicas |
| [Esquema do Banco de Dados](./database-schema.md) | Detalhamento completo do modelo de dados, relações e considerações de design |
| [Segurança](./security.md) | Estratégias e implementações de segurança, autenticação e autorização |
| [Performance e Otimização](./performance.md) | Técnicas de otimização, estratégias de cache e escalabilidade |
| [Testes e Garantia de Qualidade](./testing.md) | Abordagem de testes, ferramentas e processos de qualidade |

### Frontend

Os documentos específicos do frontend estão disponíveis em `marmitas-frontend/src/docs`:

| Documento | Descrição |
|-----------|-----------|
| [Arquitetura Frontend-Backend](../../../marmitas-frontend/src/docs/architecture.md) | Separação entre frontend e backend e padrões de comunicação |
| [Fluxo de API](../../../marmitas-frontend/src/docs/api-flow.md) | Detalhamento das APIs, formatos de requisição/resposta e implementação no cliente |

## Como Usar Esta Documentação

A documentação é organizada por tópicos, permitindo que você encontre rapidamente as informações necessárias:

- **Para desenvolvedores iniciantes**: Comece com o documento de Arquitetura para entender a visão geral do sistema
- **Para desenvolvedores backend**: Consulte os documentos de Esquema do Banco de Dados e Segurança
- **Para desenvolvedores frontend**: Consulte os documentos na pasta frontend sobre Arquitetura Frontend-Backend e Fluxo de API
- **Para DevOps**: Consulte os documentos de Performance e Otimização para entender as estratégias de escalabilidade
- **Para QA**: Consulte o documento de Testes e Garantia de Qualidade

## Convenções da Documentação

Em toda a documentação, seguimos estas convenções:

- Exemplos de código são exibidos em blocos de código com sintaxe destacada
- Comandos de terminal são precedidos por `$` 
- Notas importantes são destacadas como **Nota:** ou **Importante:**
- Referências a arquivos ou diretórios do projeto são formatadas como `path/to/file.ext`

## Contribuindo para a Documentação

A documentação é um projeto vivo e deve ser mantida atualizada. Ao fazer alterações significativas no código:

1. Identifique quais documentos precisam ser atualizados
2. Faça as alterações necessárias, mantendo o mesmo estilo e formato
3. Submeta um pull request com suas alterações
4. Mencione na descrição do PR quais documentos foram atualizados e por quê

## Histórico de Versões

| Versão | Data | Descrição das Alterações |
|--------|------|--------------------------|
| 1.0 | 2023-08-01 | Documentação inicial |

---

Para dúvidas ou sugestões sobre a documentação, entre em contato com a equipe de desenvolvimento. 