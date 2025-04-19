# Esquema do Banco de Dados

## Visão Geral

Este documento descreve o esquema do banco de dados para o sistema Marmitas, detalhando as tabelas, relacionamentos, índices e considerações de design.

O sistema utiliza PostgreSQL como banco de dados relacional, hospedado no Supabase para facilitar o gerenciamento e integração com a autenticação.

## Diagrama ER

```
+-------------+       +---------------+       +-------------+
|   Users     |       |   Products    |       | Categories  |
+-------------+       +---------------+       +-------------+
| id          |       | id            |       | id          |
| email       |       | name          |       | name        |
| password    |       | description   |       | description |
| name        |       | price         |       | image_url   |
| phone       |       | image_url     |<----->| created_at  |
| address     |       | category_id   |       | updated_at  |
| role        |       | active        |       +-------------+
| created_at  |       | created_at    |
| updated_at  |       | updated_at    |
+------|------+       +-------|-------+
       |                      |
       |                      |
       v                      v
+-------------+       +---------------+       +-------------+
|   Orders    |       | Order_Items   |       |  Payments   |
+-------------+       +---------------+       +-------------+
| id          |       | id            |       | id          |
| user_id     |<----->| order_id      |       | order_id    |
| status      |       | product_id    |       | amount      |
| total       |       | quantity      |       | status      |
| address     |       | unit_price    |       | provider    |
| payment_id  |------>| subtotal      |       | external_id |
| created_at  |       | created_at    |       | created_at  |
| updated_at  |       +---------------+       | updated_at  |
+-------------+                               +-------------+
```

## Estrutura das Tabelas

### Users

Armazena informações dos usuários do sistema, incluindo clientes, administradores e entregadores.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address JSONB,
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Observações:**
- O campo `address` é armazenado como JSONB para flexibilidade na estrutura de endereços
- O campo `role` pode conter valores como: 'customer', 'admin', 'delivery'
- Senhas são armazenadas com hash e sal usando bcrypt

### Categories

Categorias de produtos (ex: Pratos Principais, Sobremesas, Bebidas).

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_categories_name ON categories(name);
```

### Products

Produtos disponíveis para venda no sistema.

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    category_id UUID REFERENCES categories(id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
```

**Observações:**
- O campo `active` permite desativar temporariamente produtos sem removê-los
- O preço é armazenado com precisão de 2 casas decimais

### Orders

Pedidos realizados pelos usuários.

```sql
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    total DECIMAL(10, 2) NOT NULL,
    address JSONB NOT NULL,
    payment_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

**Observações:**
- O campo `status` pode conter valores como: 'pending', 'paid', 'preparing', 'delivering', 'delivered', 'cancelled'
- O endereço é copiado do usuário no momento do pedido para manter histórico
- A referência `payment_id` será preenchida após o processamento do pagamento

### Order_Items

Itens individuais dentro de um pedido.

```sql
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
```

**Observações:**
- O preço unitário é copiado do produto no momento do pedido para manter histórico
- O subtotal é calculado como `quantity * unit_price`
- Utilizamos `ON DELETE CASCADE` para automaticamente remover itens quando um pedido é excluído

### Payments

Registro de pagamentos associados aos pedidos.

```sql
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    provider VARCHAR(50) NOT NULL,
    external_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external_id ON payments(external_id);
```

**Observações:**
- O campo `status` pode conter valores como: 'pending', 'approved', 'declined', 'refunded'
- O campo `provider` indica o meio de pagamento: 'credit_card', 'pix', 'cash'
- O campo `external_id` armazena o identificador fornecido pelo gateway de pagamento

## Relacionamentos

1. **Users → Orders**: Um usuário pode ter múltiplos pedidos (1:N)
2. **Categories → Products**: Uma categoria pode ter múltiplos produtos (1:N)
3. **Orders → Order_Items**: Um pedido contém múltiplos itens (1:N)
4. **Products → Order_Items**: Um produto pode estar em múltiplos itens de pedido (1:N)
5. **Orders → Payments**: Um pedido tem um pagamento associado (1:1)

## Políticas de Segurança (RLS)

O Supabase permite implementar Row Level Security para controlar o acesso aos dados:

### Users
```sql
-- Admins podem ler todos os usuários
CREATE POLICY "Admins can read all users" ON users
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Usuários só podem ver seus próprios dados
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Usuários só podem atualizar seus próprios dados
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);
```

### Orders
```sql
-- Usuários só podem ver seus próprios pedidos
CREATE POLICY "Users can read their own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- Admins podem ver todos os pedidos
CREATE POLICY "Admins can read all orders" ON orders
    FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');

-- Entregadores podem ver pedidos em entrega
CREATE POLICY "Delivery can read active orders" ON orders
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'delivery' AND 
        status IN ('preparing', 'delivering')
    );
```

## Funções e Triggers

### Atualização do timestamp
```sql
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- Repetir para outras tabelas com campo updated_at
```

### Cálculo automático de total do pedido
```sql
CREATE OR REPLACE FUNCTION calculate_order_total()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar o total do pedido baseado nos itens
    UPDATE orders
    SET total = (
        SELECT SUM(subtotal)
        FROM order_items
        WHERE order_id = NEW.order_id
    )
    WHERE id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_total
AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE PROCEDURE calculate_order_total();
```

## Índices

Além dos índices já mencionados nas definições das tabelas, recomendamos os seguintes índices adicionais para otimizar consultas comuns:

```sql
-- Índice para busca de pedidos recentes
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);

-- Índice para filtrar produtos por categoria e status
CREATE INDEX idx_products_category_active ON products(category_id, active);

-- Índice para relatórios de vendas por período
CREATE INDEX idx_orders_date_status ON orders(created_at, status);
```

## Considerações de Desempenho

1. **Particionamento**: Para tabelas que crescem muito, como `orders` e `order_items`, considere particionamento por data:
   ```sql
   CREATE TABLE orders (
       id UUID,
       user_id UUID,
       -- outros campos
       created_at TIMESTAMP WITH TIME ZONE
   ) PARTITION BY RANGE (created_at);
   
   CREATE TABLE orders_2023 PARTITION OF orders
       FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
   ```

2. **Dados de Histórico**: Para análises históricas, considere mover dados antigos para tabelas de histórico:
   ```sql
   CREATE TABLE orders_history (LIKE orders);
   
   -- Mover pedidos antigos (mais de 6 meses) para a tabela de histórico
   INSERT INTO orders_history
   SELECT * FROM orders
   WHERE created_at < NOW() - INTERVAL '6 months';
   ```

3. **Índices Parciais**: Para consultas frequentes em subconjuntos específicos de dados:
   ```sql
   -- Índice apenas para pedidos ativos (que são consultados com mais frequência)
   CREATE INDEX idx_active_orders ON orders(id, user_id)
   WHERE status NOT IN ('delivered', 'cancelled');
   ```

## Integridade Referencial

Todas as chaves estrangeiras têm restrições de integridade referencial:

- `ON DELETE RESTRICT` (padrão): Impede a exclusão de registros referenciados
- `ON DELETE CASCADE`: Usado em `order_items` e `payments` para exclusão automática quando o pedido é removido

## Estratégia de Backup

1. **Backups automáticos diários** configurados no Supabase
2. **Retenção de backups** por 30 dias
3. **Snapshots manuais** antes de grandes migrações ou atualizações

## Evolução do Schema

Para evolução do schema, seguimos estas práticas:

1. **Migrações versionadas** usando Prisma ou ferramentas similares
2. **Alterações compatíveis com versões anteriores**:
   - Adicionar colunas com valores padrão
   - Criar novas tabelas em vez de modificar existentes
   - Uso de soft deletes em vez de exclusão permanente

3. **Script de migração exemplo**:
   ```sql
   -- Migração para adicionar coluna de avaliação em pedidos
   ALTER TABLE orders ADD COLUMN rating SMALLINT;
   ALTER TABLE orders ADD COLUMN rating_comment TEXT;
   
   -- Adicionar índice para consultas de avaliação
   CREATE INDEX idx_orders_rating ON orders(rating);
   ```

## Consultas Comuns

### Produtos mais vendidos
```sql
SELECT 
    p.id, 
    p.name, 
    SUM(oi.quantity) as total_quantity
FROM products p
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'delivered'
AND o.created_at > NOW() - INTERVAL '30 days'
GROUP BY p.id, p.name
ORDER BY total_quantity DESC
LIMIT 10;
```

### Resumo de vendas por período
```sql
SELECT 
    DATE_TRUNC('day', created_at) as date,
    COUNT(*) as order_count,
    SUM(total) as total_revenue
FROM orders
WHERE status = 'delivered'
AND created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;
```

### Pedidos pendentes por usuário
```sql
SELECT 
    u.name as customer_name,
    o.id as order_id,
    o.total,
    o.created_at,
    o.status
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status IN ('pending', 'paid', 'preparing')
ORDER BY o.created_at ASC;
```

## Conclusão

O esquema de banco de dados do sistema Marmitas foi projetado para oferecer:

1. **Flexibilidade**: Estrutura que permite evolução do negócio
2. **Performance**: Índices estratégicos para consultas frequentes
3. **Segurança**: Políticas de acesso granulares com Row Level Security
4. **Integridade**: Relações e restrições que garantem dados consistentes

Esta documentação deve ser mantida atualizada conforme o schema evolui, registrando todas as alterações significativas e suas justificativas.

## Apêndice: Tipos de Dados Customizados

```sql
-- Tipo para status de pedido com validação
CREATE TYPE order_status AS ENUM (
    'pending', 
    'paid', 
    'preparing', 
    'delivering', 
    'delivered', 
    'cancelled'
);

-- Tipo para forma de pagamento
CREATE TYPE payment_method AS ENUM (
    'credit_card', 
    'debit_card', 
    'pix', 
    'cash'
);

-- Alterar tabelas para usar os tipos customizados
ALTER TABLE orders 
ALTER COLUMN status TYPE order_status 
USING status::order_status;

ALTER TABLE payments 
ALTER COLUMN provider TYPE payment_method 
USING provider::payment_method;
``` 