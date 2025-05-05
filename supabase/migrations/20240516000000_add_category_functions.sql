-- Função para excluir uma categoria e mover seus produtos para a categoria padrão
CREATE OR REPLACE FUNCTION delete_category(target_category_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se a categoria existe
  IF NOT EXISTS (SELECT 1 FROM categories WHERE id = target_category_id) THEN
    RAISE EXCEPTION 'Categoria não encontrada';
  END IF;
  
  -- Verificar se não é a categoria padrão
  IF target_category_id = 1 THEN
    RAISE EXCEPTION 'A categoria padrão não pode ser excluída';
  END IF;
  
  -- Atualizar produtos para a categoria padrão (ID = 1)
  UPDATE products
  SET category_id = 1
  WHERE category_id = target_category_id;
  
  -- Excluir a categoria
  DELETE FROM categories
  WHERE id = target_category_id;
END;
$$;

-- Função para reorganizar os IDs das categorias
CREATE OR REPLACE FUNCTION reorganize_categories_ids()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_id BIGINT;
  max_id BIGINT;
BEGIN
  -- Encontrar o ID máximo atual
  SELECT MAX(id) INTO max_id FROM categories;
  
  -- Garantir que a categoria padrão (ID=1) não seja alterada
  FOR current_id IN 2..max_id LOOP
    -- Verificar se este ID está vazio (foi excluído)
    IF NOT EXISTS (SELECT 1 FROM categories WHERE id = current_id) THEN
      -- Encontrar o próximo ID existente maior que este
      DECLARE
        next_id BIGINT;
      BEGIN
        SELECT MIN(id) INTO next_id FROM categories WHERE id > current_id;
        
        -- Se encontrar, mova para preencher o buraco
        IF next_id IS NOT NULL THEN
          -- Atualizar a categoria para o novo ID
          UPDATE categories 
          SET id = current_id
          WHERE id = next_id;
          
          -- Atualizar as referências em produtos
          UPDATE products
          SET category_id = current_id
          WHERE category_id = next_id;
        END IF;
      END;
    END IF;
  END LOOP;
  
  -- Redefina a sequência para o próximo ID disponível
  EXECUTE 'ALTER SEQUENCE categories_id_seq RESTART WITH ' || (max_id + 1)::TEXT;
END;
$$;

-- Garantir permissões para as funções
GRANT EXECUTE ON FUNCTION delete_category(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION reorganize_categories_ids() TO authenticated; 