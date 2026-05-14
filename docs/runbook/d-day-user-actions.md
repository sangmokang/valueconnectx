# D-Day User Actions — CTO 1-Hand 외부 액션 체크리스트

> **대상자**: CTO (Sangmo Kang, 1인 운영) — 코드 에이전트가 수행 불가, **사용자가 직접 실행해야 하는 외부 액션 2건** 만 정리.
> **D-Day**: 2026-05-15
> **상위 문서**: `docs/runbook/d-day-2026-05-15.md` (전체 운영 런북) · `scripts/apply-pending-migrations.md` (Migration 상세 가이드)
> **본 문서의 차별점**: 위 두 문서는 *절차서/절차 분기* 중심이지만, 본 문서는 *D-Day 시퀀스* 관점에서 **언제 / 무엇을 / 얼마나 걸리는지** 만 압축. 손에 든 채로 따라치기 위한 1-page.

---

## 액션 1 — D-0017 운영 DB Migration 적용 (019/030/031)

**예상 소요**: 10분 (CLI 성공 케이스 기준)

### 사전 점검 (각각 체크 후 진행)

- [ ] `supabase --version` 출력 정상 (CLI 설치)
- [ ] `supabase status` 에 API URL / DB URL 표시 (linked 상태)
- [ ] `.env.local` 에 `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` 존재
- [ ] Supabase Dashboard → Database → Backups 에서 직전 backup timestamp 기록 (PITR 복원 대비)

### 실행 (1줄)

```bash
supabase db push --linked && bash scripts/verify-rpc-applied.sh && npx playwright test tests/e2e/slice/p2-s1-cold-start.spec.ts
```

### 검증 (성공 기준)

- [ ] `verify-rpc-applied.sh` 종료 코드 0 + `name` / `current_company` / `title` / `linkedin_url` 필드 발견 메시지
- [ ] P2-S1 spec TC-1 / TC-2 / TC-3 가 `skipped` 가 아닌 `passed` 로 전환

### 실패 시 fallback

CLI 가 `[VCX] DDL 작업이 차단되었습니다` 또는 기타 SQL 에러로 실패 → **즉시 중단**, Supabase Dashboard SQL Editor 로 분기:

→ `scripts/apply-pending-migrations.md` **§3 (적용 방법 B — SQL Editor 수동)** 의 3.B → 3.C → 3.D 순서 그대로 실행.
→ 적용 후 `§3.F migration repair` 로 CLI 정합성 회복.

---

## 액션 2 — D-0019 Vercel 프로덕션 배포 + DNS 연결 (valueconnect.kr)

**예상 소요**: 30~60분 (DNS 전파 시간 포함)

### 사전 점검

- [ ] `valueconnect.kr` 도메인 등록자/만료일 확인 (Whois 또는 등록 대행사 콘솔)
- [ ] Vercel 프로젝트가 `main` 브랜치 production deploy 로 설정되어 있음
- [ ] Vercel Project → Settings → Environment Variables 에 `.env.local` 의 production 키 동기화 완료

### Step 1 — Vercel Project Domain 추가

Vercel Dashboard → Project → Settings → Domains → **Add** → `valueconnect.kr` 입력 → **Add**.
Vercel 가 필요한 DNS 레코드 (A 또는 CNAME) 를 표시. 그 화면에서 값을 복사.

### Step 2 — DNS 레코드 등록 (도메인 등록 대행사 콘솔)

Vercel 안내 기준:
- Apex (`valueconnect.kr`) → **A 레코드** `76.76.21.21`
- Subdomain (`www`) → **CNAME** `cname.vercel-dns.com.`

등록 후 전파 대기 (5~30분, 최대 24h).

### Step 3 — Production Deploy Trigger

```bash
git push origin main
```

Vercel Dashboard 에서 deployment status `Ready` 확인. (또는 Dashboard → Deployments → 최신 build 의 `Promote to Production`.)

### Step 4 — 헬스체크

- [ ] `curl -s https://valueconnect.kr/api/health` → `{"status":"ok",...}` 200 응답
- [ ] 브라우저에서 `https://valueconnect.kr/` 접속 → 자물쇠 (TLS 인증서 정상) 확인
- [ ] 메인 랜딩 페이지 한국어 카피 정상 렌더 (CLAUDE.md §3.0 승인 카피)

### 실패 케이스 분기

| 증상 | 원인 | 대응 |
|---|---|---|
| Vercel Domain 화면에 `Invalid Configuration` 지속 | DNS 전파 미완 | 5~10분 재시도, `dig valueconnect.kr` 로 A 레코드 전파 확인 |
| `https://` 접속 시 인증서 에러 | Let's Encrypt 발급 지연 | Vercel Dashboard 에서 도메인 삭제 후 재추가, 다시 10분 대기 |
| `/api/health` 5xx | Edge runtime / env var 누락 | Vercel → Logs 확인, 누락 환경 변수 보강 후 redeploy |
| DNS 전파 24h 초과 | NS 잘못 설정 | 등록 대행사에서 NS 가 도메인 관리자 NS 인지 재확인 |

---

## 마감 게이트 (D-1 → D-Day 시퀀스)

| 시각 | 조치 | 게이트 통과 조건 |
|---|---|---|
| **D-1 17:00** (2026-05-14) | 액션 1 완료 → P2-S1 spec 재실행 | TC-1~3 `passed` + D-0017 close 가능 상태 |
| **D-Day 09:00** (2026-05-15) | 액션 2 완료 → 헬스체크 GREEN | `https://valueconnect.kr/api/health` 200 |
| **D-Day 12:00** | 최종 Go/No-Go 결정 | 위 2 게이트 + `docs/runbook/d-day-2026-05-15.md` Smoke Test 5/5 PASS |

위 시각보다 늦어지면 즉시 D-Day 연기 검토. 무리한 강행 금지.

---

## 롤백 트리거 (1줄 분기)

| 트리거 | 조치 |
|---|---|
| 액션 1 실패 (031 까지 진행 못 함, 부분 적용) | `scripts/apply-pending-migrations.md` **§5 롤백** — 5.1 수동 DROP → 위험 시 5.2 PITR 복원 |
| 액션 2 실패 (헬스체크 5xx 또는 카피 깨짐) | Vercel Dashboard → Deployments → 직전 GREEN deployment 의 **Promote to Production** |
| 양쪽 모두 실패 | D-Day 연기 + DEBT_LEDGER D-0017 / D-0019 OPEN 유지, 사용자 직접 결정 |

---

## 본 문서 작성 후 사용자 직접 갱신 항목

코드 에이전트 변경 금지 항목 (CLAUDE.md §3.0 카피 불가침과는 별개로, DEBT_LEDGER 도 사용자 직접 갱신 정책):

- [ ] 액션 1 완료 후 → `docs/sdd/DEBT_LEDGER.md` D-0017 상태 `resolved` 갱신
- [ ] 액션 1 완료 후 → D-0018 (P2-S1 skip 차단) 도 함께 `resolved` 갱신
- [ ] 액션 2 완료 후 → `docs/sdd/DEBT_LEDGER.md` D-0019 상태 `resolved` 갱신
- [ ] D-Day 12:00 Go 결정 후 → `history.md` 에 D-Day 결과 1줄 기록
