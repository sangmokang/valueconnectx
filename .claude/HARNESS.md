# HARNESS — ValueConnect X Claude Harness

> SoT: `docs/roles/HARNESS.md` (6-role 매트릭스), `docs/PROCESS.md` (게이트·권한·측정), `CLAUDE.md` (프로젝트 규율)
> 본 파일은 `.claude/` 하네스의 **entry point** 이며, 상세 정의는 위 SoT 를 참조한다.
> 작성일: 2026-04-21

---

## §1. 목적

ValueConnect X (초대 전용 Private Talent Network) 개발 작업을 `.claude/agents/` 6개 proxy 와 `.claude/skills/` 5개 domain skill 로 조율한다. oh-my-claudecode (OMC) 플러그인 위에 VCX 도메인 레이어를 얹은 구조.

## §2. 트리거 키워드

`vcx-orchestrator` skill 이 다음 키워드 감지 시 Phase 0~6 파이프라인 호출:

- **제품 도메인**: 초대 수락, 초대 플로우, Magic Link, 커피챗, CEO 커피챗, peer coffeechat, 커뮤니티, 포지션, AI Brief, CEO Brief
- **기술 도메인**: vcx_members, vcx_corporate_users, RLS, DDL 보호, Event Trigger, vcx_prevent_ddl, Supabase migration, @supabase/ssr, base-ui, Tailwind v4, Galaxy 360
- **프로세스 도메인**: Feature Manifest, vertical slice, Sprint, AC, DoD, L-High, L-Std, 48h 쿨다운, ADR

## §3. 구성 3-layer

### L1 — OMC 플러그인 기본

`~/.claude/plugins/oh-my-claudecode/` 의 기본 29 agents + 32 skills.

### L2 — VCX Proxy Agents (`.claude/agents/`)

| 역할 | Agent | 참조 SoT |
|------|-------|----------|
| CEO | `vcx-ceo` | `docs/roles/CEO.md` |
| CPO | `vcx-cpo` | `docs/roles/CPO.md` |
| CTO | `vcx-cto` | `docs/roles/CTO.md` |
| CDO | `vcx-cdo` | `docs/roles/CDO.md` |
| SRE | `vcx-sre` | `docs/roles/SRE.md` |
| Designer | `vcx-designer` | `docs/roles/DESIGNER.md` |

### L3 — VCX Domain Skills (`.claude/skills/`)

| Skill | 책임 |
|-------|------|
| `vcx-orchestrator` | Phase 0~6 파이프라인 진입점 |
| `vcx-scope-gate` | Feature Manifest + PROCESS §4.1 L-* 등급 검증 |
| `vcx-tdd-gate` | Red-Green-Refactor (vitest + Playwright) |
| `vcx-dod-gate` | 완료 선언 체크리스트 (build/lint/test/review/commit) |
| `vcx-history-digest` | `.omc/state/user-prompts.raw.jsonl` → `history.md` 요약 |

## §4. Phase 0~6 파이프라인 (요약)

| Phase | 이름 | 담당 |
|-------|------|------|
| 0 | 컨텍스트·워크트리 상태 점검 | orchestrator 직접 (경고만, opt-in) |
| 1 | 계획 + E2E AC 도출 | vcx-cpo |
| 2 | 아키텍처 + 테스트 전략 | vcx-cto |
| 3-A | Red (실패 테스트) | test-engineer + vcx-tdd-gate Step 1 |
| 3-B | Green (최소 구현) | executor / executor-high 병렬 |
| 3-C | Refactor (기본 포함) | code-simplifier + vcx-tdd-gate Step 3 |
| 4 | 도메인 게이트 | vcx-scope-gate + vcx-tdd-gate + vcx-dod-gate |
| 5 | 검증 | code-reviewer + security-reviewer |
| 6 | 커밋/푸시 | git-master |

상세 정의 = `.claude/skills/vcx-orchestrator/SKILL.md`.

## §5. 워크트리 정책 (권장 — opt-in)

메인 워크트리에서 `src/**` 편집은 **권장 사항**이며, 격리된 브랜치 + 워크트리 사용을 권장한다.

- `/oh-my-claudecode:project-session-manager` 로 `feat/{slug}` 브랜치 + `../valueconnectx-{slug}` 워크트리 생성 (tmux 자동 분리)
- 브랜치 네이밍: `feat/{slug}`, `fix/{slug}`, `chore/{slug}`, `refactor/{slug}`, `docs/{slug}`
- SessionStart 훅(`worktree-session-start.sh`)이 메인 워크트리 상태만 경고. **차단 없음** (opt-in).
- 향후 hard gate 도입은 별도 ADR 필요.

**주의**: `docs/PROCESS.md` 에는 워크트리 섹션이 없다. 워크트리 정책은 이 파일에서만 기술한다.

## §6. TDD 정책

- Red → Green → Refactor 3단계. `vcx-tdd-gate` skill 이 강제.
- 도구: **vitest** (단위/통합), **Playwright** (e2e).
- AC 출처: `.omc/plans/*.md` 또는 `docs/plans/*.md`.
- Anti-pattern: `vi.importActual('lucide-react')` 금지 (무한 hang).
- Coverage 수치 임계값 미정 (별도 ADR 예정).

## §7. Supabase 정책

- 마이그레이션 파일: `supabase/migrations/NNN_vcx_*.sql` (번호 증가, 중복 금지 — 013/014 중복 존재 주의).
- DDL 보호: Event Trigger `vcx_prevent_ddl` (`supabase/migrations/012_vcx_ddl_protection.sql`) 이 anon/authenticated/service_role 의 DDL 차단.
- 허용 DDL 역할: postgres, supabase_admin, supabase_auth_admin.
- **Supabase Dashboard Table Editor 로 직접 테이블 생성/수정/삭제 절대 금지**. 반드시 마이그레이션 파일 경유.

## §8. SoT & 역사적 설계 문서

**런타임 SoT**: `docs/roles/HARNESS.md` (6-role 매트릭스), `docs/PROCESS.md` (게이트), `CLAUDE.md` (프로젝트 규율).
**본 파일**: Claude Code 세션 entry point (요약 + 포인터).

관련 역사적 설계 문서:
- `.omc/plans/agent-roles-and-harness.md` — 초기 설계 기록. 런타임 정의는 본 파일 + `docs/roles/HARNESS.md` 를 따른다.

## §9. 보존 자산 (편집 금지)

`.claude/` 아래 다음은 본 하네스 이식 이전부터 존재하는 vcx-native 자산으로 **편집 금지**:

- `.claude/settings.local.json` — 권한 + Stop 훅(`log-history.py`)
- `.claude/scripts/log-history.py` — 세션 종료 히스토리 로깅
- `.claude/worktrees/` — 기존 작업 워크트리

## §10. 변경 이력

| 날짜 | 변경 | 근거 |
|------|------|------|
| 2026-04-21 | 초기 이식 (`.omc/plans/vcx-claude-harness-adaptation.md`) | 기존 하네스를 vcx 도메인으로 재구성 |
