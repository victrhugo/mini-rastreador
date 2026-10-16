-- Código público e aleatório para o cliente acompanhar o pedido sem login.
ALTER TABLE orders ADD COLUMN tracking_code VARCHAR(32);
UPDATE orders SET tracking_code = lower(hex(randomblob(12))) WHERE tracking_code IS NULL;
CREATE UNIQUE INDEX idx_orders_tracking_code ON orders (tracking_code);
