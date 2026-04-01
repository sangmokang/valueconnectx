-- 큐레이션 피드 아이템
CREATE TABLE vcx_feed_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL,
  company_tag text,
  role text NOT NULL,
  level text,
  team_size text,
  salary_band text,
  location text,
  tags text[] DEFAULT '{}',
  summary text,
  exclusive boolean DEFAULT false,
  published_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- 사용자 관심 분야
CREATE TABLE vcx_feed_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  chips text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- 피드 반응 (관심/스킵)
CREATE TABLE vcx_feed_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  feed_item_id uuid NOT NULL REFERENCES vcx_feed_items(id) ON DELETE CASCADE,
  response text NOT NULL CHECK (response IN ('yes', 'skip')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, feed_item_id)
);

-- 뉴스레터 구독
CREATE TABLE vcx_feed_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  email text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE vcx_feed_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_feed_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_feed_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vcx_feed_subscriptions ENABLE ROW LEVEL SECURITY;

-- 피드 읽기: 인증된 멤버
CREATE POLICY "feed_items_select" ON vcx_feed_items FOR SELECT TO authenticated
  USING (vcx_is_member(auth.uid()));

-- 관심 분야: 본인만
CREATE POLICY "feed_interests_all" ON vcx_feed_interests FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 피드 반응: 본인만
CREATE POLICY "feed_responses_all" ON vcx_feed_responses FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 구독: 본인만
CREATE POLICY "feed_subs_all" ON vcx_feed_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 관리자 INSERT
CREATE POLICY "feed_items_admin_insert" ON vcx_feed_items FOR INSERT TO authenticated
  WITH CHECK (vcx_is_admin(auth.uid()));
