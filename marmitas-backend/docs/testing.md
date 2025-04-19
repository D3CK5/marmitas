# Estratégia de Testes e Garantia de Qualidade

## Visão Geral

Este documento descreve a abordagem de testes e garantia de qualidade do sistema Marmitas, detalhando os tipos de testes implementados, ferramentas utilizadas, processos de CI/CD, e melhores práticas adotadas para garantir a qualidade e confiabilidade do software.

## Objetivos de Qualidade

Os principais objetivos da estratégia de testes são:

1. **Confiabilidade**: Garantir funcionamento correto em todos os cenários de uso
2. **Estabilidade**: Minimizar a introdução de regressões
3. **Segurança**: Identificar e corrigir vulnerabilidades
4. **Performance**: Validar que o sistema atende aos requisitos de desempenho
5. **Manutenibilidade**: Garantir código limpo e bem estruturado

## Níveis de Testes

### Testes Unitários

Testes isolados para componentes ou funções individuais.

#### Backend

```typescript
// Exemplo de teste unitário com Jest
import { calculateOrderTotal } from '../src/services/order.service';

describe('Order Service', () => {
  test('calculateOrderTotal soma corretamente os itens', () => {
    const items = [
      { quantity: 2, unitPrice: 15.90 },
      { quantity: 1, unitPrice: 25.50 }
    ];
    
    const result = calculateOrderTotal(items);
    
    // 2 * 15.90 + 1 * 25.50 = 57.30
    expect(result).toBe(57.30);
  });
  
  test('calculateOrderTotal retorna 0 para array vazio', () => {
    expect(calculateOrderTotal([])).toBe(0);
  });
});
```

#### Frontend

```typescript
// Exemplo de teste unitário com React Testing Library
import { render, screen } from '@testing-library/react';
import PriceDisplay from '../src/components/PriceDisplay';

describe('PriceDisplay', () => {
  test('formata o preço corretamente', () => {
    render(<PriceDisplay value={15.90} />);
    expect(screen.getByText('R$ 15,90')).toBeInTheDocument();
  });
  
  test('aplica a classe de desconto quando solicitado', () => {
    render(<PriceDisplay value={15.90} discount={true} />);
    const element = screen.getByText('R$ 15,90');
    expect(element).toHaveClass('discount-price');
  });
});
```

### Testes de Integração

Validam a interação entre múltiplos componentes ou sistemas.

#### API Tests

```typescript
// Exemplo de teste de integração de API com Supertest
import request from 'supertest';
import { app } from '../src/app';
import { setupTestDatabase, cleanupTestDatabase } from './utils/database';

describe('Product API', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  test('GET /api/products retorna lista de produtos', async () => {
    const response = await request(app)
      .get('/api/products')
      .set('Accept', 'application/json');
      
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.products)).toBe(true);
  });
  
  test('GET /api/products/:id retorna 404 para produto inexistente', async () => {
    const response = await request(app)
      .get('/api/products/non-existent-id')
      .set('Accept', 'application/json');
      
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
  });
});
```

#### Database Integration

```typescript
// Exemplo de teste de integração com banco de dados
import { ProductRepository } from '../src/repositories/product.repository';
import { setupTestDatabase, cleanupTestDatabase } from './utils/database';

describe('ProductRepository', () => {
  let repository: ProductRepository;
  
  beforeAll(async () => {
    await setupTestDatabase();
    repository = new ProductRepository();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });
  
  test('findById retorna produto correto', async () => {
    // Inserir produto de teste no banco
    const testProduct = await repository.create({
      name: 'Produto de Teste',
      price: 19.90,
      description: 'Descrição de teste',
      categoryId: 'category-id'
    });
    
    // Testar busca por ID
    const foundProduct = await repository.findById(testProduct.id);
    
    expect(foundProduct).not.toBeNull();
    expect(foundProduct?.name).toBe('Produto de Teste');
    expect(foundProduct?.price).toBe(19.90);
  });
});
```

### Testes End-to-End (E2E)

Validam o sistema completo, simulando interações de usuário real.

```typescript
// Exemplo de teste E2E com Cypress
describe('Fluxo de Compra', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/products*').as('getProducts');
    cy.intercept('POST', '/api/orders').as('createOrder');
    
    // Login e configuração de estado
    cy.login('customer@example.com', 'password123');
  });
  
  it('permite ao usuário adicionar produto ao carrinho e finalizar compra', () => {
    // Navegar para página de produtos
    cy.visit('/products');
    cy.wait('@getProducts');
    
    // Adicionar produto ao carrinho
    cy.contains('.product-card', 'Marmita Fit').within(() => {
      cy.get('button').contains('Adicionar').click();
    });
    
    // Verificar carrinho
    cy.get('.cart-icon').click();
    cy.get('.cart-item').should('have.length', 1);
    cy.contains('.cart-item', 'Marmita Fit');
    
    // Checkout
    cy.get('button').contains('Finalizar Compra').click();
    cy.url().should('include', '/checkout');
    
    // Preencher dados de entrega
    cy.get('input[name="address.street"]').type('Rua Exemplo');
    cy.get('input[name="address.number"]').type('123');
    cy.get('input[name="address.city"]').type('São Paulo');
    cy.get('input[name="address.zipCode"]').type('01234-567');
    
    // Selecionar forma de pagamento
    cy.get('input[name="paymentMethod"][value="credit_card"]').check();
    
    // Finalizar pedido
    cy.get('button').contains('Confirmar Pedido').click();
    cy.wait('@createOrder');
    
    // Verificar confirmação
    cy.url().should('include', '/order-confirmation');
    cy.contains('Pedido realizado com sucesso');
  });
});
```

### Testes de Performance

Validam o comportamento do sistema sob carga.

```javascript
// Exemplo de teste de carga com k6
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 }, // Rampa até 50 usuários em 1 minuto
    { duration: '2m', target: 50 }, // Manter 50 usuários por 2 minutos
    { duration: '1m', target: 0 },  // Reduzir para 0 em 1 minuto
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições abaixo de 500ms
    http_req_failed: ['rate<0.01'],   // Menos de 1% de falhas
  },
};

export default function() {
  // Teste da página principal
  const homeResponse = http.get('https://staging.marmitas.com.br/');
  check(homeResponse, {
    'status é 200': (r) => r.status === 200,
    'tempo de resposta < 200ms': (r) => r.timings.duration < 200,
  });
  
  // Teste da API de produtos
  const productsResponse = http.get('https://staging.marmitas.com.br/api/products');
  check(productsResponse, {
    'status é 200': (r) => r.status === 200,
    'tempo de resposta < 300ms': (r) => r.timings.duration < 300,
    'retorna array de produtos': (r) => JSON.parse(r.body).data.products.length > 0,
  });
  
  sleep(1);
}
```

### Testes de Segurança

Identificam vulnerabilidades no sistema.

```bash
# Exemplo de scan de segurança com OWASP ZAP via linha de comando
docker run -v $(pwd)/reports:/zap/reports -t owasp/zap2docker-stable \
  zap-baseline.py -t https://staging.marmitas.com.br -r security-report.html
```

## Ferramentas de Teste

### Backend

- **Framework de Teste**: Jest
- **Mocks e Spies**: Jest built-in
- **Cobertura de Código**: Istanbul/NYC
- **Testes de API**: Supertest
- **Testes de Banco de Dados**: Testcontainers para PostgreSQL

### Frontend

- **Framework de Teste**: Jest + React Testing Library
- **Component Testing**: Storybook + Chromatic
- **E2E**: Cypress
- **Visual Regression**: Percy

### Performance

- **Load Testing**: k6
- **Monitoramento de Performance**: Lighthouse CI, WebPageTest
- **Análise de Bundle Size**: Webpack Bundle Analyzer

### Segurança

- **Static Analysis**: SonarQube, ESLint com regras de segurança
- **Dependency Scanning**: npm audit, Snyk
- **Penetration Testing**: OWASP ZAP

## Estratégia de Implementação

### Cobertura de Testes

Definimos os seguintes objetivos de cobertura:

- **Testes Unitários**: 80% de cobertura mínima
- **Testes de Integração**: Todos os endpoints de API e fluxos principais
- **Testes E2E**: Fluxos críticos de negócio (registro, login, checkout)

### Ambientes de Teste

| Ambiente | Propósito | Configuração |
|----------|-----------|--------------|
| Local | Desenvolvimento e testes rápidos | Banco de dados em memória ou containers Docker |
| Staging | Testes de integração, E2E | Clone do ambiente de produção com dados fictícios |
| Produção | Testes de smoke após deploy | Configuração idêntica à produção |

### Pirâmide de Testes

Adotamos a abordagem da pirâmide de testes:

```
      /\
     /  \
    /E2E \
   /------\
  /        \
 /Integração\
/------------\
/   Unitários  \
```

- **Base (Unitários)**: Muitos testes, rápidos e isolados
- **Meio (Integração)**: Testes suficientes para garantir interações corretas
- **Topo (E2E)**: Menor número, focados em fluxos críticos

## Automatização de Testes

### CI/CD Pipeline

```yaml
# Exemplo de configuração GitHub Actions para testes
name: Test Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:unit
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        
  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_USER: postgres
          POSTGRES_DB: marmitas_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - name: Start test environment
        run: docker-compose -f docker-compose.test.yml up -d
      - name: Run E2E tests
        run: npm run test:e2e
      - name: Store test artifacts
        uses: actions/upload-artifact@v3
        with:
          name: cypress-videos
          path: cypress/videos
```

### Test-Driven Development (TDD)

Incentivamos a prática de TDD, especialmente para:

1. **Correção de bugs**: Escrever teste que reproduz o bug, depois corrigir
2. **APIs e contratos**: Definir testes antes da implementação
3. **Refatoração de código**: Garantir comportamento idêntico após mudanças

## Práticas de Qualidade de Código

### Linting e Formatação

- ESLint configurado com regras específicas para o projeto
- Prettier para formatação consistente
- Husky para executar verificações antes do commit

```json
// Exemplo de configuração .eslintrc
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:security/recommended"
  ],
  "plugins": [
    "@typescript-eslint",
    "react",
    "security"
  ],
  "rules": {
    "security/detect-object-injection": "error",
    "security/detect-non-literal-regexp": "error",
    "security/detect-unsafe-regex": "error"
  }
}
```

### Revisão de Código

- Pull requests obrigatórios para todas as mudanças
- Pelo menos um revisor necessário antes de merge
- Verificações automatizadas devem passar antes do merge

### Monitoramento de Qualidade Contínuo

- SonarQube para análise de código
- Codecov para monitoramento de cobertura de testes
- Dependabot para alertas de dependências vulneráveis

## Procedimentos de Teste

### Testes Manual vs Automatizado

Critérios para decidir entre testes manuais e automatizados:

- **Automatizar**:
  - Testes repetitivos
  - Testes de regressão
  - Testes de funcionalidades críticas
  - Testes que consomem muito tempo manualmente

- **Teste Manual**:
  - Testes exploratórios
  - Usabilidade e experiência do usuário
  - Cenários complexos de difícil automação
  - Validações visuais subjetivas

### Processo de Teste para Novos Recursos

1. **Planejamento**:
   - Identificar requisitos e casos de teste
   - Definir critérios de aceitação

2. **Implementação**:
   - Desenvolver seguindo TDD quando aplicável
   - Implementar testes unitários e de integração

3. **Verificação**:
   - Executar testes automatizados
   - Realizar testes manuais complementares
   - Verificar cobertura de código

4. **Validação**:
   - Testes de aceitação com stakeholders
   - Testes em ambiente de staging
   - Validação de performance e segurança

5. **Deploy e Monitoramento**:
   - Testes de smoke pós-deploy
   - Monitoramento para detecção de problemas

## Documentação de Testes

### Template para Casos de Teste

```markdown
# Caso de Teste: [Identificador]

## Descrição
[Breve descrição do que está sendo testado]

## Pré-condições
- [Condição necessária 1]
- [Condição necessária 2]

## Passos
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

## Resultados Esperados
- [Resultado esperado 1]
- [Resultado esperado 2]

## Dados de Teste
| Entrada | Valor |
|---------|-------|
| [Campo] | [Valor] |

## Ambiente
- [Detalhes do ambiente de teste]

## Tags
[#regressão] [#crítico] [#sprint-10]
```

### Relatório de Teste

Relatórios de teste gerados após cada ciclo contendo:

- Resumo executivo
- Métricas de cobertura e execução
- Lista de casos testados e resultados
- Defeitos encontrados e severidade
- Recomendações

## Gestão de Defeitos

### Processo de Rastreamento

1. **Detecção**: Identificação do defeito em testes ou produção
2. **Registro**: Documentação no sistema de issue tracking
3. **Triagem**: Classificação por severidade e prioridade
4. **Atribuição**: Definição de responsável pela correção
5. **Correção**: Implementação da solução
6. **Verificação**: Testes para validar a correção
7. **Encerramento**: Documentação da resolução

### Classificação de Severidade

- **Crítica**: Sistema inutilizável, dados corrompidos
- **Alta**: Funcionalidade principal comprometida
- **Média**: Funcionalidade prejudicada, mas com contorno
- **Baixa**: Problemas menores, cosméticos

## Melhoria Contínua

### Análise de Métricas

Métricas monitoradas regularmente:

- Taxa de defeitos por sprint
- Cobertura de testes
- Tempo de ciclo (da identificação à correção)
- Taxa de regressão (defeitos reintroduzidos)

### Retrospectivas de Qualidade

Sessões trimestrais para analisar:

- Tendências nas métricas de qualidade
- Eficácia das práticas de teste
- Oportunidades de melhoria
- Ajustes na estratégia de testes

## Conclusão

A estratégia de testes e garantia de qualidade do sistema Marmitas é projetada para equilibrar velocidade de desenvolvimento e qualidade do produto. Através da combinação de diferentes tipos de testes, automação e práticas de qualidade, garantimos que o software atenda aos requisitos funcionais e não-funcionais, proporcionando uma experiência confiável e segura para os usuários.

Esta estratégia é um documento vivo, revisado e atualizado regularmente para se adaptar à evolução do sistema e incorporar novas ferramentas e práticas do mercado. 