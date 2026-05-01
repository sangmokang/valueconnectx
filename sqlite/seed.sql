-- ValueConnect X SQLite dev seed

PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO auth_users (id, email) VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'core.member@example.com'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'endorsed.member@example.com'),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'ceo@example.com'),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd4', 'admin@example.com');

INSERT OR IGNORE INTO vcx_members (
  id, name, email, current_company, title, professional_fields,
  years_of_experience, bio, member_tier, system_role, is_active,
  industry, location, is_open_to_chat, profile_visibility, fts
) VALUES
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '김코어',
    'core.member@example.com',
    'Value Labs',
    'Head of Product',
    '["product","strategy"]',
    12,
    '검증된 핵심 인재 네트워크의 초기 멤버',
    'core',
    'member',
    1,
    'SaaS',
    'Seoul',
    1,
    'members_only',
    '김코어 Value Labs Head of Product product strategy'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    '박엔도스',
    'endorsed.member@example.com',
    'Scale Partners',
    'Engineering Lead',
    '["engineering","ai"]',
    9,
    'AI 제품과 성장 조직 경험을 가진 추천 멤버',
    'endorsed',
    'member',
    1,
    'AI',
    'Seoul',
    1,
    'members_only',
    '박엔도스 Scale Partners Engineering Lead engineering ai'
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
    '관리자',
    'admin@example.com',
    'ValueConnect X',
    'Operator',
    '["operations"]',
    10,
    '서비스 운영자',
    'core',
    'admin',
    1,
    'Marketplace',
    'Seoul',
    0,
    'private',
    '관리자 ValueConnect X Operator operations'
  );

INSERT OR IGNORE INTO vcx_corporate_users (
  id, name, email, company, role, title, is_verified
) VALUES (
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
  '이대표',
  'ceo@example.com',
  'Acme Korea',
  'ceo',
  'CEO',
  1
);

INSERT OR IGNORE INTO vcx_feed_items (
  id, company, company_tag, role, level, team_size, salary_band,
  location, tags, summary, exclusive, created_by, published_at
) VALUES
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    'Acme Korea',
    'B2B SaaS',
    'Product Lead',
    'Lead',
    '20-50',
    '협의',
    'Seoul',
    '["product","b2b","leadership"]',
    '초기 GTM을 제품 관점에서 설계할 리드 포지션',
    1,
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
    '2026-05-01T09:00:00+09:00'
  ),
  (
    'ffffffff-ffff-4fff-8fff-fffffffffff2',
    'Northstar AI',
    'AI Infra',
    'Engineering Manager',
    'Senior',
    '50-100',
    '협의',
    'Remote',
    '["engineering","ai","management"]',
    'AI 인프라 팀의 채용과 실행 리듬을 책임지는 역할',
    0,
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
    '2026-04-30T09:00:00+09:00'
  );

INSERT OR IGNORE INTO vcx_feed_responses (
  id, user_id, feed_item_id, response
) VALUES (
  'abababab-abab-4aba-8aba-abababababa1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  'yes'
);

INSERT OR IGNORE INTO vcx_feed_subscriptions (
  id, user_id, email, active
) VALUES (
  'acacacac-acac-4aca-8aca-acacacacaca1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'newsletter.member@example.com',
  1
);

INSERT OR IGNORE INTO vcx_ceo_coffee_sessions (
  id, host_id, title, description, session_date, duration_minutes,
  max_participants, location_type, location_detail, status, target_tier, tags
) VALUES (
  'babababa-baba-4bab-8bab-bababababab1',
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
  'B2B SaaS 스케일업 커피챗',
  '초기 리더십 채용과 제품 조직 설계에 대해 나누는 세션',
  '2026-05-08T15:00:00+09:00',
  60,
  5,
  'online',
  'Google Meet',
  'open',
  'all',
  '["saas","leadership"]'
);

INSERT OR IGNORE INTO vcx_coffee_applications (
  id, session_id, applicant_id, message, status
) VALUES (
  'bcbcbcbc-bcbc-4bcb-8bcb-bcbcbcbcbcb1',
  'babababa-baba-4bab-8bab-bababababab1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '조직 스케일업 경험을 나누고 싶습니다.',
  'pending'
);

INSERT OR IGNORE INTO peer_coffee_chats (
  id, author_id, title, content, category, status
) VALUES (
  'cacacaca-caca-4cac-8cac-cacacacacac1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  'AI 제품 리더십 경험 교환',
  'AI 제품팀 운영 경험을 가진 분과 30분 커피챗을 원합니다.',
  'career',
  'open'
);

INSERT OR IGNORE INTO peer_coffee_applications (
  id, chat_id, applicant_id, message, status
) VALUES (
  'cbcbcbcb-cbcb-4bcb-8bcb-cbcbcbcbcbc1',
  'cacacaca-caca-4cac-8cac-cacacacacac1',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
  '비슷한 문제를 겪고 있어 이야기 나누고 싶습니다.',
  'pending'
);

INSERT OR IGNORE INTO vcx_newsletter_campaigns (
  id, slug, subject, preview_text, html_body, status, sent_at, created_by
) VALUES (
  'dadadada-dada-4dad-8dad-dadadadadad1',
  's2-feed-launch',
  '이번 주 엄선된 기회',
  'ValueConnect X 큐레이션 피드 업데이트',
  '<p>이번 주 엄선된 기회를 확인하세요.</p>',
  'sent',
  '2026-05-01T10:00:00+09:00',
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd4'
);

INSERT OR IGNORE INTO vcx_newsletter_recipients (
  id, campaign_id, subscription_id, email, send_token, sent_at
) VALUES (
  'dbdbdbdb-dbdb-4bdb-8bdb-dbdbdbdbdbd1',
  'dadadada-dada-4dad-8dad-dadadadadad1',
  'acacacac-acac-4aca-8aca-acacacacaca1',
  'newsletter.member@example.com',
  'dev-newsletter-token',
  '2026-05-01T10:00:00+09:00'
);

INSERT OR IGNORE INTO vcx_newsletter_events (
  recipient_id, type
) VALUES (
  'dbdbdbdb-dbdb-4bdb-8bdb-dbdbdbdbdbd1',
  'sent'
);

INSERT OR IGNORE INTO vcx_company_jds (
  id, corporate_user_id, company_name, title, domain_sector, seniority,
  jd_text, required_skills, preferred_skills, source_type, source_uri,
  status, created_by
) VALUES (
  'eaeaeaea-eaea-4eae-8eae-eaeaeaeaeae1',
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
  'Acme Korea',
  'B2B SaaS Product Lead',
  'B2B SaaS',
  'Lead',
  'B2B SaaS 제품의 초기 GTM과 리텐션 개선을 주도할 Product Lead를 찾습니다. 고객 인터뷰, 제품 전략, 데이터 기반 우선순위 설정, 세일즈 협업 경험이 필요합니다.',
  '["product","b2b","gtm","retention"]',
  '["pricing","sales","analytics"]',
  'gdrive',
  'gdrive://sample/acme-product-lead-jd',
  'active',
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd4'
);

INSERT OR IGNORE INTO vcx_candidate_resumes (
  id, member_id, candidate_name, candidate_email, current_title,
  years_of_experience, domain_sectors, skills, resume_text,
  source_type, source_uri, consent_status, created_by
) VALUES (
  'ebebebeb-ebeb-4beb-8beb-ebebebebebe1',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '김코어',
  'core.member@example.com',
  'Head of Product',
  12,
  '["B2B SaaS","Marketplace"]',
  '["product","strategy","b2b","retention","analytics"]',
  '요약: 12년 경력의 Product Lead. B2B SaaS에서 온보딩 전환율 18% 개선, 리텐션 지표 12%p 개선, 신규 가격 정책 출시를 주도했습니다. 경력: Value Labs Head of Product로 고객 인터뷰, GTM, 세일즈 협업, 데이터 기반 제품 전략을 총괄했습니다. 프로젝트: 엔터프라이즈 대시보드 출시, ARR 성장 기여, 조직 채용과 멘토링 수행. 스킬: product, strategy, b2b, retention, analytics.',
  'desktop',
  'desktop://sample/kim-core-resume.pdf',
  'internal_review',
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd4'
);

INSERT OR IGNORE INTO vcx_b2b_market_job_signals (
  id, external_id, source, company_name, title, domain_sector,
  function_tags, seniority, location, salary_band, jd_text, url, published_at
) VALUES
  (
    'efefefef-efef-4efe-8efe-efefefefefe1',
    'wanted-acme-product-lead',
    'wanted',
    'Acme Korea',
    'Product Lead',
    'B2B SaaS',
    '["product","b2b","gtm","retention"]',
    'Lead',
    'Seoul',
    '협의',
    'B2B SaaS 제품 전략, 고객 인터뷰, 리텐션 개선, 세일즈 협업을 담당합니다.',
    'https://example.com/jobs/acme-product-lead',
    '2026-05-01T09:00:00+09:00'
  ),
  (
    'fafafafa-fafa-4faf-8faf-fafafafafaf2',
    'linkedin-northstar-ai-pm',
    'linkedin',
    'Northstar AI',
    'AI Platform PM',
    'AI Infra',
    '["product","ai","platform","analytics"]',
    'Senior',
    'Remote',
    '협의',
    'AI 플랫폼 제품 로드맵과 데이터 기반 의사결정을 담당합니다.',
    'https://example.com/jobs/northstar-ai-pm',
    '2026-04-30T09:00:00+09:00'
  );
