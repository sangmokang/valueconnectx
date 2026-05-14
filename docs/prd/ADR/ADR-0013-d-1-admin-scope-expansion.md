# ADR-0013: Phase 1 D-1 Admin 스코프 부분 완화 — `/me` + `/admin` 통합 대시보드 허용

- **Status**: Accepted (L-Std, 1-hand 서명)
- **Date (1st sign)**: 2026-05-14
- **Signers**: Sangmo Kang (Self)
- **Supersedes**: —
- **Related**: `docs/plans/VERTICAL_SLICE_PHASE1.md` §4, ADR-0008 (1인 레포 opt-in), ADR-0011 (Phase 2 슬라이스), ADR-0012 (Phase 1 5/5 GREEN 정의), `docs/PROCESS.md` §1.4 / §4.1

## Context

`docs/plans/VERTICAL_SLICE_PHASE1.md` §4 "Slice 밖" 항목은 다음과 같이 명시되어 있다:

> Admin 신규 기능 (기존 9개 유지, `/admin/ops` 피드백 대시보드만 추가)

즉, Phase 1 (2026-04-18 ~ 2026-05-15) 4주간 admin 신규 기능은 **freeze 상태**이며 `/admin/ops` 피드백 대시보드 1건만 예외로 허용되어 있었다. 이 정책은 Sprint 1 시작 시점 (2026-04-17) 의 합리적 트레이드오프 — slice 5단계 코어 흐름 (초대→온보딩→피드→디렉토리→커피챗→피드백) 에 4주 capacity 를 집중하기 위한 의도적 동결 — 였다.

D-1 (2026-05-14) 시점에 owner (Sangmo Kang, CEO/CTO) 가 다음 두 가지 추가 영역의 출시 동시 제공이 필요하다고 직접 판단했다:

1. **회원용 마이페이지 `/me` (신규 라우트, 4섹션)**
   - 프로필 / 커피챗 / 커뮤니티 / 알림+설정
   - 출시 즉시 회원이 자기 활동을 한 화면에서 보는 self-admin 표면 부재 시 stickiness (재방문 동기) 가 약하다는 owner 판단.
   - 기존 `/directory/me` 는 디렉토리 표출 관점의 프로필 편집 페이지 — 활동 가시화 표면이 아님.

2. **운영자용 `/admin` 통합 대시보드 (신규, KPI 위젯)**
   - 출시 직후 일별 핵심 지표 (가입/초대 수락/피드 노출/커피챗 신청/피드백 수집) 가시화.
   - 현재 `/admin/ops` 는 피드백 한정 — 전체 KPI 한눈 파악 표면 부재.

Phase 1 §4 freeze 정책을 그대로 두면 위 2개 영역은 D-Day 출시에 포함될 수 없다. 그러나 두 영역 모두 코어 slice 5단계 동작에는 의존하지 않으면서 **출시 직후 정착 (회원 stickiness + 운영 가시성)** 에 직접 기여한다는 비대칭 가치 판단이 성립한다.

따라서 §4 freeze 를 전체 해제하지 않고, **2개 영역만 명시 화이트리스트로 추가하는 부분 완화** 가 필요하다.

## Decision

**`docs/plans/VERTICAL_SLICE_PHASE1.md` §4 "Admin 신규 기능" 항목을 다음과 같이 부분 완화한다.**

### 1. 신규 허용 영역 (화이트리스트)

| 영역 | 라우트 | 범위 | 근거 |
|---|---|---|---|
| 회원 마이페이지 | `/me` | 4섹션 (프로필 / 커피챗 / 커뮤니티 / 알림+설정) | 회원 self-admin 표면 — 출시 직후 stickiness |
| 운영자 통합 대시보드 | `/admin` | KPI 위젯 (가입/초대/피드/커피챗/피드백 일별) | 출시 직후 운영 가시성 |

### 2. Freeze 유지 영역 (변경 없음)

다음 admin 하위 페이지는 **여전히 Phase 1 freeze 유지**:

- `/admin/curation`
- `/admin/recommendations`
- `/admin/feed`
- `/admin/positions`
- `/admin/hiring`
- `/admin/invites`
- `/admin/corporate-users`
- `/admin/analytics`
- `/admin/reports`

(Sprint 2 의 `Admin 피드 생성 UI` (Sprint 5표 line 126) 는 기존 9개 admin 페이지 중 `/admin/feed` 의 데이터 입력 기능으로 이미 존재하는 표면이며, 본 ADR 의 "신규 admin 기능" 정의에 포함되지 않는다.)

### 3. `/me` 와 `/directory/me` 관계

`/me` 는 **신규 라우트**이며 기존 `/directory/me` 와 별도로 공존한다. UX 통합 (단일 진입점화) 여부는 D-Day 이후 후속 검토로 분리한다. D-1 ~ D-Day 구간에서 `/directory/me` 의 동작·카피·라우팅을 변경하지 않는다 (CLAUDE.md §3.0 사용자 승인 카피 불가침 원칙 준수).

### 4. 적용 범위

본 ADR 은 **Phase 1 (2026-05-15 D-Day) 출시 시점 한정** 의 §4 부분 완화이며, Phase 2 admin 스코프 (ADR-0011) 와 직접적 의존 관계는 없다.

## Consequences

### 긍정

- **출시 즉시 회원 stickiness 표면 확보**: `/me` 가 회원 자기 활동 한 화면 가시화 → 재방문 동기 강화.
- **운영 가시성 즉시 확보**: `/admin` KPI 위젯으로 D-Day 직후 일별 지표 한눈 파악 → 데이터 기반 의사결정 가능.
- **freeze 의 본질 유지**: 9개 admin 하위 페이지는 여전히 동결 — slice 코어 회귀 리스크는 화이트리스트 2개로 한정.

### 부정

- **D-1 코드 추가로 회귀 리스크**: 2026-05-15 D-Day 직전 신규 라우트 2개 추가 → M1 (5/5 GREEN) 재검증 필수.
- **테스트 부채**: `/me` 와 `/admin` 신규 라우트의 Playwright spec 미존재 — D-Day 까지 작성 또는 ADR-0012 의 intentional skip 분류로 명시 격리 필요.
- **48h 쿨다운 면제 사용**: `docs/PROCESS.md` §1.4 긴급 트랙 사용 → 본 ADR 외 동일 패턴 반복 시 쿨다운 정책 약화 우려. 본 건은 **D-Day 직전 1회 한정** 으로 제한.

### 후속 액션

1. **머지 후 회귀 검증 (필수)**:
   ```bash
   npm run build
   npm run lint
   npx playwright test e2e/slice/
   ```
   회귀 0건 확인 후 D-Day 진입.

2. **신규 라우트 테스트 분류** (ADR-0012 정책 적용):
   - `/me` 4섹션 각각 happy-path 1건 → S1 또는 신규 spec 으로 추가, 또는 intentional skip + SKIP-REASON 주석.
   - `/admin` KPI 위젯 → 운영자 인증 보호 확인 1건.

3. **`/me` ↔ `/directory/me` UX 통합 후속 검토**: D-Day +7d 이후 별도 ADR 또는 plan 으로 분리.

4. **`docs/plans/VERTICAL_SLICE_PHASE1.md` §4 + §7 Changelog 동기 갱신** (본 ADR 적용 즉시).

## Alternatives Considered

1. **§4 freeze 전체 해제** — 거부. 9개 admin 하위 페이지까지 신규 작업 허용 시 D-1 시점 capacity 초과 + 회귀 리스크 비대칭 증가. 화이트리스트 2개로 한정하는 편이 의도-효과 매칭에 유리.

2. **D-Day 이후 별도 마이너 릴리스 (D+3 ~ D+7) 로 연기** — 거부. `/me` 부재 시 출시 첫 주 회원 활동 가시화 표면이 없어 stickiness 측정 자체가 불가능. `/admin` KPI 부재 시 출시 첫 주 운영 의사결정이 정성적 인상 의존 → 데이터 기반 회고 불가.

3. **`/me` 만 허용, `/admin` 대시보드 연기** — 부분 채택 검토 후 거부. 두 영역 모두 코어 slice 의존 없는 신규 라우트이며 구현 표면이 분리되어 있어 회귀 리스크가 동시 도입에서도 가산적이지 않음. 운영 가시성을 출시 첫 주에 함께 확보하는 편이 회고 품질에 직접 기여.

## Authority

- **Level**: L-Std (`docs/PROCESS.md` §4.1) — Phase 1 plan §4 부분 완화는 sprint-level 스코프 조정이며 product north star (CLAUDE.md §1) 변경 아님.
- **Cooldown**: 48h 면제 — `docs/PROCESS.md` §1.4 긴급 트랙. 사유: D-Day (2026-05-15) 직전 owner 직접 결정. D-1 시점에서 48h 대기 시 D-Day 적용 불가 → 출시 후 별도 릴리스로 연기되며 본 ADR Consequences §부정 의 alternative 2 와 동일 결과 → 의사결정 의의 소멸.
- **Approval**: 1-hand (Self), `vcx-cto` + `vcx-cpo` 합의 — ADR-0008 (1인 레포 opt-in) 근거.

## Changelog

| 일자 | 변경 | 서명 |
|---|---|---|
| 2026-05-14 | 초안 작성 + Accepted | Sangmo Kang |
