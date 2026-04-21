# ADR-0003: AI Brief = Peer Coffee Chat 공식 하위 피처

- **Status**: Accepted
- **Date (1st sign)**: 2026-04-19
- **Date (2nd sign, +48h)**: 2026-04-21
- **Date (merged)**: 2026-04-22
- **Signers**: Sangmo Kang (Self)
- **Supersedes**: —
- **Related**: docs/prd6.0.md §F-PEER-COFFEECHAT, commits `f807e4f` `4b9ee4e` `9788e7a`, PROCESS.md Annex A §A.2 (batch ADR-0001~0005)

## Context

AI Brief는 커밋 `f807e4f`, `4b9ee4e`, `9788e7a`를 거치며 독립 제품으로 제안된 적이 있다. 별도 네비게이션 항목, 독립 랜딩 페이지, 독자적 요금 모델 등이 검토되었다. 그러나 AI Brief의 실질적 가치는 Peer Coffee Chat 세션 품질을 높이는 데 있으며, 독립 제품으로 분리할 경우 Peer Coffee Chat 피처의 완성도가 낮아 보이고 사용자 흐름이 단절된다. PRD v6.0은 AI Brief를 F-PEER-COFFEECHAT의 공식 하위 피처로 확정했다.

## Decision

AI Brief는 독립 제품이 아니라 Peer Coffee Chat(F-PEER-COFFEECHAT)의 품질 강화 하위 피처다. 별도 제품 포지셔닝, 독립 GNB 항목, 독자 요금 체계는 허용되지 않는다.

## Consequences

### Positive
- 사용자 흐름이 단순해진다: 커피챗 신청 → AI Brief 자동 생성 → 세션 진행.
- Feature Manifest와 GNB 구조가 단순하게 유지된다.
- AI Brief 관련 코드가 `src/app/(protected)/coffeechat/` 및 `src/components/coffeechat/` 하위로 집약된다.

### Negative / Risk
- AI Brief의 가치가 외부에서 독립적으로 인지되기 어렵다 — 마케팅 메시지 조율 필요.
- 추후 AI Brief를 독립 제품으로 분리하려면 새 ADR + 코드 구조 변경이 필요하다.

## Enforcement

- `src/app/(protected)/coffeechat/` 외부에 AI Brief 전용 라우트 생성 시 PR 리뷰에서 block.
- GNB 네비게이션(`src/constants/navigation.ts` 등)에 AI Brief 독립 항목 추가 시 이 ADR 위반으로 처리.

## Follow-ups

- Feature Manifest(`docs/sdd/FEATURE_MANIFEST.yaml`)에 AI Brief를 F-PEER-COFFEECHAT 하위 항목으로 명시.
- `src/app/(protected)/coffeechat/` 디렉토리 구조가 하위 피처를 수용할 수 있는지 확인.
- 관련 ADR: ADR-0004 (PRD v6.0 단일 기준)
