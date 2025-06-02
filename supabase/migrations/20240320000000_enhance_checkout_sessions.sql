-- Criar tabela checkout_sessions se não existir
CREATE TABLE IF NOT EXISTS checkout_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL UNIQUE,
    cart_items JSONB NOT NULL DEFAULT '[]',
    total_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    checkout_entered_at TIMESTAMP WITH TIME ZONE NULL,
    address_selected_at TIMESTAMP WITH TIME ZONE NULL,
    payment_method_selected_at TIMESTAMP WITH TIME ZONE NULL,
    abandoned_at TIMESTAMP WITH TIME ZONE NULL,
    completed_at TIMESTAMP WITH TIME ZONE NULL,
    order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar colunas para recovery se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkout_sessions' AND column_name = 'recovered_at') THEN
        ALTER TABLE checkout_sessions ADD COLUMN recovered_at TIMESTAMP WITH TIME ZONE NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checkout_sessions' AND column_name = 'recovery_order_id') THEN
        ALTER TABLE checkout_sessions ADD COLUMN recovery_order_id INTEGER NULL REFERENCES orders(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_session_id ON checkout_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_abandoned_at ON checkout_sessions(abandoned_at) WHERE abandoned_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_recovered_at ON checkout_sessions(recovered_at) WHERE recovered_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_payment_method_selected ON checkout_sessions(payment_method_selected_at) WHERE payment_method_selected_at IS NOT NULL;

-- Criar função de trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_checkout_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS checkout_sessions_updated_at ON checkout_sessions;
CREATE TRIGGER checkout_sessions_updated_at
    BEFORE UPDATE ON checkout_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_checkout_sessions_updated_at();

-- Habilitar RLS na tabela
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- Criar policies para a tabela
DROP POLICY IF EXISTS "Users can manage their own checkout sessions" ON checkout_sessions;
CREATE POLICY "Users can manage their own checkout sessions" ON checkout_sessions
    FOR ALL
    USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE checkout_sessions IS 'Tabela para tracking de sessões de checkout e análise de abandono';
COMMENT ON COLUMN checkout_sessions.recovered_at IS 'Timestamp de quando um checkout abandonado foi recuperado (cliente fez nova compra)';
COMMENT ON COLUMN checkout_sessions.recovery_order_id IS 'ID do pedido que recuperou o checkout abandonado'; 