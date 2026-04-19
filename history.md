# ValueConnect X — 변경 이력 (History)

> 서비스 요구사항·기능·코드·프롬프팅 변경을 시간 역순(최신 → 과거)으로 누적 기록합니다.
> 커밋 단위뿐 아니라 의미 있는 프롬프트, 의사결정, 방향 전환도 함께 적습니다.

## 작성 규칙
- **정렬**: 최신이 위 (desc by date)
- **포맷**: `## YYYY-MM-DD` 헤더 → 항목별 `- [type] 내용 (commit-hash | source)`
- **type**: `feat` 신규기능 / `fix` 버그수정 / `refactor` 리팩터 / `docs` 문서 / `chore` 잡무 / `test` 테스트 / `prompt` AI 프롬프팅·요구사항 변경 / `decision` 의사결정 / `infra` 인프라
- **source**: `commit:해시` 또는 `chat:세션설명` 또는 `manual:작성자`
- 커밋 없는 변경(프롬프트, 결정사항)도 반드시 기록

---

## 2026-04-19 (현재)

- [docs] history.md 생성 — 요구사항·기능·프롬프팅 변경 통합 추적 시작 (manual:setup)

---

## 2026-04-03

- [fix] 모듈 레벨에서 `ANTHROPIC_API_KEY` 누락 시 throw 제거 — 빌드 차단 방지 (commit:eab4597)
- [feat] **AI Brief 시스템 4종 동시 추가** — 커피챗 도메인에 AI 사전 브리핑 레이어 도입
  - 사후 피드백 폼 + API + Supabase 타입 캐스트 (commit:f904d70)
  - PreBriefCard UI 컴포넌트 → 커피챗 상세 페이지 연동 (commit:3a3712c)
  - Brief 조회 API endpoint (commit:9788e7a)
  - 커피챗 수락 시 AI brief 생성 트리거 (commit:f807e4f)
- [test] AI brief 생성 단위 테스트 추가 (commit:e08956b)
- [feat] Claude AI 클라이언트 + brief 생성 로직 추가 (commit:4b9ee4e)
- [feat] AI brief 컬럼 + feedback 테이블 — migration 021 (commit:f6c8452)
- [fix] Peer 커피챗 인사이트에서 수수료 구조 언급 제거 (commit:78c6d4f)
- [fix] 서비스 전반 감사 — BM(Business Model) 노출 제거, UX 문구 개선, 라우트·테스트 수정 (commit:17297f0)

## 2026-04-02

- [docs] **PRD v6.0 서비스 변경사항 전면 반영** — 요구사항 메이저 업데이트 (commit:9baeee9)
- [fix] 서비스 문구 전면 개선 — 모순 제거, 차별화, 위화감 완화 (commit:bcae642)
- [refactor] **CEO 커피챗 컨셉 전환: "역방향 채용" → "컬쳐핏 확인"** — 핵심 포지셔닝 변경 (commit:f0bbc91)
- [fix] Benefit 페이지 수수료 노출 제거 + 빈 상태 메시지 6건 개선 (commit:8da76a0)
- [fix] 온보딩 UX 개선 — 라벨 가독성, 중복 입력 방지, 닉네임 필드 추가 (commit:916a1c7)
- [fix] **코드 리뷰 보안 이슈 3건 수정** — Open Redirect 방지 + 미들웨어 리팩터 + LinkedIn regex 강화 (commit:e7c320c)
- [feat] 주요 페이지 클라이언트 컴포넌트 분리 및 신규 기능 추가 (commit:9f23323)

## 2026-04-01

- [chore] `.gitignore`에 `.worktrees/` 추가 (commit:dcd3ba4)
- [chore] `.gitignore`에 E2E 산출물 추가 + 기존 추적 해제 (commit:c9fc757)
- [chore] **데모 시딩 자동화** + Playwright 글로벌 셋업 추가, 로그인 a11y 라벨 연결 (commit:73474a4)

## 2026-03-31

- [test] 로그인 리다이렉트 테스트 설명을 `/directory`로 업데이트 (commit:401854b)
- [fix] 코드 리뷰 피드백 — login/page.tsx 리다이렉트 일관성 + SQL `search_path` 보안 강화 (commit:74c7f34)
- [feat] **Agent Skill 방법론 적용** — `SKILL.md` 6종 + `AGENTS.md` + deprecated 패턴 수정 (commit:b6b5813)
- [fix] **로그인 후 인증 파이프라인 P0 버그 3건 수정** — RPC 프로필 필드 누락 + 리다이렉트 오류 (commit:22d3706)

## 2026-03-30

- [feat] **E2E 시나리오 15종 추가** — 인증·커피챗·알림 플로우 (Sprint 1-C #12) (commit:fe410c9)
- [feat] E2E 인프라 강화 — playwright 타임아웃·스크린샷 + auth 헬퍼 리팩터 (commit:669cbb4)
- [docs] **비즈니스 모델 계획서 v2.1** — ValueHire 시너지 + 멀티 버티컬 확장 비전 (commit:1a523ba)

## 2026-03-29

- [fix] 미들웨어 테스트 — 온보딩 리다이렉트 우회용 완전한 프로필 mock 필드 추가 (commit:520e27b)
- [feat] **디렉토리 스크래핑 방지** — 3단계 rate limiter + CSP 헤더 (Sprint 1-B) (commit:eb98927)
- [feat] **Sentry 클라이언트 에러 모니터링** — 세션 리플레이 on-error 활성화 (commit:1465138)
- [feat] **Phase 1 온보딩 플로우** — 강제 온보딩 + 2단계 스텝 폼 + 미들웨어 보호 (테스트 612→618) (commit:ff1c1d5)

## 2026-03-27

- [fix] **Sprint 6 품질 안정화** — 보안 하드닝 + 린트 정리 + dynamic route 설정 (commit:72384df)
- [feat] **Sprint 5** — Peer 커피챗 편집/테스트 + 알림 시스템 통합 확장 (537→612 테스트) (commit:17a3897)
- [feat] **Sprint 4** — Position Board 확장 + Community 카운트 + Admin UI (490→537) (commit:f2b6c83)
- [feat] **Sprint 3** — CEO 커피챗 DELETE/편집 + 컴포넌트 테스트 (413→490) (commit:0f1c105)
- [feat] **Sprint 2** — `profile_visibility` 강제 + 디렉토리 컴포넌트 테스트 (344→413) (commit:003e4bf)
- [test] 4개 도메인 API 테스트 추가 — 커피챗·디렉토리·커뮤니티·포지션 (162→344) (commit:cc59ed6)
- [fix] **Sprint 1 Auth 하드닝** — RLS 정책 + 서버사이드 쿠키 + 에러메시지 통합 (commit:788a427)
- [chore] 개발 계획 문서 + DB 마이그레이션 + 커피챗 추천 컴포넌트 추가 (commit:67c1eef)
- [feat] **Phase 3 완료** — AI 포지션 매칭 + VCX CLI Interface (#23, #24) (commit:610a1e9)
- [feat] **Phase 3** — 매칭 추천 알고리즘 + 수수료 시스템 + 분석 대시보드 (#21, #22, #25) (commit:ccc5730)
- [feat] **Mixpanel Analytics 통합** + Privacy Model 기술 강제 (Phase 2 #13, #17) (commit:ebe4920)
- [feat] **Phase 1-C + Phase 2 로드맵 실행** — 테스트·보안·커피챗·커뮤니티·어드민 고도화 (commit:a767680)

## 2026-03-25

- [feat] **모바일 반응형 전면 개편** — Galaxy 360px 기준 UX 최적화 (commit:d799ff5)
- [docs] BMplan.md v2.0 — ValueHire Intelligence 시너지 반영 (commit:5b1e8ab)
- [chore] crawler 디렉토리 전체 삭제 — 방향 전환 (commit:f3c627d)
- [chore] 불필요 문서/임시 파일 정리 (commit:d000e23)
- [chore] `.gitignore`에 `.playwright-mcp/` 추가 + 추적 로그 제거 (commit:d9ee846)

## 2026-03-24

- [feat] **공통 레이아웃(GNB) + 디자인 시스템 + 서비스 소개 페이지** 구현 — 디자인 토큰 정립 (commit:1582886)

## 2026-03-13

- [infra] **Next.js 14 App Router 프로젝트 초기화** (P0-01) (commit:e7bdeee)
- [feat] initial commit (commit:0a2f0f9)
- [chore] Initial commit from Create Next App (commit:3cadd91)

---

## 향후 기록 가이드

### 무엇을 기록할 것인가
1. **커밋된 코드 변경** — 모든 feat/fix/refactor (자동 후보)
2. **요구사항 변화** — PRD/BM 문서 업데이트, 컨셉 전환
3. **의미 있는 프롬프팅** — AI 응답 품질·방향에 영향을 주는 시스템 프롬프트, 사용자 페르소나, 톤 변경
4. **의사결정** — 기술 선택, 도메인 모델 변경, 외부 서비스 도입/제거
5. **운영 인사이트** — 사용자 피드백 반영, A/B 테스트 결과, 성능 이슈

### 무엇을 기록하지 않을 것인가
- 단순 리네이밍/포매팅
- WIP 커밋, 세이브 포인트
- 자동 의존성 업데이트 (단, 메이저 버전은 기록)

### 자동화 아이디어 (선택)
- Stop hook으로 새 커밋을 자동 prepend (`reference_obsidian_changelog` 패턴 참고)
- 또는 주 1회 `git log` diff를 수동 정리
