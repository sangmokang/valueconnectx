# ADR-0002: CEO 커피챗 = 컬쳐핏 확인

- **Status**: Accepted
- **Date (1st sign)**: 2026-04-19
- **Date (2nd sign, +48h)**: 2026-04-21
- **Date (merged)**: 2026-04-22
- **Signers**: Sangmo Kang (Self)
- **Supersedes**: —
- **Related**: docs/prd6.0.md §CEO Coffee Chat (F-CEO-COFFEECHAT), commit `f0bbc91`, PROCESS.md Annex A §A.2 (batch ADR-0001~0005)

## Context

CEO 커피챗 피처는 초기에 "역방향 채용(Reverse Recruiting)" — CEO/C-level이 인재에게 먼저 제안하는 컨셉으로 설계되었다. 그러나 커밋 `f0bbc91`에서 확인되듯 해당 컨셉은 두 차례 방향이 전환되었다. "역방향 채용" 프레이밍은 채용 플랫폼과의 차별화를 흐리고, VCX의 "검증된 네트워크" 정체성과도 충돌한다. PRD v6.0은 이 피처의 제1 선언을 "컬쳐핏 확인"으로 확정했다.

## Decision

CEO 커피챗(F-CEO-COFFEECHAT)의 핵심 목적은 "역방향 채용"이 아닌 "컬쳐핏 확인"이다. CEO/Founder/C-level이 핵심 인재와 비공식적으로 대화하며 조직 문화 적합성을 확인하는 것이 이 피처의 유일한 선언된 목적이다.

## Consequences

### Positive
- 피처 목적이 단일해져 UI 카피, 매칭 로직, 온보딩 안내가 일관성을 갖는다.
- "채용 플랫폼"이 아닌 "Private Talent Network" 정체성 강화에 기여한다.
- 컬쳐핏 중심 프레이밍은 법률적으로도 채용 계약 리스크를 줄인다.

### Negative / Risk
- 일부 기업 사용자는 여전히 직접 채용 의사를 CEO 커피챗을 통해 전달하려 할 수 있다 — 운영 가이드라인 필요.
- "역방향 채용" 기대로 가입한 초기 베타 기업 사용자와 기대 불일치 가능성.

## Enforcement

- UI 카피 리뷰: `src/app/(protected)/ceo-coffeechat/` 및 관련 컴포넌트에 "채용", "job offer", "recruit" 등의 문구 포함 시 코드 리뷰에서 플래그.
- 신규 기능 명세 시 "컬쳐핏 확인" 범위 내인지 PR 체크리스트 항목으로 추가.

## Follow-ups

- `src/app/(protected)/ceo-coffeechat/` 페이지 카피를 PRD v6.0 §F-CEO-COFFEECHAT 기준으로 감사.
- 기업 사용자 온보딩 가이드에 CEO 커피챗 목적 명시.
- 관련 ADR: ADR-0004 (PRD v6.0 단일 기준)
