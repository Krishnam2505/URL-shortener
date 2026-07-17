CREATE TABLE IF NOT EXISTS links (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(10) UNIQUE NOT NULL,
    original_url TEXT NOT NULL,
    custom_alias BOOLEAN DEFAULT FALSE,
    click_count BIGINT DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Lookups by short_code are the hottest path in this whole system (every redirect).
-- Even though UNIQUE already creates an implicit index, we explicitly note it here
-- because this index is the single most important one in the schema for performance.
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links(short_code);
