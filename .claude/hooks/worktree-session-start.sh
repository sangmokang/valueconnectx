#!/usr/bin/env bash
# worktree-session-start · SessionStart hook
# 세션 시작 시 현재 워크트리 상태를 점검하고, 메인 워크트리면 상태 고지.
# additionalContext 를 stdout 에 출력하면 Claude 세션 컨텍스트에 주입된다.

set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}" 2>/dev/null || exit 0

MAIN_WT="$(git worktree list --porcelain 2>/dev/null | awk '/^worktree / {print $2; exit}')"
CURR_TOP="$(git rev-parse --show-toplevel 2>/dev/null)"
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null)"

[ -z "$MAIN_WT" ] || [ -z "$CURR_TOP" ] && exit 0

if [ "$CURR_TOP" = "$MAIN_WT" ]; then
    cat <<EOF
[워크트리 상태] 메인 워크트리 ($MAIN_WT) · 브랜치 [$BRANCH]

메인 워크트리에서 src/** 편집은 권장 사항으로 opt-in 입니다.
   개발 작업 요청 시 vcx-orchestrator (권장 — opt-in) 를 통해 전용 브랜치 + 워크트리를 생성할 수 있습니다.
   워크트리 슬러그 형식: valueconnectx-{slug}
   문서·하네스(.claude/**)·CLAUDE.md 편집은 언제든 허용.

현재 활성 워크트리 목록:
$(git worktree list 2>/dev/null | sed 's/^/  /')
EOF
else
    REL="${CURR_TOP#$MAIN_WT/}"
    cat <<EOF
[워크트리 상태] 작업 워크트리 · 브랜치 [$BRANCH]
  위치: $CURR_TOP
  스코프: 이 워크트리는 [$BRANCH] 브랜치의 단일 작업 전용입니다. 다른 feature 섞지 말 것.
EOF
fi
