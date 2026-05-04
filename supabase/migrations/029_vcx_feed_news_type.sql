-- vcx_feed_items에 뉴스 기사 타입 지원 추가
ALTER TABLE vcx_feed_items
  ADD COLUMN IF NOT EXISTS item_type text NOT NULL DEFAULT 'job'
    CHECK (item_type IN ('job', 'news')),
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_name text,
  ADD COLUMN IF NOT EXISTS headline text;

COMMENT ON COLUMN vcx_feed_items.item_type IS 'job=채용공고, news=AI 큐레이션 뉴스';
COMMENT ON COLUMN vcx_feed_items.source_url IS '원본 기사 URL';
COMMENT ON COLUMN vcx_feed_items.source_name IS '출처명 (TechCrunch, HackerNews, Reddit 등)';
COMMENT ON COLUMN vcx_feed_items.headline IS '원문 영어 헤드라인';
