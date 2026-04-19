# 모듈 의존성 맵

## src/lib/ 모듈 관계

| 모듈 | 역할 | 의존 |
|------|------|------|
| `supabase/client.ts` | 브라우저 Supabase 클라이언트 | @supabase/ssr |
| `supabase/server.ts` | 서버 Supabase 클라이언트 | @supabase/ssr, cookies |
| `supabase/admin.ts` | Service Role 클라이언트 | SUPABASE_SERVICE_ROLE_KEY |
| `supabase/middleware.ts` | 미들웨어 세션 관리 | @supabase/ssr |
| `auth/get-vcx-user.ts` | VCX 사용자 조회 | supabase/server |
| `auth/routes.ts` | 라우트 분류 (public/protected/admin) | - |
| `api/error.ts` | HTTP 에러 헬퍼 | - |
| `api/validation.ts` | Zod 스키마 검증 | zod |
| `rate-limit.ts` | Upstash 기반 요청 제한 | @upstash/ratelimit, redis |
| `redis.ts` | Redis 클라이언트 | @upstash/redis |
| `email.ts` | Resend 이메일 발송 | resend |
| `invite.ts` | 초대 로직 | supabase/admin, email |
| `notification.ts` | 알림 생성 | supabase/admin |
| `ai/claude.ts` | Claude API 클라이언트 | @anthropic-ai/sdk |
| `ai/brief.ts` | 커피챗 브리프 생성 | ai/claude |
| `ops/health-checks.ts` | 시스템 헬스체크 | supabase/admin, redis |
| `ops/discord.ts` | Discord 웹훅 알림 | - |
| `ops/alert-rules.ts` | 알림 규칙 정의 | - |
| `ops/snapshot.ts` | 시스템 스냅샷 | supabase/admin |
| `analytics.ts` | Mixpanel 이벤트 | mixpanel-browser |
| `anti-scraping.ts` | 크롤링 방지 | - |
| `position-matcher.ts` | 포지션 매칭 알고리즘 | - |
| `validation/linkedin.ts` | LinkedIn URL 검증 | - |
| `utils.ts` | cn() 등 공통 유틸 | clsx, tailwind-merge |
| `constants.ts` | 앱 상수 | - |

## src/components/ 도메인 맵

| 도메인 | 컴포넌트 수 | 주요 컴포넌트 |
|--------|------------|--------------|
| `ui/` | 공통 UI | Button, Badge, SectionHeader, Modal |
| `layout/` | 레이아웃 | GNB, ProtectedPageWrapper, Footer |
| `auth/` | 인증 | LoginForm, InviteAcceptForm, UserMenu |
| `admin/` | 관리자 | AdminTabs, InviteList, RecommendationList |
| `coffeechat/` | 커피챗 | SessionCard, ApplyModal, FeedbackForm, PreBriefCard |
| `community/` | 커뮤니티 | LoungeFeed, PostCard, CommentList, EmojiReactions |
| `directory/` | 디렉토리 | MemberCard, MemberFilters |
| `positions/` | 포지션 | PositionCard, InterestButton |
| `feed/` | 큐레이션 피드 | FeedCard, SubscribeButton |
