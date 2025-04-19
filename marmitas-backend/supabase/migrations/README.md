# Migrações de Banco de Dados

Este diretório contém os scripts de migração para o esquema do banco de dados da aplicação Marmitas.

## Estrutura de Nomenclatura

Os arquivos de migração seguem a convenção:

```
NNN_nome_descritivo.sql
```

onde:
- `NNN` é um número de sequência com zeros à esquerda (ex: 001, 002)
- `nome_descritivo` é uma breve descrição da migração usando snake_case

## Como Adicionar uma Nova Migração

1. Crie um novo arquivo SQL seguindo a convenção de nomenclatura
2. O número da migração deve ser maior que o último arquivo existente
3. Inclua instruções SQL para criar ou modificar estruturas do banco de dados
4. Quando aplicável, inclua comentários ou instruções para reverter a migração

## Boas Práticas

- Cada migração deve ser focada em uma única alteração ou conjunto relacionado de alterações
- Sempre verifique se a migração pode ser executada sem erro antes de submeter
- Use transações quando necessário para garantir atomicidade
- Comentários explicando partes complexas são encorajados
- Evite fazer alterações em migrações já existentes/aplicadas; crie uma nova migração corretiva

## Exemplo de Migração

```sql
-- Criação da tabela de usuários
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar índice para melhorar performance de consultas por email
CREATE INDEX idx_users_email ON users(email);
```

## Testes de Migração

Antes de submeter suas migrações, teste-as localmente:

```bash
npm run db:migration:test
```

Este comando irá validar se suas migrações podem ser aplicadas com sucesso em um ambiente de teste. 