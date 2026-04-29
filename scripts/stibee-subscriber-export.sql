-- Stibee 뉴스레터 구독자 추출 쿼리
-- 실행: Supabase Dashboard > SQL Editor > 복붙 실행
-- 결과를 CSV 다운로드 후 Stibee > 주소록 > 가져오기

-- 1. 명시적 뉴스레터 구독자 (newsletter-bar 통해 구독)
SELECT
  fs.email,
  m.name           AS "이름",
  m.current_role   AS "직책",
  m.company        AS "소속",
  fs.created_at    AS "구독일"
FROM vcx_feed_subscriptions fs
LEFT JOIN vcx_members m ON m.user_id = fs.user_id
WHERE fs.active = true
ORDER BY fs.created_at DESC;

-- 2. 전체 활성 멤버 (명시적 구독 없을 경우 대체 사용)
-- 주석 해제 후 실행
/*
SELECT
  au.email,
  m.name           AS "이름",
  m.current_role   AS "직책",
  m.company        AS "소속",
  m.created_at     AS "가입일"
FROM vcx_members m
JOIN auth.users au ON au.id = m.user_id
WHERE m.profile_visibility = true
  AND m.tier IN ('core', 'endorsed')
ORDER BY m.created_at DESC;
*/
