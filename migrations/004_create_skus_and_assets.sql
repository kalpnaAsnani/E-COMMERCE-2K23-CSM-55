-- Migration 004: Create SKUs and Assets Tables
-- Student: Kalpna Asnani (Roll No: 2k23/CSM/55)
-- Project: TerraCraft Artisanal Ceramics

CREATE TABLE IF NOT EXISTS skus (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku_code VARCHAR(50) NOT NULL UNIQUE,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_skus_product_id ON skus(product_id);
CREATE INDEX IF NOT EXISTS idx_skus_sku_code ON skus(sku_code);
CREATE INDEX IF NOT EXISTS idx_skus_is_active ON skus(is_active);

CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku_id INTEGER REFERENCES skus(id) ON DELETE SET NULL,
    url VARCHAR(500) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'primary' CHECK (role IN ('primary', 'gallery', 'thumbnail')),
    alt_text VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_product_id ON assets(product_id);
CREATE INDEX IF NOT EXISTS idx_assets_sku_id ON assets(sku_id);
