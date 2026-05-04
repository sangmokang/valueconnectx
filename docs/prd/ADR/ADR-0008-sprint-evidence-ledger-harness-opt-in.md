# ADR-0008: Sprint Evidence Ledger + Harness 워크트리 HARD STOP → opt-in 전환

- **Status**: Accepted
- **Date (1st sign)**: 2026-04-24
- **Date (2nd sign, +48h)**: 2026-04-26
- **Signers**: Sangmo Kang (Self)
- **Supersedes**: —
- **Related**: `docs/roles/HARNESS.md`, `.claude/settings.json`, PROCESS.md §7.1

## Context

Sprint 1 완료 시점(2026-04-24)에 CI/CD 하네스가 두 개의 행동 제약을 갖고 있었다:

1. **Harness L4 — 워크트리 HARD STOP**: `src/**` 편집 시 전용 브랜치 + 워크트리를 강제 생성하고, 메인 워크트리에서의 직접 편집을 차단(HARD STOP)하는 hook이 설정되어 있었다.
2. **Harness L5 — Sprint Evidence Ledger**: 스프린트 산출물(커밋 해시, 테스트 결과, 빌드 상태)을 `.omc/state/` 에 자동 기록하는 후처리 흐름이 제안 상태로 있었다.

**문제점**:
- VCX는 1인 레포이다. 멀티팀 충돌 방지를 위한 HARD STOP은 오버헤드가 지나쳐, 빠른 버그 수정이나 문서 편집에도 강제 워크트리를 요구했다.
- 일상적인 단일 파일 수정 → 커밋 흐름에서 매번 "orchestrator를 통해 워크트리 생성하시겠습니까?" 인터럽트가 발생해 개발 속도를 저해했다.
- Sprint Evidence Ledger는 유용하지만, 자동 강제 기록이 아닌 선택적 사용이 더 적합하다.

## Decision

1. **워크트리 HARD STOP 폐지, opt-in으로 전환**: 메인 워크트리(`/Users/kangsangmo/Desktop/valueconnectx`, branch `main`)에서 `src/**` 직접 편집을 허용한다. 워크트리 기반 격리 개발은 `vcx-orchestrator` 스킬을 통해 opt-in으로만 권장한다.

2. **Sprint Evidence Ledger는 stop hook 자동 기록으로 구현**: 강제 차단 없이, 세션 종료 시 `.omc/state/history-last-commit.txt`에 최신 커밋 정보를 자동 기록한다. Obsidian 연동은 stop hook에서 처리한다.

3. **직접 편집 허용 경로 명시**: 문서(`docs/**`), 하네스(`.claude/**`), `CLAUDE.md`는 언제든 직접 편집 허용. `src/**` 편집은 권장 사항(opt-in)이며 강제 차단 없음.

## Consequences

### Positive
- 1인 개발 속도 향상: 단순 수정에 워크트리 생성 오버헤드 없음.
- 워크트리는 복잡한 기능 개발이나 실험적 변경 시 자발적으로 사용 가능.
- Sprint Evidence는 stop hook 자동화로 누락 없이 기록됨.

### Negative / Risk
- 메인 브랜치에 미완성 변경이 쌓일 수 있다 — pre-commit hook과 lint/typecheck로 보완.
- 팀이 확장될 경우 다시 HARD STOP 또는 브랜치 정책으로 복귀해야 한다 (ADR 재발행 필요).

## Enforcement

- `.claude/settings.json`의 `hooks.PreToolUse` 에서 HARD STOP 로직을 제거하고 opt-in 안내 메시지로 교체.
- `vcx-orchestrator` 스킬이 워크트리 생성 진입점 역할 유지.
- Stop hook: `git log -1 --format="%h %s"` → `.omc/state/history-last-commit.txt` 자동 기록.

## Follow-ups

- `docs/roles/HARNESS.md` §7.1 업데이트: "직접 편집 허용 경로" 명시.
- 팀 확장 시 ADR-0008 supersede 검토.
