---
name: vcx-scope-gate
description: ValueConnect X 신규 기능 / PR 스코프 검증. docs/sdd/FEATURE_MANIFEST.yaml 의 in_slice / out_of_slice_but_live / out_of_scope 상태 + docs/PROCESS.md §2.2 Creep/Churn 차단 + §4.1 Authorization Matrix (L-Lite / L-Std / L-High) + 48h 쿨다운 준수. 트리거 — "신규 기능", "scope 변경", "이 기능 추가", "F-XX 구현", "L-High", "L-Std", "48h 쿨다운", "ADR 필요", "PR 생성", "Vertical Slice Phase 1", "초대 수락 개선", "커피챗 확장", "AI Brief 변경" 언급 시 필수 호출.
---

# VCX-Scope-Gate · Phase 1 스코프 Freeze 검증

## Why

CLAUDE.md §3 Scope (IN = F-AUTH · F-FEED · F-DIRECTORY · F-PEER-COFFEECHAT · F-SESSION-FEEDBACK · F-CEO-COFFEECHAT 카피 only / OUT = F-COMMUNITY · F-POSITIONS · F-ADMIN-EXTENDED · F-AI-RESUME · F-MULTI-VERTICAL · F-DOMAIN-EXPERT-ROUTING) 는 Phase 1 (2026-04-17 ~ 2026-05-15) 동결 스코프.

스코프 크리프 · PRD 축소 루프는 `docs/PROCESS.md` §1 (P-1), §2 (P-2 · P-4) 의 최대 리스크. `docs/plans/VERTICAL_SLICE_PHASE1.md` §6 Red Flag 3 번 "`.omc/plans/` 또는 `docs/plans/` 에 신규 방향 제안 문서 추가" 즉시 중단 신호.

신규 기능은 `.omc/plans/_backlog/ideas.md` (존재 시) 또는 `docs/sdd/DEBT_LEDGER.md` 에만 기록. Manifest 진입은 Sprint 5+ (즉 Phase 2 이후).

## 실행 (3 단계 검증)

### Step 1 · Feature Manifest 대조

1. `docs/sdd/FEATURE_MANIFEST.yaml` Read. 변경 제안에서 기능 ID (F-AUTH · F-FEED · F-DIRECTORY · F-PEER-COFFEECHAT · F-SESSION-FEEDBACK · F-CEO-COFFEECHAT · F-COMMUNITY · F-POSITIONS 등) 또는 슬라이스 ID (S1~S5) 추출.
2. 해당 feature 의 `status` · `slice` · `maturity` 확인:
   - `status: live` + `slice: S1..S5` = **in_slice** (Phase 1 IN)
   - `status: live` + `slice: out_of_slice_but_live` = **live 유지만, 신규 개선 금지** (F-CEO-COFFEECHAT 카피 재적용만 허용 — 해당 ADR 참조)
   - `out_of_scope` 섹션 에 등재 = **OUT**, 기존 코드 유지, bug fix / 보안 패치 예외
   - Manifest 미등재 = **신규**, ideas 백로그 리다이렉트
3. `docs/prd/ADR/` 최근 ADR 에서 해당 기능 관련 결정 확인 (ADR-0001 ~ ADR-0007 활성, 추가 ADR-0008 Anthropic API 예산 예정).

### Step 2 · Creep / Churn 차단 (PROCESS §2.2)

- 신규 feature 제안 → `.omc/plans/_backlog/ideas.md` 단일 파일에만 기록. 디렉토리 부재 시 `docs/sdd/DEBT_LEDGER.md` 하단 append.
- 기존 feature UI 노출 **중단** 결정 → ADR 필수 (GNB 에서 내리는 경우).
- **기존 코드는 삭제하지 않는다** — UI / 라우팅에서 분리만. Phase 1 종료 후 일괄 정리.
- "두 우주 분리" (§2.3): VCX 제품 plan = `docs/plans/**`, 개발 도구 plan (OMC skills · 에이전트 설정 · Claude Code 확장) = `~/.claude/skills/` 또는 별도 저장소. 섞은 커밋은 revert 대상.

### Step 3 · Authorization Matrix 등급 판정 (PROCESS §4.1)

| Level | 승인자 | 대상 | 48h 쿨다운 |
|---|---|---|---|
| **L-Lite** | 본인 | 테스트, 스타일, 리팩터, 문서 오탈자, deps patch bump | 불필요 |
| **L-Std** | 본인 + 자동 CI | 신규 파일, Supabase migration (`NNN_vcx_*.sql` 순번), API 엔드포인트 (Route Handler), UI 신규 페이지, deps minor bump | 불필요 (자동 approve 불가, CI green 필요) |
| **L-High** | 본인 + 48h 쿨다운 | PRD · PROCESS · MANIFEST · ADR · CLAUDE.md, 법률 · PII · 결제, deps major bump, 외부 API 계약 | **필수** — PR 생성 → 최소 48h 머지 보류 → 재서명 후 머지. 쿨다운 중 자기번복 시 abort |

**긴급 트랙** (쿨다운 면제, `docs/PROCESS.md` §1.1):
1. **Legal Blocker** — 개인정보보호법 · 개인정보 리스크 확인
2. **User Harm** — 출시 시 사용자 피해 가능성
3. **Cost Explosion** — Anthropic · Supabase · Vercel · Upstash 비용 월 예산 150% 초과 (CLAUDE.md §7.3 Anthropic 월 USD 100 잠정 상한)

`scripts/prd-freeze-check.sh` pre-commit hook 이 `docs/prd-6.0.md` 수정 시 ADR 동반 없으면 block. 커밋 메시지에 `BREAKS: prd6.0` 또는 `ADR: NNNN` 명시 필수.

## 판정 보고 템플릿

```markdown
# VCX Scope Gate 판정 · {기능ID or slug}

**상태**: PASS | FAIL

**근거**:
- FEATURE_MANIFEST.yaml: `status: {live|stub}`, `slice: {S1..S5|out_of_slice_but_live|미등재}` (line {N})
- Slice 매핑: S{N} {onboarding_and_auth|curation_feed|directory_browse|coffeechat_with_ai_brief|post_session_feedback}
- 관련 ADR: {ADR-NNNN 또는 없음}
- L-등급: L-Lite | L-Std | L-High
- 48h 쿨다운: {불필요 | 요구됨 (기한: {date})}

**판정**: {통과 사유 / 차단 사유}

**다음 단계**:
- PASS (L-Lite / L-Std) → Phase 1 plan 진행
- PASS (L-High) → PR 생성 후 48h 재서명 대기 (긴급 트랙 해당 시 면제)
- FAIL (OUT) → `.omc/plans/_backlog/ideas.md` 또는 `docs/sdd/DEBT_LEDGER.md` 리다이렉트
- FAIL (Manifest 미등재) → ADR 초안 요구 (L-High) 또는 ideas 백로그
```

## 자주 헷갈리는 경계 사례

- **F-FEED** (Slice S2): IN · `status: stub` · `maturity: mvp_required`. Sprint 2 MVP 구현 대상. `supabase/migrations/022_vcx_feed_items.sql` + `/api/feed` + `/feed` 페이지 + 관심 태그 10건 필터링.
- **F-CEO-COFFEECHAT**: `out_of_slice_but_live`. 기본 플로우 live 유지, **해당 ADR 의 "컬쳐핏 확인" 카피 재적용만** (copy only). E2E 제외. 신규 기능 금지.
- **F-PEER-COFFEECHAT AI Brief**: IN (Slice S4). `status: live` · `maturity: quality_check`. **Anthropic API 호출 = VCX 전체에서 유일하게 허용된 AI 피처** (CLAUDE.md §7.3). 월 예산 USD 100 (잠정 ADR-0008). 150% 초과 시 Cost Explosion 긴급 트랙.
- **F-COMMUNITY · F-POSITIONS**: OUT. 기존 017 · 018 migration 유지, Phase 1 신규 기능 금지 (bug fix · 보안 패치 예외).
- **F-ADMIN-EXTENDED**: OUT. `/admin/ops` 피드백 대시보드 외 신규 기능 금지.
- **vcx_members / vcx_corporate_users 스키마 변경**: L-High (PII · RLS). 반드시 ADR + 48h 쿨다운. Supabase Dashboard Table Editor 절대 금지 — migration 파일만 허용 (Event Trigger `vcx_prevent_ddl` 자동 차단).
- **rounded-* Tailwind 클래스 추가**: 불가 — 전역 `border-radius: 0` 정책 (CLAUDE.md §13). 위반 시 PR block.
- **Galaxy 360px 모바일 미지원**: FAIL — CLAUDE.md §2.2 기술 게이트 필수.

## 후속 작업

- 이전 scope-gate 판정이 동일 slug 에 존재 → 직전 결과 먼저 Read, 변경점 diff 기반 재검증.
- "스코프 완화" 요청 (OUT → IN 전환) → 단독 진행 금지. `vcx-ceo` + `vcx-cpo` 에스컬레이션 + L-High 48h 쿨다운 ADR. Phase 1 기간 내 Manifest 변경 불가 (`docs/PROCESS.md` §2.1).
- Manifest 미등재 기능 반복 요청 시 → `.omc/plans/_backlog/ideas.md` 에 append-only 누적. Phase 2 Kick-off ADR 에서 일괄 검토.
