-- 021_vcx_ai_brief_feedback.sql
-- CEO 커피챗 신청 테이블에 AI Brief 컬럼 추가

ALTER TABLE vcx_coffee_applications
  ADD COLUMN IF NOT EXISTS host_brief text,
  ADD COLUMN IF NOT EXISTS applicant_brief text,
  ADD COLUMN IF NOT EXISTS brief_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS brief_error text;

-- 커피챗 피드백 테이블 (CEO 세션 종료 후 수집)
CREATE TABLE vcx_coffeechat_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES vcx_ceo_coffee_sessions(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES vcx_coffee_applications(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id),
  reviewer_role text NOT NULL CHECK (reviewer_role IN ('host', 'applicant')),

  -- 평가 항목
  overall_rating int NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  culture_fit_score int CHECK (culture_fit_score BETWEEN 1 AND 5),
  would_connect_again boolean,
  feedback_tags text[] DEFAULT '{}',
  comment text,

  -- 브리프 유용성 평가
  brief_helpful boolean,

  created_at timestamptz DEFAULT now(),
  UNIQUE(application_id, reviewer_id)
);

-- RLS 정책
ALTER TABLE vcx_coffeechat_feedback ENABLE ROW LEVEL SECURITY;

-- 피드백 작성: 본인만
CREATE POLICY "feedback_insert_own"
  ON vcx_coffeechat_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (reviewer_id = auth.uid());

-- 피드백 조회: admin만 (집계용)
CREATE POLICY "feedback_select_admin"
  ON vcx_coffeechat_feedback
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vcx_members
      WHERE id = auth.uid()
        AND system_role IN ('admin', 'super_admin')
    )
  );
