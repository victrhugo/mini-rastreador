-- Versão do pedido para detectar alterações concorrentes (lock otimista).
ALTER TABLE orders ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
