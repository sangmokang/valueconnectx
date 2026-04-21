# ADR-0001: 수수료 구조 멤버 비노출 원칙

- **Status**: Accepted
- **Date (1st sign)**: 2026-04-19
- **Date (2nd sign, +48h)**: 2026-04-21
- **Date (merged)**: 2026-04-22
- **Signers**: Sangmo Kang (Self)
- **Supersedes**: —
- **Related**: docs/prd6.0.md §수익 모델, commits `78c6d4f` `8da76a0`, PROCESS.md Annex A §A.2 (batch ADR-0001~0005)

## Context

VCX의 수수료 구조는 개발 초기부터 "멤버에게 노출할 것인가"를 두고 커밋 `78c6d4f`와 `8da76a0`에서 반복적으로 조정되었다. 멤버(인재)는 네트워크에 참여하는 주체이고, 기업(Corporate User)은 채용/네트워킹의 수혜자이다. 두 역할에 동일한 수수료 정보를 노출할 경우 멤버 경험이 저해되고, 주주가치 보호 측면에서도 수익 구조가 불필요하게 공개된다.

## Decision

VCX는 수수료 및 요금 정보를 멤버(vcx_members) UI에 일절 노출하지 않는다. 수수료 관련 정보는 기업 사용자(vcx_corporate_users) 전용 인터페이스에만 표시한다.

## Consequences

### Positive
- 멤버 경험이 단순해지고 "선발된 네트워크" 브랜드 이미지가 강화된다.
- 수익 구조가 외부에 불필요하게 노출되지 않아 경쟁사 벤치마킹 리스크를 줄인다.
- 멤버·기업 간 역할 분리가 UI 레벨에서 명확해진다.

### Negative / Risk
- 멤버가 서비스 지속 가능성에 의문을 가질 경우 신뢰를 검증할 수단이 없다.
- 기업 전용 UI에서 수수료 정보를 별도 관리해야 하는 유지보수 분리 비용이 발생한다.

## Enforcement

- `scripts/check-fee-hidden.sh` — CI에서 `src/app/**`, `src/components/**` 대상으로 수수료 노출 코드 패턴 스캔 (PROCESS.md §7 참조).
- 코드 리뷰 시 멤버 대상 페이지에 요금/수수료 문자열 포함 여부 수동 확인.

## Follow-ups

- `scripts/check-fee-hidden.sh` Sprint 1 내 작성 (PROCESS.md §7).
- Feature Manifest에서 Corporate User 전용 수수료 표시 기능 scope 명시.
- 관련 ADR: ADR-0004 (PRD v6.0 단일 기준)
