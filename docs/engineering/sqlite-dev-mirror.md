# SQLite Dev Mirror

Supabase CLI, Docker, 원격 Supabase 프로젝트가 막힌 상황에서 로컬 개발 흐름을 멈추지 않기 위한 SQLite 미러입니다. 운영 DB의 단일 원천은 여전히 `supabase/migrations/*.sql`입니다.

## 사용법

```bash
npm run sqlite:init
npm run sqlite:smoke
npm run sqlite:query -- "select id, email, member_tier from vcx_members;"
```

DB 파일은 기본적으로 `.local/vcx-dev.sqlite`에 생성됩니다. 다른 경로가 필요하면 `VCX_SQLITE_PATH`를 지정합니다.

```bash
VCX_SQLITE_PATH=/tmp/vcx-dev.sqlite npm run sqlite:reset
```

## 포함 범위

- `auth_users`: Supabase `auth.users`를 대체하는 최소 로컬 테이블
- 초대/멤버: `vcx_members`, `vcx_corporate_users`, `vcx_recommendations`, `vcx_invites`
- 커피챗: `vcx_ceo_coffee_sessions`, `vcx_coffee_applications`, `peer_coffee_chats`, `peer_coffee_applications`
- 피드: `vcx_feed_items`, `vcx_feed_interests`, `vcx_feed_responses`, `vcx_feed_subscriptions`
- 뉴스레터: `vcx_newsletter_campaigns`, `vcx_newsletter_recipients`, `vcx_newsletter_events`
- B2B Intelligence: `vcx_company_jds`, `vcx_candidate_resumes`, `vcx_b2b_market_job_signals`, `vcx_b2b_match_runs`

## 한계

SQLite 미러는 Supabase 런타임 대체가 아닙니다. 다음은 재현하지 않습니다.

- Supabase Auth 세션과 쿠키
- RLS 정책과 `auth.uid()`
- Postgres `uuid`, `timestamptz`, `text[]`, `tsvector`의 정확한 타입 동작
- `SECURITY DEFINER` RPC 실행 권한
- Supabase JS/PostgREST query builder

뉴스레터 토큰 조회는 SQLite에서 함수 대신 아래 쿼리로 검증합니다.

```sql
select *
from vcx_newsletter_recipient_tokens
where send_token = 'dev-newsletter-token';
```

## 운영 규칙

- 스키마 변경의 단일 원천은 계속 `supabase/migrations/*.sql`입니다.
- SQLite 스키마는 Supabase가 불가할 때 개발을 이어가기 위한 보조물입니다.
- DB 파일은 `.local/` 아래에 생성되며 커밋하지 않습니다.
