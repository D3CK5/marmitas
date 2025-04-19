-- RLS (Row Level Security) policies para restrição de acesso direto ao banco de dados
-- Este arquivo deve ser executado após o schema.sql para aplicar as políticas de segurança

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE changeable_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_changeable_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE temp_product_changeable_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verifications ENABLE ROW LEVEL SECURITY;

-- Criar role específica para acesso via API backend
CREATE ROLE api_service WITH NOLOGIN;

-- Conceder privilégios à role api_service
GRANT ALL ON ALL TABLES IN SCHEMA public TO api_service;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO api_service;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO api_service;
GRANT ALL ON ALL PROCEDURES IN SCHEMA public TO api_service;

-- Criar usuário para o serviço backend com privilégios elevados
CREATE USER backend_service WITH PASSWORD 'backend_service_password';
GRANT api_service TO backend_service;

-- Verificar que o backend_service é membro do role api_service
GRANT USAGE ON SCHEMA public TO backend_service;

-- Remover todas as políticas existentes para substituí-las por novas
DROP POLICY IF EXISTS "Usuários autenticados podem ver produtos" ON products;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pedidos" ON orders;
DROP POLICY IF EXISTS "Admins podem ver todos os pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários podem criar pedidos" ON orders;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios itens de pedido" ON order_items;
DROP POLICY IF EXISTS "Áreas de entrega visíveis para todos" ON delivery_areas;
DROP POLICY IF EXISTS "Apenas admins podem modificar áreas de entrega" ON delivery_areas;
DROP POLICY IF EXISTS "Users can view their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON user_addresses;
DROP POLICY IF EXISTS "Admins podem gerenciar endereços de usuários" ON user_addresses;
DROP POLICY IF EXISTS "Permitir autenticação pública" ON auth.users;

-- Políticas RLS para profiles
CREATE POLICY "Service API pode acessar todos os perfis"
ON profiles FOR ALL
TO api_service
USING (true);

CREATE POLICY "Usuários só podem ver seu próprio perfil"
ON profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Políticas RLS para products
CREATE POLICY "Apenas leitura para usuários autenticados"
ON products FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service API pode gerenciar produtos"
ON products FOR ALL
TO api_service
USING (true);

-- Políticas RLS para orders
CREATE POLICY "Usuários só podem ver suas próprias orders"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service API pode acessar todas as orders"
ON orders FOR ALL
TO api_service
USING (true);

-- Políticas RLS para order_items
CREATE POLICY "Usuários só podem ver seus próprios itens de pedido"
ON order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = order_items.order_id
        AND orders.user_id = auth.uid()
    )
);

CREATE POLICY "Service API pode acessar todos os itens de pedido"
ON order_items FOR ALL
TO api_service
USING (true);

-- Políticas RLS para categories
CREATE POLICY "Acesso de leitura para categorias"
ON categories FOR SELECT
TO authenticated, anon
USING (deleted_at IS NULL);

CREATE POLICY "Service API pode gerenciar categorias"
ON categories FOR ALL
TO api_service
USING (true);

-- Políticas RLS para foods
CREATE POLICY "Acesso de leitura para foods"
ON foods FOR SELECT
TO authenticated, anon
USING (active = true AND deleted_at IS NULL);

CREATE POLICY "Service API pode gerenciar foods"
ON foods FOR ALL
TO api_service
USING (true);

-- Políticas RLS para changeable_foods
CREATE POLICY "Acesso de leitura para changeable_foods"
ON changeable_foods FOR SELECT
TO authenticated, anon
USING (deleted_at IS NULL);

CREATE POLICY "Service API pode gerenciar changeable_foods"
ON changeable_foods FOR ALL
TO api_service
USING (true);

-- Políticas RLS para product_changeable_foods
CREATE POLICY "Acesso de leitura para product_changeable_foods"
ON product_changeable_foods FOR SELECT
TO authenticated, anon
USING (true);

CREATE POLICY "Service API pode gerenciar product_changeable_foods"
ON product_changeable_foods FOR ALL
TO api_service
USING (true);

-- Políticas RLS para delivery_areas
CREATE POLICY "Acesso de leitura para delivery_areas"
ON delivery_areas FOR SELECT
TO authenticated, anon
USING (is_active = true);

CREATE POLICY "Service API pode gerenciar delivery_areas"
ON delivery_areas FOR ALL
TO api_service
USING (true);

-- Políticas RLS para user_addresses
CREATE POLICY "Usuários só podem ver seus próprios endereços"
ON user_addresses FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service API pode gerenciar endereços"
ON user_addresses FOR ALL
TO api_service
USING (true);

-- Políticas RLS para user_verifications
CREATE POLICY "Usuários só podem ver suas próprias verificações"
ON user_verifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Service API pode gerenciar verificações"
ON user_verifications FOR ALL
TO api_service
USING (true);

-- Políticas RLS para admin_users
CREATE POLICY "Service API pode gerenciar admin_users"
ON admin_users FOR ALL
TO api_service
USING (true);

-- Negar acesso a todas as tabelas para usuários anônimos, exceto onde explicitamente permitido
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TYPES FROM anon; 