# Phase 2 PRD — AI Resume Intelligence MVP

| Field | Value |
|---|---|
| Status | **Proposed** (사용자 결재 전) |
| Phase | 2 (Phase 1 D-day 2026-05-15 직후 착수 후보) |
| Owner | CPO (Sangmo Kang) |
| Drafted | 2026-05-08 |
| Estimated duration | 4–6주 |
| Estimated cost | $0.40 ~ $0.90 / 분석 1건 (Claude Sonnet 기준) |
| Margin | 95%+ (B2B 기업 트랙 내부 도구 가정) |
| Authority refs | `docs/prd-6.0.md`, `docs/sdd/FEATURE_MANIFEST.yaml`, `docs/prd/_archive/phase2-proposal/README.md` |
| Predecessor | Phase 1 AI Brief 시스템 (2026-04-05 라이브, `src/lib/ai/brief.ts`) |

> **운영 제약 재확인**
> - 멤버 UI에는 수수료/25%/fee 문구 0건 (CLAUDE.md §1, ADR-0001).
> - 모든 사용자 노출 카피는 한국어.
> - 본 PRD는 src/**, supabase/migrations/** 변경 없음. 결재 후 별도 ADR + Manifest 업데이트로 구현 트리거.

---

## 1. 제품 가치 제안

ValueConnect X는 추천 인재의 신뢰 기반 네트워크다. 그러나 Phase 1까지의 검증은 **추천인의 코멘트 + 자가 입력 프로필**에 의존했고, 이력서(PDF/DOCX)에 담긴 실제 경력 시그널은 매칭과 CEO Brief에 반영되지 못했다.

**AI Resume Intelligence MVP**는 멤버가 업로드한 이력서를 LLM이 구조화된 시그널로 변환하고, 이를 Phase 1 AI Brief 파이프라인에 주입해 **CEO 커피챗 직전에 "이 사람을 왜 만나야 하는가"가 한 페이지로 자동 정리되는 상태**를 만든다.

세 줄 요약:

1. 이력서 1장이 들어가면 "검증된 경력 키워드 + 매칭 시그널 + CEO Brief 시드 문장"이 24시간 안에 디렉토리/커피챗에 자동 반영된다.
2. 운영자(어드민)는 자가 입력 vs 이력서 추출 결과의 차이를 보고 멤버 등급(core/endorsed)을 더 빠르게 판단한다.
3. CEO 커피챗 호스트는 신청자 이력서를 직접 읽지 않고도 합류 적합성에 대한 1차 판단을 받는다.

---

## 2. 사용자 페르소나

### 2.1 멤버 (Resume Owner)
- 이미 초대받아 가입한 검증 인재. 자가 입력 프로필은 5분 안에 채웠지만 자기 경력의 핵심 시그널을 다 담지 못했다고 느낀다.
- 기대: "이력서 한 장 올리면 알아서 잘 정리해 주면 좋겠다."
- 우려: "내 PDF가 다른 멤버에게 그대로 노출되면 안 된다."

### 2.2 기업 리더 (CEO / Founder, Coffee Chat Host)
- CEO 커피챗 신청을 받았을 때 30초 안에 "이 사람을 만날지" 결정해야 한다.
- 기대: 이력서 원본을 다운로드하지 않고도 컬쳐핏 가설과 검증 포인트를 받는다.
- 우려: AI가 부풀린 묘사로 잘못된 인상을 줄 수 있다 → 출처가 보여야 함.

### 2.3 운영자 (Admin / Curator)
- 추천 → 초대 → 수락 흐름 끝에서 멤버 등급(core / endorsed)을 결정한다.
- 기대: 이력서에서 추출된 신호가 자가 입력과 얼마나 일치하는지 한눈에 보고, 등급 판단의 근거를 남길 수 있어야 한다.
- 우려: 운영자가 신청자 PII(주민번호, 주소, 가족 등)를 직접 보지 않고도 일할 수 있어야 한다.

---

## 3. 핵심 사용자 흐름

```
[멤버]
  온보딩 또는 /directory/me 진입
    ↓
  "이력서 업로드" 영역에서 PDF/DOCX 1개 업로드 (≤ 10MB)
    ↓
  Supabase Storage(private bucket)에 저장
    ↓
[백그라운드 잡 — 큐드라이브, 24시간 SLA]
  ① 텍스트 추출 (PDF→text)
  ② PII 마스킹 (이메일/전화/주민번호/주소)
  ③ Claude 분석 호출 → 구조화 JSON 산출
    {careers[], skills[], strengths[], red_flags[], summary_kr}
  ④ vcx_member_resume_signals 에 저장
    ↓
[멤버 화면]
  /directory/me 에서 "AI가 정리한 내 핵심 시그널" 확인 + 토글로 공개 범위 조정
    ↓
[CEO 커피챗 흐름 — 기존 F-CEO-COFFEECHAT 확장]
  CEO가 신청자 카드 진입 → 기존 host_brief 옆에 "이력서 시드"가 함께 렌더링
    ↓
  CEO가 "수락" 시 generateCoffeechatBrief() 가 resume_signals 를 추가 입력으로 받아
    더 풍부한 host_brief 생성
    ↓
[어드민]
  /admin/resume-review 에서 "자가 입력 vs 이력서 추출" diff 보고 등급 결정
```

원칙:
- 이력서 원본 파일은 **운영자/멤버 본인** 외 누구에게도 직접 노출되지 않는다.
- 다른 멤버/CEO에게는 **요약 + 시그널만** 보인다.
- 시그널은 멤버가 항목 단위로 토글(on/off) 할 수 있다.

---

## 4. 기능 명세

### F-2-AI-RESUME-1 — 이력서 업로드 + 저장
- 멤버 본인 페이지(`/directory/me`)에 업로드 영역 추가.
- 허용 포맷: PDF, DOCX. 최대 10MB.
- 업로드 즉시 분석 큐에 잡 등록 (`status: queued`).
- 동일 멤버 재업로드 시 이전 버전은 `superseded` 처리, 최신 1건만 활성.

### F-2-AI-RESUME-2 — 텍스트 추출 + PII 마스킹 파이프라인
- 서버사이드에서 PDF/DOCX → 일반 텍스트 변환.
- 정규식 + LLM 보조로 다음 PII 마스킹: 이메일(@ 도메인 보존), 전화번호, 주민/외국인등록번호, 우편번호+상세주소, 가족관계 표현.
- 마스킹된 텍스트만 LLM 분석 입력으로 사용.

### F-2-AI-RESUME-3 — Claude 기반 시그널 추출
- 모델: Claude 4.7 Sonnet (`CLAUDE_MODEL` 재사용). 폴백 4.6.
- 출력 스키마(JSON):
  ```json
  {
    "careers": [{"company": "...", "role": "...", "duration_kr": "...", "highlights": ["..."]}],
    "skills": ["..."],
    "strengths": ["3개 이내, 한국어 단문"],
    "watch_points": ["선택, 1-2개"],
    "summary_kr": "150자 이내 한국어 요약"
  }
  ```
- `careers[].highlights` 는 이력서 원문 인용 가능 시 인용, 아니면 추론 표시.

### F-2-AI-RESUME-4 — 멤버 본인 시그널 보드
- `/directory/me` 에 "AI가 정리한 내 시그널" 섹션.
- 항목 단위 공개 토글: 각 career, skill, strength 별 on/off.
- "다시 분석" 버튼: 24시간 쿨다운.

### F-2-AI-RESUME-5 — CEO Brief 자동 시드 주입
- 기존 `generateCoffeechatBrief()` (`src/lib/ai/brief.ts`)에 `applicantResumeSignals?` 옵셔널 입력 추가(설계 단계 명세, 본 PRD에서는 코드 미수정).
- 시그널이 있으면 CEO host brief 프롬프트의 `## 신청자 정보` 블록에 `careers + summary_kr + watch_points` 추가.
- 시그널이 없으면 기존 동작 그대로 유지(폴백 호환).

### F-2-AI-RESUME-6 — 어드민 리뷰 화면
- `/admin/resume-review` 신규 페이지(super_admin/admin RLS).
- 좌측: 자가 입력(vcx_members), 우측: 추출 시그널(vcx_member_resume_signals).
- 액션: "core 승격", "endorsed 유지", "재분석 요청", "원본 보기"(원본 다운로드는 super_admin only + 감사 로그).

---

## 5. 비기능 요구사항

| 항목 | 목표 |
|---|---|
| 업로드 → 시그널 노출 SLA | p95 ≤ 24h, p50 ≤ 10분 |
| LLM 1건 원가 | $0.40 ~ $0.90 (이력서 평균 12k 토큰 가정) |
| 추출 정확도 | careers[] 회사명/직함 = 95%+ exact match (수동 라벨 30건 기준) |
| 가용성 | 분석 잡 실패 시 fallback 메시지 + 운영자 알림, 멤버 흐름 차단 금지 |
| 보안 | 이력서 원본은 Supabase Storage private bucket, signed URL 5분 만료 |
| 감사 | 원본 열람은 모두 `vcx_resume_access_log` 에 기록 |
| 비용 cap | 멤버당 월 분석 5회 (어드민이 수동 재분석 트리거 시 별도 카운트) |

---

## 6. AI 모델 / 컨텍스트 전략

| 결정 항목 | 1안 (권장) | 2안 |
|---|---|---|
| 분석 모델 | **Claude 4.7 Sonnet** (Phase 1과 동일 스택) | Claude 4.6 (비용 -30%, 정확도 -5~10%) |
| 컨텍스트 주입 | **프롬프트 직접 주입** (이력서 텍스트 12k 토큰 → 시스템 프롬프트) | RAG (벡터 인덱스) |
| 출력 형식 | **structured JSON** (Anthropic structured output) | Markdown + 후처리 파싱 |
| 온도 | 0.2 (시그널 추출은 결정론에 가깝게) | 0.4 |
| 메모리 | **세션 단위** — 분석 1건 = 1콜, 메모리 미공유 | 멤버 단위 메모리(과제: PII 누출 위험) |

**1안 권장 근거**:
- Phase 1 AI Brief가 Claude 4.7로 안정 운영 중. 인프라/모니터링 그대로 재사용 가능.
- 이력서는 12k 토큰 안에 들어오는 케이스 99%. RAG 도입은 Phase 3 다국어/멀티이력서 단계로 미룸.
- structured JSON은 어드민 diff 화면을 만들 때 후처리 비용을 0으로 만든다.

---

## 7. PII 처리 / 데이터 모델 영향

### 7.1 PII 정책
- 원본 이력서: Supabase Storage `resumes/` private bucket, RLS = owner OR super_admin.
- 추출 텍스트: `vcx_member_resume_extracts` 테이블, 마스킹 전 raw 는 **저장하지 않음**(메모리에서 마스킹 후 폐기).
- 시그널 JSON: `vcx_member_resume_signals` 에 저장, 멤버 본인이 토글한 공개 범위만 외부로 SELECT.
- 주민등록번호/외국인등록번호는 마스킹 실패 시 분석 잡 자체를 abort.

### 7.2 신규 테이블 (예상, 결재 후 마이그레이션 작성)
1. `vcx_member_resumes` — 업로드 이력 (storage path, status, version).
2. `vcx_member_resume_signals` — 추출된 구조화 시그널 + 공개 토글.
3. `vcx_resume_access_log` — 원본 다운로드 감사 로그.

### 7.3 vcx_members 영향
- 신규 컬럼 없음. 1:1 관계는 `vcx_member_resume_signals.member_id → vcx_members.id` 외래키로만.
- Phase 1 디렉토리 RLS(015_vcx_privacy_model)와 충돌 없음.

---

## 8. Acceptance Criteria

| AC | 한 줄 요약 |
|---|---|
| AC-1 | 멤버가 PDF 이력서를 업로드하면 24h 내 `/directory/me`에 한국어 요약 + careers/skills 카드가 노출된다. |
| AC-2 | 마스킹되지 않은 주민등록번호/전화번호/이메일이 시그널 JSON 또는 어드민 화면에 단 1건도 등장하지 않는다(테스트 픽스처 30건 기준). |
| AC-3 | CEO 커피챗 수락 시 생성되는 host brief에 `careers[].company` 또는 `summary_kr` 중 최소 1개가 인용 형태로 포함된다(시그널 존재 케이스). |
| AC-4 | 어드민이 `/admin/resume-review`에서 자가 입력 vs 추출 시그널 diff 를 보고 "core/endorsed" 등급을 1클릭으로 변경할 수 있다. |
| AC-5 | 멤버 UI 어디에도 "수수료 / 25% / fee / commission" 문구가 노출되지 않는다(`scripts/check-fee-hidden.sh` 통과). |

---

## 9. Definition of Done

- [ ] ADR 작성 (`docs/prd/ADR/ADR-XXXX-ai-resume-intelligence.md`) 후 Manifest 등록.
- [ ] 마이그레이션 3종 생성 + RLS 정책 + dry-run on staging.
- [ ] AC-1 ~ AC-5 자동 테스트 (Vitest + Playwright 1슬라이스).
- [ ] PII 마스킹 회귀 테스트(고정 픽스처 30건).
- [ ] LLM 비용 모니터링 대시보드(`/admin/ops` 확장).
- [ ] `scripts/check-fee-hidden.sh` 통과.
- [ ] CDO 1회 검토 (스키마 + RLS), Designer 1회 검토 (디렉토리/me 시그널 카드).
- [ ] 외부 변호사 1회 리뷰 (개인정보 수집·이용 항목 갱신).

---

## 10. Out of Scope (Phase 2 MVP에서 제외)

- 다국어 이력서 자동 번역 → Phase 3.
- 멤버당 다중 이력서 비교/머지 → Phase 3.
- Vector 검색 기반 "유사 인재 추천" → Phase 3.
- 채용 공고 ↔ 이력서 매칭 점수화 → Phase 4 (B2B Position Board 연계).
- LinkedIn URL 스크래핑 → Phase 2에서 명시적 제외 (TOS 위험).
- 음성/영상 인터뷰 분석 → 후속 백로그.
- 멤버 자가 수정 가능한 시그널 raw 편집기 → MVP에서는 토글 on/off만, 텍스트 편집은 Phase 3.

---

## 11. 의문점 / 사용자 결재 필요 항목

1. **모델 비용 상한**: 멤버당 월 5회 분석이 적정한지? (영업 캠페인 시 상향 필요할 수 있음)
2. **이력서 원본 보존 기간**: 분석 완료 후 원본 PDF를 30일/90일/영구 중 어디에 두는가? 개인정보보호법상 "수집 목적 달성 후 지체 없이 파기" 원칙 vs. 멤버 재분석 편의 상충.
3. **추출 시그널 기본 공개 범위**: 디폴트가 "공개"인가 "비공개"인가? 본 PRD는 멤버 결정 보호 차원에서 **기본 비공개 + 멤버가 항목별 opt-in**을 권고.
4. **CEO Brief에 시그널 인용 시 출처 표기 의무**: "이력서에 따르면 ..." 같은 명시적 prefix를 매번 붙일지, 자연스러운 문장으로 녹일지.
5. **F-2-AI-RESUME-5 구현 위치**: `src/lib/ai/brief.ts` 직접 확장 vs. `src/lib/ai/resume-brief.ts` 신규 모듈 분리. 본 PRD는 후자(영향 범위 최소화)를 선호.
6. **운영자 권한 분리**: 원본 다운로드를 super_admin only 로 두면 인력 1명 병목. admin 도 가능하게 하되 감사 로그 강제로 충분한가?
7. **Phase 2 진입 트리거**: Phase 1 D-day(2026-05-15) DoD 100% 도달 vs. 80% 도달 시 병렬 시작 — 어느 쪽?

---

## 12. 참조

- 선행: `src/lib/ai/brief.ts` (Phase 1 AI Brief, 2026-04-05 라이브)
- 선행 마이그레이션: `supabase/migrations/021_vcx_ai_brief_feedback.sql`, `supabase/migrations/025_vcx_peer_coffeechat_brief_feedback.sql`
- 디렉토리 RLS: `supabase/migrations/015_vcx_privacy_model.sql`
- Manifest 등록 위치: `docs/sdd/FEATURE_MANIFEST.yaml` `out_of_scope: F-AI-RESUME` (현재) → 결재 후 features 섹션으로 이동
- Phase 2 후보 풀: `docs/prd/_archive/phase2-proposal/README.md`
- 카피 정책: `CLAUDE.md` §3.0, ADR-0001 (수수료 문구 비노출)
