# Open Questions

## vcx-design-review - 2026-03-13
- [ ] Branding.md의 색상/폰트가 실제 사이트와 다른 이유 확인 필요 — Branding.md가 오래된 버전인지, 의도적 변경인지에 따라 수정 방향이 달라짐
- [ ] 폰트 변경 의도 확인: 실제 사이트 Georgia 통일 → Playfair/Inter 혼합이 의도적 리브랜딩인지, 실수인지 — 의도적이면 figma-design-prompt.md 유지, 실수면 Georgia로 교체
- [ ] 멤버 티어 용어 최종 결정: "Endorsed" vs "Intro" — PRD, 사이트, Branding 문서 간 불일치. figma-design-prompt.md에서 "Intro" 권장 중이나 최종 결정 필요
- [ ] 네비게이션 과밀 해결 방식: 드롭다운 통합 vs 현행 유지 — 멤버 디렉토리 추가 시 8개 메뉴로 데스크탑에서도 밀집
- [ ] 모바일 반응형 디자인 범위: Phase 1에서 필수 포함인지, 별도 Phase인지 — 현재 figma-design-prompt.md에 모바일 디자인이 거의 없음
- [ ] Invite Flow UI 디자인 우선순위: P0/P1 중 어디에 배치할지 — PRD Section 3에서 핵심 흐름이나 figma-design-prompt.md의 우선순위 목록에 빠져 있음

## invite-only-auth - 2026-03-24
- [ ] Supabase 프로젝트 생성 여부 확인: URL과 키가 이미 있는지 — Step 1에서 .env.local 설정에 필수
- [ ] Resend API 키 확보 여부: 이메일 발송 서비스 계정이 있는지 — Step 3 이메일 발송에 필수. 없으면 개발 중 콘솔 로그로 대체
- [ ] 프로필 완성 플로우 범위: 초대 수락 후 즉시 프로필 완성을 강제할지, 나중에 하도록 할지 — UX 흐름과 member 테이블 필수 필드 검증에 영향
- [x] Core Member의 초대 권한 범위: Core Member가 직접 초대할 수 있는지, Admin 승인 후 초대되는지 — **RESOLVED (v2):** Core Member recommends -> Admin approves -> invite sent. Two-step flow confirmed.
- [ ] 비밀번호 정책 결정: 최소 길이, 특수문자 요구 등 — Supabase 기본(6자)보다 강화할지 여부
- [ ] 초대 이메일 발신자 주소 및 도메인: Resend에서 사용할 발신 이메일 — 커스텀 도메인 필요 여부 (e.g., invite@valueconnectx.com)
- [ ] Session 유지 기간: 로그인 세션을 얼마나 유지할지 — Supabase 기본(1주)을 사용할지 커스텀할지

## invite-only-auth v2 - 2026-03-24 (Revision)
- [ ] Shared Supabase instance의 다른 프로젝트 테이블 목록 확인 — Step 0 Database Audit에서 충돌 여부를 확인하려면 기존 테이블 현황을 알아야 함
- [ ] Rate limiter 구현 방식 결정: in-memory map vs Redis vs middleware-level — 단일 서버면 in-memory 충분하지만, 서버리스(Vercel) 환경이면 외부 저장소 필요
- [ ] Admin의 직접 초대(추천 우회) 허용 범위: 모든 admin이 가능한지, super_admin만 가능한지 — Step 7에서 direct invite 기능의 권한 범위에 영향
- [ ] 추천 거절 시 recommender에게 알림 여부: 이메일/앱 내 알림을 보낼지 — UX 결정. 현재 plan에는 거절 시 알림 없음
- [ ] vcx_recommendations에 중복 방지 범위: 같은 이메일에 대해 여러 Core Member가 동시에 추천 가능한지 — 중복 추천 허용 여부에 따라 unique constraint 결정

## p1-auth-completion-sprint - 2026-03-25
- [ ] Vitest + Playwright 설치 시 기존 eslint 설정과 충돌 여부 — Next.js 14 + ESLint 9 flat config 환경에서 testing-library 플러그인 호환성 확인 필요
- [ ] E2E 테스트용 Supabase 환경 결정: 로컬 Supabase (docker) vs 별도 테스트 프로젝트 — E2E seed/cleanup이 프로덕션 DB에 영향을 주면 안 됨
- [ ] invite accept API에서 `signInWithPassword` 호출 후 클라이언트 쿠키 설정 방식 — 현재 서버 admin client로 signIn하지만 클라이언트에 세션이 전달되지 않을 수 있음 (line 64 of accept/route.ts)
- [ ] `invite-accept-form.tsx` LinkedIn URL 필드가 state에 바인딩되지 않고 submit body에 포함되지 않음 — 의도적 생략인지 버그인지 확인 필요 (Sprint S2.4에서 수정 예정)
- [ ] Protected route의 login wall 렌더링 방식: middleware header 기반 vs server component에서 getVcxUser 호출 — middleware는 이미 `x-vcx-authenticated` 헤더를 설정하지만 server component에서 읽기가 비표준적

## p2-p4-development-roadmap - 2026-03-25
- [ ] Member Directory의 industry 필드 목록 확정: 자유입력 vs 고정 enum — 필터 UI와 DB 제약조건 설계에 영향. 고정 enum이면 migration에 CHECK 추가 필요
- [ ] CEO Coffee Chat의 notification 방식: 이메일 알림 vs 인앱 알림 vs 둘 다 — 신청 수락/거절 시 applicant에게 알리는 방식. P3-C 알림 시스템과 연결
- [ ] Coffee Chat 세션 반복 생성 지원 여부: 매주/매월 정기 세션 기능 — MVP에서는 1회성으로 충분한지, 정기 세션이 CEO 유치에 중요한지
- [ ] Position Board salary 공개 정책: 기본 공개 vs 기본 비공개(poster 선택) — 한국 채용 시장에서 연봉 공개가 민감할 수 있음
- [ ] Community Board 익명 게시 남용 방지 방안: 신고 기능, 관리자 IP 추적, 일일 익명 게시 제한 등 — 소규모 커뮤니티에서 익명 남용 시 신뢰 훼손 위험
- [ ] AI Matching embedding 모델 선택: OpenAI text-embedding-3-small vs 한국어 특화 모델 — 한국어 프로필/JD 매칭 정확도에 영향. 비용 대비 성능 검증 필요
- [ ] Premium 결제 시스템 선택: Toss Payments vs Stripe — 한국 법인카드/계좌이체 지원 여부, PG 수수료, 구현 복잡도 차이
- [ ] Supabase pgvector 활성화 가능 여부: shared instance에서 extension 설치 권한이 있는지 — P4-A AI Matching의 전제조건. 불가능하면 외부 벡터 DB(Pinecone 등) 고려 필요
- [ ] Market Intelligence 데이터 소스: 내부 데이터만 vs 외부 API 연동 — 내부 데이터만으로 유의미한 인사이트가 나오려면 최소 트래픽/데이터 규모 필요
