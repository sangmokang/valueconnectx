# ValueConnect X — Sprint Implementation Plan

**작성일:** 2026-03-25
**Status:** Ready for Execution (v2 — Architect Review 반영)
**선행 문서:** p1-auth-completion-sprint.md, p2-p4-development-roadmap.md
**Architect Review:** APPROVED_WITH_NOTES — 구조 건전, 코드베이스 현황 반영 수정 완료

---

## Overview

P1(Auth 80% 완료) → P2(핵심 플랫폼) → P3(확장) → P4(AI/Premium) 로드맵을 **멀티에이전트 스프린트** 방식으로 실행한다.

**에이전트 역할 매핑:**

| 역할 | Agent Type | Model | 책임 |
|------|-----------|-------|------|
| **PO** (Product Owner) | `oh-my-claudecode:planner` | opus | 요구사항 정의, AC 검증, 우선순위 결정 |
| **Backend** | `oh-my-claudecode:executor` | sonnet | API, DB 마이그레이션, 비즈니스 로직 |
| **Frontend** | `oh-my-claudecode:designer` | sonnet | UI 컴포넌트, 페이지, 반응형 |
| **QA** | `oh-my-claudecode:test-engineer` | sonnet | 테스트 작성, 검증, 버그 리포트 |
| **Designer** | `oh-my-claudecode:designer` | sonnet | 디자인 시스템 준수, UX 리뷰 |
| **Architect** | `oh-my-claudecode:architect` | opus | 코드 리뷰, 아키텍처 검증 |

**스프린트 사이클:**
```
PO: AC 정의 → Backend + Frontend 병렬 구현 → QA 테스트 → Designer UX 리뷰 → Architect 최종 검증
```

---

## Phase 현황 (2026-03-25 기준)

| Phase | 상태 | 완료율 |
|-------|------|--------|
| P0: 랜딩 + GNB + 디자인시스템 | ✅ 완료 | 100% |
| P0.5: 모바일 반응형 | ✅ 완료 | 100% |
| P1: Invite-Only Auth | 🔶 코드 완료, 테스트/하드닝 미완 | 80% |
| P2: 핵심 플랫폼 (Directory + CEO Chat) | 🔶 UI 스캐폴딩 + API 존재, 통합/테스트 미완 | 45% |
| P3: 확장 (Position + Community + Peer Chat) | 🔶 UI 스캐폴딩 + API 존재, 통합/테스트 미완 | 35% |
| P4: AI/Premium | ❌ 미착수 | 0% |

---

## Sprint 1: P1 완성 + P2 기반 (Week 1)

> **목표:** Auth 시스템 하드닝 + P2 공통 인프라 구축

### S1-A: P1 Auth 하드닝 (Backend + QA 병렬)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S1-A1 | Backend | `invite-accept` API에서 signIn 후 클라이언트 쿠키 설정 수정 | - | S |
| S1-A2 | Backend | `invite-accept-form.tsx`에서 LinkedIn URL 필드 submit body에 포함 | - | S |
| S1-A3 | Backend | Protected pages에 login wall 통합 (getVcxUser → blur overlay) | - | M |
| S1-A4 | Backend | Security: password update API, rate limit 강화, error disambiguation 제거 | - | M |
| S1-A5 | QA | 기존 Vitest/Playwright 설정 검증 + @playwright/test devDep 추가 | - | S |
| S1-A6 | QA | 기존 25개 테스트 파일 실행 + 커버리지 갭 분석 → 누락 케이스 추가 | S1-A5 | M |
| S1-A7 | QA | 테스트 Fixture Factory 구축 (members, corporate users, sessions 시드 데이터) | S1-A5 | M |

**병렬 전략:** S1-A1~A4 (Backend) ∥ S1-A5~A7 (QA) 동시 진행

### S1-B: P2 인프라 감사 + 버그 수정 (Backend)

> **Architect Note:** error.ts, validation.ts, zod, CorporateUser enum은 이미 구현됨. 감사 후 버그 수정에 집중.

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S1-B1 | Backend | 기존 `error.ts`/`validation.ts` 감사 — 모든 API route가 실제로 사용하는지 확인 | - | S |
| S1-B2 | Backend | **[BUG FIX]** positions API `isAdmin` 함수 수정 — `members` → `vcx_members`, `role` → `system_role`, `user_id` → `id` | - | S |
| S1-B3 | Backend | Supabase types vs 실제 DB 스키마 drift 감사 — `src/types/supabase.ts` 검증 | - | M |
| S1-B4 | Backend | Supabase type generation workflow 수립 + 문서화 | - | S |
| S1-B5 | Backend | **[PERF]** JWT Custom Claims 구현 — middleware DB 쿼리 2회 → 0회 최적화 | - | M |

**S1 Review Gate:**
- Architect: P1 보안 하드닝 + positions isAdmin 버그 수정 코드 리뷰
- QA: 기존 테스트 통과율 + 커버리지 리포트
- PO: P1 AC 전체 체크

---

## Sprint 2: P2-A Member Directory (Week 2)

> **목표:** Member Directory 완전 구현 (DB → API → UI → 테스트)

### S2-A: Database Layer (Backend)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S2-A1 | Backend | Migration 003: vcx_members에 industry, location, is_open_to_chat, profile_visibility 컬럼 추가 | S1-B 완료 | S |
| S2-A2 | Backend | Migration 003: 검색 최적화 인덱스 + Full-text search 인덱스 | S2-A1 | S |
| S2-A3 | Backend | RLS 정책: active members만 서로 조회, profile_visibility 적용 | S2-A1 | S |

### S2-B: API Layer (Backend)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S2-B1 | Backend | GET `/api/directory` — pagination, filters (tier, industry, q), zod validation | S2-A 완료 | M |
| S2-B2 | Backend | GET `/api/directory/[id]` — 단일 멤버 프로필 조회 | S2-A 완료 | S |
| S2-B3 | Backend | GET/PUT `/api/directory/me` — 내 프로필 조회/수정, zod body validation | S2-A 완료 | M |

### S2-C: UI Layer (Frontend + Designer 병렬)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S2-C1 | Frontend | `member-card.tsx` 리팩토링 — 실제 API 데이터 바인딩 | S2-B1 | M |
| S2-C2 | Frontend | `member-filters.tsx` 리팩토링 — debounced search, industry/tier 필터 | S2-B1 | M |
| S2-C3 | Frontend | `/directory/[id]` 상세 프로필 페이지 — bio, specialties, LinkedIn, chat indicator | S2-B2 | M |
| S2-C4 | Frontend | `/directory/me` 프로필 수정 폼 — editable fields, submit to PUT API | S2-B3 | M |
| S2-C5 | Designer | Directory 전체 UX 리뷰 — 디자인 시스템 준수, 모바일 반응형 확인 | S2-C1~C4 | M |

### S2-D: Testing (QA)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S2-D1 | QA | Unit tests: directory API routes (pagination, filters, auth) | S2-B 완료 | M |
| S2-D2 | QA | Component tests: member-card, member-filters, profile-edit-form | S2-C 완료 | M |
| S2-D3 | QA | E2E: directory 탐색 → 프로필 클릭 → 내 프로필 수정 플로우 | S2-C 완료 | M |

**S2 Review Gate:**
- Architect: API 보안 + RLS 정책 리뷰
- Designer: 디자인 시스템 + 모바일 리뷰
- PO: Directory AC 전체 체크

---

## Sprint 3: P2-B CEO Coffee Chat (Week 3)

> **목표:** CEO Coffee Chat 완전 구현

### S3-A: Database + Corporate User Onboarding (Backend)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S3-A1 | Backend | Admin 기업사용자 API: POST `/api/corporate-users`, PUT verify | - | M |
| S3-A2 | Backend | Admin 기업사용자 UI: `/admin/corporate-users` 관리 페이지 | S3-A1 | M |
| S3-A3 | Backend | Migration 004: vcx_ceo_coffee_sessions + vcx_coffee_applications 테이블 | S3-A1 | M |
| S3-A4 | Backend | RLS: sessions SELECT for members, INSERT for CEO/Founder only | S3-A3 | S |
| S3-A5 | Backend | SECURITY DEFINER: vcx_coffee_application_count() 함수 | S3-A3 | S |

### S3-B: API Layer (Backend)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S3-B1 | Backend | GET/POST `/api/ceo-coffeechat` — 세션 목록 + 생성 (CEO only) | S3-A 완료 | M |
| S3-B2 | Backend | GET/PUT `/api/ceo-coffeechat/[id]` — 세션 상세 + 수정 | S3-A 완료 | S |
| S3-B3 | Backend | POST `/api/ceo-coffeechat/[id]/apply` — 비밀 신청 (member only, unique) | S3-A 완료 | M |
| S3-B4 | Backend | GET applications + PUT accept/reject — 호스트 전용 + 알림 insert | S3-A 완료 | M |

### S3-C: UI Layer (Frontend + Designer 병렬)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S3-C1 | Frontend | `/ceo-coffeechat` 세션 목록 — API 바인딩, session-card 리팩토링 | S3-B1 | M |
| S3-C2 | Frontend | `/ceo-coffeechat/[id]` 세션 상세 + "비밀 신청하기" 모달 | S3-B2, S3-B3 | M |
| S3-C3 | Frontend | `/ceo-coffeechat/create` 세션 생성 폼 (CEO only) | S3-B1 | M |
| S3-C4 | Frontend | 호스트 뷰: 신청자 목록 + 수락/거절 UI | S3-B4 | M |
| S3-C5 | Designer | Coffee Chat 전체 UX 리뷰 — "비밀 신청" UX, 모바일 반응형 | S3-C1~C4 | M |

### S3-D: Testing (QA)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S3-D1 | QA | Unit tests: CEO coffeechat API (권한, 중복 신청, CRUD) | S3-B 완료 | M |
| S3-D2 | QA | E2E: CEO 세션 CRUD (생성/수정/삭제) 플로우 | S3-C 완료 | M |
| S3-D3 | QA | E2E: 멤버 신청 → CEO 수락/거절 → 알림 확인 플로우 | S3-C 완료 | M |

**S3 Review Gate:**
- Architect: CEO-only 권한 체크 + RLS + SECURITY DEFINER 리뷰
- Designer: 비밀 신청 UX + CEO 전용 UI 차별화 리뷰
- PO: CEO Coffee Chat AC 전체 체크

---

## Sprint 4: P2-C Position Board + P2-D Community Board (Week 4)

> **목표:** 2개 Pillar 병렬 구현 (독립적이므로 동시 진행)
>
> **마이그레이션 충돌 방지 프로토콜:** S4-A1(Migration 005)과 S4-B1(Migration 006)은 **순차 실행** (각 S 크기, 합계 30분). 번호 확정 후 나머지 모두 병렬 진행.

### S4-A: Position Board (Backend + Frontend 병렬)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S4-A1 | Backend | Migration **005**: positions 테이블 확장 (salary_range, requirements, benefits) + RLS | - | S |
| S4-A2 | Backend | 기존 positions API 감사 + `isAdmin` 수정 반영 확인 + zod validation 적용 | S4-A1 | M |
| S4-A3 | Backend | GET `/api/positions/[id]` + POST `/api/positions/[id]/interest` — 상세 + 관심 표현 | S4-A1 | M |
| S4-A4 | Frontend | `/positions` 목록 리팩토링 — API 바인딩, 필터, 페이지네이션 | S4-A2 | M |
| S4-A5 | Frontend | `/positions/[id]` 상세 페이지 — 포지션 정보 + "관심 있습니다" CTA | S4-A3 | M |
| S4-A6 | Frontend | Admin `/admin/positions` — 포지션 CRUD 관리 | S4-A2 | M |

### S4-B: Community Board (Backend + Frontend 병렬)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S4-B1 | Backend | Migration **006**: community_posts (`likes_count`, `comments_count` 포함) + community_comments 테이블 + RLS | S4-A1 (번호 확정 후) | S |
| S4-B2 | Backend | GET/POST `/api/community` — 게시글 목록 + 작성 (category 필터) | S4-B1 | M |
| S4-B3 | Backend | GET `/api/community/[id]` + POST comments — 상세 + 댓글 + likes_count/comments_count 업데이트 | S4-B1 | M |
| S4-B4 | Frontend | `/community` 리팩토링 — category-tabs API 바인딩, post-card 연동 | S4-B2 | M |
| S4-B5 | Frontend | `/community/[id]` 상세 + 댓글 UI — 익명 게시 토글, 좋아요 | S4-B3 | M |
| S4-B6 | Frontend | `/community/create` 글쓰기 폼 — 카테고리 선택, 익명 옵션 | S4-B2 | M |

### S4-C: Testing + Review (QA + Designer)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S4-C1 | QA | Position Board API + E2E 테스트 | S4-A 완료 | M |
| S4-C2 | QA | Community Board API + E2E 테스트 (익명 게시 포함) | S4-B 완료 | M |
| S4-C3 | Designer | Position + Community 전체 UX 리뷰 | S4-A, S4-B 완료 | M |

**S4 Review Gate:**
- Architect: 2개 모듈 교차 리뷰 + 익명 게시 보안 검토
- PO: Position + Community AC 전체 체크

---

## Sprint 5: P2-E Peer Coffee Chat + 알림 시스템 (Week 5)

> **목표:** 마지막 Pillar + 교차 기능(알림) 구현

### S5-A: Peer Coffee Chat (Backend + Frontend)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S5-A1 | Backend | Migration 007: peer_coffee_chats + peer_coffee_replies 테이블 + RLS | - | M |
| S5-A2 | Backend | API: GET/POST `/api/peer-coffeechat`, GET/POST replies, PUT match | S5-A1 | M |
| S5-A3 | Frontend | `/coffeechat` 리팩토링 — API 바인딩, peer-chat-card 연동 | S5-A2 | M |
| S5-A4 | Frontend | `/coffeechat/[id]` 상세 — 비밀 댓글, 매칭 UI | S5-A2 | M |
| S5-A5 | Frontend | `/coffeechat/create` 사연 작성 폼 | S5-A2 | M |

### S5-B: 알림 시스템 (Backend + Frontend)

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S5-B1 | Backend | Migration 008: vcx_notifications 테이블 + RLS (본인만 조회) | - | M |
| S5-B2 | Backend | API: GET `/api/notifications`, PUT `/api/notifications/[id]/read` | S5-B1 | S |
| S5-B3 | Backend | 기존 API에 알림 insert 통합 (coffeechat accept, community reply 등) | S5-B1, S3-B4 | M |
| S5-B4 | Frontend | GNB 알림 벨 아이콘 + 드롭다운 — unread count, mark as read | S5-B2 | M |

### S5-C: Testing + Final Review

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S5-C1 | QA | Peer Coffee Chat API + E2E 테스트 | S5-A 완료 | M |
| S5-C2 | QA | 알림 시스템 통합 테스트 (coffeechat → notification 흐름) | S5-B 완료 | M |
| S5-C3 | Designer | Peer Chat + 알림 UX 리뷰 | S5-A, S5-B 완료 | M |

**S5 Review Gate:**
- Architect: 알림 시스템 아키텍처 + 전체 P2 교차 리뷰
- QA: 전체 E2E regression 테스트
- PO: P2 전체 릴리즈 체크리스트

---

## Sprint 6: P2 통합 + 품질 안정화 (Week 6)

> **목표:** P2 전체 통합 테스트 + 성능 최적화 + 배포 준비

| Task ID | 역할 | 작업 | 의존성 | 크기 |
|---------|------|------|--------|------|
| S6-1 | QA | 전체 E2E regression suite 실행 + 버그 리포트 | S5 완료 | L |
| S6-2a | Designer | UX 감사 Part 1: Directory + CEO Coffee Chat + GNB | S5 완료 | M |
| S6-2b | Designer | UX 감사 Part 2: Position + Community + Peer Chat + 모바일 반응형 | S5 완료 | M |
| S6-3 | Frontend | QA 버그 + Designer 피드백 수정 + 성능 최적화 | S6-1, S6-2a/b | M |
| S6-4 | Architect | P2 전체 아키텍처 최종 리뷰 + 보안 감사 | S6-3 | L |
| S6-5 | PO | P2 릴리즈 체크리스트 최종 확인 + 배포 승인 | S6-4 | M |

> **병렬 전략:** S6-1 (QA regression) ∥ S6-2a/2b (Designer UX 감사) 동시 진행. 독립적 관심사이므로 안전.

---

## Cross-Review 매트릭스

모든 스프린트에서 아래 교차 리뷰가 발생한다:

```
Backend 구현 완료 ─┬→ QA가 API 테스트 작성 ──────┐
Frontend 구현 완료 ─┴→ Designer가 UX 리뷰 ────────┤ (병렬)
                                                   ↓
                    Architect가 코드 리뷰 → 승인 or 수정 요청
                                                   ↓
                    PO가 AC 체크 → 미충족 시 해당 역할에 재작업 요청
```

> **핵심 원칙:** QA 테스트와 Designer UX 리뷰는 독립적 관심사이므로 **항상 병렬** 진행한다.

| 산출물 | 1차 리뷰어 | 2차 리뷰어 |
|--------|-----------|-----------|
| DB Migration | Architect | QA (테스트 데이터) |
| API Route | QA (테스트) | Architect (보안) |
| UI Component | Designer (UX) | QA (E2E) |
| 전체 Feature | PO (AC 검증) | Architect (아키텍처) |

---

## 실행 방법

각 스프린트를 실행할 때:

```
/ralph S1 실행해줘
```

이렇게 하면 Ralph가:
1. 해당 스프린트의 태스크를 TODO로 등록
2. Backend/Frontend/QA를 병렬 에이전트로 파견
3. Review Gate에서 Architect/Designer/PO 에이전트 리뷰
4. 모든 AC 통과까지 반복

---

## 리스크 & Open Questions

| 리스크 | 심각도 | 영향 | 대응 |
|--------|--------|------|------|
| **positions API `isAdmin` 런타임 버그** | HIGH | Admin 권한 체크 항상 실패 | S1-B2에서 즉시 수정 |
| **Supabase types vs DB 스키마 drift** | HIGH | 타입 안전 깨짐, 런타임 에러 | S1-B3에서 감사 후 동기화 |
| **Middleware 매 요청 DB 2회 쿼리** | MEDIUM | 모든 인증 페이지 지연 | S1-B5에서 JWT Claims로 해결 |
| **테스트 시드 데이터 전략 부재** | MEDIUM | QA 태스크 블로킹 | S1-A7에서 Fixture Factory 구축 |
| **Frontend types ↔ DB types 불일치** | MEDIUM | UI에서 undefined 렌더링 | 각 스프린트 마이그레이션 시 동기화 |
| Supabase shared instance 제약 | LOW | pgvector, Auth Hook 불가능 | P4까지 연기, 대안 검토 |
| E2E 테스트 환경 (프로덕션 DB) | MEDIUM | Seed/cleanup이 실데이터 영향 | 로컬 Supabase 또는 별도 프로젝트 |
| Rate limiter in-memory 한계 | LOW | Vercel serverless 환경 부적합 | P3에서 Supabase-backed 전환 |

**미결 사항 (open-questions.md 참조):**
- industry 필드: 자유입력 vs 고정 enum
- salary 공개 정책
- 커피챗 알림 방식 (이메일 vs 인앱)
- 익명 게시 남용 방지
