# Open Questions

## vcx-design-review - 2026-03-13
- [ ] Branding.md의 색상/폰트가 실제 사이트와 다른 이유 확인 필요 — Branding.md가 오래된 버전인지, 의도적 변경인지에 따라 수정 방향이 달라짐
- [ ] 폰트 변경 의도 확인: 실제 사이트 Georgia 통일 → Playfair/Inter 혼합이 의도적 리브랜딩인지, 실수인지 — 의도적이면 figma-design-prompt.md 유지, 실수면 Georgia로 교체
- [ ] 멤버 티어 용어 최종 결정: "Endorsed" vs "Intro" — PRD, 사이트, Branding 문서 간 불일치. figma-design-prompt.md에서 "Intro" 권장 중이나 최종 결정 필요
- [ ] 네비게이션 과밀 해결 방식: 드롭다운 통합 vs 현행 유지 — 멤버 디렉토리 추가 시 8개 메뉴로 데스크탑에서도 밀집
- [ ] 모바일 반응형 디자인 범위: Phase 1에서 필수 포함인지, 별도 Phase인지 — 현재 figma-design-prompt.md에 모바일 디자인이 거의 없음
- [ ] Invite Flow UI 디자인 우선순위: P0/P1 중 어디에 배치할지 — PRD Section 3에서 핵심 흐름이나 figma-design-prompt.md의 우선순위 목록에 빠져 있음

## AI Resume Intelligence v2.0 - 2026-03-26
- [ ] Vercel Pro plan 확보 여부: `maxDuration: 300` 사용을 위해 Pro plan 필요 — 현재 Hobby plan이면 파이프라인 타임아웃 발생
- [ ] Gotenberg 호스팅 위치 결정: Railway vs Fly.io — 비용/레이턴시/안정성 비교 필요, ~$5/월 예산
- [ ] 결제 시스템 선택: Toss Payments vs Stripe — 한국 시장 최적화(Toss) vs 글로벌 확장성(Stripe), 기존 결제 인프라 유무 확인 필요
- [ ] 한국어 이력서 품질 기준 수립: 실제 S-tier 멤버 데이터로 파일럿 테스트 후 프롬프트 튜닝 필요 — AI 생성 이력서가 프로페셔널 기준에 부합하는지 검증 전까지 런칭 불가
- [ ] Core+ / Intro+ 구독 번들에 Resume Intelligence를 포함할 경우 기존 가격 체계 조정 필요성 — BMplan 2.3의 구독 모델과 충돌 가능
- [ ] Anthropic API 데이터 처리 약관 검토: 멤버 커리어 데이터가 모델 학습에 사용되지 않음을 법적으로 확인 — PIPA(개인정보보호법) 컴플라이언스 필수
- [ ] 갱신 패키지(3회 묶음) 구매 UX: 선불 크레딧 방식 vs 할인 코드 방식 — 결제 시스템 구현 복잡도에 영향
- [ ] 팀 역량 대비 MVP 4-6주 일정 현실성 검증 — 현재 진행 중인 auth/admin 작업과의 우선순위 충돌 가능

## P0 Critical Bugs Post-Login - 2026-03-31
- [ ] `vcx_get_user_info` RPC가 실제 Supabase DB에 적용되어 있는지 확인 필요 — `src/lib/supabase/migrations/`에만 존재하고 `supabase/migrations/`에는 없음. 수동 적용 여부 불명. 미적용 시 RPC 자체가 없어 모든 사용자 403.
- [ ] Migration 019 적용 방법 결정: `supabase db push` vs `supabase migration up` vs Supabase Dashboard SQL Editor — 로컬 개발 환경과 프로덕션 환경 각각에 대해 적용 절차 확인 필요
- [ ] 프로필 완성도 판단 기준 재검토: 현재 4개 필드(name, current_company, title, linkedin_url) 모두 필수인지 — linkedin_url이 없는 멤버도 서비스 이용 가능해야 하는지 비즈니스 결정 필요

## BMplan 멀티 버티컬 비전 업데이트 - 2026-03-26
- [ ] 버티컬 확장 시 분야별 Advisory Board 구성 방안 — 각 분야(요리, 음악, 예술 등)의 검증 기준을 누가 정할 것인가. 외부 자문위원 영입 비용/시기 결정 필요
- [ ] 창의/문화 분야의 수수료 구조 적정성 — IT/Tech의 25% 채용 수수료와 달리 에이전시형 15~20% 모델이 시장에서 수용 가능한지 벤치마킹 필요
- [ ] 크로스 버티컬 이벤트의 수요 검증 — "IT CEO + 미슐랭 셰프" 같은 교차 네트워킹에 실제 수요가 있는지 파일럿 이벤트로 사전 검증 필요
- [ ] 엔터테인먼트 분야 진출 시 매니지먼트 업계와의 관계 설정 — 기존 엔터 에이전시와 경쟁/협력 관계 정리 필요, 법률 검토 포함

## Domain Expert Auto-Routing + RLVR - 2026-04-03
- [ ] Expert Router 자동 활성화 범위: `/ask` 명시적 트리거만 vs 광범위 질문 자동 감지 — 자동 감지 시 기존 OMC 라우팅(autopilot, ralph 등)과 충돌 가능성. Phase 5에서 결정 필요
- [ ] 18 전문가 프롬프트 템플릿의 깊이 수준: 간결한 페르소나(~50줄) vs 상세 도메인 프레임워크 포함(~200줄) — 컨텍스트 윈도우 비용과 응답 품질 간 트레이드오프. 초기에는 간결하게 시작하고 반복 개선 권장
- [ ] Feedback 감지의 한국어 NLP 정확도: 현재 키워드 기반 휴리스틱으로 충분한지 — "다시"가 부정적 피드백인지 단순 반복 요청인지 문맥 의존적. 오탐 시 knowledge 오염 위험
- [ ] expert-scores.json 동시 쓰기 안전성: 여러 세션에서 동시에 같은 파일을 업데이트하면 데이터 손실 가능 — JSONL은 append-only라 안전하지만, scores.json은 read-modify-write 패턴이라 경쟁 조건 존재. 파일 락 또는 JSONL 기반 재계산 방식 검토 필요
- [ ] Reflection 주기 최적화: 50 entries가 적절한 임계값인지 — 초기에는 데이터가 적어 노이즈가 많을 수 있음. 최소 표본(5회 이상)에 대해서만 제안 생성하도록 가드레일 필요
- [ ] Year 5 멀티 버티컬 수익 시나리오(57.9억원)의 현실성 검증 — IT/Tech 외 분야는 채용 시장 규모와 구조가 다르므로 별도 시장 조사 필요

## AI Ops Agent - 2026-04-03
- [ ] Vercel 플랜 확인: Cron Functions 사용 가능 여부 — Hobby 플랜은 1일 1회 크론만 지원, Pro 플랜은 무제한. 10분 주기 헬스체크에는 Pro 필요
- [ ] Slack 워크스페이스 및 채널 준비 여부 — Incoming Webhook URL 생성을 위해 Slack 앱 설정 필요. 아직 Slack 워크스페이스가 없다면 사전 준비 필요
- [ ] 헬스체크 실패 시 에스컬레이션 대상: Slack만으로 충분한지, 이메일(Resend)/SMS도 필요한지 — 1인 개발 체제에서 Slack 알림을 놓칠 가능성
- [ ] 운영 대시보드 접근 권한 범위: admin/super_admin만인지, 향후 Head of Operations도 포함할지 — 현재 admin 라우트는 system_role 기반이므로 새 역할 추가 시 마이그레이션 필요
- [ ] Supabase 헬스체크 쿼리의 RLS 영향: service_role로 체크할지 anon으로 체크할지 — service_role은 RLS 우회하므로 실제 사용자 경험과 다를 수 있음, anon은 인증 없이 쿼리 불가할 수 있음
