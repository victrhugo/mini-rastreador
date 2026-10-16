-- UF do endereço de entrega. Obrigatória para novos pedidos (validada na API).
ALTER TABLE orders ADD COLUMN state VARCHAR(2);
