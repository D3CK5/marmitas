-- Dados de teste para o ambiente de teste

-- Inserir categorias
INSERT INTO categories (id, name, description)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Pratos Principais', 'Marmitas completas com proteína, carboidrato e vegetais'),
  ('22222222-2222-2222-2222-222222222222', 'Acompanhamentos', 'Complementos para sua refeição'),
  ('33333333-3333-3333-3333-333333333333', 'Bebidas', 'Bebidas para acompanhar sua refeição'),
  ('44444444-4444-4444-4444-444444444444', 'Sobremesas', 'Doces para depois da refeição')
ON CONFLICT (name) DO NOTHING;

-- Inserir produtos
INSERT INTO products (id, name, description, price, category_id, available)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Marmita Frango', 'Arroz, feijão, frango grelhado e salada', 15.90, '11111111-1111-1111-1111-111111111111', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Marmita Carne', 'Arroz, feijão, carne assada e legumes', 17.90, '11111111-1111-1111-1111-111111111111', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Marmita Vegetariana', 'Arroz, feijão, legumes e proteína de soja', 14.90, '11111111-1111-1111-1111-111111111111', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Batata Frita', 'Porção de batata frita', 8.50, '22222222-2222-2222-2222-222222222222', true),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Refrigerante', 'Lata 350ml', 5.00, '33333333-3333-3333-3333-333333333333', true),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Pudim', 'Pudim de leite condensado', 7.00, '44444444-4444-4444-4444-444444444444', true)
ON CONFLICT (id) DO NOTHING;

-- Inserir usuário de teste
INSERT INTO users (id, email, name, password_hash, role)
VALUES
  ('99999999-9999-9999-9999-999999999999', 'teste@exemplo.com', 'Usuário Teste', '$2a$10$JqZNSrQ.t9J4jIHMRKXpneNc/dA4mRO3uf1qLDipqSTptxQK.OfyC', 'customer')
ON CONFLICT (email) DO NOTHING;

-- Inserir cliente de teste
INSERT INTO customers (id, user_id, phone, address)
VALUES
  ('88888888-8888-8888-8888-888888888888', '99999999-9999-9999-9999-999999999999', '(11) 99999-9999', 'Rua de Teste, 123')
ON CONFLICT (id) DO NOTHING; 