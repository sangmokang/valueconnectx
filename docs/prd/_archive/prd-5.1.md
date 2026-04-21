
ValueConnect X
Product & Business Strategy
비즈니스 계획 · PRD · 디자인 플랜 · 엔지니어링
v6.0 · 2026년 4월


0. 현재 상황 진단
0.1 혼돈의 근원 — '이게 무슨 서비스인가?'
현재 VCX는 두 개의 정체성 사이에서 흔들리고 있다. 헤드헌팅 플랫폼인가, 커뮤니티인가. 이 질문에 답하기 전에 먼저 비즈니스 목적을 명확히 해야 한다.

핵심 질문: ValueConnect의 수익은 헤드헌팅 성사 수수료다. 커뮤니티는 수단이고, 채용 연결이 목적이다. 단, 커뮤니티 없이는 최고 수준의 인재가 머물지 않는다.

현재 코드 상태의 3가지 문제:
•	서브 페이지 디자인 붕괴 — 메인 대비 현저히 낮은 완성도
•	온보딩 폼 UX — 고급 인재에게 구직 사이트 느낌을 주는 폼 기반 인터페이스
•	Cold Start 미해결 — 네트워크 효과가 없는 상태에서 사람을 모을 이유가 부족

0.2 클로드 코드 검증 결과 요약
가설	검증 결과
온보딩 이탈이 많을 것	LOW — 초대 전용 유저 동기는 이미 높음. 진짜 마찰은 폼 길이가 아닌 '중복 입력'
LinkedIn 자동 채움 도입	Phase 1 불필요 — API 제약, ToS 리스크, 6초 절약을 위한 신뢰 훼손 위험
초개인화 구독 모델	방향 옳음, 실행 시기 다름 — 30명 데이터로는 의미 있는 매칭 불가
전문 분야 카테고리	자유 태그로 전환 권장 — 영어/한국어 혼재, 분류 너무 광범위

0.3 즉시 수정이 필요한 UX 버그
심각도	문제	원인/해결
Critical	온보딩 중 GNB 노출 → 무한 리다이렉트	gnb-visibility.tsx에 /onboarding 경로 미포함
Major	이름/LinkedIn 중복 수집 — ✅ 해결됨: 온보딩에서 기입력 필드는 읽기 전용으로 표시	초대 수락 시 이미 받은 정보를 온보딩에서 재요청 → 해결 완료
Major	전문 분야 영어/한국어 혼재	PROFESSIONAL_FIELDS 영어, INDUSTRIES 한국어
Major	진행률 0%에서 시작	기입력 데이터가 progress bar에 미반영

 
1. 비즈니스 전략
1.1 핵심 명제
탁월한 사람들이 스스로 모이는 곳 — 각 분야에서 깊이 있는 경험을 가진 사람들이 모이는 곳. 이들이 머무는 이유를 설계하면, 헤드헌팅은 자연스럽게 따라온다.

1.2 비즈니스 구조
VCX의 비즈니스는 3개 레이어로 구성된다:

레이어	기능	수익 기여
채용정보 큐레이션 (Hook)	초개인화 채용시장 데이터 → 인재 확보 & 리텐션	간접 (인재 확보)
커뮤니티 라운지 (Sticky)	익명 커뮤니티 → 인재가 머무는 이유 제공	간접 (이탈 방지)
채용 연결 (Revenue)	CEO Coffee Chat + Peer Coffee Chat → 수수료 수익	직접 (핵심 수익)

1.3 수익 모델
수익원	구조
성사 수수료 (주수익)	채용 성사 시 성과 기반 수수료 (기업 부담, 구체 조건 별도 협의) — CEO Coffee Chat, Peer Coffee Chat 모두 적용 [내부 기준: 연봉의 25%, 유저에게 노출하지 않음]
채용 연결 보상	멤버가 관심 표시한 포지션에 채용 성사 시 보상 지급 (인재 신뢰도 강화 목적)
동료 추천 보상	멤버가 동료 추천 → 채용 성사 시 높은 보상 (소싱·보증 노력 반영)
프리미엄 기업 계정 (추후)	CEO Coffee Chat 세션 우선권, 인재 디렉터리 열람 등급 상향

1.4 Cold Start 전략 — 채용시장 큐레이션으로 시작
네트워크 효과가 없는 초기 상태에서 인재를 끌어오려면, 그들이 혼자서도 가치를 느끼는 서비스가 먼저 있어야 한다.

Cold Start Hook: '딥테크 백엔드 시장 관심 있음' → 42dot, Upstage, Naver Clova 등 맞춤 채용정보 자동 구독 이 서비스가 있으면, 네트워크가 작아도 개인적 가치가 즉시 발생한다.

단계별 Cold Start 해결:
•	Week 1~4: 어드민이 수동으로 채용시장 뉴스레터 발송 (Stibee). 오픈율/클릭율 측정
•	Month 2~3: 관심 분야 태그 기반 자동 큐레이션 파이프라인 구축
•	Month 4~: 자연어 니즈 입력 → LLM 기반 매칭 채용정보 구독 자동화

1.5 커뮤니티 라운지 — 인재가 머무는 이유
초대 전용 라운지. 익명 글쓰기. 카테고리는 인재들의 실제 관심사로 구성.

카테고리	설명
📚 독서 & 인사이트	읽은 책, 아티클, 생각의 단편 공유
💼 이직 이야기	커리어 고민, 이직 경험, 연봉 협상 리얼 토크
🏢 회사 생활	'이 회사 어때요?' — 실경험 기반 조직 문화 정보
🧠 리더십 & 조직	팀 운영, 사람 관리, 의사결정 경험담
⚡ 생산성 & Tech	도구, 워크플로우, 테크 트렌드
☕ 가볍게 이야기해요	번아웃, 워라밸, 일상 이야기

 
2. PRD v6.0 — Product Requirements
2.1 제품 비전
ValueConnect X는 시대의 핵심 인재들이 서로를 알아보고, 성장하고, 커리어의 다음 챕터를 자신의 방식으로 써내려가는 Private Network다.

2.2 Core Features — 우선순위 재정렬
Feature 1: 채용시장 큐레이션 피드 (신규)
Cold Start를 해결하는 핵심 기능. 멤버가 관심 분야를 등록하면, 해당 시장의 채용 포지션을 자동으로 큐레이션해서 전달한다.

항목	내용
입력	관심 분야 태그 (자유 입력, 최대 5개) — e.g., '딥테크', '핀테크 B2B', 'Series A 스타트업'
처리	원티드, LinkedIn, 사람인 데이터 → LLM 필터링 → 관련 포지션 추출
출력	주 1회 뉴스레터 (Stibee) + 인앱 피드
Phase 1	어드민 수동 큐레이션 → 뉴스레터 발송. 코드 없음.
Phase 2	자동화 파이프라인 + 자연어 구독 설정 UI

Feature 2: 커뮤니티 라운지 (신규 우선순위)
네트워크가 작아도 가치 있는 공간. 익명성이 솔직함을 만들고, 솔직함이 신뢰를 만든다.

항목	내용
익명 글쓰기	닉네임 또는 익명으로 글 작성 가능 (멤버임은 인증됨)
카테고리	독서, 이직, 회사생활, 리더십, 생산성, 가벼운 이야기
Privacy Rule	커뮤니티 글은 채용 활용 불가 — 시스템 차원 분리
모더레이션	Admin 삭제 권한 + 멤버 신고 + 반복 위반 시 작성 제한

Feature 3: Member Directory
검증이 필요 없을 정도의 인재들이 모여 있는 디렉터리. 이름, 직군, 전문 분야로 탐색.

항목	내용
검색/필터	이름, 직군, 전문 분야 태그, 산업
Anti-Scraping	1분 10건 경고 / 20건 세션 종료 / 하루 50건 접근 제한
LinkedIn	필수 연동 (신뢰 검증 목적) — 자동 채움 아님, URL 입력
Member Tier	Core / Endorsed 배지 노출

Feature 4: Position Board
ValueConnect가 내부 등록한 포지션만 게시. 기업이 직접 올리지 않는다.

멤버 액션	설명
관심 있음	포지션 관심 표시 → AI Match Engine의 학습 신호로 활용
관심 없음	피드에서 제외 → 큐레이션 고도화
나중에 보기	북마크

Feature 5: Peer Coffee Chat
멤버가 사연을 올리고 신청자를 직접 선택. 채용으로 이어지면 VCX 소개 수수료 적용.

Feature 6: CEO Coffee Chat
CEO/Founder/C-Level이 세션 생성 → 멤버가 신청 → CEO가 선택. 세션 생성 시 채용 연결 구조 동의. 컬쳐핏 확인을 중심으로, 대화와 교류를 통해 서로의 결을 확인하는 자리.

2.3 온보딩 플로우 개선
현재 온보딩의 핵심 문제는 폼이 길어서가 아니라, 이미 받은 정보를 다시 묻는 것이다.

단계	수집 정보
초대 수락 (이메일 링크)	이름, LinkedIn URL — 여기서 한 번만 수집
온보딩 Step 1 (필수)	현재 회사, 직함, 관심 분야 태그 (자유 입력 최대 5개)
온보딩 Step 2 (선택)	자기소개 Bio, 위치, 총 경력 연수
이후 언제든	프로필 편집으로 추가 정보 입력 가능

GNB 수정: /onboarding 경로에서 GNB를 숨겨야 한다. 한 줄 수정으로 Critical 버그 해결 가능.

 
3. UX & 디자인 플랜
3.1 디자인 시스템
'Quiet Luxury' 에디토리얼 미학 — Anthropic.com, Linear, Aman Hotels에서 영감받은 절제된 프리미엄.

요소	값	용도
Primary Background	#F5F0E8 (크림)	페이지 배경
Near Black	#1A1A1A	주요 텍스트, 헤더
Gold Accent	#C9A84C	버튼, 강조, 배지
Body Text	#4B5563	본문 텍스트
Border/Divider	#E5E7EB	구분선, 카드 테두리
Display Font	Georgia / Noto Serif KR	대형 타이틀, 히어로
UI Font	Pretendard	본문, 버튼, 레이블

3.2 페이지별 UX 개선 방향
온보딩 — 마찰 제거
•	Step 진행률 표시기: 초대 수락에서 받은 데이터를 반영해 첫 화면부터 0% 아님
•	자유 태그 입력: 전문 분야를 고정 카테고리 대신 자유 입력 태그로 전환
•	GNB 숨김: 온보딩 중 상단 내비게이션 완전 제거
•	환영 메시지: 'OOO님, ValueConnect X에 오신 것을 환영합니다' — 이름 자동 반영

채용정보 큐레이션 피드 — 핵심 신규 화면
•	자연어 관심사 입력 위젯: '어떤 시장이 궁금하신가요?' — 칩 선택 또는 자유 입력
•	주간 피드 카드: 회사명, 포지션, 팀 규모, 연봉 밴드, '관심 있음 / 관심 없음' 액션
•	뉴스레터 연동 표시: '이 내용이 매주 이메일로 전송됩니다'

커뮤니티 라운지 — 커뮤니티 첫인상
•	카테고리 탭: 아이콘 + 한국어 레이블, 가로 스크롤
•	익명 글쓰기: '멤버 인증됨, 이름은 표시되지 않습니다' 안내 뱃지
•	글 카드: 카테고리 태그, 제목, 미리보기, 댓글 수, 좋아요
•	빈 상태 디자인: '첫 번째 이야기를 시작해보세요' — 콘텐츠 0 상태에서의 CTA

CEO Coffee Chat — 서로의 결을 확인하는 자리
•	세션 카드: CEO 이름/회사/시리즈 정보를 대형 타이포그래피로 — 지원서가 아닌 초대장 느낌
•	신청 전 계약 동의: 인라인 모달, '이 대화를 통해 채용이 연결될 경우, ValueConnect의 채용 연결 구조가 적용됩니다'
•	세션 상태 표시: 모집 중 / 마감 / 진행 완료

3.3 디자인 원칙
원칙	적용 방식
뿌리지 않는다	정보 밀도를 낮게. 화면당 하나의 핵심 메시지.
신뢰가 먼저	화려한 기능보다 텍스트와 여백으로 무게감 전달
인재 정체성 강화	UI 카피에 '지원'이 아닌 '연결', '선택'이 아닌 '기회' 언어 사용
마찰은 의도적으로	아무나 들어올 수 없다는 신호 — 초대 코드, 승인 대기 화면

 
4. 엔지니어링 아키텍처
4.1 기술 스택 확정
레이어	기술
Frontend	Next.js 15 (App Router) — React Server Components 적극 활용
Backend / DB	Supabase (PostgreSQL + Row Level Security)
Auth	Supabase Auth — Email Invite 기반, Magic Link
AI Pipeline	Claude Sonnet (큐레이션 필터링) + GPT-4o (크로스 검증)
Email	Resend (트랜잭션) + Stibee (뉴스레터)
Analytics	Mixpanel — 온보딩 이탈 이벤트 로깅 필수
Hosting	Vercel
DNS / Domain	Cloudflare (valueconnectx.kr via Gabia, 글로벌 도메인 Cloudflare 직접)

4.2 DB 스키마 핵심
Members 테이블
컬럼	설명
id	UUID, PK
email	초대 이메일, UNIQUE
name	실명
nickname	커뮤니티 표시명 (익명 대신 사용, 필수)
linkedin_url	필수, 커리어 검증
current_company	현재 회사
title	직함
interest_tags	TEXT[], 자유 태그 (최대 5개)
member_tier	ENUM: core | endorsed
invited_by	FK → members.id (추천인)
onboarding_completed	BOOLEAN
created_at	TIMESTAMP

Invites 테이블
컬럼	설명
id	UUID, PK
email	초대 대상 이메일
token	UUID, 24시간 유효
invited_by	FK → members.id 또는 admin
expires_at	TIMESTAMP (now + 24h)
used_at	TIMESTAMP, NULL이면 미사용
name_prefill	초대 수락 시 자동 채움용

Market_Feed_Subscriptions 테이블 (신규)
컬럼	설명
member_id	FK → members.id
interest_query	TEXT — 자연어 입력 ('딥테크 백엔드')
tags	TEXT[] — 파싱된 키워드 태그
active	BOOLEAN
last_sent_at	TIMESTAMP

Community_Posts 테이블
컬럼	설명
id	UUID, PK
author_id	FK → members.id
is_anonymous	BOOLEAN
category	ENUM: reading | career | company | leadership | productivity | casual
title	VARCHAR(200)
content	TEXT
is_recruiting_restricted	TRUE — 채용 활용 금지 플래그
created_at	TIMESTAMP

4.3 보안 & 데이터 분리
커뮤니티 데이터와 채용 데이터는 Row Level Security (RLS) 레벨에서 분리한다.

데이터	채용 활용 가능 여부
커뮤니티 글 (community_posts)	불가 — is_recruiting_restricted = TRUE
Coffee Chat 글	불가
포지션 관심 표시 (position_interests)	가능 — 명시적 동의 데이터
멤버 프로필	가능 — 가입 시 동의
활동 로그	집계 데이터만 — 개인 특정 불가

4.4 Anti-Scraping 구현
•	Supabase Edge Function: 프로필 조회 이벤트 로깅
•	Redis (Upstash): 슬라이딩 윈도우 카운터 (1분, 1일)
•	임계 초과 시: 경고 토스트 → 세션 종료 → IP 차단 (Cloudflare WAF 연동)

 
5. 로드맵
5.1 Phase 별 목표

Phase 1 · M1~2
Cold Start & Foundation
초기 Core 멤버 확보. 수동 운영. 코드는 최소.
•	Invite System + Magic Link 로그인
•	Member Profile & Directory
•	Position Board (Admin 수동 등록)
•	채용정보 뉴스레터 수동 발송 (Stibee) — 오픈율/클릭율 측정
•	커뮤니티 라운지 오픈 (게시판 기능)
•	온보딩 버그 수정 (GNB 숨김, 중복 입력 제거, 자유 태그)
•	Mixpanel 이벤트 로깅 (온보딩, 포지션 관심, 라운지 클릭)

Phase 2 · M3~5
Engagement & First Revenue
Core 60명, 첫 채용 성사.
•	Peer Coffee Chat 런칭
•	CEO Coffee Chat 런칭 (헤드헌팅 계약 동의 포함)
•	채용정보 자동 큐레이션 파이프라인 구축 (Claude API 연동)
•	관심 분야 태그 기반 뉴스레터 자동화
•	포지션 관심/비관심 데이터 분석 → 큐레이션 품질 개선
•	상세 페이지 디자인 끌어올리기 (디자인 시스템 적용)

Phase 3 · M6~10
Scale & AI Matching
월 채용 성사 3건 이상.
•	자연어 채용정보 구독 UI (인앱 피드)
•	LLM 기반 포지션-멤버 매칭 스코어링
•	AI Match Engine (Claude Sonnet + GPT-4o 크로스 검증)
•	LinkedIn OAuth 연동 (본인 인증 목적)
•	추천 엔진 데이터 파이프라인
•	글로벌 한국인 네트워크 확장 준비

5.2 Phase 1 스프린트 우선순위 (즉시 실행)
순위	작업	노력/임팩트
1	GNB 온보딩 중 숨김 처리	1줄 수정 / Critical 버그 해결
2	온보딩 중복 입력 제거 (이름/LinkedIn)	낮음 / 마찰 대폭 감소
3	전문 분야 → 자유 태그 전환	낮음 / 영어/한국어 혼재 해결
4	Mixpanel 이탈 측정 이벤트 로깅	낮음 / 데이터 확보 시작
5	채용정보 뉴스레터 1회 수동 발송	없음 (어드민 작업) / Cold Start 시작
6	커뮤니티 라운지 카테고리 확정 및 오픈	중간 / 리텐션 기반 구축

 
6. 핵심 의사결정 정리
6.1 커뮤니티 vs 채용 플랫폼?
둘 다다. 단, 순서가 있다.  커뮤니티(라운지) → 인재가 머무는 이유 → 채용 연결 → 수익 커뮤니티를 먼저 만들지 않으면, 채용 플랫폼은 평범한 헤드헌팅 사이트가 된다.

6.2 LinkedIn 자동 채움 — Phase 1에서 하지 않는 이유
•	API: 본인 OAuth만 가능, 타인 프로필 접근 불가
•	3rd Party: LinkedIn ToS 위반, 법적 리스크
•	절약 시간: 약 6초 — 이를 위해 신뢰 기반 서비스의 첫인상을 '내 정보를 수집하는 서비스'로 만들면 치명적
•	Phase 2+에서 LinkedIn OAuth 연동 (자동 채움이 아닌 본인 인증 목적)

6.3 Phase 1에서 하지 않을 것
•	LinkedIn API 연동 / 프로필 자동 채움
•	AI 기반 Coffee Chat/Position 매칭 알고리즘
•	개인화 구독/푸시 자동화 시스템
•	추천 엔진 데이터 파이프라인

6.4 커뮤니티의 Cold Start — 다음카페 모멘트
처음에는 콘텐츠가 없다. 이를 해결하는 방법:
•	Tim과 팀원이 첫 글을 직접 작성 (씨드 콘텐츠)
•	초기 멤버에게 '첫 주 이야기 남기기' 온보딩 미션
•	강점: 초대 전용이라 커뮤니티 품질이 자연스럽게 유지됨
•	약점 인지: 강제 콘텐츠 생성 시도 금지 — 라운지가 비어있는 것이 억지로 채우는 것보다 낫다



한 줄 요약
최적의 기회를 먼저 전달하고, 커뮤니티 라운지로 머물게 하고, CEO Coffee Chat으로 수익화한다.
지금 가장 중요한 것은 사람을 모으는 것이 아니라, 사람이 머무는 이유를 설계하는 것이다.

