# Sistema de Integrações e Analytics

Este documento descreve como usar o sistema de integrações implementado na aplicação Marmitas, incluindo Google Analytics, Hotjar, Facebook Pixel e Google Tag Manager.

## 🏗️ Arquitetura

### Componentes Principais

1. **TrackingProvider** - Provider central que gerencia todas as integrações
2. **GoogleAnalyticsProvider** - Provider específico do Google Analytics  
3. **HotjarProvider** - Provider para mapas de calor e gravações
4. **useIntegrations** - Hook para gerenciar configurações no banco

### Fluxo de Funcionamento

```
App.tsx
└── TrackingProvider (carrega configurações do banco)
    ├── GoogleAnalyticsProvider (se GA estiver ativado)
    ├── HotjarProvider (se Hotjar estiver ativado) 
    ├── Facebook Pixel (carregado dinamicamente)
    └── Google Tag Manager (carregado dinamicamente)
```

## ⚙️ Configuração

### 1. Acessar Configurações

1. Faça login como administrador
2. Acesse `/admin/configuracoes`
3. Clique na aba **"Integrações"**

### 2. Google Analytics

- **ID**: Formato `G-XXXXXXXXXX`
- **Como encontrar**: Google Analytics → Admin → Propriedade → Streams de dados
- **Funcionalidades**: 
  - Tracking automático de páginas
  - Eventos de e-commerce
  - Conversões personalizadas

### 3. Hotjar

- **ID**: Apenas números (ex: `1234567`)
- **Como encontrar**: Hotjar → Sites & Organizations → Configurações
- **Funcionalidades**:
  - Mapas de calor
  - Gravações de sessão
  - Pesquisas e feedback

### 4. Facebook Pixel

- **ID**: Formato `1234567890123456`
- **Como encontrar**: Meta Business → Gerenciador de Eventos → Pixels
- **Funcionalidades**:
  - Tracking de conversões
  - Retargeting
  - Lookalike audiences

### 5. Google Tag Manager

- **ID**: Formato `GTM-XXXXXXX`
- **Como encontrar**: Google Tag Manager → Área de trabalho → ID do contêiner
- **Funcionalidades**:
  - Gerenciamento centralizado de tags
  - Eventos personalizados
  - Triggers avançados

## 📊 Como Usar nos Componentes

### Google Analytics

```tsx
import { useGoogleAnalytics, useAnalyticsTracking } from '@/components/GoogleAnalyticsProvider';

function MeuComponente() {
  const { trackEvent, trackPurchase } = useGoogleAnalytics();
  const { trackClick, trackFormSubmit } = useAnalyticsTracking();
  
  const handleClick = () => {
    trackClick('button_name', { additional_data: 'value' });
  };
  
  const handlePurchase = (orderId: string, value: number, items: any[]) => {
    trackPurchase(orderId, value, items);
  };
}
```

### Hotjar

```tsx
import { useHotjar } from '@/components/HotjarProvider';

function MeuComponente() {
  const { identify, trackEvent } = useHotjar();
  
  const handleUserLogin = (userId: string) => {
    identify(userId, { user_type: 'customer' });
  };
  
  const handleImportantAction = () => {
    trackEvent('important_action');
  };
}
```

### Facebook Pixel

```tsx
import { useFacebookPixel } from '@/components/TrackingProvider';

function MeuComponente() {
  const { trackEvent, trackPurchase, trackAddToCart } = useFacebookPixel();
  
  const handleAddToCart = (value: number, productId: string) => {
    trackAddToCart(value, 'BRL', productId);
  };
}
```

### Google Tag Manager

```tsx
import { useGoogleTagManager } from '@/components/TrackingProvider';

function MeuComponente() {
  const { pushEvent, trackPurchase } = useGoogleTagManager();
  
  const handleCustomEvent = () => {
    pushEvent('custom_event', {
      category: 'engagement',
      action: 'click',
      label: 'header_button'
    });
  };
}
```

## 🛠️ Eventos Implementados

### Eventos Automáticos

- **Page Views**: Todas as mudanças de rota
- **User Properties**: Login/logout de usuários
- **Session Tracking**: Duração e páginas por sessão

### Eventos Personalizados

#### E-commerce
- `view_item` - Visualização de produto
- `add_to_cart` - Adicionar ao carrinho  
- `begin_checkout` - Iniciar checkout
- `purchase` - Compra finalizada

#### Engajamento
- `click` - Cliques em botões/links
- `form_submit` - Envio de formulários
- `search` - Buscas realizadas
- `scroll_depth` - Profundidade de scroll

#### Personalizado
- `favorite_click` - Favoritar produto
- `product_view` - Visualizar detalhes
- `newsletter_signup` - Inscrição newsletter

## 🔧 Banco de Dados

### Tabela `integrations_settings`

```sql
CREATE TABLE integrations_settings (
    id UUID PRIMARY KEY,
    google_analytics_id TEXT,
    hotjar_id TEXT, 
    facebook_pixel_id TEXT,
    google_tag_manager_id TEXT,
    is_google_analytics_enabled BOOLEAN DEFAULT false,
    is_hotjar_enabled BOOLEAN DEFAULT false,
    is_facebook_pixel_enabled BOOLEAN DEFAULT false,
    is_google_tag_manager_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Permissões RLS

- **SELECT**: Todos os usuários autenticados
- **UPDATE**: Apenas administradores (`profiles.is_admin = true`)

## 🚀 Exemplo Completo - ProductCard

```tsx
// Exemplo de como o ProductCard.tsx usa todos os providers
export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  
  // Hooks de tracking
  const { trackAddToCart } = useGoogleAnalytics();
  const { trackClick } = useAnalyticsTracking();
  const { trackEvent: trackHotjar } = useHotjar();
  const { trackAddToCart: fbTrackAddToCart } = useFacebookPixel();
  const { pushEvent } = useGoogleTagManager();

  const handleAddToCart = () => {
    // Adicionar ao carrinho
    addItem(product, 1);
    
    // Tracking em todas as plataformas simultaneamente
    trackAddToCart(product.id.toString(), product.title, product.price);
    trackClick('add_to_cart_button', { product_id: product.id });
    trackHotjar('add_to_cart');
    fbTrackAddToCart(product.price, 'BRL', product.id.toString());
    pushEvent('add_to_cart', { item_id: product.id });
  };
}
```

## 🔍 Debug e Monitoramento

### Console Logs

Todos os eventos são logados no console para debug:

```
📊 GA Event: add_to_cart {...}
🔥 Hotjar evento: add_to_cart
📘 FB Pixel Event: AddToCart {...}
🏷️ GTM Event: add_to_cart {...}
```

### Verificação de Carregamento

```
📊 Google Analytics carregado com ID: G-XXXXXXXXXX
🔥 Hotjar carregado com ID: 1234567
📘 Facebook Pixel carregado com ID: 1234567890123456
🏷️ Google Tag Manager carregado com ID: GTM-XXXXXXX
```

### Ferramentas de Debug

1. **Google Analytics**: Real-time reports
2. **Hotjar**: Recordings e heatmaps
3. **Facebook Pixel**: Pixel Helper (extensão Chrome)
4. **GTM**: Preview mode e debug console

## 📈 Métricas Importantes

### KPIs de E-commerce
- Taxa de conversão (`purchase` / `view_item`)
- Valor médio do pedido
- Taxa de abandono do carrinho
- Produtos mais visualizados

### Métricas de Engajamento  
- Tempo na página
- Taxa de cliques em botões
- Scroll depth
- Formulários enviados

### Análise de Usuário
- Sessões por usuário
- Páginas por sessão  
- Taxa de rejeição
- Origem do tráfego

## 🔒 Privacidade e LGPD

- Scripts carregados apenas quando habilitados
- Logs apenas em desenvolvimento  
- Dados anonimizados quando possível
- Consent management (implementar conforme necessário)

---

## 📝 Próximos Passos

1. **Consent Management**: Implementar banner de cookies
2. **Custom Dimensions**: Adicionar segmentações personalizadas
3. **Enhanced E-commerce**: Eventos avançados de produto
4. **A/B Testing**: Integração com ferramentas de teste
5. **Data Studio**: Dashboards personalizados 