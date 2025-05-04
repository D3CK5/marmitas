-- Remove a tabela temporária que não é mais necessária
DROP TABLE IF EXISTS temp_product_changeable_foods CASCADE;

-- Remover todos os registros com product_id negativo (IDs temporários)
DELETE FROM product_changeable_foods WHERE product_id < 0; 