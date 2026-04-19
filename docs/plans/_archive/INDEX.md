# Archived Plans — ValueConnect X

> 본 폴더는 **더 이상 실행되지 않는** plan 파일의 저장소.
> 삭제하지 않는 이유: 향후 의사결정 맥락 추적 (특히 ADR 참조).
> 상위 규칙: `docs/PROCESS.md` §6.2, `docs/process-review-2026-04-17.md` §4.6.

---

## 아카이브 이관 대상 (Sprint 1, 2026-04-24 기한)

아래 파일들은 현재 `.omc/plans/` 에 있으며 Sprint 1 중 **단일 PR**로 본 `_archive/` 로 물리 이동한다. 이관 시 각 파일 상단에 다음 블록을 삽입:

```markdown
---
archived: 2026-04-24
by: Sangmo Kang
reason: <아래 표의 Reason>
superseded_by: <대체 문서 경로>
---
```

| 파일 | 원위치 | 신위치 | Reason | Superseded by |
|---|---|---|---|---|
| `vcx-full-recode.md` | `.omc/plans/` | `docs/plans/_archive/` | PRD v6.0에 흡수됨 | `docs/prd6.0.md`, `docs/plans/VERTICAL_SLICE_PHASE1.md` |
| `p1-auth-completion-sprint.md` | `.omc/plans/` | `docs/plans/_archive/` | v4.1.3 전제, 대부분 구현 완료 | `docs/sdd/FEATURE_MANIFEST.yaml` (F-AUTH) |
| `p2-p4-development-roadmap.md` | `.omc/plans/` | `docs/plans/_archive/` | v4.1.3 전제, 현행성 없음 | `docs/plans/VERTICAL_SLICE_PHASE1.md` |
| `sprint-implementation-plan.md` | `.omc/plans/` | `docs/plans/_archive/` | v4.1.3 전제 | `docs/plans/VERTICAL_SLICE_PHASE1.md` |
| `bmplan-multi-vertical-vision.md` | `.omc/plans/` | `docs/plans/_archive/` | Phase 3+ 백로그 (미슐랭 비전) | `docs/plans/_backlog/ideas.md` |
| `ai-resume-intelligence.md` | `.omc/plans/` | `docs/plans/_archive/` | Phase 2 후보 (Resume AI 별도 제품) | `docs/plans/_backlog/ideas.md` |
| `cto-cpo-review-and-roadmap.md` | `.omc/plans/` | `docs/plans/_archive/` | 본 감사 보고서가 대체 | `docs/process-review-2026-04-17.md` |
| `vcx-design-review.md` | `.omc/plans/` | `docs/plans/_archive/` | 5주 미해결 질문, Branding.md와 통합 필요 | `docs/sdd/DEBT_LEDGER.md` D-0003 |
| `ai-ops-agent.md` | `.omc/plans/` | `docs/plans/_archive/infra/` | 7요소 전체는 Phase 2, 헬스체크 1건만 Sprint 1 반영 | `docs/sdd/FEATURE_MANIFEST.yaml` `infra_minimum.healthcheck` |

---

## 이관 제외 (다른 우주로 이동)

**VCX 제품이 아닌 개발자 도구 plan** — `docs/plans/` 트리에 남기지 않음:

| 파일 | 원위치 | 신위치 | Reason |
|---|---|---|---|
| `domain-expert-routing-rlvr.md` | `.omc/plans/` | `~/.claude/skills/omc-learned/` (또는 OMC 플러그인 저장소) | VCX 제품 아님 (ADR-0005). PROCESS §2.3 "두 우주 분리" |

---

## 이관 후 `.omc/plans/` 잔존 (active)

Sprint 1 이관 완료 후 `.omc/plans/` 에 남아야 할 파일:

| 파일 | 사유 |
|---|---|
| `open-questions.md` | Sprint 1 중 `docs/plans/_open_questions_triaged.md` 로 변환 후 archive |
| `invite-only-auth.md` | 참조용 historical spec (개정 없음) — 선택적으로 `docs/plans/_archive/` |

이관 후 `.omc/plans/` 는 **원칙적으로 비워두고** VCX 제품 plan은 `docs/plans/` 를 공식 위치로 통일한다 (PROCESS §2.3).

---

## 재활성화 규칙

아카이브된 plan을 다시 활성화하려면:
1. `docs/plans/_backlog/ideas.md` 에 아이디어로 재등록.
2. ADR 작성하여 "왜 지금 재활성화하는가" 기록.
3. 기존 active plan 1개를 archive로 이동 (상한 ≤ 3 유지).
4. 같은 PR에서 처리.

단순 "읽어보니 다시 하고 싶다"로는 복원 불가. 반드시 ADR 체인.

---

## 히스토리

| 일자 | 액션 | 파일 | 사유 |
|---|---|---|---|
| 2026-04-17 | INDEX 초안 작성 | (본 파일) | Process review 결과 |
| 2026-04-24 | (예정) | 9개 파일 이관 | Sprint 1 종료 |
