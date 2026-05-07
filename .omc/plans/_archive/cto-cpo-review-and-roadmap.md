# ValueConnect X — CTO/CPO 종합 리뷰 & 개발 로드맵

**작성일:** 2026-03-26
**버전:** v2.0 (Architect + Critic 피드백 반영)
**기준 문서:** PRD v5.1

---

## Part 1: 현재 상태 리뷰

### A. CTO 관점 (기술 리뷰)

#### 1. 아키텍처 & 인프라

| 항목 | 상태 | 평가 |
|------|------|------|
| Next.js 14 App Router | ✅ 완성 | RSC + Suspense 적절히 활용 |
| TypeScript strict mode | ✅ 적용 | 타입 안전성 확보 |
| Supabase Auth + RLS | ⚠️ 결함 있음 | 12개 마이그레이션, DDL 보호. 단 `vcx_notifications` INSERT RLS 정책 누락 |
| 미들웨어 라우트 보호 | ✅ 완성 | 5단계 분류. 단 admin API 보호는 개별 route handler에 의존 |
| API 에러 핸들링 | ✅ 완성 | 표준 헬퍼 6종 (`src/lib/api/error.ts`) |
| Zod 입력 검증 | ✅ 완성 | 모든 API route에 적용 (`src/lib/api/validation.ts`) |
| Rate Limiting | 🔴 사실상 미작동 | 인메모리 Map 기반 — Vercel Serverless 콜드스타트마다 초기화되어 무효 |

**강점:**
- `vcx_consume_invite` RPC로 원자적 초대 처리 (`supabase/migrations/003_vcx_atomic_invite.sql`)
- `vcx_get_user_info` RPC로 미들웨어 단일 DB 호출 (`src/middleware.ts:45`)
- FTS generated column으로 검색 성능 확보 (`supabase/migrations/005_vcx_member_directory.sql`)

**🔴 Critical 기술 결함 (Architect 발견):**

| 항목 | 심각도 | 설명 | 파일 참조 |
|------|--------|------|----------|
| `vcx_notifications` INSERT RLS 누락 | 🔴 Critical | SELECT/UPDATE 정책만 존재, INSERT 정책 없음 → authenticated 사용자의 알림 insert가 RLS에 의해 **모두 차단됨**. CEO 커피챗의 try-catch에서 조용히 실패 중 | `supabase/migrations/011_vcx_notifications.sql:17-25` |
| Rate Limiting Serverless 무효 | 🔴 Critical | `Map` 기반 인메모리 → Vercel Serverless 콜드스타트마다 초기화. **사실상 Rate Limiting 미적용 상태** | `src/lib/rate-limit.ts:1` |
| 알림 비대칭 구현 | 🟡 중 | CEO 커피챗에만 best-effort notification insert 존재, Peer 커피챗에는 **알림 코드 자체가 없음** | CEO: `src/app/api/ceo-coffeechat/[id]/applications/[appId]/route.ts:64-75`, Peer: 해당 파일에 notification 코드 0줄 |

**기술 부채 (조정됨):**

| 항목 | 심각도 | 설명 |
|------|--------|------|
| Rate Limiting → Upstash Redis 전환 필수 | 🔴 높 | 인메모리 방식은 Serverless에서 근본적으로 작동 불가 |
| Anti-Scraping 미구현 | 🟡 중 | PRD 5.2 명시 (분당/일간 제한, IP 차단) |
| 알림 시스템 전면 구축 필요 | 🔴 높 | 테이블만 존재, RLS 결함, 조회 API 없음, UI 없음 |
| E2E 테스트 부족 | 🟡 중 | `e2e/example.spec.ts`만 존재 (제목 체크 1개) |
| 에러 모니터링 없음 | 🔴 높 | Sentry 등 APM 미연결 |
| Analytics 미연결 | 🟡 중 | PRD에 Mixpanel 명시, 미구현 |
| 보안 헤더 미설정 | 🟡 중 | CSP, HSTS, X-Frame-Options 등 |

#### 2. 도메인별 기술 완성도 (Architect 검증 반영, 하향 조정)

> 점수 기준: 기능 구현 40% + 테스트 커버리지 20% + 비즈니스 로직 완결성 20% + 보안/안정성 20%

| 도메인 | 페이지 | 컴포넌트 | API | DB | 테스트 | 종합 | 조정 근거 |
|--------|--------|----------|-----|----|----|------|----------|
| Auth/Invite | 5 | 6 | 5 | ✅ | ✅ 8개 | **95%** | 완성도 높음, rate limit만 인메모리 이슈 |
| Admin | 6 | 5 | 7 | ✅ | ✅ 4개 | **90%** | admin API 보호가 route handler 의존 |
| Directory | 3 | 4 | 3 | ✅ | ❌ 0 | **75%** | 테스트 0 + Anti-Scraping 미구현 + LinkedIn 필수 미적용 |
| CEO Coffee Chat | 3 | 6 | 5 | ✅ | ❌ 0 | **70%** | 테스트 0 + 연락처 공개 미구현 + Head Hunting 동의서 없음 |
| Peer Coffee Chat | 3 | 4 | 5 | ✅ | ❌ 0 | **65%** | 테스트 0 + 알림 insert 전무 + 연락처 공개 미구현 |
| Community | 3 | 6 | 4 | ✅ | ❌ 0 | **75%** | 테스트 0 + 모더레이션 도구 미흡 |
| Positions | 2 | 3 | 3 | ✅ | ❌ 0 | **80%** | 테스트 0, 기능적으로는 가장 완결 |
| Layout/GNB | - | 4 | - | - | ❌ 0 | **85%** | 알림 벨 미구현 |

#### 3. 보안 상태

| 항목 | 상태 | 비고 |
|------|------|------|
| RLS 정책 | ⚠️ | `vcx_notifications` INSERT 정책 누락 (버그) |
| DDL 보호 | ✅ | Event Trigger 적용 (`supabase/migrations/012_vcx_ddl_protection.sql`) |
| CSRF 보호 | ✅ | Next.js 내장 |
| XSS 방지 | ✅ | React 자동 이스케이핑 |
| 토큰 해싱 | ✅ | SHA-256 (`src/lib/invite.ts`) |
| 입력 검증 | ✅ | Zod 스키마 전체 적용 |
| Rate Limiting | 🔴 | Serverless 환경에서 사실상 미작동 |
| Anti-Scraping | ❌ | 미구현 |
| 보안 헤더 | ❌ | CSP, HSTS 등 미설정 |
| 이메일 인증 | ⚠️ | SPF/DKIM 구성 확인 필요 (Resend 도메인 설정) |

---

### B. CPO 관점 (제품 리뷰)

#### 1. PRD 대비 기능 구현율

| PRD 섹션 | 기능 | 구현 상태 | Gap |
|----------|------|----------|-----|
| 3.1 Invite Flow | 추천→검토→초대→수락 | ✅ 완성 | - |
| 3.2 Email Invite | 이메일 초대 + 24시간 만료 | ✅ 완성 | - |
| 4.1 Permission Structure | Super Admin/Admin/Member | ✅ 완성 | - |
| 5.1 Member Profile | 프로필 구조 + 편집 | ⚠️ 부분 | LinkedIn URL 필수 검증 미적용 |
| 5.2 Member Directory | 검색/필터/프로필 조회 | ⚠️ 부분 | Anti-Scraping 전체 미구현 (분당/일간/IP) |
| 5.3 Position Board | 포지션 CRUD + 관심 표시 | ✅ 완성 | - |
| 5.4 Peer Coffee Chat | 글 작성→신청→선택 | ⚠️ 부분 | 연락처 공개 미구현, 수수료 원칙 미반영 |
| 5.5 CEO Coffee Chat | 세션 생성→신청→선택 | ⚠️ 부분 | Head Hunting Agreement 미구현, 연락처 공개 미구현 |
| 5.6 Community Board | 6카테고리 + 익명 + 신고 | ⚠️ 부분 | 모더레이션 도구 미흡, "이 회사 어때요?" Privacy 강제 없음 |
| 7. Privacy Model | 데이터 분리 | ⚠️ 부분 | 정책만 존재, RLS 수준 기술적 강제 미구현 |
| 8. Analytics | Mixpanel | ❌ 미구현 | 사용자 행동 추적 불가 |
| 9. CLI Interface | vcx jobs/coffee/connect | ❌ 미구현 | Phase 3 범위 |

#### 2. 사용자 여정 Gap 분석

**🔴 Critical (런칭 전 필수)**

| Gap | 설명 | 영향 |
|-----|------|------|
| 온보딩 플로우 부재 | 초대 수락 후 프로필 작성 유도 없음. 코드 0줄 (완전 신규 개발) | 빈 프로필 멤버 양산 → 디렉토리/커피챗 가치 급감 |
| 커피챗 매칭 후 연락처 교환 | 수락 후 다음 단계 없음 | **핵심 가치 전달 실패** — 커피챗 존재 이유 소멸 |
| 알림 시스템 전면 부재 | DB 테이블만 존재, RLS 버그로 insert 불가, 조회 UI 없음 | 사용자가 신청/수락 여부를 알 방법 없음 |
| 이메일 알림 미구현 | 중요 이벤트(커피챗 신청/수락) 이메일 미발송 | 재방문 유도 불가 |

**🟡 Important (런칭 후 1개월 내)**

| Gap | 설명 | 영향 |
|-----|------|------|
| Analytics 미연결 | 사용자 행동 데이터 수집 불가 | 제품 개선 의사결정 불가 |
| LinkedIn 필수 검증 | PRD 5.1 명시, 미적용 | 커리어 검증 신뢰도 하락 |
| CEO Head Hunting Agreement | PRD 5.5 명시, 세션 생성 시 약관 동의 없음 | 수수료 분쟁 위험 |
| 커뮤니티 좋아요/반응 | 게시글 피드백 수단 없음 | 참여도 측정 불가 |
| Privacy Model 기술 강제 | "이 회사 어때요?" 카테고리 데이터의 채용 활용 차단이 정책만 존재 | 법적/신뢰 리스크 |

#### 3. 단위별 제품 완성도 점수 (Architect/Critic 검증 반영)

> 점수 기준: 기능 완성 30% + UX 완성 25% + 비즈니스 로직 완결성 25% + 핵심 가치 전달 20%

| 단위 | 기능 완성 | UX 완성 | 비즈니스 로직 | 핵심 가치 전달 | 종합 점수 |
|------|----------|---------|-------------|-------------|----------|
| **Auth & Invite** | 100% | 85% | 95% | 90% | **93점** |
| **Admin Panel** | 95% | 85% | 85% | 85% | **88점** |
| **Member Directory** | 85% | 80% | 70% | 75% | **78점** |
| **CEO Coffee Chat** | 85% | 75% | 55% | 40% | **65점** |
| **Peer Coffee Chat** | 85% | 75% | 50% | 35% | **62점** |
| **Community** | 85% | 80% | 65% | 70% | **75점** |
| **Position Board** | 90% | 85% | 85% | 80% | **85점** |
| **알림 시스템** | 5% | 0% | 0% | 0% | **2점** |
| **Analytics** | 0% | 0% | 0% | 0% | **0점** |

**전체 평균: ~61점**

> 커피챗 점수가 크게 하향된 이유: 매칭 후 연락처 교환이 없으면 커피챗의 핵심 가치(직접 연결)가 전달되지 않음. 기능이 있어도 **비즈니스 목적 달성 불가**.

---

## Part 2: 개발 로드맵

### Phase 0: 긴급 버그 수정 (선행 필수, 0.5일)

> **목표:** Sprint 1 시작 전 blocking 결함 제거

| # | 작업 | 구체적 변경 사항 | 우선순위 |
|---|------|----------------|---------|
| 0-1 | **`vcx_notifications` INSERT → admin client 전환** | 알림 insert를 admin client(`src/lib/supabase/admin.ts`)로 전환. `WITH CHECK (true)` INSERT 정책은 과도한 권한이므로 사용하지 않음 (Architect 권고). 모든 알림 insert는 서비스 레이어에서 admin client를 통해 수행 | P0 |
| 0-2 | **Peer 커피챗 알림 insert 추가** | `src/app/api/peer-coffeechat/[id]/applications/[appId]/route.ts` PUT 핸들러에 CEO 커피챗과 동일한 notification insert 로직 추가 | P0 |

### Phase 1: 런칭 준비 Sprint (필수, 1~2주)

> **목표:** Core Member 30명 대상 소프트 런칭 가능 상태

#### Sprint 1-A: 알림 서비스 레이어 + 연결 (Critical)

| # | 작업 | 구체적 변경 사항 | 우선순위 |
|---|------|----------------|---------|
| 1 | **알림 서비스 레이어 생성** | 신규 `src/lib/notification.ts` 생성 — `sendNotification(userId, type, data)` 함수로 인앱 insert + 이메일 발송을 추상화. 알림 타입 enum: `coffeechat_applied`, `coffeechat_accepted`, `coffeechat_rejected`, `peer_chat_applied`, `peer_chat_accepted`, `invite_accepted`. admin client (`src/lib/supabase/admin.ts`) 사용하여 RLS 우회 | P0 |
| 2 | **인앱 알림 API + UI** | 신규 `src/app/api/notifications/route.ts` (GET: 본인 알림 목록, PATCH: 읽음 처리). 신규 `src/components/layout/notification-bell.tsx` GNB에 추가 (`src/components/layout/gnb.tsx` 수정). 미읽음 카운트 배지 표시 | P0 |
| 3 | **이메일 알림 (Resend)** | `src/lib/notification.ts` 내에서 `src/lib/email.ts` 확장. 커피챗 신청/수락/거절 이메일 템플릿 3종. CEO/Peer 양쪽 API route에서 기존 직접 insert를 `sendNotification()` 호출로 교체: `src/app/api/ceo-coffeechat/[id]/applications/[appId]/route.ts`, `src/app/api/peer-coffeechat/[id]/applications/[appId]/route.ts` | P0 |
| 4 | **커피챗 매칭 후 연락처 공개** | `src/app/api/ceo-coffeechat/[id]/applications/[appId]/route.ts` PUT에서 status='accepted' 시 응답에 `contact_email` 포함. `src/app/api/peer-coffeechat/[id]/applications/[appId]/route.ts` 동일 적용. UI: `src/components/coffeechat/application-list.tsx`와 `peer-application-list.tsx`에서 수락 상태일 때 이메일 표시 | P0 |
| 5 | **온보딩 프로필 작성 유도** | 신규 `src/app/(protected)/onboarding/page.tsx` 생성. `src/app/api/invites/accept/route.ts` 응답에 `redirectTo: '/onboarding'` 추가. `src/components/auth/invite-accept-form.tsx`에서 리다이렉트 처리. 프로필 필수 항목(이름, 회사, 직함, LinkedIn) 작성 후 `/directory` 이동 | P0 |

#### Sprint 1-B: 보안 & 안정성 (1-A와 병렬 진행)

| # | 작업 | 구체적 변경 사항 | 우선순위 |
|---|------|----------------|---------|
| 6 | **Rate Limiting → Upstash Redis** | `npm install @upstash/ratelimit @upstash/redis`. `src/lib/rate-limit.ts` 완전 교체 — 인메모리 Map → Upstash Redis sliding window. 환경변수: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. `src/middleware.ts`에 전역 rate limit 적용 (분당 60회/IP 기본, `/api/invites/*` 분당 5회) | P0 |
| 7 | **Anti-Scraping** | `src/middleware.ts`에 디렉토리 라우트 전용 rate limit 추가. PRD 5.2 기준: 1분 10 프로필 → 경고 응답, 1분 20 프로필 → 세션 차단, 1일 50 프로필 → 접근 제한. Upstash Redis의 sliding window + fixed window 조합 | P1 |
| 8 | **보안 헤더** | `next.config.mjs`에 `headers()` 추가: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, 기본 CSP | P1 |
| 9 | **에러 모니터링 (Sentry)** | `npm install @sentry/nextjs`. `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts` 생성. `next.config.mjs`에 `withSentryConfig` 래핑. 환경변수: `SENTRY_DSN`, `SENTRY_AUTH_TOKEN` | P1 |

#### Sprint 1-C: 테스트 (1-A 기능 개발과 동시 진행 — TDD 방식)

| # | 작업 | 구체적 변경 사항 | 우선순위 |
|---|------|----------------|---------|
| 10 | **핵심 도메인 단위 테스트** | `src/__tests__/app/api/` 하위에 directory, ceo-coffeechat, peer-coffeechat, community, positions 각 route handler 테스트 작성. 기존 `src/__tests__/utils/supabase-mock.ts` 패턴 활용. 목표: 각 도메인 GET/POST/PATCH 성공/실패 케이스 | P1 |
| 11 | **알림 시스템 테스트** | `src/__tests__/lib/notification.test.ts` — sendNotification() 단위 테스트. `src/__tests__/app/api/notifications/route.test.ts` — 알림 조회/읽음 API 테스트 | P1 |
| 12 | **E2E 시나리오** | `e2e/auth-flow.spec.ts` (로그인→디렉토리 접근), `e2e/coffeechat-flow.spec.ts` (커피챗 신청→수락→연락처 확인), `e2e/notification-flow.spec.ts` (알림 수신→읽음 처리) | P2 |

### Phase 2: 제품 고도화 (런칭 후 1~2개월)

| # | 작업 | 구체적 변경 사항 | 수락 기준 | 우선순위 |
|---|------|----------------|----------|---------|
| 13 | **Analytics (Mixpanel)** | `npm install mixpanel-browser`. `src/lib/analytics.ts` 생성. `src/app/providers.tsx`에서 초기화. 핵심 이벤트: page_view, coffeechat_applied, coffeechat_accepted, position_interested, community_posted | Mixpanel 대시보드에서 일간 이벤트 수집 확인 | P1 |
| 14 | **Admin 모더레이션 도구** | `src/app/(protected)/admin/reports/page.tsx` 신규. 신고 목록 조회, 게시글/댓글 숨김 처리, 회원 경고/제재 기능. `src/app/api/community/[id]/report/route.ts` 확장 | Admin이 신고된 글을 숨김 처리하고 회원에게 경고 발송 가능 | P1 |
| 15 | **CEO Head Hunting Agreement** | `src/components/coffeechat/session-form.tsx`에 약관 동의 체크박스 추가. `vcx_ceo_coffee_sessions` 테이블에 `agreement_accepted_at` 컬럼 추가 (마이그레이션) | CEO 세션 생성 시 동의 없이는 제출 불가 | P1 |
| 16 | **LinkedIn 필수 검증** | `src/components/directory/profile-edit-form.tsx`에 LinkedIn URL 필수 + 형식 검증 (Zod). 온보딩 페이지에서도 동일 적용 | LinkedIn URL 없이 프로필 저장 불가 | P1 |
| 17 | **Privacy Model 기술 강제** | RLS 수준에서 `community_posts` 데이터에 대한 채용 관련 API 접근 차단. "이 회사 어때요?" 카테고리 게시글의 작성자 정보를 corporate_users에게 노출 차단 | Corporate 사용자가 커뮤니티 작성자 식별 불가 | P1 |
| 18 | **프로필 완성도 게이지** | `src/components/directory/profile-completion.tsx` 신규. 항목별 가중치: 이름 10%, 회사 15%, 직함 15%, 분야 15%, 경력 10%, 바이오 15%, LinkedIn 20% | 프로필 완성도 % 표시, 미완성 항목 하이라이트 | P2 |
| 19 | **커뮤니티 좋아요/반응** | `community_reactions` 테이블 추가 (마이그레이션). 게시글별 반응 카운트 표시 | 게시글에 공감 버튼 동작, 카운트 표시 | P2 |
| 20 | **검색 개선** | `src/app/api/directory/route.ts` 정렬 로직에 관련성 가중치 추가 (FTS rank + is_open_to_chat 우선) | 검색 결과가 관련성 순으로 정렬 | P2 |

### Phase 3: 확장 & 지능화 (3~6개월)

| # | 작업 | 설명 | 수락 기준 | 우선순위 |
|---|------|------|----------|---------|
| 21 | **매칭 추천 알고리즘** | 커피챗 상대 추천 (분야/경력/관심사 기반) | 추천 정확도 사용자 만족도 70%+ | P2 |
| 22 | **수수료/Self Introduction Reward 시스템** | PRD 5.4 수수료 원칙, Self Introduction Reward 비즈니스 로직 | 채용 성사 시 자동 수수료 추적 | P2 |
| 23 | **AI 이력서 분석** | 프로필 기반 포지션 매칭 | - | P3 |
| 24 | **CLI Interface** | `vcx jobs`, `vcx coffee`, `vcx connect` | - | P3 |
| 25 | **데이터 분석 대시보드** | Admin용 사용 통계, 매칭 성과 | - | P2 |

---

## Part 3: 의존성 & 실행 순서

```
[Phase 0] 긴급 버그 수정 (0.5일) ──────────→ 모든 Sprint의 선행 조건
     │
     ├── 0-1. notifications RLS 수정 (독립)
     └── 0-2. Peer 알림 insert 추가 (독립)

[Sprint 1-A] 알림 서비스 + 연결 ───────────→ 런칭 가능
     │
     ├── 1. 알림 서비스 레이어 (선행 — 2,3,4가 의존)
     ├── 2. 인앱 알림 API + UI (1에 의존)
     ├── 3. 이메일 알림 (1에 의존)
     ├── 4. 연락처 공개 (1,3에 의존 — 수락 알림 후 공개)
     └── 5. 온보딩 (독립 — 1-A와 병렬 가능)

[Sprint 1-B] 보안 (1-A와 병렬 진행) ──────→ 런칭 안정성
     │
     ├── 6. Upstash Redis Rate Limit (독립, 최우선)
     ├── 7. Anti-Scraping (6에 의존 — Redis 인프라 공유)
     ├── 8. 보안 헤더 (독립)
     └── 9. Sentry (독립)

[Sprint 1-C] 테스트 (1-A와 동시 진행, TDD) ─→ 품질 보증
     │
     ├── 10. 도메인 단위 테스트 (1-A 기능과 병행)
     ├── 11. 알림 테스트 (1-A #1,2 완료 후)
     └── 12. E2E 테스트 (1-A, 1-B 완료 후)
```

**병렬화:**
- Phase 0의 0-1, 0-2는 동시 진행
- Sprint 1-A의 5(온보딩)는 1,2,3과 병렬 가능
- Sprint 1-B 전체는 1-A와 병렬 가능
- Sprint 1-C의 10(도메인 테스트)은 1-A와 동시 진행 (TDD)

---

## 수락 기준

### Phase 0 완료 기준
- [ ] `vcx_notifications` INSERT가 RLS 에러 없이 성공 (마이그레이션 013 적용)
- [ ] Peer 커피챗 수락 시 notification insert 확인

### Phase 1 완료 기준
- [ ] `sendNotification()` 함수가 인앱 + 이메일 동시 발송
- [ ] GNB 알림 벨에 미읽음 카운트 표시, 클릭 시 알림 목록 표시
- [ ] 커피챗(CEO/Peer) 신청/수락/거절 시 상대방에게 이메일 도착
- [ ] 수락된 커피챗에서 상대방 이메일 확인 가능 (UI에 표시)
- [ ] 초대 수락 → `/onboarding` 자동 이동 → 프로필 작성 → `/directory` 이동
- [ ] Upstash Redis 기반 Rate Limiting 동작 (분당 60회/IP, 초대 API 분당 5회)
- [ ] 디렉토리 프로필 조회 제한 동작 (1분 10회 경고, 20회 차단, 1일 50회 제한)
- [ ] 보안 헤더 4종 응답에 포함 (HSTS, X-Frame, X-Content-Type, Referrer-Policy)
- [ ] Sentry에 클라이언트/서버 에러 수집 확인
- [ ] 핵심 도메인 테스트 커버리지 70%+ (`npm test` 통과)
- [ ] `npm run build` 에러 제로
- [ ] `npm run lint` 에러 제로

### Phase 2 완료 기준
- [ ] Mixpanel 대시보드에서 일간 이벤트 수집 확인
- [ ] Admin이 신고된 글을 숨김 처리 가능
- [ ] CEO 세션 생성 시 Head Hunting Agreement 동의 필수
- [ ] LinkedIn URL 없이 프로필 저장 불가
- [ ] Corporate 사용자가 커뮤니티 작성자 식별 불가 (Privacy Model)
- [ ] 프로필 완성도 % 게이지 표시

---

## 리스크 & 완화

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| ~~Rate Limiting 인메모리 한계~~ → **Upstash Redis 필수 도입** | - | - | Phase 1에서 즉시 전환 (무료 티어 10,000 req/day) |
| Resend 이메일 일일 한도 (무료: 100/일) | 중 | 높 | 초기 30명 규모에서는 충분. Core 60명 도달 전 유료 전환 |
| Resend 이메일 스팸 분류 | 중 | 높 | 커스텀 도메인 SPF/DKIM 설정 (Resend 가이드 따라 DNS 레코드 추가) |
| 온보딩 미완성 시 빈 프로필 양산 | 높 | 높 | 온보딩을 Phase 1 P0으로 배치. 프로필 필수 항목 미작성 시 서비스 이용 제한 |
| 알림 서비스 레이어 복잡도 | 중 | 중 | MVP: 이메일 + 인앱 2채널만. Push/SMS는 Phase 2+ |
| Supabase RPC 호출 비용 (미들웨어 매 요청 DB 호출) | 중 | 중 | 트래픽 증가 시 세션 캐싱 검토. 초기 30명에서는 문제 없음 |
| E2E 테스트 환경 구성 | 중 | 낮 | Supabase 로컬 인스턴스 + Playwright |

---

## Changelog

### v2.0 (Architect + Critic 피드백 반영)

**Architect 피드백 반영:**
- [적용] `vcx_notifications` INSERT RLS 정책 누락 → Phase 0 긴급 수정으로 추가
- [적용] Vercel Serverless 인메모리 Rate Limiting 무효 → Upstash Redis 필수 전환으로 격상
- [적용] 도메인별 완성도 점수 하향 조정 (Peer CoffeeChat 85%→65%, CEO CoffeeChat 85%→70% 등)
- [적용] 알림 서비스 레이어 추상화 (`src/lib/notification.ts`) Sprint 1-A 선행 작업으로 추가
- [적용] 의존성 그래프 수정 — Phase 0 선행, 알림 레이어가 2/3/4의 의존 관계
- [적용] Peer 커피챗 알림 비대칭 → Phase 0에서 즉시 수정
- [적용] Privacy Model 기술 강제 → Phase 2에 명시적 작업으로 추가

**Critic 피드백 반영:**
- [적용] 모든 작업에 구체적 파일 경로와 변경 사항 명시 (구체성 5→8)
- [적용] Phase 2에 수락 기준 추가 (검증가능성 7→8)
- [적용] 누락된 PRD 갭 추가: LinkedIn 필수 검증, 수수료 원칙, Privacy Model 강제, Anti-Scraping 일간 제한
- [적용] CPO 점수 산출 기준 명시 (4가지 가중치) 및 하향 조정
- [적용] 추가 리스크: 이메일 deliverability, 빈 프로필 양산, Supabase RPC 비용
- [적용] Sprint 1-C를 1-A와 동시 진행 (TDD 방식)으로 변경
