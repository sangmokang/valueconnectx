# 개발 프로세스 검토 보고서 — ValueConnect X

> 일자: 2026-04-17
> 작성자: CTO (CPO 공동 검토 요청)
> 대상: VCX v6.x 빌드팀 (1인 코어 + AI 에이전트)
> 성격: **Honest process audit — 진행 방향 타당성 판정 + 교정안**
> 벤치마크: `ValueHire v7.x dev-process-review` (동일 저자·동일 실패 패턴)

---

## TL;DR (결론 먼저)

**판정: ⚠️ 제품은 살아 있다. 하지만 지금 프로세스로는 "무엇을 만든 서비스인지" 선언할 수 없다.**

VCX는 ValueHire의 거울상 문제다. ValueHire가 "뒷단 90% / 앞단 5%"라면, VCX는 **"앞단 95% / 정체성 40%"**. 지난 30일 (2026-03-18 → 2026-04-17) 동안:

- **PRD 메이저 3회 개정** (v4.1.3 61KB → v5.1 17KB → v6.0 16KB) — 매번 축소
- `docs/prd6.0.md` §0.1 스스로 고백: **"헤드헌팅이냐 커뮤니티냐"** 정체성 미결
- `.omc/plans/` 에 **13개의 활성 plan·제안** 공존 (bmplan·auth·recode·multi-vertical·AI 이력서·AI Ops·도메인 전문가 라우팅·critical bugs 5종·sprint 3종·design review…)
- 이 중 2개(`domain-expert-routing-rlvr.md`, `ai-ops-agent.md` 일부)는 **VCX 제품이 아닌 개발자 도구** 계획 — plan 색인이 두 가지 우주를 섞는다
- **실제 라이브 프론트엔드: 35개 페이지** (`src/app/**/page.tsx`) — PRD v6.0이 요구하는 6 pillars 대비 초과 완성
- 마이그레이션 **013, 014 중복** (CLAUDE.md에 명시된 6주째 미해결 기술부채)
- `.omc/plans/open-questions.md` — **7개 섹션 34개 미해결 질문**, 가장 오래된 건 3주 전(2026-03-13 Branding 일관성)
- 수익 구조(성사 25%)는 **멤버에게 의도적으로 비노출**(커밋 `8da76a0`, `78c6d4f`) — 서비스 표면과 수익 구조 비대칭

이는 "잘못된 방향"이 아니라 **"정체성이 닫히기 전에 이미 만들어진 제품"**을 다루는 문제다. 처방은 ValueHire와 같되 다르다: **identity freeze + slice-on-top-of-live + plan archive**.

---

## 1. 현재 상태 진단 (팩트 기반)

### 1.1 PRD 변동성 지수

| 일자 | 버전 | 크기 | 변화 성격 |
|---|---|---|---|
| 2026-03-25 | v4.1.3 | 61KB | 최초 포괄 PRD (인증·디렉토리·커피챗·커뮤니티·포지션 전부) |
| 2026-04-02 | v5.1 | 17KB | **1/4 축소** — 범위 압축, 세부 제거 |
| 2026-04-03 | v6.0 | 16KB | **정체성 재정의** — "혼돈의 근원" 서문, 3-layer 모델(Hook-Sticky-Revenue) 도입 |

**문제**: v4.1.3 기반으로 이미 35개 페이지가 빌드됐다. v5.1, v6.0은 축소 방향이지만 **기존 페이지 중 어느 것을 은퇴시킬지 결정되지 않음**. 결과: 라이브 UI에는 v4.1.3의 유물 + v6.0의 새 의도가 병존.

ValueHire가 "PRD가 매일 바뀌어서 엔지니어가 따라잡지 못한다"면, VCX는 **"PRD가 매번 더 작아지는데 코드는 계속 큰 그대로"**다.

### 1.2 Plan Sprawl (계획 확산)

`.omc/plans/` 스냅샷 (2026-04-17 기준 13개 활성):

| 파일 | 크기 | 일자 | 성격 | 현재 상태 |
|---|---|---|---|---|
| `invite-only-auth.md` | 37KB | 03-24 | 인증 설계 | 대부분 구현됨 |
| `p1-auth-completion-sprint.md` | 50KB | 03-25 | 스프린트 | 완료/부분 반영 불명 |
| `p2-p4-development-roadmap.md` | 55KB | 03-25 | 로드맵 | 정지 상태 |
| `sprint-implementation-plan.md` | 17KB | 03-25 | 스프린트 | 정지 |
| `vcx-design-review.md` | 14KB | 03-13 | 디자인 검토 | 질문 미해결 |
| `bmplan-multi-vertical-vision.md` | 11KB | 03-26 | **비전 피봇** — 미슐랭 3스타 다분야 확장 |
| `ai-resume-intelligence.md` | 36KB | 03-26 | **신제품 제안** |
| `cto-cpo-review-and-roadmap.md` | 22KB | 03-26 | **메타 리뷰** |
| `p0-critical-bugs-post-login.md` | 8KB | 03-31 | 버그 리스트 | 일부 수정, 추적 안됨 |
| `vcx-full-recode.md` | 9.7KB | 04-02 | **전체 리코드 제안** |
| `ai-ops-agent.md` | 12KB | 04-03 | **운영 에이전트** — "사용자 확인 대기" |
| `domain-expert-routing-rlvr.md` | 30KB | 04-03 | **OMC 도구 계획 — VCX 제품 아님** |
| `open-questions.md` | 6.7KB | 04-03 | 34개 미해결 질문 |

**의미 1 (ValueHire와 공통)**: 방향 문서가 실행 문서보다 많다.

**의미 2 (VCX 고유)**: **plan의 두 우주가 섞였다.** `domain-expert-routing-rlvr.md`는 `~/.claude/skills/omc-learned/`에 설치되는 개발 도구 계획이지 VCX 제품 스펙이 아니다. 이게 VCX plans 폴더에 있으면 "무엇이 VCX 스코프인지"가 흐려진다.

### 1.3 PRD vs 코드 격차 (VCX는 격차가 반대 방향)

| 영역 | 문서 | 실제 코드 |
|---|---|---|
| PRD v6.0 | 16KB, 6 pillars 재정의 | — |
| 인증/초대 | invite-only-auth.md 37KB | `src/app/(auth)/**`, `src/lib/auth/**` 풍부 ✅ |
| 커뮤니티 | PRD §2 Feature | 익명 커뮤니티 전체 구현 ✅ |
| 디렉토리 | PRD §2 Feature | 멤버 프로필 페이지 live ✅ |
| CEO 커피챗 | PRD §2 Feature | 생성/열람/편집 live ✅ |
| Peer 커피챗 | PRD §2 Feature + AI Brief | 생성/수락/브리프/피드백 live ✅ |
| 포지션 | PRD §2 Feature | 생성/열람/편집 live ✅ |
| **큐레이션 피드 (v6.0 신규)** | §2 Feature 1 | `(protected)/feed/page.tsx` **스텁만** ⚠️ |
| Admin 패널 | PRD §7 | 9개 admin 페이지 ✅ |
| **AI Brief 시스템** | 비공식 — PRD 없이 구현 | 완성 + 최근 피드백 수집 ✅ |
| **마이그레이션 중복** | CLAUDE.md 기재 | 013, 014 **두 번씩 존재** ❌ |
| **ADR** | **부재** | — |
| **FEATURE_MANIFEST** | **부재** | — |
| **Process SoT** | **부재** | — |
| **OpenAPI spec** | **부재** | 48개 Route Handler 존재 |
| **Design tokens JSON** | **부재** | `src/constants/site.ts`에 산재 |

**핵심 비대칭**: "코드 기능 > PRD 선언"의 역 비대칭. 빌드는 풍부하지만 **"무엇이 완성된 스코프인지"를 선언하는 문서가 없다.** 출시 여부를 "제품이 돈다"로 말할 수 있지만 "v6.0 Phase 1 DoD 달성"으로 말할 수 없다.

### 1.4 정체성 미결의 증거

`prd6.0.md` §0.1 원문:

> "현재 VCX는 두 개의 정체성 사이에서 흔들리고 있다. 헤드헌팅 플랫폼인가, 커뮤니티인가."

v6.0 자체가 이 질문에 **"수익=헤드헌팅 25% 성사 수수료, 커뮤니티=수단"**으로 답했지만, 동시에 최근 커밋들은 반대 방향으로 움직인다:

- `78c6d4f` — "Peer Coffee Chat insight — 수수료 구조 언급 제거"
- `8da76a0` — "Benefit 수수료 노출 제거"
- `f0bbc91` — "CEO 커피챗 컨셉 전환 — 역방향 채용 → 컬쳐핏 확인"

**의미**: PRD는 "헤드헌팅이 목적, 커뮤니티는 수단"이라 선언했지만, UI는 "수익 구조를 멤버에게 숨긴다"는 반대 방향으로 정리되고 있다. 이는 틀린 판단이 아닐 수 있다 (프리미엄 인재 앞에 "수수료" 단어는 마찰 요소) — 하지만 **ADR로 닫지 않으면 "왜 숨겼지? 다시 노출하자"가 6주 안에 다시 튀어나온다.**

### 1.5 piledup 의사결정의 증거 (open-questions.md)

`open-questions.md` 7개 섹션:
1. vcx-design-review (2026-03-13) — Branding 일관성 4개 질문, **35일째 미해결**
2. AI Resume Intelligence v2.0 (2026-03-26) — 8개 미해결 (Vercel Pro 여부 등)
3. P0 Critical Bugs Post-Login (2026-03-31) — 3개 (migration 019 적용 방법 등)
4. BMplan 멀티 버티컬 (2026-03-26) — 4개
5. Domain Expert Auto-Routing (2026-04-03) — 6개 ← **VCX 제품 아님**
6. AI Ops Agent (2026-04-03) — 5개
7. (제목 없음) — 2개

**34개 중 실제 VCX 제품 관련 = 약 20개. 나머지는 사이드 프로젝트.** 이 파일 자체가 "무엇을 결정해야 하는지"의 stale 백로그가 되어, 열어봐도 행동으로 연결되지 않는다.

### 1.6 기술부채 방치 신호

CLAUDE.md에 명시된 것들 중 **여전히 살아있는 항목**:
- Migration 013, 014 **중복 번호** — "현재 013, 014번 중복 존재 — 주의"로 기록만 되고 해결 안 됨
- `019_vcx_fix_get_user_info.sql` — 4-3에 머지되었지만 `open-questions.md`는 여전히 "적용 방법 결정 필요"를 열어둠 → **실적용 상태 미검증**

이는 drift의 증상이다: 알고 있는데 닫지 못한다.

### 1.7 ValueHire와 정반대의 Gating 역설

ValueHire: 게이트가 너무 무거워서 실행이 멈춤.
VCX: 게이트가 너무 가벼워서 **"일단 만듦 → 승인 없음 → PRD가 뒤따라 수정"** 패턴. 이게 v4.1.3 → v5.1 → v6.0 축소의 정체다. 만든 뒤에 PRD를 거기에 맞춘다.

---

## 2. 구조적 문제 5가지 (VCX 버전)

### P-1. "PRD 축소 루프" (Reverse Creep)
PRD가 매번 작아진다. 각 축소는 올바른 판단이지만, **축소된 스펙이 기존 코드 페이지를 은퇴시키는 결정을 동반하지 않음**. 결과: "코드는 v4.1.3 유산, 선언은 v6.0"의 2중 현실.

### P-2. "정체성 미결 → 소프트 결정 반복"
헤드헌팅 vs 커뮤니티, 수수료 공개 vs 은폐, CEO 커피챗이 "역방향 채용"이냐 "컬쳐핏 확인"이냐. 이 3개 축이 커밋 레벨에서 흔들렸고 **ADR로 닫히지 않아서** 3달 뒤 다시 흔들릴 위험이 구조적으로 살아있다.

### P-3. "plan의 두 우주 혼재"
VCX 제품 plan (6-pillars, AI Brief, feed) + 개발 도구 plan (domain-expert-routing, ai-ops-agent 일부) + 비전 플레어 (multi-vertical) 가 **같은 `.omc/plans/` 폴더**에 들어있다. "지금 무엇이 우선순위인가"를 묻는 사람에게 이 폴더는 혼란만 준다.

### P-4. "Drift 없는 Definition of Done"
무엇이 "Phase 1 완료"인지 정의가 없다. AI Brief는 구현되었지만 PRD v6.0에 항목으로 없다. Feed 스텁은 존재하지만 PRD v6.0 §2 Feature 1의 acceptance가 없다. **"선언된 스코프"와 "살아있는 코드" 사이에 다리가 없으면 완료 판정도 불가능**.

### P-5. "알고 있는데 닫히지 않는 것들"
- Migration 013, 014 중복 (6주째)
- Branding 일관성 질문 (5주째)
- Migration 019 실적용 검증 (2주째)
- 이런 항목이 open-questions.md에 쌓이지만 "누가 언제까지" 표시가 없다. 이것이 기술부채 눈덩이.

---

## 3. 방향 타당성 판정 (VCX 실사)

| 영역 | 판정 | 근거 |
|---|---|---|
| PRD v6.0 §0 정체성 진단 | **KEEP** | "헤드헌팅이 목적, 커뮤니티가 수단" 판단은 수익 현실과 일치. ADR로 닫기만 하면 됨 |
| 3-layer (Hook-Sticky-Revenue) | **KEEP** | 최근 30일 실험으로 검증됨 (AI Brief = Sticky 강화 실증) |
| 6 pillars (초대, 디렉토리, 커뮤니티, CEO/Peer 커피챗, 포지션) | **KEEP** | 이미 구현·운영 중. 축소 불가 |
| **AI Brief System** | **KEEP — PRD에 승격** | 비공식 구현 → 정식 Feature 승격 필요. PRD v6.0 §2에 항목 추가 |
| **큐레이션 피드 (v6.0 §2 Feature 1)** | **KEEP — First Slice 타깃** | 스텁 존재. 이걸 완성하는 게 Phase 1의 핵심 |
| 수수료 비노출 정책 | **KEEP — ADR로 닫기** | 커밋 3회 반복 = 이미 결정됨. ADR-0001로 영구화 |
| CEO 커피챗 "컬쳐핏" 재정의 | **KEEP — ADR로 닫기** | 2번 바뀐 컨셉. 세 번째 바뀌기 전에 ADR-0002 |
| multi-vertical 비전 | **DEFER — Phase 3+** | 본 4주 스코프에서 제외. `_backlog/`로 |
| AI Resume Intelligence | **DEFER — Phase 2 재평가** | 독립 제품 성격. Phase 1 완료 후 재검토 |
| vcx-full-recode | **STOP** | v6.0 PRD에 이미 흡수됨. 별도 plan 필요 없음. Archive |
| AI Ops Agent | **ADJUST — Infra minimal** | 헬스체크 1개 + Sentry 기존 + Vercel 기본 로그만. 7요소 전체 구현은 Phase 2 |
| domain-expert-routing-rlvr | **MOVE OUT** | VCX 제품 아님. `~/.claude/skills/` 또는 OMC 플러그인 쪽으로 이관 |
| Migration 013, 014 중복 | **FIX — Sprint 1 내** | 기술부채. 새 마이그레이션 022로 정리 |
| 34개 open questions | **TRIAGE — Sprint 1** | 오너 + 기한 태깅. Orphan 질문은 아카이브 |

---

## 4. 즉시 실행 가능한 교정안 (이번 주)

### 4.1 Identity Freeze (v6.0 락다운)

- **2026-04-17 23:59 기준 `docs/prd6.0.md` 락다운**. 4주간 §0~§2 변경 금지
- AI Brief를 PRD v6.0 §2에 **즉시 편입** (ADR-0003)
- 변경 필요 시 **ADR** 작성 + CPO/CTO 양자 승인 (구두 합의 금지)

### 4.2 Decision Closure ADR 5건 (Sprint 1 내 작성)

| ADR | 주제 | 근거 커밋 |
|---|---|---|
| ADR-0001 | 수수료 구조를 멤버 UI에 노출하지 않는다 | `78c6d4f`, `8da76a0` |
| ADR-0002 | CEO 커피챗의 제1 선언은 "컬쳐핏 확인" | `f0bbc91` |
| ADR-0003 | AI Brief는 Peer Coffee Chat Sticky의 공식 하위 피처다 | `4b9ee4e`, `f807e4f`, `9788e7a` |
| ADR-0004 | PRD는 v6.0을 단일 기준점으로 한다 (v4.1.3, v5.1 아카이브) | PRD 파일 스냅샷 |
| ADR-0005 | Domain Expert Routing + RLVR은 VCX 제품이 아니다 — OMC 스킬로 분리 | `domain-expert-routing-rlvr.md` |

### 4.3 First Vertical Slice 정의 (4주)

**"초대받은 인재가 로그인 → 큐레이션 피드에서 맞춤 채용정보를 본다 → 관심 있는 포지션에 커피챗 신청 → AI Brief 확인 → 세션 후 피드백 제출한다"**

포함 페이지 (기존 live + 1개 신규):
1. `/login` + `/invite/accept` (live) — 인증/온보딩
2. `/onboarding` (live) — 온보딩 UX 버그 3종 수정 (GNB, 중복 입력, progress 0%)
3. `/feed` (**신규 - v6.0 Feature 1**) — 큐레이션 피드 MVP
4. `/directory`, `/directory/[id]` (live) — 디렉토리
5. `/coffeechat/create`, `/coffeechat/[id]` (live) — 커피챗 + AI Brief
6. 포지션 브라우즈 (live)
7. 세션 후 피드백 제출 (live)

**Slice 밖**: Admin 작업, Community 신규 기능, CEO 커피챗 고도화, Multi-vertical, AI Resume.
**Slice 안 기능의 E2E Playwright 시나리오 1건이 CI에서 녹색일 것.**

### 4.4 Authorization Re-set

| 레벨 | 승인자 | 대상 |
|---|---|---|
| **L-Lite** | 스스로 | 테스트, 스타일, 문서 오탈자, deps patch |
| **L-Std** | CTO 1인 | 신규 파일, 마이그레이션, 신규 API 엔드포인트, UI 신규 페이지 |
| **L-High** | CPO+CTO 2인 | PRD/PROCESS/MANIFEST/ADR, PII/법률/결제 |

ValueHire 보고서 §4.3의 PR-level authorization과 동일. 단, 현재 팀이 1인이므로 CPO=CTO=Sangmo임을 인정하고 **2-hand commitment = "PR 생성 + 48시간 쿨다운 + 본인 재서명"** 으로 구조화.

### 4.5 진행 측정 지표 3개

매주 금요일 18:00 측정:
1. **M1 Slice Pages Green**: Phase 1 Slice 5개 스텝 중 E2E 통과 스텝 수 (목표 5/5)
2. **M2 ADR Closed**: 위 §4.2 5개 ADR 중 서명 완료 수 (목표 5/5)
3. **M3 Plan Active Count**: `.omc/plans/` 활성 파일 수 (목표 ≤ 3)

Phase 1 DoD = **M1 = 5, M2 = 5, M3 ≤ 3**.

### 4.6 Plan File Hygiene — Archive 9건 (VCX 8 + 외부 1)

아래 8개를 `docs/plans/_archive/` 로, 1개는 `~/.claude/skills/` 로 이관 (상세: `docs/plans/_archive/INDEX.md`):

| 파일 | 이관 대상 | 사유 |
|---|---|---|
| `vcx-full-recode.md` | `_archive/` | PRD v6.0에 흡수됨 |
| `p1-auth-completion-sprint.md` | `_archive/` | 완료 또는 해당 로드맵 대체 |
| `p2-p4-development-roadmap.md` | `_archive/` | v4.1.3 전제 — 현행성 없음 |
| `sprint-implementation-plan.md` | `_archive/` | v4.1.3 전제 |
| `bmplan-multi-vertical-vision.md` | `_archive/` | Phase 3+ 백로그 |
| `ai-resume-intelligence.md` | `_archive/` | Phase 2 후보 백로그 |
| `cto-cpo-review-and-roadmap.md` | `_archive/` | 본 보고서가 대체 |
| `vcx-design-review.md` | `_archive/` | 5주 미해결 질문, Branding 통합 대상 (D-0003) |
| `ai-ops-agent.md` | `_archive/infra/` | 7요소 전체는 Phase 2, 헬스체크만 Sprint 1 |
| `domain-expert-routing-rlvr.md` | `~/.claude/skills/` (제품 아님) | VCX 제품 아님 (§7.5 두 우주 분리) |

이관 후 `.omc/plans/` active = 0 (비움, §7.5 원칙 적용). `docs/plans/` active = 3 (`VERTICAL_SLICE_PHASE1.md` + `_open_questions_triaged.md` 보조 + `_backlog/ideas.md` 보조). `docs/` 루트 active = 2 (`PROCESS.md`, 본 보고서) — **M3 Plan Active Count ≤ 3 달성**.

---

## 5. 4주 Sprint Plan (구체)

### Sprint 1 (2026-04-18 ~ 04-24) — "Close Decisions & Fix Debt"

| 작업 | 산출물 |
|---|---|
| ADR-0001 ~ ADR-0005 서명 | `docs/prd/ADR/*.md` 5건 |
| `docs/PROCESS.md` 서명 | 본 프로세스 SoT 공식화 |
| Migration 013·014 중복 정리 | `supabase/migrations/022_vcx_dedupe_013_014.sql` |
| Migration 019 실적용 검증 | `scripts/verify-rpc-applied.sh` + Sentry 0건 확인 |
| 온보딩 UX 버그 3종 수정 | GNB 경로, 중복 입력, progress 0% |
| open-questions.md triage | 20개 VCX 질문만 남기고 오너·기한 태깅, 14개 아카이브 |
| Plan archive 8건 실행 | `docs/plans/_archive/INDEX.md` 작성 |
| `docs/sdd/FEATURE_MANIFEST.yaml` 초기판 | 6 pillars + AI Brief + Feed 7개 항목 |
| Playwright E2E 1건 | "로그인 → 디렉토리 → 커피챗 신청" 시나리오 녹색 |

### Sprint 2 (2026-04-25 ~ 05-01) — "Cold Start Feed MVP"

| 작업 | 산출물 |
|---|---|
| `vcx_feed_items` 테이블 (020 재활용 또는 확장) | 마이그레이션 완료 + seed |
| 관심 분야 태깅 UI (온보딩에서 수집) | `/onboarding` 확장 |
| `/feed` MVP (수동 큐레이션 10건 표시) | Page live + SWR |
| 어드민 피드 아이템 생성 API | `/api/admin/feed/items` |
| `/api/feed?tags=` 개인화 필터 | Route Handler + 테스트 |
| Stibee 수동 뉴스레터 1회 발송 | 오픈율·클릭율 측정 (prd6.0 §1.4) |

### Sprint 3 (2026-05-02 ~ 05-08) — "Coffee Chat Loop + AI Brief Quality"

| 작업 | 산출물 |
|---|---|
| Peer 커피챗 플로우 E2E 재검증 | 시나리오 2건 |
| AI Brief 생성 품질 리그레션 | 10개 샘플 인간 평가 |
| Post-session feedback 데이터 분석 대시보드 | `/admin/ops` 연결 |
| CEO 커피챗 "컬쳐핏" 카피 전면 재적용 | ADR-0002 반영 |
| 수수료 비노출 정책 grep 검증 | CI 스크립트 `scripts/check-fee-hidden.sh` |

### Sprint 4 (2026-05-09 ~ 05-15) — "Onboarding + Landing + Phase 1 DoD"

| 작업 | 산출물 |
|---|---|
| Landing (`/`) v6.0 카피 반영 | public page |
| 온보딩 V2 (중복 제거, 자유 태그) | `/onboarding` V2 |
| Playwright 5개 Slice E2E 전체 녹색 | CI green |
| a11y, Lighthouse 예산 통과 | artifact |
| **Phase 1 DoD 검증 회의** | Go/No-Go |

---

## 6. Red Flags — 하나라도 발생 시 즉시 멈춤

1. Sprint 1 종료 시점에 ADR 서명 < 5개
2. 5번째 PRD(v6.1 이상) 초안이 Sprint 2 전에 등장
3. `.omc/plans/`에 새 "방향 제안" 문서가 추가됨
4. `/feed` 가 Sprint 2 종료 시점에도 스텁 상태
5. Playwright E2E가 Sprint 4 종료 시점에도 1건도 CI 녹색 아님
6. Migration 013·014 중복이 Sprint 1 이후에도 남아있음

---

## 7. 프로세스 자체에 대한 권고 (메타 레벨)

### 7.1 "논의는 자유, 결정은 ADR로 닫는다"

ValueHire 보고서 §7.1의 원칙을 그대로 채택. VCX는 특히 **"수수료 노출 여부", "CEO 커피챗 정체성", "multi-vertical 확장 시기"** 3개 축이 반복적으로 흔들리므로 ADR 강제 효과가 크다.

### 7.2 "Two-Hand Commitment" (1인 팀 변형)

VCX는 1인 코어 체제. 표준 2-hand(CPO+CTO 2명)가 불가능하므로 **"자기 서명 + 48시간 쿨다운 + 재서명"** 구조로 대체. 48시간 안에 번복하고 싶어지는 아이디어는 ADR로 닫지 않는다.

### 7.3 "Weekly Finish" 리듬

매주 금요일 18:00 30분:
1. M1/M2/M3 숫자
2. **Loom 또는 화면녹화 1분 데모** — Slice 위의 오늘 상태
3. 다음 주 목표 1개

영상 없으면 "이번 주 진행 없음"으로 기록. `docs/history.md` 자동 append (기존 stop hook 활용).

### 7.4 "Plan Budget" — Active ≤ 3

`docs/plans/` + `.omc/plans/` 합산 active **3개 제한** (VERTICAL_SLICE, PROCESS, OPEN_QUESTIONS triaged). 새 plan 추가 시 기존 1개를 `_archive/` 로. 이것으로 plan sprawl 자동 억제.

### 7.5 "Two Universes" 분리 원칙

VCX 제품 plan과 **개발 도구 (OMC 스킬·에이전트) plan**은 **물리적으로 분리**:
- VCX 제품: `docs/plans/`
- 개발 도구: `~/.claude/skills/` 또는 OMC 플러그인 저장소
- 혼재 금지. revert 대상.

### 7.6 Engineering Harness 즉시 적용

- `scripts/prd-freeze-check.sh` — pre-commit: `docs/prd6.0.md` 수정 시 ADR 파일 없으면 block
- `scripts/weekly-metrics.sh` — 금요 18:00 `.omc/state/weekly-metrics.json` 기록
- `scripts/check-fee-hidden.sh` — ADR-0001 enforcement: 수수료 %, "25%", "수수료" 단어가 클라이언트 번들에 포함되면 fail

Sprint 1 내 구현. CI 연결은 Sprint 2.

---

## 8. 최종 권고 (1-hand + 48h 서명 요청)

이 보고의 요지는 **세 문장**:

1. **PRD v6.0은 옳다. 정체성 반복 재정의를 ADR로 닫을 것.**
2. **이미 만들어진 제품 위에 Vertical Slice를 새로 얹을 것 — 재코드가 아닌 활성화.**
3. **Plan sprawl이 판단을 대체 중이다. Active ≤ 3 + 두 우주 분리로 교정할 것.**

**서명 요청**:
- [ ] CPO/CTO (Sangmo Kang) — 본 리뷰 결론 수락
- [ ] v6.0 scope freeze 4주 동의
- [ ] 48시간 쿨다운 후 ADR-0001~0005 최종 서명
- [ ] 4주 Sprint Plan 책임, 금요일 18:00 Weekly Finish 리듬 준수
- [ ] 서명 일자: 2026-04-17 → 재서명 2026-04-19

---

## 부록 A — 증거 파일 인덱스

- `docs/prd6.0.md` §0, §1, §2 — 현행 정체성 + 3-layer
- `docs/prd5.1.md`, `docs/prd4.1.3.md` — 축소 이력 (아카이브 대상)
- `CLAUDE.md` Anti-Patterns 섹션 — migration 013·014 중복 기재
- `.omc/plans/open-questions.md` — 34개 열린 질문
- `.omc/plans/vcx-full-recode.md` — PRD v6.0에 흡수됨
- `.omc/plans/domain-expert-routing-rlvr.md` — VCX 제품 아님 증거
- `supabase/migrations/021_vcx_ai_brief_feedback.sql` — 최신 마이그레이션 (AI Brief 피드백 테이블)
- 최근 커밋 `78c6d4f`, `8da76a0`, `f0bbc91` — ADR-0001·0002 소급 기록 대상
- `src/app/**/page.tsx` 35개 — 실제 구현 범위

## 부록 B — 결정 비교 테이블

| 질문 | 현재 기본값 | 본 리뷰 권고 |
|---|---|---|
| 다음 기능 추가? | 자유 | 4주간 Feed 외 금지 |
| PRD 수정? | 자유 | ADR 필수, 48h 쿨다운 |
| 새 plan 문서? | 자유 | Active ≤ 3, 기존 archive 필수 |
| Sprint 게이트? | 없음 | PR 단위 자동 승인 + 금요 Weekly Finish |
| 정체성 재논의? | 수시 | ADR-0001·0002 닫히면 12주 동결 |
| 런칭 기준? | 모호 | Slice E2E 5/5 + ADR 5/5 + Plan ≤ 3 |
| 측정 지표? | 없음 | 매주 M1/M2/M3 (§4.5) |
| 제품 plan vs 도구 plan? | 혼재 | 물리 분리 (§7.5) |

---

*본 문서는 VCX v6.0 PRD와 독립적으로 검토된 프로세스 리뷰입니다. 기술적 설계 결정이 아닌 **조직 실행력 진단**입니다. 방향 자체에 대한 이견이 아니라 **방향대로 실행되고 닫히도록 하는 골격**에 대한 제안입니다. 벤치마크 기준: ValueHire v7.x dev-process-review (2026-04-17 동일 일자).*
