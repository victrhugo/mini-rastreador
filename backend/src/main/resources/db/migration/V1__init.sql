CREATE TABLE users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP    NOT NULL
);

CREATE TABLE orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name  VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20),
    street         VARCHAR(160) NOT NULL,
    number         VARCHAR(20)  NOT NULL,
    complement     VARCHAR(120),
    district       VARCHAR(120) NOT NULL,
    city           VARCHAR(120) NOT NULL,
    zip_code       VARCHAR(9)   NOT NULL,
    status         VARCHAR(20)  NOT NULL,
    total_cents    BIGINT       NOT NULL,
    created_by     BIGINT       NOT NULL REFERENCES users (id),
    created_at     TIMESTAMP    NOT NULL,
    updated_at     TIMESTAMP    NOT NULL
);

CREATE INDEX idx_orders_status ON orders (status);

CREATE TABLE order_items (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id         BIGINT       NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    description      VARCHAR(200) NOT NULL,
    quantity         INTEGER      NOT NULL CHECK (quantity > 0),
    unit_price_cents BIGINT       NOT NULL CHECK (unit_price_cents >= 0)
);

CREATE INDEX idx_order_items_order ON order_items (order_id);

CREATE TABLE order_status_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id    BIGINT      NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    from_status VARCHAR(20),
    to_status   VARCHAR(20) NOT NULL,
    changed_by  BIGINT      NOT NULL REFERENCES users (id),
    changed_at  TIMESTAMP   NOT NULL
);

CREATE INDEX idx_order_status_history_order ON order_status_history (order_id);
