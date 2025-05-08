-- Adiciona coluna deleted_at para soft delete
ALTER TABLE user_addresses
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Atualiza as policies para considerar apenas registros não deletados
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON user_addresses;
CREATE POLICY "Enable read access for authenticated users" ON user_addresses
    FOR SELECT
    USING (
        auth.uid() = user_id 
        AND deleted_at IS NULL
    );

-- Atualiza o índice para incluir apenas registros ativos
DROP INDEX IF EXISTS idx_user_addresses_user_id;
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id) WHERE deleted_at IS NULL; 