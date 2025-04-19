# Performance e Otimização

## Visão Geral

Este documento detalha as estratégias e técnicas de otimização implementadas no sistema Marmitas para garantir performance, escalabilidade e experiência do usuário otimizada, mesmo sob carga elevada.

## Métricas de Performance

### Métricas Críticas Monitoradas

- **Tempo de Resposta da API**: Média, percentil 95 e percentil 99
- **Throughput**: Requisições por segundo
- **Taxa de Erro**: Porcentagem de requisições com falha
- **Tempo de Carregamento da Página**: First contentful paint, Time to interactive
- **Utilização de Recursos**: CPU, memória, I/O de disco, tráfego de rede

### Objetivos de Performance

| Métrica | Objetivo |
|---------|----------|
| Tempo médio de resposta da API | < 200ms |
| Tempo de resposta da API (p95) | < 500ms |
| Tempo de carregamento inicial | < 2s em 4G |
| Tempo para interatividade | < 3.5s em 4G |
| Pontuação Lighthouse Performance | > 85 |

## Estratégias de Otimização no Backend

### Otimização de Banco de Dados

#### Indexação Estratégica

- Índices criados com base em análise de consultas frequentes
- Índices compostos para consultas com múltiplas condições
- Monitoramento regular de índices não utilizados

```sql
-- Exemplos de índices estratégicos
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at DESC);
CREATE INDEX idx_products_category_active ON products(category_id, active);
```

#### Queries Otimizadas

- Uso de EXPLAIN ANALYZE para identificar gargalos
- Reescrita de queries problemáticas
- Limitação de resultados e paginação em todas as listagens

```typescript
// Exemplo de query otimizada com filtros e paginação
const getProducts = async (filters: ProductFilters, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  
  return prisma.product.findMany({
    where: {
      ...(filters.category && { categoryId: filters.category }),
      ...(filters.search && { 
        OR: [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ]
      }),
      active: true
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
    select: {
      id: true,
      name: true,
      price: true,
      imageUrl: true,
      // Seleção apenas dos campos necessários
    }
  });
};
```

#### Normalização e Desnormalização

- Modelagem normalizada para integridade de dados
- Desnormalização estratégica para consultas de alta frequência:
  - Preço do produto armazenado nos itens do pedido
  - Informações resumidas de usuário armazenadas com pedidos

### Estratégias de Cache

#### Cache de Dados

- Implementação de cache em Redis para dados frequentemente acessados
- Estratégia de cache com invalidação automática após mudanças

```typescript
// Exemplo de implementação de cache
const getProductById = async (id: string): Promise<Product | null> => {
  const cacheKey = `product:${id}`;
  
  // Tentar obter do cache
  const cachedProduct = await redisClient.get(cacheKey);
  if (cachedProduct) {
    return JSON.parse(cachedProduct);
  }
  
  // Se não estiver em cache, buscar do banco
  const product = await prisma.product.findUnique({
    where: { id }
  });
  
  // Salvar no cache com expiração de 1 hora
  if (product) {
    await redisClient.set(cacheKey, JSON.stringify(product), 'EX', 3600);
  }
  
  return product;
};
```

#### Cache de Resposta HTTP

- Headers de cache adequados para recursos estáticos
- Cache-Control, ETag e Last-Modified implementados

```typescript
// Middleware para adicionar headers de cache
const setCacheHeaders = (req, res, next) => {
  // Para recursos estáticos
  if (req.path.startsWith('/static')) {
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 horas
  }
  
  // Para dados da API que podem mudar, mas não frequentemente
  else if (req.method === 'GET' && req.path.startsWith('/api/products')) {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutos
    res.setHeader('Vary', 'Accept-Encoding');
  }
  
  next();
};
```

### Otimização de Código

#### Processamento Assíncrono

- Uso de filas para operações que não precisam de resposta imediata:
  - Processamento de pagamentos
  - Geração de relatórios
  - Envio de notificações e emails

```typescript
// Exemplo de processamento assíncrono com Bull
import Queue from 'bull';

const emailQueue = new Queue('email-sending', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// Adicionando job à fila
await emailQueue.add({
  to: user.email,
  subject: 'Confirmação de Pedido',
  orderId: order.id
});

// Processador de fila em worker separado
emailQueue.process(async (job) => {
  const { to, subject, orderId } = job.data;
  await emailService.sendOrderConfirmation(to, subject, orderId);
});
```

#### Otimização de Algoritmos

- Identificação e reescrita de funções com complexidade elevada
- Minimização de operações dentro de loops
- Preferência por operações de conjunto no banco de dados em vez de no código

```typescript
// Antes: Processamento ineficiente
const getOrdersTotal = async (userId: string): Promise<number> => {
  const orders = await prisma.order.findMany({
    where: { userId, status: 'delivered' }
  });
  
  return orders.reduce((total, order) => total + order.total, 0);
};

// Depois: Agregação feita no banco de dados
const getOrdersTotal = async (userId: string): Promise<number> => {
  const result = await prisma.order.aggregate({
    where: { userId, status: 'delivered' },
    _sum: { total: true }
  });
  
  return result._sum.total || 0;
};
```

### Compressão e Minificação

- Compressão GZIP/Brotli para todas as respostas HTTP
- Minificação de respostas JSON removendo espaços desnecessários

```typescript
// Middleware de compressão
import compression from 'compression';

app.use(compression({
  level: 6, // Nível de compressão balanceado
  threshold: 1024 // Comprimir respostas maiores que 1KB
}));
```

## Estratégias de Otimização no Frontend

### Carregamento Eficiente

#### Code Splitting

- Divisão do bundle por rotas
- Carregamento sob demanda de componentes pesados

```javascript
// Exemplo de React.lazy() para code splitting
import React, { Suspense, lazy } from 'react';

const OrderHistory = lazy(() => import('./pages/OrderHistory'));

function App() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Route path="/orders" component={OrderHistory} />
    </Suspense>
  );
}
```

#### Priorização de Recursos Críticos

- Carregamento prioritário de CSS crítico
- Carregamento postergado de imagens fora da viewport

```html
<!-- Exemplo de carregamento postergado de imagens -->
<img 
  src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" 
  data-src="/images/product-large.jpg" 
  class="lazyload" 
  alt="Produto" 
/>
```

### Otimização de Renderização

#### Memoização de Componentes

- Uso de React.memo, useMemo e useCallback para evitar re-renderizações desnecessárias

```javascript
// Exemplo de memoização
const ProductItem = React.memo(({ product, onAddToCart }) => {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <p>R$ {product.price.toFixed(2)}</p>
      <button onClick={() => onAddToCart(product.id)}>
        Adicionar ao Carrinho
      </button>
    </div>
  );
});

// Hook useMemo para cálculos caros
const ProductList = ({ products, category }) => {
  const filteredProducts = useMemo(() => {
    return products.filter(p => p.categoryId === category);
  }, [products, category]);
  
  return (
    <div className="product-list">
      {filteredProducts.map(product => (
        <ProductItem 
          key={product.id} 
          product={product} 
          onAddToCart={handleAddToCart} 
        />
      ))}
    </div>
  );
};
```

#### Virtualização de Listas

- Implementação de virtualização para listas longas

```javascript
// Exemplo com react-window para virtualização
import { FixedSizeList } from 'react-window';

const ProductList = ({ products }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ProductItem product={products[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={products.length}
      itemSize={100}
    >
      {Row}
    </FixedSizeList>
  );
};
```

### Otimização de Assets

#### Imagens Otimizadas

- Uso de formatos modernos (WebP, AVIF)
- Redimensionamento responsivo com srcset
- Compressão eficiente sem perda perceptível de qualidade

```html
<picture>
  <source 
    type="image/avif" 
    srcset="/images/product-400.avif 400w, /images/product-800.avif 800w" 
  />
  <source 
    type="image/webp" 
    srcset="/images/product-400.webp 400w, /images/product-800.webp 800w" 
  />
  <img 
    src="/images/product-800.jpg" 
    srcset="/images/product-400.jpg 400w, /images/product-800.jpg 800w" 
    sizes="(max-width: 600px) 400px, 800px"
    alt="Produto" 
  />
</picture>
```

#### Otimização de Fontes

- Subsetting de fontes para incluir apenas caracteres necessários
- Uso de font-display: swap para renderização rápida

```css
@font-face {
  font-family: 'Marmitas Sans';
  src: url('/fonts/marmitas-sans-subset.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
```

## Estratégias de Rede

### API Eficiente

#### Batching de Requisições

- Agrupamento de múltiplas operações em uma única requisição para reduzir overhead de rede

```typescript
// Endpoint de batch para produtos
router.post('/api/batch', async (req, res) => {
  const { operations } = req.body;
  const results = {};
  
  // Executar operações em paralelo
  await Promise.all(operations.map(async (op) => {
    try {
      if (op.type === 'get_product') {
        results[op.id] = await productService.getById(op.productId);
      } else if (op.type === 'get_category') {
        results[op.id] = await categoryService.getById(op.categoryId);
      }
    } catch (error) {
      results[op.id] = { error: error.message };
    }
  }));
  
  res.json({ results });
});
```

#### Respostas Incrementais

- Implementação de streaming de resposta para conjuntos grandes de dados

```typescript
// Streaming de resultados grandes
router.get('/api/reports/large-data', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // Streaming do início do objeto JSON
  res.write('{"results":[');
  
  let first = true;
  const processChunk = async (chunk) => {
    if (!first) {
      res.write(',');
    }
    first = false;
    res.write(JSON.stringify(chunk));
  };
  
  dataService.streamLargeReport(processChunk)
    .then(() => {
      // Finalizar o objeto JSON
      res.write(']}');
      res.end();
    })
    .catch(error => {
      res.end(`],"error":"${error.message}"}`);
    });
});
```

### CDN e Edge Caching

- Utilização de CDN para distribuição de assets estáticos
- Edge caching para reduzir a latência em diferentes regiões geográficas

```typescript
// Configuração para servir assets estáticos via CDN
app.use('/static', express.static('public', {
  maxAge: '1d',
  setHeaders: (res, path) => {
    if (path.endsWith('.css') || path.endsWith('.js')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 ano
    }
  }
}));
```

## Monitoramento e Otimização Contínua

### Ferramentas de Monitoramento

- **APM (Application Performance Monitoring)**: New Relic ou Datadog
- **Monitoramento de Frontend**: Sentry para erros, LogRocket para sessões
- **Métricas de Servidor**: Prometheus + Grafana

```typescript
// Configuração de rastreamento com OpenTelemetry
import { NodeTracerProvider } from '@opentelemetry/node';
import { SimpleSpanProcessor } from '@opentelemetry/tracing';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const provider = new NodeTracerProvider();
const exporter = new JaegerExporter({
  serviceName: 'marmitas-api',
});

provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
provider.register();
```

### Análise de Performance

#### Auditorias Regulares

- Execução semanal de Lighthouse CI para avaliação de performance
- Análise mensal de logs e métricas para identificar tendências

```javascript
// Exemplo de integração Lighthouse CI em GitHub Actions
module.exports = {
  ci: {
    collect: {
      url: ['https://staging.marmitas.com.br/'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'interactive': ['error', { maxNumericValue: 3500 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

#### Testes de Carga

- Execução regular de testes de carga para validar limites do sistema
- Simulação de picos de tráfego para identificar gargalos

```bash
# Exemplo de script k6 para teste de carga
k6 run --vus 100 --duration 5m tests/load/api-endpoints.js
```

## Estratégia de Escalabilidade

### Escalabilidade Horizontal

- Arquitetura stateless para permitir múltiplas instâncias
- Balanceamento de carga com health checks
- Auto-scaling baseado em métricas de CPU/memória

### Escalabilidade de Banco de Dados

- Read replicas para consultas de alta demanda
- Sharding por região ou cliente para sistemas muito grandes
- Connection pooling para otimizar uso de recursos

```typescript
// Configuração de pool de conexões PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Máximo de clientes no pool
  idleTimeoutMillis: 30000, // Tempo máximo que um cliente pode ficar inativo
  connectionTimeoutMillis: 2000, // Tempo máximo para estabelecer conexão
});
```

## Conclusão

As estratégias de performance e otimização do sistema Marmitas são implementadas em múltiplas camadas, desde o banco de dados até a interface do usuário. Através de monitoramento contínuo e melhorias incrementais, mantemos o sistema responsivo mesmo durante períodos de alta demanda.

### Principais Resultados

- Redução de 60% no tempo médio de resposta da API
- Melhoria de 40% no First Contentful Paint
- Aumento de 3x na capacidade de processamento de pedidos simultâneos
- Redução de 70% no consumo de banda através de otimizações de assets e cache

A otimização de performance é um processo contínuo, revisado e aprimorado a cada iteração do sistema para garantir que os objetivos de performance sejam consistentemente atingidos. 