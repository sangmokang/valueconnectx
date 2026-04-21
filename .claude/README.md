# .claude/ — ValueConnect X Harness

이 디렉토리는 Claude Code 세션이 참조하는 vcx 하네스다. 런타임 SoT 는 `docs/roles/HARNESS.md` + `docs/PROCESS.md` + `CLAUDE.md`.

## 구조

```
.claude/
├── HARNESS.md          # 세션 entry point (요약 + 포인터)
├── README.md           # 본 파일
├── settings.json       # SessionStart + UserPromptSubmit 훅 등록 (공유)
├── settings.local.json # 개인 권한 + Stop 훅 (편집 금지 — vcx-native)
├── agents/             # 6개 VCX proxy (vcx-{ceo,cpo,cto,cdo,sre,designer}.md)
├── skills/             # 5개 VCX domain skill
│   ├── vcx-orchestrator/
│   ├── vcx-scope-gate/
│   ├── vcx-tdd-gate/
│   ├── vcx-dod-gate/
│   └── vcx-history-digest/
├── hooks/              # 3개 훅
│   ├── worktree-session-start.sh  # SessionStart (경고만)
│   ├── log-user-prompt.sh         # UserPromptSubmit (raw 로그)
│   └── history-stop.sh            # Stop (opt-in, 미등록)
├── scripts/            # vcx-native (편집 금지)
│   └── log-history.py
└── worktrees/          # vcx-native (편집 금지)
    └── ...
```

## 훅 등록 현황

| 이벤트 | 등록된 훅 | 출처 |
|--------|-----------|------|
| SessionStart | `worktree-session-start.sh` | `.claude/settings.json` (신규) |
| UserPromptSubmit | `log-user-prompt.sh` | `.claude/settings.json` (신규) |
| Stop | `log-history.py` | `.claude/settings.local.json` (기존 — 편집 금지) |
| PreToolUse | (없음) | — |

## Opt-in 항목

다음은 파일만 존재하고 `settings.json` 에 등록하지 않는다. 사용자가 수동 등록 시 활성화:

- `hooks/history-stop.sh` — Stop 훅. 기존 `log-history.py` 와 중복 실행 방지를 위해 미등록.
- worktree hard gate — vcx 는 opt-in 정책. 기본 비활성.

## Settings 병합 의미론

Claude Code 는 `settings.json` 과 `settings.local.json` 의 hooks 를 **concatenate + 자동 dedup** 한다. 동일 command string 은 1회만 실행. env 객체는 **local override**.

- 본 세팅에서 Stop 훅은 settings.local.json 에만 존재 → 1회 실행 보장.

## 참고

- 런타임 정의: `docs/roles/HARNESS.md`
- 프로세스 게이트: `docs/PROCESS.md`
- 프로젝트 규율: `CLAUDE.md`
- OMC 플러그인: `~/.claude/plugins/oh-my-claudecode/`
