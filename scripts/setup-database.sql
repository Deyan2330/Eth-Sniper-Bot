-- Database schema for storing pool data and trading history
CREATE TABLE IF NOT EXISTS pools (
    id SERIAL PRIMARY KEY,
    token0 VARCHAR(42) NOT NULL,
    token1 VARCHAR(42) NOT NULL,
    pool_address VARCHAR(42) NOT NULL UNIQUE,
    fee INTEGER NOT NULL,
    block_number BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    analyzed BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    pool_id INTEGER REFERENCES pools(id),
    trade_type VARCHAR(10) NOT NULL, -- 'BUY' or 'SELL'
    amount_in DECIMAL(36, 18) NOT NULL,
    amount_out DECIMAL(36, 18) NOT NULL,
    gas_used INTEGER NOT NULL,
    gas_price BIGINT NOT NULL,
    transaction_hash VARCHAR(66) NOT NULL,
    block_number BIGINT NOT NULL,
    profit_loss DECIMAL(36, 18),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS token_analysis (
    id SERIAL PRIMARY KEY,
    token_address VARCHAR(42) NOT NULL UNIQUE,
    symbol VARCHAR(20),
    name VARCHAR(100),
    decimals INTEGER,
    total_supply DECIMAL(36, 18),
    is_honeypot BOOLEAN DEFAULT FALSE,
    risk_score INTEGER DEFAULT 0, -- 0-100 scale
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pools_created_at ON pools(created_at);
CREATE INDEX IF NOT EXISTS idx_pools_analyzed ON pools(analyzed);
CREATE INDEX IF NOT EXISTS idx_trades_created_at ON trades(created_at);
CREATE INDEX IF NOT EXISTS idx_token_analysis_address ON token_analysis(token_address);
