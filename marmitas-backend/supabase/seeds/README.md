# Dados de Teste (Seeds)

Este diretório contém arquivos SQL para inserir dados iniciais no banco de dados da aplicação Marmitas.

## Propósito

Os arquivos de seed têm os seguintes propósitos:

1. Inserir dados necessários para o funcionamento básico da aplicação (ex: categorias padrão)
2. Configurar dados para testes automatizados
3. Fornecer dados de demonstração para ambientes de desenvolvimento

## Estrutura de Nomenclatura

Os arquivos de seed seguem a convenção:

```
NNN_descricao.sql
```

onde:
- `NNN` é um número de sequência com zeros à esquerda (ex: 001, 002)
- `descricao` é uma breve descrição dos dados sendo inseridos

## Como Adicionar Novos Seeds

1. Crie um novo arquivo SQL seguindo a convenção de nomenclatura
2. Escreva instruções SQL para inserir os dados necessários
3. Use cláusulas `ON CONFLICT` para evitar duplicação de dados ao executar o script várias vezes

## Boas Práticas

- Mantenha os IDs consistentes usando UUIDs fixos para facilitar referências entre tabelas
- Use comentários para explicar o propósito dos dados inseridos
- Organize os arquivos por domínio ou funcionalidade
- Considere a ordem de inserção para evitar violações de chave estrangeira

## Exemplo de Seed

```sql
-- Inserir categorias padrão
INSERT INTO categories (id, name, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Pratos Principais', 'Marmitas completas'),
  ('22222222-2222-2222-2222-222222222222', 'Acompanhamentos', 'Complementos para refeição'),
  ('33333333-3333-3333-3333-333333333333', 'Bebidas', 'Bebidas diversas')
ON CONFLICT (id) DO NOTHING;

-- Inserir produtos de exemplo
INSERT INTO products (id, name, description, price, category_id, available)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Marmita Frango', 'Arroz, feijão e frango', 15.90, '11111111-1111-1111-1111-111111111111', true)
ON CONFLICT (id) DO NOTHING;
```

## Execução de Seeds

Os seeds são executados automaticamente durante o setup do banco de dados de teste:

```bash
npm run db:setup:test
```

Para executar apenas os seeds em um ambiente específico, você pode modificar o script conforme necessário. 