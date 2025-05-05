-- Adicionar coluna deleted_at à tabela orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Criar índice para deleted_at para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS idx_orders_deleted_at ON orders(deleted_at);

-- Atualizar as políticas para considerar deleted_at
DROP POLICY IF EXISTS "Usuários podem ver seus próprios pedidos" ON orders;
CREATE POLICY "Usuários podem ver seus próprios pedidos"
ON orders FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Admins podem ver todos os pedidos" ON orders;
CREATE POLICY "Admins podem ver todos os pedidos"
ON orders FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
); 