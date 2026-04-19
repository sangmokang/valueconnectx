# Architecture Decision Records (ADR)

> VCX의 PRD/PROCESS/스코프 변경을 닫는 단일 기록 매체.
> 상위 규칙: `docs/PROCESS.md` §1.2 ~ §1.4.

---

## 왜 ADR인가

VCX는 지난 30일간 **PRD 3회 개정**과 **5개 대형 방향 피봇 제안**이 혼재했고, "헤드헌팅 vs 커뮤니티", "수수료 노출 vs 은폐", "CEO 커피챗 = 역방향 채용 vs 컬쳐핏" 같은 결정이 반복적으로 흔들렸다. ADR은 **"이 결정은 언제 누가 왜 내렸고, 언제 어떻게 뒤집을 수 있는가"** 를 단일하게 기록하여 **같은 결정이 다시 흔들리지 않도록 한다**.

---

## 번호 체계

- `ADR-NNNN-kebab-title.md` — 4자리 zero-pad.
- 한 번 매긴 번호 재사용 금지.
- 번복은 새 ADR을 만들어 **supersedes** 체인으로 닫는다.
- 예약 번호대:
  - `ADR-0000-*` : PROCESS meta 변경 (자기 수정)
  - `ADR-0001 ~ 0999` : 제품/스코프 결정
  - `ADR-1000 ~ 1999` : 인프라/보안
  - `ADR-2000 ~ 2999` : 외부 API·결제·법률

---

## 서명 규칙 (PROCESS §1.4 — 1인 팀 변형)

- **1차 서명 (Self)**: 작성 당일.
- **2차 서명 (Cooldown +48h)**: 48시간 경과 후 재서명.
- 쿨다운 중 번복하고 싶어지면 → ADR abort. 기록은 남기되 `Status: Abandoned` 로 표시.
- 쿨다운 넘어선 재서명 = "48시간 지나도 여전히 옳다"의 증거.

긴급 트랙 (쿨다운 면제) 3개 — PROCESS §1.1:
1. Legal Blocker
2. User Harm
3. Cost Explosion (월 API 예산 150% 초과)

---

## ADR 템플릿

아래를 복사하여 `ADR-NNNN-kebab-title.md` 로 저장.

```markdown
# ADR-NNNN: <Decision title>

- **Status**: Proposed | Cooldown | Accepted | Superseded by ADR-XXXX | Abandoned
- **Date (1st sign)**: YYYY-MM-DD
- **Date (2nd sign, +48h)**: YYYY-MM-DD
- **Signers**: Sangmo Kang (Self)
- **Supersedes**: — / ADR-XXXX
- **Related**: PRD section, commit hashes, plan files

## Context

(왜 이 결정이 필요한가. 어떤 증거/상황이 이를 유도했는가. 이전에 흔들렸던 이력이 있다면 커밋 해시로 명시.)

## Decision

(무엇을 결정하는가. 1-2문장으로 요약 가능해야 한다.)

## Consequences

### Positive
- ...
### Negative / Risk
- ...

## Enforcement

- 코드 레벨에서 강제하는 방법 (CI 스크립트, lint 규칙, 테스트 등).
- 없으면 "Enforcement: Manual review only" 명시.

## Follow-ups

- 이 ADR이 트리거하는 작업 (manifest 갱신, 스크립트 작성 등).
```

---

## Sprint 1 소급 작성 대상 (2026-04-24 기한)

| ADR | 주제 | 근거 |
|---|---|---|
| `ADR-0001-fee-structure-hidden.md` | 수수료 구조를 멤버 UI에 노출하지 않는다 | 커밋 `78c6d4f`, `8da76a0` (반복 조정됨) |
| `ADR-0002-ceo-coffeechat-culturefit.md` | CEO 커피챗의 제1 선언은 "컬쳐핏 확인" | 커밋 `f0bbc91` (개념 2회 전환됨) |
| `ADR-0003-ai-brief-as-official-feature.md` | AI Brief는 Peer Coffee Chat Sticky의 공식 하위 피처다 | 커밋 `f807e4f`, `4b9ee4e`, `9788e7a` |
| `ADR-0004-prd60-as-single-source.md` | PRD는 v6.0을 단일 기준점으로, v4.1.3·v5.1은 아카이브 | `docs/prd6.0.md` §0 |
| `ADR-0005-domain-expert-routing-out-of-scope.md` | Domain Expert Routing + RLVR은 VCX 제품이 아닌 OMC 도구 | `.omc/plans/domain-expert-routing-rlvr.md` |

---

## 현재 ADR 목록

| # | Title | Status | Date |
|---|---|---|---|
| — | (Sprint 1 내 작성 예정) | — | — |

(ADR 추가 시 위 표 자동 갱신 — `scripts/adr-index.sh` Sprint 2 작성 예정.)
