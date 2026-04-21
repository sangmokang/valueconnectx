-- ============================================================================
-- 025d_vcx_safe_count.sql
-- 목적: Directory Level 0 집계의 k-anonymity floor. 재식별 위험 완화.
-- 근거: CDO Review §2 D5
-- ----------------------------------------------------------------------------
-- k=10 기본. 10 미만 cell은 "N명 미만"으로 suppress,
-- 10~49는 10-bucket, 50~499는 50-bucket, 500+는 100-bucket 반올림.
-- 본인 제외 카운트 변형 포함 (뉴스레터 "당신과 겹치는 N명" 케이스).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- vcx_safe_count: k-anonymity floor + bucket 반올림
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vcx_safe_count(p_count BIGINT, p_k INTEGER DEFAULT 10)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_count IS NULL           THEN NULL
    WHEN p_count < p_k             THEN p_k::TEXT || '명 미만'
    WHEN p_count < 50              THEN (FLOOR(p_count / 10.0) * 10)::TEXT || '+'
    WHEN p_count < 500             THEN (FLOOR(p_count / 50.0) * 50)::TEXT || '+'
    ELSE                                (FLOOR(p_count / 100.0) * 100)::TEXT || '+'
  END;
$$;

COMMENT ON FUNCTION vcx_safe_count(BIGINT, INTEGER) IS
  'CDO rev 4 D5: k-anonymity floor for Directory Level 0 aggregates. Default k=10.';

-- ----------------------------------------------------------------------------
-- vcx_safe_count_excluding_self:
-- 뉴스레터·대시보드에서 "나를 제외하고 N명이 겹칩니다" 타겟팅 카피용
-- 수신자 본인이 집합에 포함된 경우 p_count - 1을 적용 → 재식별 방지
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vcx_safe_count_excluding_self(
  p_count            BIGINT,
  p_viewer_included  BOOLEAN,
  p_k                INTEGER DEFAULT 10
)
RETURNS TEXT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT vcx_safe_count(
    CASE WHEN p_viewer_included THEN GREATEST(p_count - 1, 0) ELSE p_count END,
    p_k
  );
$$;

COMMENT ON FUNCTION vcx_safe_count_excluding_self(BIGINT, BOOLEAN, INTEGER) IS
  'CDO rev 4 D5: viewer-exclusion variant. 본인이 집합에 포함될 때 자동 -1.';

-- ----------------------------------------------------------------------------
-- vcx_safe_count_numeric: 반올림된 숫자 반환 (차트용)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION vcx_safe_count_numeric(p_count BIGINT, p_k INTEGER DEFAULT 10)
RETURNS BIGINT
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_count IS NULL           THEN NULL
    WHEN p_count < p_k             THEN NULL                                  -- suppress
    WHEN p_count < 50              THEN (FLOOR(p_count / 10.0) * 10)::BIGINT
    WHEN p_count < 500             THEN (FLOOR(p_count / 50.0) * 50)::BIGINT
    ELSE                                (FLOOR(p_count / 100.0) * 100)::BIGINT
  END;
$$;

COMMENT ON FUNCTION vcx_safe_count_numeric(BIGINT, INTEGER) IS
  'CDO rev 4 D5: NULL when p_count < k (차트용). 프론트에서 "데이터 부족" 카피로 처리.';

-- ----------------------------------------------------------------------------
-- 사용 패턴 주석 (API 레이어 가이드)
-- ----------------------------------------------------------------------------
-- 1. 단일 dimension 집계 (e.g. 산업별 멤버 수):
--    SELECT industry, vcx_safe_count(COUNT(*)) AS safe_display,
--           vcx_safe_count_numeric(COUNT(*)) AS safe_num
--      FROM vcx_members WHERE is_active = true GROUP BY industry;
--
-- 2. 2-dim 집계 (industry × stage):
--    API 레이어에서 cell 수 < k 인 조합 자동 suppression.
--    수치 대신 Y/N binary만 노출 권장.
--
-- 3. 3-dim 이상: 거부 ("dataset too sparse").
--
-- 4. 뉴스레터 타겟팅 ("당신과 핀테크 관심사가 겹치는 N명"):
--    SELECT vcx_safe_count_excluding_self(
--             COUNT(*) FILTER (WHERE ...),
--             bool_or(id = auth.uid())
--           )
--      FROM vcx_members WHERE ...;
