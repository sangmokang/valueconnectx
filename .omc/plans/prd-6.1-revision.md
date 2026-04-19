# ValueConnect X — PRD v6.1 (2026-04-19 개정, rev 2)

> **본 문서는 `docs/prd6.0.md`를 대체한다.** v6.0에서 피상적이거나 논리적 결함이 있던 섹션 3(디자인)·섹션 4(엔지니어링)을 CPO/CDO 관점에서 전면 재작성하였고, Member Directory에 대한 공개 전략을 신고/평판 시스템과 함께 재설계하였다.
> 기준일: 2026-04-19. 저자: Prometheus (Strategic Planning). Review: Critic loop (rev 2에서 스키마/경로 불일치 및 운영 가드 수정).

---

## 0. v6.0 대비 변경 요약 (Changelog)

| # | 섹션 | v6.0 | v6.1 변경 | 근거 |
|---|------|------|----------|------|
| C1 | §2 Feature 3 (Directory) | 완전 공개 + Anti-Scraping | **Tiered Disclosure + Double Opt-in (peer-chat 기반) + 신고/평판 레이어** 하이브리드 | 스크린샷 기반 유출은 세션 차단으로 막을 수 없음. 반대로 사회적 증명(social proof) 가치는 실재. 두 문제를 *공개 범위 축소 + 평판 필터링*으로 동시 해결 (ADR-001) |
| C2 | §3 Design System | Quiet Luxury 색/폰트 토큰 나열 | **Atomic Design × RSC 구성 원칙 × 360px 반응형 × 접근성 WCAG AA** 완전 재작성 | 토큰만으로는 15+ 페이지의 품질 편차를 제어 불가 (v6.0 §0.1 '서브페이지 디자인 붕괴' 문제의 근본 원인) |
| C3 | §4 Data Architecture | 4개 테이블 피상 설명 + Anti-Scraping Redis | **실스키마 기반 ERD + Event Sourcing + 태그 이원화 + Feature Store + RLS SQL + PII 워크플로우 + 확장성 임계점** | CDO 관점에서 Phase 3 AI Match의 학습 데이터를 Phase 1에 '심는' 설계가 필요 |
| C4 | §1.3 수익 모델 | '25% 수수료' 명시 | **수수료율은 UI/PRD 비노출, 내부 문서에만** (project memory 기준) | 2026-04-02 서비스 메시징 오버홀과 일치 |
| C5 | §2 Feature 순서 | 큐레이션 > 라운지 > Directory | 현재 코드(2026-04-02 전 페이지 recode 완료 + AI Brief 2026-04-05)를 기준점으로 재배치 | sprint progress 검증 |
| C6 | §4.4 Anti-Scraping | Upstash + Cloudflare WAF | **유지하되 '허들' 수준으로 기대치 조정**. 본질적 방어는 §2 Feature 3 재설계에 위임 | 스크린샷/느린 스크레이퍼에 기술적 차단은 불가능 — 사회적 설계로 해결 |
| C7 | §5 Roadmap | Phase 1/2/3 명목 나열 | **"이미 완료"/"진행 중"/"신규" 구분 + MUST/SHOULD/DEFER 분리** 및 마이그레이션 번호 할당(022~029) | 중복 번호(013, 014) 회피 + Phase 1 스코프 크립 방지 |
| C8 | §6 | '의사결정 정리' | **ADR 4개 (Decision / Context / Consequences / Alternatives)** 포맷으로 재작성 | 추후 번복·재검토 추적성 확보 |
| C9 **(rev 2)** | §4.1 ERD, §4.6 RLS, §3.4 인벤토리 | 가상 테이블명/잘못된 atom 경로 | **실제 스키마 테이블명(peer_coffee_chats, community_posts 등)으로 교정. Atom 인벤토리는 실제 `src/components/ui/` 파일만 ✅, 나머지는 🆕** | migration 001/006/007/008/009/018/020 verified |
| C10 **(rev 2)** | ADR-001, §4.6 | CEO chat 수락이 Level 2 트리거 (잘못) | **Level 2 트리거 = peer_coffee_applications.status='accepted'만**. CEO↔멤버는 asymmetric이라 해당 없음 | CEO 세션은 corporate_user host, 다수 멤버 applicant — 멤버↔멤버 관계 형성 아님 |

---

## 1. 비즈니스 전략 (재검토)

### 1.1 핵심 명제 — 변하지 않는 중심

**"시대의 인재들이 서로를 알아보는 Private Network."**
회사에 한두 명 있을까 말까한 사람들이 *스스로 모이는 이유*를 설계한다. 매칭은 결과이지 목적이 아니다.

### 1.2 비즈니스 구조 — 3-Layer Funnel

| 레이어 | 기능 | 역할 | 수익 기여 |
|-------|------|------|---------|
| **Hook** — 채용시장 큐레이션 피드 | Cold Start 해결. 네트워크 없이도 개인적 가치 발생 | 유입 + 리텐션 트리거 | 간접 |
| **Sticky** — 커뮤니티 라운지 + Member Directory | 인재가 머무는 이유 (사회적 증명 + 피어 대화) | 이탈 방지, LTV 상승 | 간접 |
| **Revenue** — CEO / Peer Coffee Chat + AI Brief | 연결 → 이직 성사 | **직접** (placement fee, 내부만) |

### 1.3 수익 모델 (UI 비노출 원칙)

| 수익원 | 내부 구조 | UI 노출 |
|-------|---------|--------|
| Placement Fee | 성사 시 고정 수수료. 퍼센트·구체액은 코드·PRD·UI에서 일절 노출 금지 (2026-04-02 메시징 원칙) | ❌ 노출 금지 |
| Self Introduction Reward | 본인 추천 성사 시 고정 보상 | 멤버에게는 '채용 연결 보상'으로 표기 |
| Peer Referral Reward | 동료 추천 성사 시 프리미엄 보상 | '동료 추천 보상' |
| Premium Corporate Account (Phase 3) | CEO Chat 우선권 + Directory 열람 등급 상향 | Phase 3 진입 시 기획 |

### 1.4 Cold Start 전략 — '큐레이션 피드'는 이미 출시됨

2026-04-02 기준으로 Curation Feed(Feature 6)는 `src/app/(protected)/feed/` + 마이그레이션 `020_vcx_curation_feed.sql`로 구현 완료 (`vcx_feed_items`, `vcx_feed_interests`, `vcx_feed_responses`, `vcx_feed_subscriptions`). v6.1에서는 이 피드의 **구독 자동화(Phase 2)** 와 **자연어 구독(Phase 3)** 을 순차 확장한다.

### 1.5 커뮤니티 라운지 — 2026-04-02 recode 완료, 6 카테고리 운영 중

독서·이직·회사생활·리더십·생산성·가벼운 이야기. `community_posts.category` 값은 `career | leadership | salary | burnout | productivity | company_review` (migration 009 CHECK). `company_review` 카테고리는 privacy model(`015_vcx_privacy_model.sql`)로 기업 사용자 작성자 마스킹 적용됨.

---

## 2. Product Requirements (Feature별, 우선순위 재정렬)

각 Feature는 **현재 상태 → 변경 사항 → Phase → 수락 기준(measurable)** 형태로 기술한다.

### Feature 1: Onboarding Flow (즉시 품질 수정)

**현재 상태**: `src/app/(protected)/onboarding/` 2-step 폼 + nickname(2026-04-02). `vcx_get_user_info` RPC 4개 필드 누락(019 마이그레이션 미적용) — **P0 블로커**.

**v6.1 변경 사항**:
- 019 마이그레이션을 **Phase 1 Week 1 내 적용 완료** (스프린트 첫 티켓)
- 초대 수락 시 받은 `name` / `linkedin_url`을 온보딩 1단계에서 재요청하지 않도록 서버에서 `vcx_invites`에 저장된 값이 있으면 pre-fill (자동으로 `value` prop 주입)
- `/onboarding` 경로 GNB 숨김: 이미 `src/components/layout/gnb-visibility.tsx`에서 처리되어 있다면 회귀 테스트 추가, 아니면 1줄 수정
- 진행률 initial value = `vcx_invites` 사전 수집 필드 포함 비율 (≥ 20%)

**수락 기준**:
- [ ] 019 마이그레이션 production 적용됨 (Supabase SQL editor 로그 스크린샷)
- [ ] 온보딩 1단계에서 이름·LinkedIn URL이 이미 채워진 상태로 렌더 (Playwright E2E)
- [ ] 진행률이 0%가 아닌 ≥20%로 시작 (스냅샷)
- [ ] Mixpanel `onboarding_step_enter` / `onboarding_step_abandon` 이벤트 로깅 (Phase 2 #13 의존)

### Feature 2: Curation Feed (운영 강화)

**현재 상태**: 구현 완료. 관심 칩 + Yes/Skip 응답 + 뉴스레터 구독.

**v6.1 변경 사항**:
- **어드민 수동 큐레이션 루틴 주 1회 정착** — Week 1~4 수동 발송, 오픈율/클릭율 측정(`vcx_feed_newsletter_metrics` 테이블 신규, migration **029** — 022는 Directory가 선점)
- Phase 2: Claude API 기반 자동 필터링 파이프라인 (`/api/admin/feed/curate` 라우트 + 크론)

**수락 기준**:
- [ ] 주간 오픈율 ≥ 35%, 클릭율 ≥ 8% (invite-only 표준 대비)
- [ ] 발송 실패/바운스 1% 미만

### Feature 3: Member Directory — 전면 재설계 (HIGH PRIORITY)

> 이 Feature가 v6.1의 중심 결정이다. ADR-001 참조.

**현재 상태**: `src/app/(protected)/directory/` + `src/components/directory/{member-card,member-filters,member-profile,profile-completion,profile-edit-form}.tsx`. 컬럼: `profile_visibility` (members_only|corporate_only|all, migration 014), `is_open_to_chat`. 전면 공개 + Anti-Scraping 가정.

**v6.1 변경 사항** — **Tiered Disclosure + Double Opt-in (peer-chat accept) + Reputation Layer** 하이브리드

```
┌──────────────────────────────────────────────────────────────┐
│  Directory = "누가 있는지"(집계) + "누구와 연결될지"(명시적) │
└──────────────────────────────────────────────────────────────┘

Level 0 (Public to all members)  →  집계 통계 + 익명 하이라이트
   "이번 주 3명의 시리즈 A 창업자가 합류했습니다"
   "당신의 관심사(딥테크)와 겹치는 멤버 12명"

Level 1 (Semi-revealed)          →  직군+산업+연차 (이름/회사 마스킹)
   "파이낸스 / 시리즈 B CFO / 12년차"
   본인이 profile_visibility='members_only' 이상이면 노출

Level 2 (Full profile)           →  **peer_coffee_applications 상호 수락 후** 공개
   - A가 B의 peer_coffee_chats 글에 신청 → B(author)가 accept
   - 또는 B가 A의 글에 신청 → A가 accept
   → 이 시점부터 A↔B 양방향 풀네임·회사·LinkedIn 상호 공개
   ※ CEO Coffee Chat 수락은 asymmetric (corporate↔member)이므로 Level 2 트리거에 **포함하지 않는다**
```

**왜 이 방식인가** (사용자 우려에 대한 직접 응답):

| 사용자 우려 | v6.0 답 | v6.1 답 |
|----------|-------|-------|
| "스크린샷 기반 유출은 막을 수 없다" | Anti-Scraping만 배치 (실효성 제한) | **맞다. 기술로는 근본 방어 불가.** 따라서 공개 기본값을 줄여 유출 시의 손해를 최소화 (Level 0 = 통계, Level 1 = 마스킹). 사회적 증명은 Level 0/1로 충분 달성 |
| "안정환/박지성 급이 있다는 사회적 증명" | 전면 공개 | **Level 0에서 확보** — "시리즈 B+ CEO 5명이 이번 달 참여" 같은 집계 카피가 이름 나열보다 설득력 + 유출 무해 |
| "톱티어라도 빌런일 수 있다 — 신고로 검증?" | 없음 | **ADR-001 Reputation Layer** — `vcx_member_reports` 테이블, 3회 이상 근거 있는 신고 시 tier 강등 + Directory에서 hide, moderator 큐 (community_reports와는 scope 분리) |

**Phase 1 (즉시 구현)**:
- Level 0 집계 위젯 + Level 1 마스킹 카드 + Level 2 upgrade (기존 `peer_coffee_applications` accept 흐름 재사용)
- `vcx_member_reports` 테이블 + Admin moderation queue (migration **023**) — 기존 `community_reports`(post/comment 대상)와 **scope를 분리**해 별도 테이블 신설
- Directory 기본값: 모든 신규 멤버 `profile_visibility='members_only'`, **Level 1 마스킹 적용**. `full_reveal_on_mutual_accept=TRUE` 신규 컬럼

**Phase 2**:
- 상호 관심사 매칭 위젯 ("5명이 당신의 '핀테크' 관심사와 겹칩니다")
- 신고 자동 triage (LLM 사전 분류)

**수락 기준**:
- [ ] 로그인 상태에서 Directory 첫 화면이 **집계 통계 + 관심사 겹침** 중심 (이름 나열 아님)
- [ ] Level 1 카드에 이름·회사·LinkedIn이 마스킹됨 (Playwright assertion)
- [ ] **peer-chat 상호 수락 전까지** Level 2 필드 API가 null 반환 (RLS 테스트)
- [ ] CEO chat 수락만으로는 Level 2 unlock 되지 않음 (RLS 역테스트)
- [ ] `vcx_member_reports` 3회 확정 시 `member_tier` 자동 강등 배치 스크립트
- [ ] Anti-Scraping은 **보조 방어선**으로 유지 (세션 50건/일 하드 리밋)

### Feature 4: Position Board — 유지

**현재 상태**: `positions` + `position_interests` (migration 007, 018). MATCH 스코어 + inline expand + 관심/비관심 + admin CRUD.

**v6.1 변경**: **변경 없음**. Phase 3 AI Match Engine의 학습 피처로 `position_interests.interest_type`(interested/not_interested/bookmark) 사용.

**수락 기준**: 기존 유지.

### Feature 5: Peer Coffee Chat — Level 2 트리거 역할 승격

**현재 상태**: `008_vcx_peer_coffeechat.sql` → `peer_coffee_chats` (author_id → auth.users) + `peer_coffee_applications` (chat_id → peer_coffee_chats, applicant_id → auth.users, status: pending/accepted/rejected).

**v6.1 변경**:
- 본 테이블의 `status='accepted'` 이벤트가 **Directory Level 2 공개의 유일한 트리거**로 정식화 (ADR-001)
- AI Brief 적용 확대 (현재는 CEO Chat만) — Phase 2 검토

### Feature 6: CEO Coffee Chat + AI Brief — 유지 (최근 기능)

**현재 상태**: 2026-04-05 AI Brief 시스템 라이브. `vcx_ceo_coffee_sessions` (host_id → vcx_corporate_users) + `vcx_coffee_applications` (applicant_id → vcx_members). `021_vcx_ai_brief_feedback.sql` 적용됨. Anthropic Claude API. Post-session feedback(culture fit, would-connect-again, brief helpfulness).

**중요 제약** (ADR-001): CEO↔member는 **asymmetric** (기업 host가 멤버 applicant를 accept). 동일 도메인 간 peer 관계가 아니므로 **Directory Level 2 reveal 트리거에서 제외**.

**v6.1 변경**:
- AI Brief 품질 KPI 추적: brief helpfulness 평균 ≥ 4.0/5 (현재 데이터 수집 중)
- `ANTHROPIC_API_KEY` 누락 시 graceful degradation 회귀 테스트(`eab4597` 이후)

### Feature 7: Community Lounge — 유지 + 모더레이션 강화

**현재 상태**: 6 카테고리. 익명/이모지 리액션. `015_vcx_privacy_model.sql` — `company_review`는 기업 사용자에게 작성자 마스킹. `community_reports`는 **이미 migration 009에 존재** (post/comment 대상 신고).

**v6.1 변경**:
- Phase 2 #14 Admin moderation tools 완성 (Block-user / Soft-delete / Report review 워크플로우)
- `community_posts.status` 상태 머신: 현 `active | hidden | deleted` (migration 009) → `active | pending_review | hidden | deleted` 로 확장. `pending_review` 추가 시 기존 CHECK constraint 교체 필요 (migration 029+α)

### Feature 8 (신규): Reputation / Reports System

Feature 3의 핵심 부속이지만 다른 영역(CEO Chat, Peer Chat)에도 적용되므로 독립 feature로 승격.

- 신규 `vcx_member_reports` 엔티티 (reportee_id, reporter_id, context_type, context_id, reason, evidence, status) — **멤버 단위 평판**
- 기존 `community_reports` (post/comment 대상)와 scope 분리. 관계: `community_reports.reviewed_action='tier_demote'` 가 확정되면 어드민이 `vcx_member_reports` 로 승격(transfer) 하는 정책
- Moderator workflow: Admin → review → {dismiss, warn, tier_demote, exit}
- 자동 임계: 서로 다른 3인 이상의 confirmed report → tier 강등 + Directory hide (immediate)

---

## 3. Design System — Atomic Design × React × Responsive

### 3.1 Atomic Design 계층

VCX 디자인 시스템은 아래 5-tier 구조에 명시적으로 매핑한다. 각 tier는 파일 위치·책임·Client/Server 구분·export 규칙이 고정된다.

| Tier | 위치 | 책임 | Client/Server | 예시 |
|-----|------|------|--------------|------|
| **Atoms** | `src/components/ui/*` | 단일 UI 토큰 구현. 상태·비즈니스 로직 없음 | Client (hook 없는 경우 Server) | `button.tsx`, `badge.tsx`, `section-header.tsx`, `gold-line.tsx` (**확인된 기존 4개 전부**) + 신규 `avatar.tsx`, `tag.tsx`, `input.tsx`, `textarea.tsx`, `checkbox.tsx`, `skeleton.tsx`, `empty-state.tsx`, `divider.tsx` |
| **Molecules** | `src/components/ui/` 또는 도메인 하위 | 2~5개 atoms 조합. 단일 목적 | 상황별 | `tag-input.tsx` (Input + Tag[]), `search-bar.tsx` (Input + Button), `category-tab.tsx` (Tab group) |
| **Organisms** | `src/components/{domain}/*` | 도메인 특화 복합 블록. 자체 상태 보유 가능 | Client (대개) | `member-card.tsx`, `member-filters.tsx`, `member-profile.tsx`, `profile-completion.tsx`, `profile-edit-form.tsx` (전부 `src/components/directory/` 기존) + `session-card.tsx`, `position-card.tsx`, `post-card.tsx`, `pre-brief-card.tsx` (기존), `bottom-nav.tsx` (mobile), `gnb.tsx` (기존) |
| **Templates** | `src/components/layout/*` + `src/app/**/layout.tsx` | 페이지 레이아웃 (grid/spacing) + fallback | Server 우선 | `protected-page-wrapper.tsx` (기존), `admin-layout.tsx`, `directory-layout.tsx` |
| **Pages** | `src/app/**/page.tsx` | Route. 데이터 fetch + 템플릿 조합 | Server (기본) | `(protected)/directory/page.tsx` 등 |

**계층 간 규칙**:
1. 하위 tier는 상위 tier를 import **금지** (Atom이 Organism을 참조 X)
2. 동일 tier 간 의존은 허용하되 barrel export 사용 금지 (CLAUDE.md 규칙)
3. 도메인 Organism은 다른 도메인 Organism을 직접 import 금지. 공유가 필요하면 Molecule으로 내려 재배치

### 3.2 React 구성 원칙

| 원칙 | 적용 | 이유 |
|------|------|------|
| **Server Component 기본** | `app/**/page.tsx`, `layout.tsx`, 데이터 fetch 컴포넌트 | Next.js App Router 활용, 번들 크기 최소화 |
| **Client Component는 Interaction Island** | `"use client"`는 상태·이벤트 필요한 최소 단위에만 | 불필요한 hydration 방지 |
| **Compound Components** | `Directory.Card`, `SessionCard.Body/Footer`, `PostCard.Header/Reactions` | 유연한 슬롯 구성, props drilling 제거 |
| **Headless via `@base-ui/react`** | 모든 인터랙션 있는 Atom (Dialog, Popover, Tabs, Select, Switch, Checkbox) | CLAUDE.md: 루트 import 금지, 서브패스 필수 (`@base-ui/react/dialog`) |
| **Controlled + Uncontrolled 듀얼 API** | Form atoms (`Input`, `TagInput`, `Checkbox`) | React Server Actions + 클라이언트 상태 양립 |
| **Zod 스키마 = 단일 진실원** | `src/lib/api/validation.ts`의 스키마를 폼·API·DB 제약에 재사용 | v4 `ZodType` 사용 (CLAUDE.md anti-pattern) |
| **SWR 캐시 규약** | `'/api/' + resource`. `mutate()` 후 revalidate | CLAUDE.md 명시 규약 |

### 3.3 반응형 전략

**모바일 우선(Galaxy S series 360px) → Tablet → Desktop**. Tailwind v4 CSS-first (tailwind.config.ts 생성 금지, CLAUDE.md).

| Breakpoint | min-width | 의도 |
|-----------|-----------|------|
| `default` | 360px | Galaxy S / iPhone SE. 본문 1-column. 모든 CTA ≥ 44px 터치 타겟 |
| `sm:` | 640px | 큰 스마트폰. 카드 간격 확장 |
| `md:` | 768px | 태블릿. 2-column 전환 시작 |
| `lg:` | 1024px | 랩톱. Desktop GNB, 3-column Directory |
| `xl:` | 1280px | 풀 데스크톱. `DESIGN_TOKENS.spacing.container = 1280px` |

**구체 규칙**:
- Safe-area 인셋: `pb-[env(safe-area-inset-bottom)]` 모든 fixed bottom-nav
- `prefers-reduced-motion: reduce` — 모든 트랜지션 `motion-reduce:transition-none`
- 터치 타겟 ≥ 44×44px (WCAG 2.5.5 AAA)
- Hover 효과는 `@media (hover: hover)`로 제한 — 모바일 터치 고착 방지
- 모바일에서만 `BottomNav` 노출, 768px 이상에서 `GNB` 노출 — 조건부 렌더 아닌 `hidden md:block` / `md:hidden`

### 3.4 컴포넌트 인벤토리 (Phase 1 — 25개)

> v6.0 디자인 붕괴의 원인은 공통 atom 부족. 아래 25개를 **먼저 완성한 뒤** 페이지 작업.
>
> **경로 검증 기준** (2026-04-19 rev 2 재확인):
> - `src/components/ui/` 실제 존재: `badge.tsx`, `button.tsx`, `gold-line.tsx`, `section-header.tsx` (4개만 ✅)
> - `src/components/directory/` 실제 존재: `member-card.tsx`, `member-filters.tsx`, `member-profile.tsx`, `profile-completion.tsx`, `profile-edit-form.tsx`
> - **`profile-completion.tsx`는 directory 도메인 Organism이며 ui/ Molecule이 아니다** (v6.1 rev 1에서 오분류했던 항목 수정)

**Atoms (12)** — 목표 위치 `src/components/ui/`
1. `Button` (variants: primary/secondary/ghost/destructive, sizes: sm/md/lg) ✅ 기존
2. `Badge` (tier/status) ✅ 기존
3. `SectionHeader` (eyebrow + title + description) ✅ 기존
4. `GoldLine` (divider with gold accent) ✅ 기존
5. `Avatar` (initial fallback + tier halo) 🆕
6. `Tag` (removable / read-only) 🆕
7. `Input` (text, with label + error + helper) 🆕
8. `Textarea` (auto-grow, char count) 🆕
9. `Checkbox` / `Switch` (base-ui/react 기반) 🆕
10. `Skeleton` (shimmer, sized variants) 🆕
11. `EmptyState` (icon + message + CTA) 🆕
12. `Divider` (horizontal/vertical, dashed/solid) 🆕

**Molecules (7)** — 목표 위치 `src/components/ui/` (도메인 중립)
13. `TagInput` (free-tag, max N, Zod 검증 hook-in) 🆕 — **온보딩·Directory 필터·관심사 구독** 공유
14. `SearchBar` (Directory·Community 공유) 🆕
15. `CategoryTab` (가로 스크롤, base-ui/react Tabs) 🆕
16. `ProgressBar` (단계별 + percentage) 🆕 — onboarding
17. `FilterChipGroup` (다중 선택 칩) 🆕
18. `ContactRevealPrompt` (Level 2 상호 공개 UI) 🆕
19. `FormField` (label + input/textarea + helper + error의 래퍼) 🆕

**Organisms (6, 도메인별 대표)**
20. `MemberCard` (Level 1/2 듀얼 렌더) ✅ 기존 (`src/components/directory/member-card.tsx`) + 개조
21. `ProfileCompletion` ✅ 기존 (`src/components/directory/profile-completion.tsx`) — **directory 도메인 Organism으로 유지**. ui/ 이동 금지 (도메인 특화 로직 포함)
22. `SessionCard` (Coffee Chat) ✅ 기존 (compound 리팩터)
23. `PostCard` (Community) ✅ 기존 (compound 리팩터)
24. `PreBriefCard` ✅ 기존 (2026-04-05)
25. `BottomNav` (mobile) 🆕

> **Note**: `PositionCard` / `MemberFilters` / `MemberProfile` / `ProfileEditForm`도 리팩터 범위에 포함되지만 "대표 6개" 슬롯 한계로 §5 Task #2·#6 하위 작업으로 이관한다.

### 3.5 접근성 & 가독성 (WCAG AA)

| 항목 | 기준 | 검증 |
|------|------|------|
| 본문 대비 | `#555` on `#f5f0e8` → 7.1:1 (AAA) ✅ | axe-core CI |
| 연한 텍스트 | `#888` on `#f5f0e8` → 3.4:1 — **18pt+ 또는 bold 14pt+에서만 사용** (WCAG 1.4.3) | 코드 리뷰 |
| 골드 accent on 크림 | `#c9a84c` on `#f5f0e8` → 2.5:1 — **텍스트로는 금지**, 경계선·아이콘 전용 | ESLint 커스텀 규칙 `no-gold-text`: `className` 문자열에 `text-[#c9a84c]` 또는 `text-accent-gold` 발견 시 에러 (플러그인: `eslint-plugin-vcx-brand`, Phase 1 Task #10 신설) |
| 라인 길이 | 본문 45~75ch (`max-w-prose`) | 템플릿에 강제 |
| 수직 리듬 | `leading-7` 본문 기본. Heading `leading-tight` | Tailwind 공통 클래스 |
| 키보드 내비게이션 | 모든 인터랙션 Tab 도달 + focus-visible | Playwright a11y |
| reduce-motion | `prefers-reduced-motion` 존중 | 글로벌 CSS |
| 폼 에러 | `aria-describedby` + 시각적 붉은 텍스트 + 아이콘 (색 단독 금지) | 컴포넌트 테스트 |

---

## 4. Data Architecture — CDO Review

### 4.1 Entity 모델 (ERD — 실스키마 반영, rev 2)

아래 엔티티 명은 **실제 마이그레이션 파일 기준**이다. v6.0 대비 `activity_events` · `vcx_member_reports` · `tag_canonical` · `match_features` 4개 신설.

```
                       ┌───────────────────┐
                       │ vcx_members       │◄──┐
                       │ (PK id = auth.uid)│   │ endorsed_by
                       └───────────────────┘   │
                          ▲      ▲      ▲      │
                          │      │      └──────┤
          ┌───────────────┘      │             │
          │                      │             │
┌─────────────────────┐ ┌────────────────┐ ┌───┴──────────────┐
│ 🆕 vcx_member_      │ │ position_       │ │ vcx_invites      │
│    reports          │ │ interests       │ │ (PK id,          │
│ (reportee_id,       │ │ (user_id ->    │ │  token_hash UNQ) │
│  reporter_id)       │ │  auth.users)    │ │                  │
└─────────────────────┘ └────────────────┘ └──────────────────┘
                          ▲                       ▲
                          │                       │
                   ┌──────────────┐          ┌────────────────┐
                   │ positions    │          │vcx_corporate_   │
                   │ (no vcx_     │          │_users           │
                   │  prefix)     │          └────────────────┘
                   └──────────────┘                ▲
                          ▲                         │
                          │                         │
        ┌─────────────────┴───────────────┐         │
        │                                 │         │
 ┌──────────────────┐              ┌───────────────┐
 │peer_coffee_chats │              │vcx_ceo_coffee_│
 │(author_id ->    │              │sessions       │
 │ auth.users)     │              │(host_id ->    │
 └──────────────────┘              │ corporate)    │
        │                           └───────────────┘
        │ 1                                 │ 1
        ▼ N                                 ▼ N
 ┌──────────────────────┐         ┌────────────────────┐
 │peer_coffee_          │         │vcx_coffee_         │
 │applications          │         │applications        │
 │(chat_id,             │         │(session_id,        │
 │ applicant_id ->     │         │ applicant_id ->    │
 │ auth.users)         │         │ vcx_members)       │
 │ status: pending/    │         │ status: pending/   │
 │ accepted/rejected   │         │ accepted/rejected  │
 └──────────────────────┘         └────────────────────┘
   │                                      │
   │ (status='accepted'                   │ (CEO accept:
   │  → Directory Level 2)                │  asymmetric,
   │                                      │  NOT Level 2)
   ▼                                      │
 ┌────────────────────┐                   │
 │🆕 activity_events  │◄──────────────────┘
 │ (append-only)      │
 └────────────────────┘
          │
          ▼ daily batch
 ┌────────────────────┐      ┌─────────────────┐
 │🆕 match_features   │      │community_posts  │  (no vcx_ prefix)
 │(Phase 3 input)     │      │community_comments│
 └────────────────────┘      │community_reports│  (이미 존재: 009)
                              │community_       │
                              │ reactions       │  (014)
                              └─────────────────┘
                              ┌─────────────────┐
                              │🆕 tag_canonical │
                              │🆕 member_tag_   │
                              │    mapping      │
                              └─────────────────┘
                              ┌─────────────────┐
                              │vcx_feed_items   │
                              │vcx_feed_interests│
                              │vcx_feed_responses│
                              │vcx_feed_         │
                              │ subscriptions   │ (migration 020)
                              │🆕 vcx_feed_     │
                              │ newsletter_     │
                              │ metrics         │ (migration 029)
                              └─────────────────┘
```

**엔티티 핵심 필드** (선별, 전체는 migration 파일 참조):

| 엔티티 | PK | 핵심 FK | 핵심 인덱스 | RLS 정책 (요약) |
|-------|----|----|---------|------------|
| `vcx_members` | id (= auth.uid) | endorsed_by → members | `(is_active, member_tier, industry)`, `fts GIN` (기존) | Tiered Disclosure RLS (§4.6) |
| `vcx_corporate_users` | id (= auth.uid) | — | — | service_role only select PII |
| `vcx_invites` | **id** uuid PK | invited_by → auth.users | `token_hash` UNIQUE, `(email)` | accepting user only (기존) |
| `positions` (no prefix) | id | created_by → auth.users | `idx_positions_status` (018) | all members select active, admin write |
| `position_interests` (no prefix) | id (+ UNIQUE position_id,user_id) | position_id, user_id | `idx_position_interests_position_id` (018) | self only |
| `vcx_ceo_coffee_sessions` | id | host_id → corporate_users | `idx_coffee_sessions_status_date` | auth read, CEO/founder insert, host update |
| `vcx_coffee_applications` | id (+ UNIQUE session,applicant) | session_id, applicant_id → vcx_members | `idx_coffee_applications_session_status` | applicant/host select, applicant insert, host update |
| `peer_coffee_chats` (no prefix) | id | author_id → auth.users | (none explicit) | all read, author CRUD |
| `peer_coffee_applications` (no prefix) | id (+ UNIQUE chat,applicant) | chat_id, applicant_id → auth.users | (none explicit) | author + applicant read, applicant insert, author update |
| `community_posts` (no prefix) | id | author_id → auth.users | — | active select, author/admin CRUD |
| `community_comments` (no prefix) | id | post_id, author_id | — | active select, author/admin CRUD |
| `community_reports` (no prefix) | id | reporter_id, post_id, comment_id | — | reporter insert, admin select |
| `community_reactions` (014) | id | post_id, member_id | `(post_id, emoji)` | members own |
| `vcx_feed_items/interests/responses/subscriptions` | id | user_id/feed_item_id | (020 내부) | §4 migration 020 |
| **🆕 `activity_events`** | id BIGSERIAL | actor_id | `(actor_id, created_at)`, `(event_type, created_at)` | service_role only (default deny) |
| **🆕 `vcx_member_reports`** | id | reportee_id, reporter_id | `(reportee_id, status)`, `(created_at)` | reporter self-insert, admin review |
| **🆕 `tag_canonical`** | id | — | `(canonical_slug)` UNIQUE | members read, admin write |
| **🆕 `member_tag_mapping`** | (member_id, canonical_id, raw_value) | — | `(member_id)`, `(canonical_id)` | self read, service_role write |
| **🆕 `match_features`** | (member_id, feature_key) | — | `(member_id)`, `(feature_key, updated_at)` | service_role only |
| **🆕 `vcx_feed_newsletter_metrics`** | id | feed_item_id | `(sent_at)` | admin only |

### 4.2 Event Sourcing / Activity Feed — **택일: `activity_events` 도입 + Mixpanel dual-write**

v6.0은 분석 데이터를 Mixpanel에만 의존했다. CDO 관점에서 **자체 append-only event store** 를 함께 두는 것이 필수다:

1. **AI Brief의 context**: 세션 상대방의 최근 활동(관심 표시한 포지션, 커뮤니티 참여 카테고리)을 모델에 공급 — Mixpanel은 server-side 조회 비용·지연 큼
2. **Phase 3 AI Match Engine의 학습 데이터**: Mixpanel은 export가 느리고 schema evolution에 취약. Postgres append-only는 `pg_partman` 월별 파티셔닝으로 장기 유지 가능
3. **데이터 주권**: Mixpanel은 GDPR 삭제·감사 로그 이슈. 내부 store는 `vcx_anonymize_member()`로 즉시 삭제 가능

**소스 오브 트루스 (Source-of-Truth)**:
> **Supabase `activity_events`는 source of truth이다. Mixpanel은 analytics-only mirror.**
> 프론트엔드에서 이벤트 발생 시 (a) 서버 API → `activity_events` INSERT 가 먼저, (b) 응답 확인 후 클라이언트에서 Mixpanel track. Mixpanel 실패는 경고 로그만.
> **Reconciliation**: 일 1회 `pg_cron` 배치가 `event_type × date` 기준 카운트를 Mixpanel Query API와 비교. 차이 > 2%이면 Sentry 알림.

**스키마 (migration 024)** — 아래는 목표 형태. pg_partman 가드 §5 참고.

```sql
CREATE EXTENSION IF NOT EXISTS pg_partman WITH SCHEMA extensions;

CREATE TABLE activity_events (
  id          BIGSERIAL,
  actor_id    UUID,                                 -- nullable (anonymize 대응)
  actor_type  TEXT NOT NULL CHECK (actor_type IN ('member','corporate','system')),
  event_type  TEXT NOT NULL,                        -- e.g. 'position_interest_add','peer_chat_accept'
  context     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id, created_at)                      -- 파티션 키 포함 필수
) PARTITION BY RANGE (created_at);

-- pg_partman: monthly (available 시)
-- SELECT partman.create_parent('public.activity_events','created_at','native','monthly');

CREATE INDEX idx_act_actor_time ON activity_events (actor_id, created_at DESC);
CREATE INDEX idx_act_type_time  ON activity_events (event_type, created_at DESC);

ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
-- no policy = default deny for authenticated; service_role bypasses RLS
```

**Mixpanel dual-write 규칙**:
- 구조화 비즈니스 이벤트(수락, 신청, 관심 표시, 신고 등) → 두 곳 모두
- 퍼널(page_view, button_click, scroll_depth) → Mixpanel only (활동 feed에 저장 안 함)
- PII는 `context` JSON 에서 제외 (reportee_id 같은 uuid는 허용, email/linkedin은 금지)

### 4.3 태그 이원화 — raw + canonical + cost 가드 (rev 2)

v6.0의 `interest_tags TEXT[]`는 Phase 1엔 OK지만, 300명에서 붕괴한다 ('딥테크' vs '딥 테크' vs 'deep tech' vs 'DeepTech'). **2-layer 시스템**을 지금 심는다. **단 edge function 비용·장애 가드가 필수**.

```sql
-- Layer 1: raw (기존 유지, members.interest_tags TEXT[])
-- Layer 2: canonical (migration 025)
CREATE TABLE tag_canonical (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_slug  TEXT NOT NULL UNIQUE,     -- 'deeptech'
  display_ko      TEXT NOT NULL,            -- '딥테크'
  display_en      TEXT,
  category        TEXT NOT NULL CHECK (category IN ('industry','function','stage','skill','topic')),
  synonyms        TEXT[] NOT NULL DEFAULT '{}',
  usage_count     INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tag_canonical_synonyms ON tag_canonical USING gin(synonyms);

CREATE TABLE member_tag_mapping (
  member_id     UUID NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  canonical_id  UUID NOT NULL REFERENCES tag_canonical(id) ON DELETE CASCADE,
  raw_value     TEXT NOT NULL,
  confidence    NUMERIC(3,2) NOT NULL DEFAULT 1.00,
  PRIMARY KEY (member_id, canonical_id, raw_value)
);
```

**운영 흐름 + 가드 (Phase 2로 `normalize-tags` edge fn 이동, Phase 1은 테이블만 생성)**:
1. 멤버가 자유 태그 입력 → `vcx_members.interest_tags`에 raw 저장 (즉시)
2. **(Phase 2)** Edge function `normalize-tags` — Claude API로 canonical 매핑
3. 매칭·검색·분석은 `member_tag_mapping`을 통해 canonical 조인
4. 어드민 UI: 미매핑 raw 태그 주간 리뷰 → synonym 추가

**비용/장애 가드 (edge fn 요구사항 — Phase 2 구현 시 필수)**:
- **Budget cap**: ≤ 500 canonical mapping Claude API calls / week. 배치 크기 20/call. Redis(Upstash) 카운터로 하드 리밋
- **Backoff**: 지수 재시도 (초기 10s, max 24h), 3회 실패 시 dead-letter queue(`tag_normalize_dlq` 테이블 또는 pg_boss)
- **API key missing fallback**: `ANTHROPIC_API_KEY` 미설정 (incident `eab4597` 케이스) — raw 태그는 그대로 사용 가능한 상태 유지, `member_tag_mapping`에 INSERT 하지 않음(NULL canonical 유지). 키 복구 시 자동 re-queue
- **AI Brief와 동일 큐**: `normalize-tags` 와 AI Brief 는 같은 pg_boss/Upstash queue 네임스페이스 사용 — rate-limit·retry 정책 공유 (ADR-001 O3 항목과 연계)

**Phase 1 구현 범위**: 테이블 생성 + 서비스-role 기반 수동 매핑 엔트리 + 검색은 여전히 raw GIN. Phase 2에서 canonical 기반 검색·매칭 + edge fn 활성화.

### 4.4 매칭 Feature Store (Phase 3 사전 설계)

**현상**: Phase 3 'AI Match Engine'을 뒤늦게 짜면 Phase 1~2에서 필요한 신호를 수집하지 못해 cold start가 두 번 일어난다.

**해결**: **Phase 2 초반**에 `match_features` 테이블을 만들고, `activity_events` 기반 배치(daily `pg_cron`)로 feature를 주기 업데이트. (Phase 1에선 **선언만**, 배치 미구동 — §5 DEFER 참고)

```sql
-- migration 026 (Phase 2)
CREATE TABLE match_features (
  member_id    UUID NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  feature_key  TEXT NOT NULL,
  feature_val  NUMERIC NOT NULL,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, feature_key)
);
CREATE INDEX idx_mf_key_val ON match_features (feature_key, feature_val DESC);
```

**Phase 2 수집 대상 feature**:
- `interest_vec_<canonical_slug>` — 해당 태그 등록 여부 + usage 빈도
- `position_interest_density_<industry>` — 관심 표시 포지션의 산업 분포 (from `position_interests.interest_type='interested'`)
- `community_activity_<category>` — 글·리액션 비율 (from `community_posts`, `community_reactions`)
- `chat_apply_rate` — peer_coffee_applications 수락율

Phase 3에서 이 테이블을 input으로 Claude Sonnet + GPT-4o 크로스 검증 스코어링을 돌린다.

### 4.5 분석 파이프라인 — **택일: Supabase 기본 + 월 1회 S3 아카이브**

30→300→3000 스케일에서 옵션 비교:

| 옵션 | 비용 (검증) | 지연 | 30명 | 3000명 | 결론 |
|------|-----|------|-----|-------|------|
| (a) Supabase Pro($25/mo) + read replica(~$125/mo/replica) + MV | 월 $150 내외 | ms | ✅ | ✅ (pg_partman 가용 시) | **Tentative 채택** (procurement 승인 필요) |
| (b) BigQuery 로지컬 복제 | 월 수백 $ | 분 | 오버스펙 | ✅ | Phase 3 재검토 |
| (c) Mixpanel only | $0~$ | 초 | ✅ | ⚠️ 쿼리 자유도↓ | 프론트 이벤트 전용으로 병행 |

**채택안 (Tentative, cost-gated)**:
- OLTP: Supabase Postgres (현재)
- 분석 쿼리: 동일 DB (Phase 1) → read replica + MV (Phase 2~3 승인 시) — `pg_cron`으로 시간당 refresh
- 장기 보관: 월 1회 `activity_events` 오래된 파티션을 S3 (Parquet) 아카이브 — pg_partman 가용 시. **미가용 시 §5 fallback (수동 파티션 + pg_cron)** 사용
- Phase 3에서 BigQuery 필요성 재평가 (3000명 돌파 + 실시간 매칭 엔진 요구 시)

### 4.6 RLS 정책 (concrete SQL — 실스키마, rev 2)

v6.0은 서술뿐이었다. v6.1 rev 2는 **실제 테이블명으로 작동 가능한 SQL**을 제시한다.

```sql
-- ================================================================
-- 1) Directory Level 2 reveal helper: peer_coffee_applications only
-- ================================================================
CREATE OR REPLACE FUNCTION vcx_has_mutual_peer_accept(a uuid, b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM peer_coffee_applications pa
    JOIN peer_coffee_chats pc ON pc.id = pa.chat_id
    WHERE pa.status = 'accepted'
      AND (
        (pc.author_id = a AND pa.applicant_id = b)
        OR (pc.author_id = b AND pa.applicant_id = a)
      )
  );
$$;

-- ================================================================
-- 2) vcx_members SELECT RLS: members_only 기본 + Level 2 unlock
-- ================================================================
DROP POLICY IF EXISTS "members_directory_select" ON vcx_members;
CREATE POLICY "members_directory_select"
  ON vcx_members FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (
      id = auth.uid()                                            -- 본인
      OR vcx_has_mutual_peer_accept(auth.uid(), id) = true       -- peer-chat accept pair
      OR profile_visibility IN ('members_only','all')            -- Level 1 (마스킹은 view에서 수행)
    )
  );

-- ================================================================
-- 3) Level 1 masked view (security_invoker로 호출자 권한 존중)
-- ================================================================
CREATE OR REPLACE VIEW members_directory_level1
WITH (security_invoker = true)
AS
SELECT
  id,
  CASE WHEN vcx_has_mutual_peer_accept(auth.uid(), id) OR id = auth.uid()
       THEN name ELSE NULL END AS name,
  CASE WHEN vcx_has_mutual_peer_accept(auth.uid(), id) OR id = auth.uid()
       THEN current_company ELSE NULL END AS current_company,
  CASE WHEN vcx_has_mutual_peer_accept(auth.uid(), id) OR id = auth.uid()
       THEN linkedin_url ELSE NULL END AS linkedin_url,
  title,                                       -- 직군은 Level 1에서도 표시
  member_tier,
  years_of_experience,
  professional_fields,
  bio,
  profile_visibility
FROM vcx_members
WHERE is_active = true
  AND profile_visibility IN ('members_only','all');

-- ================================================================
-- 4) vcx_member_reports
-- ================================================================
CREATE TABLE IF NOT EXISTS vcx_member_reports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reportee_id   uuid NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  reporter_id   uuid NOT NULL REFERENCES vcx_members(id) ON DELETE CASCADE,
  context_type  text NOT NULL CHECK (context_type IN ('directory','peer_chat','ceo_chat','community')),
  context_id    uuid,                               -- related entity id (nullable)
  reason        text NOT NULL,
  evidence      text,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','reviewing','dismissed','warned','tier_demoted','exited')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  reviewed_by   uuid REFERENCES vcx_members(id),
  reviewed_at   timestamptz,
  CHECK (reportee_id <> reporter_id)
);
CREATE INDEX idx_member_reports_reportee_status ON vcx_member_reports (reportee_id, status);
CREATE INDEX idx_member_reports_created ON vcx_member_reports (created_at DESC);

ALTER TABLE vcx_member_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_insert_self" ON vcx_member_reports FOR INSERT
  TO authenticated WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_select_admin_or_reporter" ON vcx_member_reports FOR SELECT
  TO authenticated USING (
    reporter_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM vcx_members m
      WHERE m.id = auth.uid() AND m.system_role IN ('admin','super_admin')
    )
  );

CREATE POLICY "reports_update_admin" ON vcx_member_reports FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM vcx_members m
      WHERE m.id = auth.uid() AND m.system_role IN ('admin','super_admin')
    )
  );

-- ================================================================
-- 5) activity_events: service_role only (default deny)
-- ================================================================
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;
-- no policy → authenticated 거부, service_role bypass
```

### 4.7 PII & Soft-delete / GDPR 워크플로우

| PII 필드 | 위치 | 보호 | 삭제 경로 |
|---------|------|------|---------|
| `email` | `vcx_members`, `vcx_invites` | pgcrypto `encrypt_iv` (at-rest, Phase 2), access 로깅 | `vcx_anonymize_member(uuid)` → email=`deleted-<id>@vcx.local` |
| `linkedin_url` | `vcx_members` | access 로깅 (감사 트리거) | 위 fn에서 null 처리 |
| `name` | `vcx_members` | AES at-rest (Phase 2), 평문 유지 Phase 1 | 위 fn |
| 세션 대화 로그 | `vcx_coffee_applications.message`, `peer_coffee_applications.message`, AI Brief | private storage bucket | soft-delete → 30일 후 purge cron |

**공식 삭제 워크플로우 (migration 027 — Phase 2)**:

```sql
CREATE OR REPLACE FUNCTION vcx_anonymize_member(p_member UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE vcx_members SET
    name = '(탈퇴한 멤버)',
    email = 'deleted-' || id || '@vcx.local',
    linkedin_url = NULL,
    current_company = NULL,
    bio = NULL,
    is_active = false
  WHERE id = p_member;

  DELETE FROM member_tag_mapping WHERE member_id = p_member;
  DELETE FROM vcx_feed_subscriptions WHERE user_id = p_member;
  UPDATE community_posts SET is_anonymous = true, author_id = NULL
    WHERE author_id = p_member;
  UPDATE community_comments SET is_anonymous = true, author_id = NULL
    WHERE author_id = p_member;
  UPDATE activity_events SET actor_id = NULL WHERE actor_id = p_member;
END; $$;
```

**감사 로그**: `vcx_access_audit_log`(migration 027) 테이블. PII 읽기(linkedin_url, email)는 DB function을 거치고 자동 로깅.

### 4.8 확장성 임계점 (알아두어야 할 벽)

| 기능 | 깨지는 지점 | 증상 | 사전 대응 |
|------|------------|-----|---------|
| 자유 태그 검색 (`interest_tags GIN`) | 10k 멤버 × 평균 4 태그 | 쿼리 200ms→2s | `pg_trgm` + canonical 조인 (§4.3) |
| Directory 전체 스캔 | 1k 멤버 + filter 3개 조합 | 테이블 스캔 | 복합 인덱스 확장 (기존 idx + `(member_tier, professional_fields) GIN`) |
| `activity_events` 풀 스캔 | 100k rows | MV refresh 1min+ | 월별 `pg_partman` 또는 fallback (§5 pre-flight gate) |
| 커뮤니티 `community_posts` fulltext | 10k 게시글 | `ILIKE` O(n) | fts tsvector + GIN (migration 028, Phase 2) |
| AI Brief / Tag normalize 생성 | 동시 10건 | Anthropic API 429 | 공통 큐(`pg_boss` or Upstash Queue) + retry backoff |
| `members_directory_level1` view | 5k rows | view 복잡도로 EXPLAIN 폭발 | MV + refresh trigger (Phase 2), 또는 Postgres 17 column privileges |

---

## 5. 로드맵 (Phase 1/2/3 재배분, rev 2)

### 5.1 Phase 1 MUST / SHOULD / DEFER (스코프 크립 방지)

| 우선순위 | 항목 | 근거 |
|---------|-----|-----|
| **MUST** (31번째 멤버 입사 전 완료) | 019 migration 적용 · Directory Tiered Disclosure(§4.6 RLS+view) · `vcx_member_reports` 테이블 + 3-report 자동 강등 · 온보딩 GNB/중복입력/진행률 수정 · 컴포넌트 인벤토리 Atoms 12 + Molecules 7 (`src/components/ui/` 완성) · 수수료 문구 ESLint 규칙 · Mixpanel 최소 이벤트 (onboarding, directory_view, peer_chat_apply, peer_chat_accept) | 운영 안정성 + 브랜드 메시징 + 재설계된 Directory의 RLS 기반 정합성 |
| **SHOULD** (Phase 1.5 = M2) | `activity_events` 스키마 (pg_partman 없이 단일 큰 테이블로 시작) · `vcx_feed_newsletter_metrics` · Mixpanel 전체 퍼널 계측 · Admin moderation UI 베타 · `tag_canonical` / `member_tag_mapping` **테이블만** | 데이터 수집은 지금 시작해야 Phase 3이 빠름. 단 edge fn/배치는 DEFER |
| **DEFER → Phase 2** | `normalize-tags` edge fn (스키마는 Phase 1에 있음, job 실행은 Phase 2) · `activity_events` pg_partman 자동화 + `pg_cron` 배치 · `match_features` 테이블 + 배치 · `vcx_access_audit_log` · read-replica/warehouse · community fulltext | 비용·장애 가드가 Phase 1 스코프 초과. Phase 2 진입 시 feature 2주 스프린트로 한 번에 |

### 5.2 컴포넌트 인벤토리: blocking vs parallelizable

| 작업 층 | 병렬성 | 예상 기간 | 근거 |
|--------|-------|---------|------|
| Atoms(12) + Molecules(7) 완성 = `src/components/ui/` 목표 19개 | **순차(blocking)** — Organism 개조 작업이 이걸 의존 | 2일 | 공통 토큰 부재가 v6.0 디자인 붕괴 근본 원인 |
| Organisms 리팩터(6 + 부속) + 페이지 연결 | **병렬** (완성된 Atoms/Molecules가 있어야 시작) | 3일 (다수 FE 병렬) | 각 도메인 독립적 |

→ **Phase 1 Week 1**: Atoms+Molecules 먼저. **Week 2~**: Organisms + 페이지, 각 Directory/CoffeeChat/Community/Positions 병렬.

### 5.3 Phase 1 — Foundation + Directory Redesign (M1~2, 현재~2026년 6월)

**주제: "이미 만든 6 pillar를 견고하게, Directory를 재설계, 데이터 토대를 심는다."**

| 순위 | 작업 | Migration | 담당 | Effort | MUST/SHOULD |
|-----|------|----------|-----|-------|-----|
| 1 | **019 마이그레이션 적용** (P0 블로커) | 019 (기존) | DB | 1h | MUST |
| 2 | Directory Tiered Disclosure 구현 (§4.6 RLS + view + `vcx_has_mutual_peer_accept`) | 022 | BE+FE | 3d | MUST |
| 3 | `vcx_member_reports` + Admin moderation queue | 023 | BE+FE | 3d | MUST |
| 4 | `activity_events` 스키마 단일 테이블 (pg_partman **없이** 시작, §5.4 pre-flight 통과 후 partition 적용) | 024 | BE | 2d | SHOULD |
| 5 | `tag_canonical` + `member_tag_mapping` 테이블 생성 (edge fn 미구동) | 025 | BE | 1d | SHOULD |
| 6 | Atoms 12 + Molecules 7 완성 (§3.4) — blocking | — | FE | 2d | MUST |
| 7 | Organisms 리팩터 + 페이지 연결 (Directory/Chat/Community/Positions 병렬) | — | FE | 3d 병렬 | MUST (Directory)·SHOULD (나머지) |
| 8 | 온보딩 중복 입력 제거 + 진행률 정정 + GNB 숨김 회귀 테스트 | — | FE | 1d | MUST |
| 9 | Curation Feed 주간 발송 루틴 + `vcx_feed_newsletter_metrics` | 029 | Admin | 2d | SHOULD |
| 10 | 수수료 문구 lint 규칙 (ESLint `no-fee-percent`) + Mixpanel 최소 이벤트 | — | FE | 1d | MUST |

### 5.4 Pre-flight gates (Phase 1 실행 전 통과 필수)

| # | Gate | 판정 기준 | 실패 시 |
|---|------|---------|-------|
| G1 | `pg_partman` extension 가용성 | Supabase Dashboard → Database → Extensions 에서 `pg_partman` 활성 가능 여부 확인 (Pro 이상 플랜 요구 가능) | Supabase support 티켓 오픈. migration 024는 **단일 테이블 버전**으로 우선 적용, pg_partman은 Phase 2로 DEFER. Fallback: `pg_cron` + 함수 `vcx_create_monthly_partition()` 로 월 1회 `CREATE TABLE activity_events_YYYY_MM PARTITION OF activity_events FOR VALUES FROM ('YYYY-MM-01') TO ('YYYY-MM+1-01')` 실행 (스키마에 명시된 PARTITION BY 유지) |
| G2 | `ANTHROPIC_API_KEY` production 상태 | Vercel env vars + Supabase edge secrets 양쪽 확인 | incident `eab4597`의 graceful degradation 코드 경로 회귀 테스트 통과 + 운영 알림 채널 연결 |
| G3 | Read-replica 비용 승인 | ADR-003 Tentative — procurement 승인 문서 | 미승인 시 단일 DB로 Phase 1 전체 운영, Phase 2 초 재검토 |
| G4 | 신규 migration 번호 예약 | 022~029 범위에서 기존 파일과 충돌 없는지 `ls supabase/migrations/` 확인 (현재 022~028은 비어있음) | 충돌 발견 시 PR 전 번호 재할당 |

### 5.5 Phase 2 — Engagement & First Revenue (M3~5)

| 작업 | Migration | 비고 |
|-----|-----------|-----|
| Feed 자동 큐레이션 파이프라인 (Claude API) | — | v6.0 §5.1 유지 |
| `normalize-tags` edge fn 활성화 + cost gates (§4.3) | — | 같은 queue에 AI Brief |
| Admin moderation tools 완성 (#14) | — | Phase 2 plans 기존 |
| CEO Head Hunting Agreement (#15) | — | Phase 2 plans 기존 |
| Privacy Model 기술 강제 (#17) | — | Phase 2 plans 기존 |
| `match_features` 테이블 + 일일 배치 | 026 | Phase 3 사전 심기 |
| `vcx_access_audit_log` + PII 감사 + `vcx_anonymize_member` | 027 | GDPR 대비 |
| `community_posts` fulltext 색인 | 028 | 게시글 1k 돌파 대비 |
| AI Brief 적용 확대 (Peer Chat) | — | helpfulness ≥ 4.0 검증 후 |
| `activity_events` pg_partman 자동화 (G1 통과 시) 또는 pg_cron 수동 파티션 | — | G1 결과에 따라 선택 |
| 분석: MV 월간 활성/드롭 퍼널 | — | Supabase read replica (G3 통과 시) |

### 5.6 Phase 3 — Scale & AI Matching (M6~10)

| 작업 | 비고 |
|-----|-----|
| AI Match Engine (Claude Sonnet + GPT-4o cross-validation) | `match_features` input |
| 자연어 구독 UI (in-app feed) | `tag_canonical` synonyms 활용 |
| LinkedIn OAuth (본인 인증 목적) | v6.0 §6.2 유지 |
| Premium Corporate Account | 수수료 구조 UI 비노출 전제 |
| BigQuery 전환 ROI 재평가 | 3000명 또는 실시간 매칭 요구 시 |

---

## 6. 의사결정 기록 (ADR)

### ADR-001: Member Directory 공개 범위 — Tiered Disclosure + Double Opt-in (peer-chat) + Reputation

**Decision**: Directory를 3-tier 공개 모델로 재설계한다. Level 0(집계 통계) + Level 1(마스킹 카드) + Level 2(**peer-chat 상호 수락** 후 전체). `vcx_member_reports`로 신고 기반 평판 레이어 도입.

**Context**: v6.0은 Directory 전면 공개 + Anti-Scraping. 사용자 지적: (1) 스크린샷 기반 유출은 기술로 막을 수 없다, (2) 톱티어 인재의 사회적 증명 가치는 실재, (3) '빌런' 필터링이 없다. 세 가지가 동시에 맞다.

**Alternatives**:
- **(a) 전면 공개 + Anti-Scraping** (v6.0): 스크린샷에 무력
- **(b) Tiered Disclosure**: Level 0 집계로 사회적 증명, Level 1 마스킹으로 유출 시 PII 손해 최소
- **(c) 신고 레이어**: 빌런 필터링. (b)와 독립
- **(d) Double Opt-in (peer-chat accept)**: 상호 관심만 공개

**선택**: **(b) + (c) + (d) 하이브리드**. (d)의 트리거는 **`peer_coffee_applications.status='accepted'`만** 인정. 이 선택은 다음 구조적 이유 때문이다:

- CEO Coffee Chat(`vcx_ceo_coffee_sessions` + `vcx_coffee_applications`)은 **기업 host ↔ 멤버 applicant**. 동일 도메인 peer 관계 아님.
- Peer Coffee Chat(`peer_coffee_chats` + `peer_coffee_applications`)은 **멤버 host(auth.users) ↔ 멤버 applicant(auth.users)**. 상호 관계.
- Directory Level 2는 "멤버 ↔ 멤버 상호 관심"의 결과물이므로 peer만 트리거.

**Consequences**:
- ✅ 스크린샷 유출 시 노출 정보가 직군+산업+연차만 (손해 최소)
- ✅ "5명의 시리즈 B CEO가 이번 달 합류" 같은 집계로 사회적 증명 달성
- ✅ 빌런 자동 tier 강등 (3회 confirmed report)
- ✅ `peer_coffee_applications` 재사용 → 구현 비용 낮음
- ⚠️ 초기 네트워크 작을 때 Level 2 전환율이 낮아 '차가운 느낌' 가능 → Level 0 카피로 보완
- ⚠️ CEO Chat 수락만으로는 Directory Level 2 unlock 되지 않음 → 멤버들이 다른 멤버와 연결하려면 peer-chat 흐름을 이용해야 함. UX 상 "다른 멤버와 더 가까워지려면 Peer Coffee Chat" CTA 명확화 필요 (Feature 5 디자인)
- ⚠️ Moderator 워크플로우 운영 비용 — Admin UI 필요 (Phase 1 작업 #3)
- **Architect Q (rev 1) 응답**: Level 2 트리거는 오직 `vcx_has_mutual_peer_accept()` helper가 true 반환할 때. CEO chat 수락은 `activity_events`에만 기록되고 Directory RLS에는 영향 없음.

### ADR-002: 태그 시스템 — Raw + Canonical 이원화 + Cost Gates

**Decision**: Phase 1에서는 `vcx_members.interest_tags TEXT[]`(raw) 유지 + `tag_canonical` / `member_tag_mapping` **테이블만** 신설. Edge function `normalize-tags`는 Phase 2로 DEFER.

**Context**: 자유 태그는 UX 좋지만 매칭·검색·분석에 치명적. 영어/한국어 혼재, 오탈자, 동의어.

**Alternatives**:
- (a) 고정 카테고리 강제: 코드 간결, UX 파괴
- (b) 순수 free-tag: UX 승, 300명에서 품질 붕괴
- (c) Raw + Canonical 이원화: 즉시 UX는 free-tag, 뒷단은 구조화

**선택**: (c). **단 cost/failure 가드가 없는 edge fn은 incident 위험** (ANTHROPIC_API_KEY 장애 시 전체 파이프라인 블로킹 가능) — Phase 1에는 테이블만, Phase 2에 가드 포함된 edge fn 투입.

**Consequences**:
- Phase 1에서는 canonical 조인 없음 → 검색·매칭은 raw GIN 기반 유지 (Phase 2에서 전환)
- Edge fn 비용 가드(§4.3): 주 500 calls cap, 지수 backoff, API key 누락 시 graceful fallback, AI Brief와 공통 queue
- LLM 매핑 신뢰도 컬럼(`confidence`) 필수. 낮은 신뢰도는 admin review 큐로
- Canonical 번역 유지보수 비용 주 1회 admin 작업

### ADR-003: 분석 파이프라인 — Supabase 기본 + Mixpanel 병행, BigQuery는 Phase 3 재평가 (**Tentative**)

**Decision** (status: **Tentative — cost-gated pending procurement approval**): OLTP + OLAP 모두 Supabase로. Phase 1은 단일 DB에서 시작, Phase 2 진입 시 read replica 승인 받아 MV/분석 쿼리를 replica로 이전. 프론트 퍼널 이벤트만 Mixpanel. 장기 아카이브는 S3 Parquet.

**Context**: 30→3000 스케일. 현 시점 BigQuery는 복잡도·비용·팀 규모 대비 오버스펙.

**Alternatives**:
- (a) Mixpanel 올인: 쿼리 자유도·export 지연 문제. 데이터 주권 이슈
- (b) BigQuery 로지컬 복제: 오버엔지니어링
- (c) Supabase 중심 + Mixpanel 퍼널: ROI 최적

**선택**: (c). 3000명 또는 실시간 매칭 요구 시 (b) 재평가 (Phase 3 gate).

**비용 검증 (2026-04-19 기준, 추후 재확인 필수)**:
- Supabase Pro $25/mo 베이스
- Read replica 애드온 ~$125/mo/replica (참고치, 플랜/리전에 따라 변동)
- Phase 2 진입 시 월 ~$150 추가 예산 — procurement 승인 **필수**
- 승인 전: 단일 DB에서 MV 운영 (replica 없음), 쿼리 부하 모니터링

**Consequences**:
- `pg_partman` + `pg_cron` 운영 필요 — §5.4 G1 pre-flight gate 통과가 선행 조건
- pg_partman 미가용 시 수동 pg_cron 파티션 fallback 확보 (§5.4 G1)
- Read replica 미승인 시 Phase 1/2 성능 모니터링 강화, 승인 시 Phase 2 중순 전환
- **Architect Q (rev 1) 응답 (source-of-truth)**: Supabase `activity_events`가 source of truth. Mixpanel은 analytics-only mirror. 일 1회 `pg_cron` 배치가 `event_type × date` 카운트를 Mixpanel Query API와 비교, 차이 > 2%이면 Sentry 알림 (§4.2)
- Cost unverified 항목은 §7 O11로 이관

### ADR-004: 신고/평판 시스템 — `vcx_member_reports` 단일 엔티티 + 자동 임계 + Moderator 큐 (community_reports와 분리)

**Decision**: 멤버 단위 평판은 **`vcx_member_reports`** (신규)로 단일 관리. 서로 다른 3인 confirmed → tier 강등 자동화. 기존 `community_reports`(migration 009)는 **post/comment 대상 신고 전용으로 유지** — scope 분리.

**Context**: ADR-001의 (c). 빌런 필터링 필요. `community_reports`는 이미 존재하지만 대상이 콘텐츠(post_id/comment_id)이고 멤버 평판을 위한 `reportee_id` 컬럼이 없다. 멤버 단위 평판을 같은 테이블에 섞으면 CHECK constraint/RLS가 복잡해진다.

**Alternatives**:
- (a) `community_reports`에 `reportee_id` 컬럼 추가 + `context_type` 분기: 기존 운영 데이터와 혼재로 마이그레이션 위험
- (b) `vcx_member_reports` 별도 테이블 + 심각한 community_report → member_report 승격 정책: 명확한 scope
- (c) 외부 trust & safety SaaS: 비용·GDPR 이슈

**선택**: (b). `community_reports.reviewed_action = 'tier_demote'` 확정 시 admin 수동 action으로 `vcx_member_reports` INSERT (transfer rule).

**Consequences**:
- Admin moderation UI 필수 (Phase 1 작업 #3)
- 자동 tier 강등은 dry-run 옵션 + 멤버에게 이의제기 30일 창
- `community_reports`와 `vcx_member_reports`의 이중 집계는 admin dashboard에서 reportee_id 기준 JOIN 뷰로 제공

---

## 7. 오픈 이슈 및 리스크

| # | 이슈 | 영향 | 대응 |
|---|-----|------|-----|
| O1 | `019_vcx_fix_get_user_info.sql` production 미적용 | Critical — 사용자 프로필 필드 결손 | Phase 1 작업 #1 즉시 |
| O2 | 마이그레이션 013/014 번호 중복 (기존 이슈) | 신규 마이그레이션 작성 시 혼동 | v6.1 신규는 **022부터** 할당 (022~029). 과거 중복은 이후 정리 PR |
| O3 | AI Brief / Tag-normalize ANTHROPIC_API_KEY 운영 장애 | CEO Chat 경험 degrade + tag canonical 지연 | `eab4597`의 graceful degradation 회귀 테스트 + 두 기능 공통 큐/rate-limit 설계 |
| O4 | Directory Level 1 view 성능 (`vcx_has_mutual_peer_accept` per row) | 멤버 수 증가 시 쿼리 저하 | 멤버 1000명 돌파 시 MV로 전환 + refresh trigger |
| O5 | Tag canonical 매핑 지연 | 정규화 전 쓴 데이터의 분석 누락 | 백필 배치 작업 — 주 1회 미매핑 태그 batch (Phase 2) |
| O6 | Moderator 인력 부족 | 신고 큐 적체 | Phase 1에서는 Tim 본인 + 1명. LLM triage는 Phase 2 |
| O7 | 수수료 % UI 누출 회귀 | 브랜드 신뢰 리스크 | ESLint 커스텀 규칙: `/\b\d{1,2}\s*%|\bfee|\b수수료\s*율/i` 패턴 + "placement/수수료/커미션" 공출현 경고 (`eslint-plugin-vcx-brand` / `no-fee-percent`) |
| O8 | `activity_events` 월별 파티셔닝 운영 | `pg_partman` drift 시 쿼리 실패 | §5.4 G1 pre-flight. 가용 시 pg_partman, 미가용 시 pg_cron 수동 fallback |
| O9 | Directory 기본값 변경 시 기존 멤버 이의 | 일부 멤버가 '내 이름이 공개되길 원함' | UI에서 explicit opt-in 스위치 유지 (`profile_visibility='all'`) |
| O10 | 한국어 UI 원칙 회귀 | 브랜드 일관성 | PR 템플릿 체크리스트 + 기존 lint 플러그인 확장 |
| **O11 (rev 2)** | ADR-003 비용 미승인 리스크 | Read replica 없이 Phase 1 전체 운영 시 성능 저하 가능 | procurement 승인 타임라인 명확화 + Phase 2 진입 전 결정 |
| **O12 (rev 2)** | CEO Chat만 수락한 멤버의 "왜 Directory Level 2 안 열리죠" 컴플레인 | UX 기대 충돌 | Feature 5 (Peer Chat) CTA 문구 명확화 + 도움말에 'Level 2 조건' 명시 |

---

## 부록 A. 핵심 파일/경로 레퍼런스 (절대 경로, rev 2 검증)

- PRD v6.0 (대체됨): `/Users/kangsangmo/Desktop/valueconnectx/docs/prd6.0.md`
- PRD v6.1 (본 문서): `/Users/kangsangmo/Desktop/valueconnectx/.omc/plans/prd-6.1-revision.md`
- CLAUDE.md (프로젝트 지침): `/Users/kangsangmo/Desktop/valueconnectx/CLAUDE.md`
- 마이그레이션 디렉터리: `/Users/kangsangmo/Desktop/valueconnectx/supabase/migrations/`
- Directory 페이지: `/Users/kangsangmo/Desktop/valueconnectx/src/app/(protected)/directory/page.tsx`
- Directory 컴포넌트: `/Users/kangsangmo/Desktop/valueconnectx/src/components/directory/` (member-card, member-filters, member-profile, profile-completion, profile-edit-form)
- UI Atoms (확인된 기존 4개): `/Users/kangsangmo/Desktop/valueconnectx/src/components/ui/` (badge, button, gold-line, section-header)
- 디자인 토큰: `/Users/kangsangmo/Desktop/valueconnectx/src/constants/site.ts`
- 미들웨어: `/Users/kangsangmo/Desktop/valueconnectx/src/middleware.ts`
- Rate Limit: `/Users/kangsangmo/Desktop/valueconnectx/src/lib/rate-limit.ts`

## 부록 B. 신규 마이그레이션 번호 예약 (중복 방지, rev 2)

| # | 파일명 | 내용 |
|---|--------|-----|
| 022 | `022_vcx_directory_tiered.sql` | `vcx_has_mutual_peer_accept` fn + `members_directory_level1` view + RLS 재정의 + `full_reveal_on_mutual_accept` 컬럼 |
| 023 | `023_vcx_member_reports.sql` | 멤버 단위 신고/평판 (ADR-001/ADR-004) |
| 024 | `024_vcx_activity_events.sql` | Event sourcing 스키마 (pg_partman 가용 시 partition, 미가용 시 단일 테이블 + pg_cron fallback) |
| 025 | `025_vcx_tag_canonical.sql` | 태그 이원화 **테이블만** (ADR-002, edge fn 미포함) |
| 026 | `026_vcx_match_features.sql` | Phase 2 — Feature store 배치 input |
| 027 | `027_vcx_pii_audit_and_anonymize.sql` | Phase 2 — GDPR 삭제 + 접근 감사 |
| 028 | `028_vcx_community_fulltext.sql` | Phase 2 — Community fulltext GIN |
| 029 | `029_vcx_feed_newsletter_metrics.sql` | Curation Feed 오픈율·클릭율 수집 (022를 Directory에 양보) |

---

## 부록 C. rev 2 변경 요약 (Critic round 1 대응)

| 이슈 | 조치 |
|------|----|
| #1 §4.1 ERD / §4.6 RLS 가상 테이블명 | 실제 스키마(peer_coffee_chats, community_posts, vcx_ceo_coffee_sessions 등)로 전면 교체 |
| #2 Atom/Molecule 경로 오분류 | `src/components/ui/` 실존 4개만 ✅, 나머지 🆕. `profile-completion.tsx`는 directory 도메인 Organism으로 정정 |
| #3 pg_partman 미보장 | §5.4 G1 pre-flight gate + pg_cron 수동 파티션 fallback + `CREATE EXTENSION IF NOT EXISTS pg_partman` 선두 배치 |
| #4 ADR-003 "$X" 플레이스홀더 | $25 + ~$125/mo replica 기입, status: Tentative — cost-gated, O11로 리스크 등재 |
| #5 Tag normalize 비용/장애 가드 | §4.3에 budget cap(주 500 calls) · 지수 backoff · API-key 누락 fallback · AI Brief 공통 queue 추가 |
| #6 Level 2 트리거 모델 부적합 | `vcx_has_mutual_peer_accept` 로 재작성, CEO chat 수락은 **제외** (ADR-001 Consequences 명시) |
| #7 Phase 1 스코프 크립 | §5.1 MUST/SHOULD/DEFER 테이블 신설, edge fn·partman 자동화·match_features 배치·audit log는 DEFER |
| Minor | `vcx_invites` PK 재확인(id + token_hash UNIQUE), view `security_invoker = true` 추가, 수수료 regex 확장, migration 번호 022→Directory / 029→newsletter_metrics, ESLint 플러그인 구체화 |
| Architect Q | ADR-001/003 Consequences에 인라인 답변, §5.2에 컴포넌트 blocking/parallel 판단 |

---

**END OF PRD v6.1 rev 2** — 이 문서는 Critic round 2 승인 시 `docs/prd6.1.md`로 승격한다.
