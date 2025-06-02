-- Criar tabela para tracking de visualizações de página
CREATE TABLE IF NOT EXISTS page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    page_path TEXT NOT NULL,
    page_title TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    viewport_width INTEGER,
    viewport_height INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para eventos personalizados
CREATE TABLE IF NOT EXISTS custom_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    page_path TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para sessões de usuário (analytics)
CREATE TABLE IF NOT EXISTS analytics_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    device_type TEXT, -- mobile, desktop, tablet
    browser TEXT,
    os TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    ip_address INET,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    pages_visited INTEGER DEFAULT 0,
    events_count INTEGER DEFAULT 0,
    is_bounce BOOLEAN DEFAULT false,
    referrer_domain TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela para métricas de produto (analytics de conversão)
CREATE TABLE IF NOT EXISTS product_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    cart_additions INTEGER DEFAULT 0,
    purchases INTEGER DEFAULT 0,
    revenue DECIMAL(10,2) DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0,
    avg_time_on_page INTEGER DEFAULT 0, -- em segundos
    bounce_rate DECIMAL(5,4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, date)
);

-- Criar tabela para funil de conversão
CREATE TABLE IF NOT EXISTS conversion_funnel (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    step_name TEXT NOT NULL, -- 'view_product', 'add_to_cart', 'checkout', 'purchase'
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    additional_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session_id ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_timestamp ON page_views(timestamp);

CREATE INDEX IF NOT EXISTS idx_custom_events_name ON custom_events(event_name);
CREATE INDEX IF NOT EXISTS idx_custom_events_user_id ON custom_events(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_events_session_id ON custom_events(session_id);
CREATE INDEX IF NOT EXISTS idx_custom_events_timestamp ON custom_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_analytics_sessions_user_id ON analytics_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_sessions_started_at ON analytics_sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_product_analytics_product_id ON product_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_product_analytics_date ON product_analytics(date);

CREATE INDEX IF NOT EXISTS idx_conversion_funnel_session_id ON conversion_funnel(session_id);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_step_name ON conversion_funnel(step_name);
CREATE INDEX IF NOT EXISTS idx_conversion_funnel_timestamp ON conversion_funnel(timestamp);

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para product_analytics
DROP TRIGGER IF EXISTS update_product_analytics_updated_at ON product_analytics;
CREATE TRIGGER update_product_analytics_updated_at
    BEFORE UPDATE ON product_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS nas tabelas
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_funnel ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para administradores
CREATE POLICY "Admins can access all analytics data" ON page_views
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can access all custom events" ON custom_events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can access all analytics sessions" ON analytics_sessions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can access all product analytics" ON product_analytics
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can access all conversion funnel" ON conversion_funnel
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Políticas para usuários normais (apenas seus próprios dados)
CREATE POLICY "Users can insert their own page views" ON page_views
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own custom events" ON custom_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own analytics sessions" ON analytics_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own conversion funnel data" ON conversion_funnel
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Comentários para documentação
COMMENT ON TABLE page_views IS 'Tracking de visualizações de páginas com dados de sessão';
COMMENT ON TABLE custom_events IS 'Eventos personalizados como cliques, scroll depth, etc';
COMMENT ON TABLE analytics_sessions IS 'Sessões de usuário com metadados para analytics';
COMMENT ON TABLE product_analytics IS 'Métricas agregadas de produtos para analytics de conversão';
COMMENT ON TABLE conversion_funnel IS 'Dados do funil de conversão por sessão e produto';

-- Função para agregar dados de produto diariamente
CREATE OR REPLACE FUNCTION aggregate_product_analytics()
RETURNS VOID AS $$
DECLARE
    target_date DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
    -- Inserir ou atualizar métricas de produto para o dia anterior
    INSERT INTO product_analytics (product_id, date, views, unique_views, cart_additions, purchases, revenue)
    SELECT 
        p.id as product_id,
        target_date as date,
        COALESCE(pv.views, 0) as views,
        COALESCE(pv.unique_views, 0) as unique_views,
        COALESCE(ce.cart_additions, 0) as cart_additions,
        COALESCE(o.purchases, 0) as purchases,
        COALESCE(o.revenue, 0) as revenue
    FROM products p
    LEFT JOIN (
        -- Contagem de visualizações de produto
        SELECT 
            CAST(SPLIT_PART(page_path, '/', 3) AS INTEGER) as product_id,
            COUNT(*) as views,
            COUNT(DISTINCT session_id) as unique_views
        FROM page_views 
        WHERE page_path LIKE '/produto/%'
        AND DATE(timestamp) = target_date
        GROUP BY SPLIT_PART(page_path, '/', 3)
    ) pv ON p.id = pv.product_id
    LEFT JOIN (
        -- Contagem de adições ao carrinho
        SELECT 
            CAST(event_data->>'product_id' AS INTEGER) as product_id,
            COUNT(*) as cart_additions
        FROM custom_events 
        WHERE event_name = 'add_to_cart'
        AND DATE(timestamp) = target_date
        GROUP BY event_data->>'product_id'
    ) ce ON p.id = ce.product_id
    LEFT JOIN (
        -- Contagem de compras e receita
        SELECT 
            oi.product_id,
            COUNT(DISTINCT o.id) as purchases,
            SUM(oi.quantity * oi.price) as revenue
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        WHERE DATE(o.created_at) = target_date
        AND o.status = 'completed'
        GROUP BY oi.product_id
    ) o ON p.id = o.product_id
    ON CONFLICT (product_id, date) 
    DO UPDATE SET
        views = EXCLUDED.views,
        unique_views = EXCLUDED.unique_views,
        cart_additions = EXCLUDED.cart_additions,
        purchases = EXCLUDED.purchases,
        revenue = EXCLUDED.revenue,
        conversion_rate = CASE 
            WHEN EXCLUDED.views > 0 
            THEN EXCLUDED.purchases::DECIMAL / EXCLUDED.views 
            ELSE 0 
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql; 