---
name: vcx-dod-gate
description: ValueConnect X **최종 완료 선언** 체크리스트. CLAUDE.md §2 Phase 1 DoD + §10 완료 선언 체크리스트 + `docs/PROCESS.md` §5 M1/M2/M3 + `docs/plans/VERTICAL_SLICE_PHASE1.md` §3 전량 GREEN 이어야 "완료" 선언 가능. 품질 게이트 5단계 순차 통과 — `npm run build` → `npm run lint` → `npm test` → `npx playwright test` → `/oh-my-claudecode:code-review`. Phase 1 납기 (2026-05-15) 직전 필수. 트리거 — "완료 선언", "DoD", "최종 체크", "ship 준비", "go/no-go", "Phase 1 마감", "D-Day", "납기 게이트" 언급 시 필수 호출. 단 1개라도 미달이면 BLOCK.
---

# VCX-DoD-Gate · Phase 1 최종 완료 선언 게이트

## Why

CLAUDE.md §10 "Phase 1 완료 선언 체크리스트" 는 §2.1~2.5 전량 충족 + §5 Weekly Metrics 목표치 + Sprint 4 Go/No-Go 회의 기록 + L-High 항목 48h 쿨다운 재서명 "전부 녹색이 되기 전까지 Phase 2 착수 금지".

§4.4 **Evidence Before Assertion** 은 "완료" 주장 시 fresh 증거 필수 — 같은 세션의 최신 `npm run build` 출력, Playwright artifact, `git log --oneline` 커밋 SHA, CI 링크. "should" · "probably" · "seems to" 없이 fresh 실행 결과가 없는 주장은 거짓 보고 간주. 본 스킬 통과 없이 "Phase 1 완료" 선언 금지. vcx-ceo + vcx-cpo 최종 sign-off 선행 조건.

## 체크리스트 (CLAUDE.md §2 + §10 + PROCESS §5)

### (A) 기능 DoD — §2.1 Phase 1 Feature AC
- [ ] F-AUTH (Slice S1) — 초대 이메일 → accept → 로그인 → 온보딩 → 디렉토리 리다이렉트 체인 녹색. GNB 노출 버그 (`gnb-visibility.tsx` onboarding 포함). 이름 · 프로필 URL 중복 수집 제거. 전문 분야 자유 태그. Progress bar 기입력 반영.
- [ ] F-FEED (Slice S2) MVP — `supabase/migrations/022_vcx_feed_items.sql` + `/api/feed?limit=&tags=` (Zod 검증) + `/feed` 페이지 (관심 태그 기반 10건 필터링). 어드민 피드 아이템 수동 생성. 비인증 사용자 제한 뷰.
- [ ] F-DIRECTORY (Slice S3) — 로그인 사용자 멤버 리스트 + 프로필 열람. 비로그인 `x-vcx-authenticated: false` 처리. rate limiter (dir 5-limiter) 정책 준수.
- [ ] F-PEER-COFFEECHAT + AI Brief (Slice S4) — 수수료 문구 0건 (`scripts/check-fee-hidden.sh` 통과, ADR-0001). 수락 시 AI Brief 자동 생성 + PreBriefCard. Brief 생성 실패 fallback (ANTHROPIC_API_KEY 누락, eab4597). Galaxy 360px 녹색.
- [ ] F-SESSION-FEEDBACK (Slice S5) — 완료된 커피챗 피드백 제출 가능. `session_feedback_submit` 이벤트 발화 (PostHog Sprint 2 통합). `/admin/ops` 집계 대시보드 (최근 10건 + row count).
- [ ] F-CEO-COFFEECHAT 카피 재적용 only — "컬쳐핏 확인" 프레이밍 (해당 ADR 참조). 기본 플로우 live 유지, E2E 제외 (out_of_slice_but_live).

### (B) 기술 게이트 — §2.2
- [ ] `npm run build` exit 0 (fresh 증거: 최신 실행 로그)
- [ ] `npm run lint` exit 0
- [ ] `npm test` green (vitest 전량 PASS)
- [ ] Playwright 5건 녹색 — `tests/e2e/slice/s{1,2,3,4,5}-*.spec.ts` 전부 CI green
- [ ] a11y axe critical = 0 (jsdom / Playwright axe-core 스캔)
- [ ] Lighthouse mobile ≥ 70 (Galaxy 360px 뷰포트)
- [ ] Anthropic API 월 예산 준수 (CLAUDE.md §7.3 USD 100 잠정 — ADR-0008 예정). 150% 초과 시 Cost Explosion 긴급 트랙 발동 증거.

### (C) 법률 · 컴플라이언스 — §2.3
- [ ] 개인정보보호법 개인정보 처리방침 최신 (015 migration `vcx_privacy_model` 적용)
- [ ] UI "수수료" · "25%" · "fee" grep 0건 (`scripts/check-fee-hidden.sh` 통과 — ADR-0001)
- [ ] UI 한국어 100% (영어 UI 텍스트 0건, CLAUDE.md §13)

### (D) 운영 — §2.4
- [ ] `/api/health` 엔드포인트 + Vercel Cron 5분 프로브
- [ ] Supabase / Vercel / Anthropic / Resend runbook 존재 + 길이 > 0
- [ ] `docs/sdd/DEBT_LEDGER.md` D-0001 (013 · 014 migration 중복) · D-0002 (019 migration 실적용 검증) · D-0003 (Branding) · D-0004 (프로필 완성도 기준) CLOSED

### (E) 제품 자기검증 — §2.5
- [ ] S1~S5 AC 전량 (`docs/plans/VERTICAL_SLICE_PHASE1.md` §2)
- [ ] 초대 → 수락 → 로그인 → 온보딩 → 디렉토리 E2E **3건 수동** 검증
- [ ] 360px 스크린샷 5페이지 (Galaxy 360px)

### (F) 측정 — PROCESS §5 Weekly Metrics
- [ ] **M1 Slice Pages Green** = 5 (S1~S5 Playwright artifact 5건 녹색)
- [ ] **M2 ADR Closed** = 5 (ADR-0001 ~ ADR-0005 서명 완료, ADR-0006 · ADR-0007 활성)
- [ ] **M3 Plan Active Count** ≤ 3 (`docs/plans/**/*.md` + `.omc/plans/**/*.md` 활성)
- [ ] Weekly Finish Ritual (금 18:00 KST) 미제출 주간 0 (M1/M2/M3 스크린샷 + 1분 데모 영상 + 다음 주 Sprint 목표)

### (G) Sprint 4 Go/No-Go
- [ ] Sprint 4 (05-09 ~ 05-15) Go/No-Go 회의 기록
- [ ] Phase 2 Kick-off 결정 ADR (또는 동결 결정)

### (H) L-High 48h 쿨다운 재서명
- [ ] CLAUDE.md 변경 포함 L-High 항목 전부 48h 쿨다운 재서명 완료 (`docs/PROCESS.md` §1.4, §4.1)
- [ ] PRD / PROCESS / MANIFEST / ADR 동시 merge 없음 (쿨다운 중 자기번복 abort 증거)

## 실행

1. 각 체크포인트를 **실 증거 수집 로직** 과 매핑:

   | 섹션 | 수집 방법 |
   |---|---|
   | A F-AUTH ~ F-CEO | `tests/e2e/slice/s{1..5}-*.spec.ts` Playwright artifact Read |
   | B build | 최신 `npm run build` 출력 (fresh, 같은 세션) |
   | B lint | 최신 `npm run lint` 출력 |
   | B test | 최신 `npm test -- --run` 출력 |
   | B e2e | `npx playwright test --reporter=list` 결과 |
   | B a11y | axe-core 스캔 결과 (Playwright 내장 또는 별도 스크립트) |
   | B Lighthouse | mobile preset 360px 실행 결과 |
   | B 비용 | Anthropic Dashboard 월 사용량 스크린샷 |
   | C 개인정보 · fee · 한국어 | `scripts/check-fee-hidden.sh` + migration 015 적용 확인 + `grep -rE '[A-Za-z]' src/app/` 검토 |
   | D /api/health | `curl -sf $URL/api/health` + Vercel Cron 대시보드 |
   | D runbook | `ls docs/runbooks/` + length check |
   | D Debt | `docs/sdd/DEBT_LEDGER.md` D-0001~0004 `status: closed` 확인 |
   | E S1~S5 AC | `docs/plans/VERTICAL_SLICE_PHASE1.md` §2 체크박스 전량 |
   | E 수동 E2E | QA 기록 로그 |
   | E 360px 스크린샷 | `.claude/screenshots/` 또는 `docs/qa/screenshots/` |
   | F M1 | `scripts/weekly-metrics.sh` 출력 |
   | F M2 | `ls docs/prd/ADR/ADR-000{1..5}-*.md` 존재 + 서명 확인 |
   | F M3 | `find docs/plans/**/*.md .omc/plans/**/*.md -not -path '*archive*' \| wc -l` ≤ 3 |
   | G Go/No-Go | Sprint 4 회의록 또는 ADR |
   | H 쿨다운 | `git log --all --oneline` 로 PR 생성 48h 이후 머지 증거 |

2. 각 항목을 병렬로 검증 (독립적)
3. 모든 항목 GREEN 이면 GO, 단 1개라도 ❌ 면 BLOCK (CLAUDE.md §10 "하나라도 미달 = Phase 1 미완. Phase 2 논의 동결")

## 품질 게이트 5단계 (순차 통과 — CLAUDE.md §"Development Workflow" 품질 게이트)

```bash
# 1. Build
npm run build        # exit 0 필수

# 2. Lint
npm run lint         # exit 0 필수

# 3. Test
npm test -- --run    # vitest 전량 PASS

# 4. E2E (해당 기능에 e2e 있을 경우)
npx playwright test  # 5 spec 녹색

# 5. Code / Security review
/oh-my-claudecode:code-review
/oh-my-claudecode:security-review   # RLS · PII · DDL · Magic Link · invite token 변경 시

# 6. 커밋 + 푸시
git commit -m "..."
git push --force-with-lease   # 개인 feature 브랜치만. 공유 브랜치 force push 금지
```

## 판정 보고 템플릿

```markdown
# VCX Phase 1 DoD Gate Report · {YYYY-MM-DD HH:MM KST}

**총 항목**: N
**PASS**: X
**FAIL**: Y
**세션 fresh 증거**: {SHA · 타임스탬프}

## 상세

| 섹션 | 항목 | 상태 | 증거 |
|---|---|---|---|
| A | F-AUTH S1 E2E | ✅ | `tests/e2e/slice/s1-invite-onboarding.spec.ts` PASS (run: {timestamp}) |
| A | F-FEED S2 MVP | ❌ | `/api/feed` 미구현 ({파일 경로}) |
| B | npm run build | ✅ | exit 0 ({timestamp}) |
| B | a11y axe | ✅ | critical 0 ({report path}) |
| B | Lighthouse mobile | ✅ | perf 74 (> 70) |
| C | check-fee-hidden.sh | ✅ | 0 hit |
| D | /api/health | ✅ | 200 OK ({URL}) |
| D | Debt D-0001~0004 | ✅ | 4/4 closed |
| E | 360px 스크린샷 | ✅ | 5 pages saved |
| F | M1 Slice Pages Green | ✅ | 5/5 |
| F | M2 ADR Closed | ✅ | 5/5 (ADR-0001~0005) |
| F | M3 Plan Active Count | ✅ | 3 (≤ 3) |
| G | Sprint 4 Go/No-Go | ✅ | ADR-0006 기록 |
| H | L-High 쿨다운 재서명 | ✅ | PR #N merge ≥ 48h 이후 |

**판정**: {GO (모두 PASS) | BLOCK (Y개 미달)}

**BLOCK 시 Top 3 블로커**:
1. {항목 + 증거 + 조치 + ETA}
2. ...
3. ...

**Evidence Before Assertion 준수 여부**: ✅ (모든 PASS 항목에 fresh 증거 링크 첨부) / ❌ ("should / probably / seems" 사용 — CLAUDE.md §4.4 위반)

**예상 해소 ETA**: {일시} (담당: self)
```

## 후속 작업

- 재호출 시 → 직전 리포트와 diff (같은 세션 fresh 증거 재수집 필수, stale 금지).
- BLOCK 후 항목 해소 → 해당 항목만 재검증 (전체 재실행 불필요하나 fresh `npm run build` + `npm test` 재실행 권장).
- Phase 1 납기 직전 (05-14 이후) 매일 자동 호출 권장.
- GO 판정 시 → `vcx-ceo` 최종 sign-off → Phase 2 Kick-off ADR → CLAUDE.md §10 모든 항목 녹색 커밋 + push.
