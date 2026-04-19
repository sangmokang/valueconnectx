---
name: vcx-qa
description: >
  ValueConnect X 전용 품질 검수 스킬. Playwright로 실제 서비스를 직접 탐색하며
  CPO·CTO·CISO·User Researcher·Brand Manager·CBO·UI Designer 7개 관점의 페르소나 기반
  고강도 품질 심사를 수행한다. 실 계정으로 로그인·회원가입·더미 데이터 누적을 직접 수행하는
  개밥먹기(Dogfooding) 루프를 포함한다. PRD v6.0 대비 구현 갭을 자동 추적한다.
  트리거: 'vcx qa', 'vcx 품질', 'valueconnectx 테스트', 'vcx 개밥', 'vcx 검수',
  'vcx 로그인 테스트', 'vcx 가입 테스트', '7개 관점', 'vcx prd 검증',
  'vcx 버그', 'vcx ux', 'vcx 피드백 루프', 'vcx dogfood', '개밥먹기'
---

# ValueConnect X — QA Skill

## 개요

VCX PRD v6.0 기준으로, 실제 서비스를 **7개 C-Suite 페르소나**가 직접 탐색하며
품질을 점검하는 고강도 QA 스킬이다.

단순 버그 탐지가 아니라 **비즈니스 정렬도 + 기술 구현 + 보안 + 유저 경험 + 브랜드**
전 축에서 동시에 압박한다. 실 계정 Dogfooding 루프로 실제 유저가 겪을 마찰을
Claude가 직접 체험하며 기록한다.

---

## ⚠️ 보안 원칙 (변경 불가)

```
1. 자격증명은 사용자가 채팅에서 직접 제공한 것만 사용
2. PASSWORD는 절대 로그·스크린샷·리포트에 평문 노출 금지 → *** 마스킹
3. 실제 결제·구독·불가역 데이터 변경 액션 수행 금지
4. 테스트용 계정 사용 강력 권장 (운영 계정 사용 시 반드시 경고)
5. Supabase RLS 우회 시도 금지
```

---

## 입력 수집

| 항목 | 필수 | 설명 |
|------|------|------|
| `VCX_URL` | ✅ | 점검할 VCX 서비스 URL (예: https://app.valueconnectx.kr) |
| `LOGIN_EMAIL` | 권장 | 테스트용 로그인 이메일 |
| `LOGIN_PW` | 권장 | 테스트용 패스워드 |
| `INVITE_TOKEN` | Signup시 필수 | 초대 전용 서비스이므로 회원가입 테스트용 초대 토큰 |
| `SIGNUP_EMAIL` | 선택 | 회원가입 테스트용 이메일 (미제공 시 스킵) |
| `SCOPE` | 선택 | 점검 범위. 기본: 전체. 예: `AUTH`, `PERSONA:CPO`, `DOGFOOD` |
| `DOGFOOD_ROUNDS` | 선택 | 개밥먹기 루프 반복 횟수 (기본: 1) |
| `PRD_VERSION` | 선택 | 비교 기준 PRD 버전 (기본: v6.0) |

---

## 환경 준비

```bash
mkdir -p /tmp/vcx-qa/{screenshots,network,reports,dogfood}

pip install playwright --break-system-packages 2>/dev/null || true
python -m playwright install chromium 2>/dev/null || true
```

---

## 전체 워크플로우

```
[입력 수집]
     │
     ▼
Phase 0 : 비로그인 캡처 ── 스크린샷·네트워크·콘솔·DOM
     │
     ├──▶ Phase 1 : PRD 갭 분석
     ├──▶ Phase 2 : 7-Persona 품질 심사
     ├──▶ Phase 3 : 인증 여정 (Signup → Login → Post-Auth)
     ├──▶ Phase 4 : Dogfooding 루프 (더미 데이터 누적)
     └──▶ Phase 5 : 피드백 루프 & 개선 로드맵
               │
               ▼
         VCX QA Report 출력
```

---

## Phase 0 : 사전 캡처

```python
import asyncio, json, os
from playwright.async_api import async_playwright

OUT = "/tmp/vcx-qa"
PAGES_TO_CAPTURE = [
    ("landing",   "{VCX_URL}"),
    ("login",     "{VCX_URL}/login"),
    ("signup",    "{VCX_URL}/signup"),
    ("directory", "{VCX_URL}/members"),
    ("board",     "{VCX_URL}/lounge"),
    ("positions", "{VCX_URL}/positions"),
    ("onboarding","{VCX_URL}/onboarding"),
]

async def capture_page(page, name, url):
    reqs, resps, errs = [], [], []
    page.on("request",  lambda r: reqs.append({"url":r.url,"method":r.method}))
    page.on("response", lambda r: resps.append({"url":r.url,"status":r.status,"timing":r.request.timing}))
    page.on("console",  lambda m: errs.append({"type":m.type,"text":m.text}) if m.type in ["error","warning"] else None)

    await page.goto(url, wait_until="networkidle", timeout=30000)
    await page.set_viewport_size({"width":1440,"height":900})
    await page.screenshot(path=f"{OUT}/screenshots/{name}_desktop.png", full_page=True)
    await page.set_viewport_size({"width":390,"height":844})
    await page.screenshot(path=f"{OUT}/screenshots/{name}_mobile.png", full_page=True)

    return {
        "name": name, "url": url,
        "requests": reqs, "responses": resps, "errors": errs,
        "text": await page.inner_text("body"),
        "title": await page.title(),
        "meta_desc": await page.get_attribute('meta[name="description"]', "content") or "",
    }
```

**Phase 0 체크리스트:**
- [ ] 모든 주요 페이지 스크린샷 저장 완료
- [ ] 콘솔 에러 0개 (있으면 즉시 Critical 이슈 등록)
- [ ] 4xx/5xx 응답 없음
- [ ] /onboarding 진입 시 GNB 숨김 여부 확인 (PRD Critical 버그)

---

## Phase 1 : PRD v6.0 갭 분석

> PRD 원문: 문서 첨부 또는 `references/prd-v6.md` 참조

VCX PRD v6.0 기준으로 **구현 완료 / 구현 중 / 미구현 / 스펙 이탈**을 자동 분류한다.

### 1-1. Feature 구현 상태 추적

| PRD Feature | 상태 | 발견 근거 | 비고 |
|-------------|------|-----------|------|
| 채용시장 큐레이션 피드 | ⬜ 확인 필요 | | Phase 1 = 어드민 수동 발송 |
| 커뮤니티 라운지 | ⬜ 확인 필요 | | 익명 글쓰기 포함 |
| Member Directory | ⬜ 확인 필요 | | Anti-Scraping 포함 |
| Position Board | ⬜ 확인 필요 | | 관심있음/없음/나중에보기 |
| Peer Coffee Chat | ⬜ 확인 필요 | | Phase 2 기능 |
| CEO Coffee Chat | ⬜ 확인 필요 | | 헤드헌팅 계약 동의 포함 |
| 온보딩 중복 입력 제거 | ⬜ 확인 필요 | | Critical 버그 수정 여부 |
| GNB /onboarding 숨김 | ⬜ 확인 필요 | | 1줄 수정 Critical |
| 자유 태그 입력 | ⬜ 확인 필요 | | 고정 카테고리 → 자유태그 |
| 진행률 0%→ 기입력 반영 | ⬜ 확인 필요 | | Progress bar 버그 |
| Magic Link 로그인 | ⬜ 확인 필요 | | Supabase Auth |
| Invite System | ⬜ 확인 필요 | | 24h 토큰 |
| Mixpanel 이벤트 로깅 | ⬜ 확인 필요 | | 온보딩 이탈 이벤트 필수 |
| Anti-Scraping (1분/10건) | ⬜ 확인 필요 | | Redis 슬라이딩 윈도우 |
| RLS 데이터 분리 | ⬜ 확인 필요 | | 커뮤니티 ≠ 채용 데이터 |

상태 범례: ✅ 완료 | 🔨 진행 중 | ❌ 미구현 | ⚠️ 스펙 이탈 | ⬜ 확인 필요

### 1-2. PRD 이탈 패턴 탐지

PRD에 명시된 아래 항목이 구현에서 **반대로 간** 케이스를 찾는다:

```
탐지 패턴:
① LinkedIn 자동채움 시도 → PRD: Phase 1 금지, URL 입력만 허용
② 고정 카테고리 드롭다운 → PRD: 자유 태그 입력으로 전환 명시
③ 온보딩에서 이름 재수집 → PRD: 초대 수락 시 한 번만 수집
④ 커뮤니티 글에 작성자 추적 가능 구조 → PRD: 완전 익명 + RLS 분리
⑤ CEO Coffee Chat에 계약 동의 누락 → PRD: 필수 인라인 모달
```

### 1-3. GAP 리포트 포맷

```
[GAP-N] {PRD Feature명}
PRD 명세: {PRD v6.0에서 요구한 내용}
현재 구현: {실제 발견된 상태}
갭 유형: 미구현 / 스펙 이탈 / 부분 구현
우선순위: Sprint 1 필수 / Sprint 2 / Backlog
담당 페르소나: CPO / CTO / CISO / ...
```

---

## Phase 2 : 7-Persona 품질 심사

> 상세 체크리스트 → `personas/` 폴더 참조

각 페르소나는 독립적인 관점으로 서비스를 평가한다.
**동일한 화면을 7개 렌즈로 보는 것** — 중복을 두려워하지 말 것.

---

### 👑 CPO (Chief Product Officer)

> `personas/cpo.md` 참조

**핵심 질문:** "이 제품이 PRD v6.0에서 정의한 비즈니스 목적에 정렬되어 있는가?"

```
평가 항목:
① 비전 정렬: "시대의 인재를 모은다"는 비전이 첫 화면에서 느껴지는가?
② BM 3-Layer 구현: Hook(큐레이션) → Sticky(라운지) → Revenue(Coffee Chat) 플로우가 유저 여정에 녹아 있는가?
③ Cold Start 해결력: 네트워크 없어도 혼자 가치 느낄 수 있는 요소가 있는가?
④ KPI 가시성: 온보딩 이탈 이벤트, 포지션 관심 표시 등 핵심 지표를 측정할 수 있는가?
⑤ Phase 1 스코프 준수: Phase 2+ 기능이 조기 구현되어 복잡도를 올리고 있지 않은가?
⑥ CTA 언어: '지원'이 아닌 '연결', '선택'이 아닌 '기회' 언어가 사용되는가?
⑦ 커뮤니티-채용 분리 신호: 유저가 커뮤니티 글이 채용에 쓰이지 않는다는 것을 인지할 수 있는가?
```

출력 포맷:
```
[CPO-N] {이슈명}
BM 영향: {어느 레이어(Hook/Sticky/Revenue)에 영향}
현황: {발견 내용}
PRD 대비: {PRD v6.0 어느 항목과 충돌/누락}
제안: {CPO 관점 개선 방향}
우선순위: Critical / High / Medium
```

---

### ⚙️ CTO (Chief Technology Officer)

> `personas/cto.md` 참조

**핵심 질문:** "이 코드베이스가 Scale할 수 있는가? 기술 부채가 쌓이고 있는가?"

```
점검 항목:
① Supabase RLS: community_posts.is_recruiting_restricted = TRUE가 실제 쿼리에서 enforce되는가?
② Anti-Scraping: Member Directory에서 1분 10건 초과 시 경고 발동하는가?
③ Next.js 15 App Router: RSC와 Client Component 분리가 적절한가? use client 남용?
④ Magic Link 만료: 24h 토큰 만료 후 접근 시 적절한 에러 처리가 있는가?
⑤ N+1 쿼리: Member Directory 목록 → 개별 프로필 상세에서 N+1 발생 여부
⑥ Edge Function: 프로필 조회 이벤트 로깅이 실제로 작동하는가?
⑦ 환경변수: API 키가 클라이언트 번들에 노출되지 않는가? (window.__NEXT_DATA__ 확인)
⑧ Error Boundary: 컴포넌트 오류 시 전체 페이지 Crash 방지 구조가 있는가?
⑨ 번들 최적화: 초기 JS 번들 사이즈 (< 200KB gzipped 권장)
⑩ 타입 안전성: API 응답 타입이 명시되어 있는가, any 남용 여부
```

네트워크 분석 자동화:
```python
# CTO 관점 API 분석
def analyze_for_cto(requests, responses):
    issues = []
    
    # 환경변수 노출 체크
    for req in requests:
        if "supabase" in req["url"] and "anon" in req.get("headers", {}).get("apikey", ""):
            issues.append("⚠️ Supabase anon key 노출 (정상이나 RLS 적용 필수 확인)")
    
    # 느린 API 탐지
    for resp in responses:
        timing = resp.get("timing", {})
        if timing.get("responseEnd", 0) - timing.get("requestStart", 0) > 1000:
            issues.append(f"🐌 느린 API: {resp['url']} ({timing.get('responseEnd',0)}ms)")
    
    # 4xx/5xx 탐지
    errors = [r for r in responses if r["status"] >= 400]
    for e in errors:
        issues.append(f"❌ HTTP {e['status']}: {e['url']}")
    
    return issues
```

---

### 🔒 CISO (Chief Information Security Officer)

> `personas/ciso.md` 참조

**핵심 질문:** "초대 전용 서비스의 신뢰 구조가 보안적으로 견고한가?"

```
보안 점검:
① Invite Token 보안
   - 토큰이 UUID v4 형식인가? (예측 불가능성)
   - 이미 사용된 토큰으로 재사용 시도 → 차단되는가?
   - 만료된 토큰 접근 시 → 적절한 에러 페이지?
   - 토큰이 URL에 노출되는가? (Referrer 헤더 누출 위험)

② 인증 보안
   - Magic Link 세션 토큰이 httpOnly Cookie에 저장되는가?
   - CSRF 방어가 적용되어 있는가?
   - 패스워드가 POST body로 전송되는가? (URL 파라미터 절대 금지)
   - 로그인 실패 시 계정 존재 여부가 노출되지 않는가?
     ✅ "이메일 또는 패스워드가 올바르지 않습니다"
     ❌ "이 이메일로 가입된 계정이 없습니다"

③ 커뮤니티 익명성 보안
   - community_posts 테이블에 author_id가 저장되는가? (RLS로 접근 제어?)
   - 익명 글에서 작성자 특정 가능한 메타데이터가 API 응답에 포함되는가?
   - is_recruiting_restricted = TRUE 가 실제 적용되는가?

④ Member Directory 보안
   - IDOR: /members/[id] URL 변조로 미승인 멤버 데이터 접근 가능한가?
   - Anti-Scraping이 실제로 발동하는가?
   - 비로그인 상태에서 멤버 데이터 API 직접 호출 가능한가?

⑤ XSS / Injection
   - 커뮤니티 글 입력에 <script> 태그 → 실행되는가?
   - SQL Injection: ' OR 1=1 -- 입력 시 서버 반응
   - Markdown/HTML 인젝션 가능 여부

⑥ 데이터 노출
   - API 응답에 이메일, 내부 ID, 해시값 등 불필요 데이터 포함 여부
   - 관리자 전용 필드(invited_by, member_tier 내부 데이터)가 일반 멤버에게 노출되는가?
```

CISO 출력 포맷:
```
[CISO-N] {이슈명}
심각도: Critical / High / Medium / Low
OWASP 분류: {해당되는 OWASP Top 10 항목}
현황: {발견 내용 + 재현 방법}
위험: {실제로 발생 가능한 공격 시나리오}
수정 방법: {구체적 기술 해결책}
```

---

### 🔬 User Researcher

> `personas/user-researcher.md` 참조

**핵심 질문:** "실제 초대된 핵심 인재가 이 서비스를 처음 마주쳤을 때 어떤 감정과 마찰을 경험하는가?"

**3가지 페르소나로 여정 시뮬레이션:**

```
Persona A — 현재 대기업 시니어 개발자 (잠재 이직 대상)
├─ 동기: 링크드인 DM으로 초대 받음. 반신반의.
├─ 첫인상: "이게 또 다른 리쿠루팅 플랫폼인가?"
└─ 탈출 조건: 가입 폼이 구직 사이트처럼 느껴지면 즉시 이탈

Persona B — 스타트업 C-Level (네트워크 목적)
├─ 동기: 동종 업계 C-Level과 연결하고 싶음
├─ 첫인상: "커뮤니티 품질이 중요하다"
└─ 탈출 조건: 라운지에 가치 있는 콘텐츠가 없으면 이탈

Persona C — 이직 준비 중인 PM (커뮤니티 + 포지션 탐색)
├─ 동기: 커리어 고민 공유 + 좋은 포지션 탐색
├─ 첫인상: "익명이 진짜 익명인지 모르겠다"
└─ 탈출 조건: 내 커뮤니티 글이 채용에 쓰일까봐 걱정되면 이탈
```

평가 항목:
```
① 첫 5초 테스트: 랜딩에서 "이 서비스가 나를 위한 것인가" 즉각 판단 가능한가?
② 온보딩 마찰: 몇 개 필드인가? 중복은 없는가? 구직 사이트 느낌이 나는가?
③ 신뢰 신호: "초대된 사람만 볼 수 있다"는 배타성과 안전감이 느껴지는가?
④ 빈 상태 경험: 커뮤니티·피드가 비었을 때 공허감 or 가능성이 느껴지는가?
⑤ 익명성 신뢰: "내 글이 채용에 안 쓰인다"는 것을 UI에서 납득할 수 있는가?
⑥ 가치 즉시성: 가입 직후 바로 가치를 느낄 수 있는가? (Cold Start 고려)
⑦ 이탈 위험 지점: 각 페이지에서 유저가 이탈할 가능성이 가장 높은 순간은?
```

---

### 🎨 Brand Manager

> `personas/brand-manager.md` 참조

**핵심 질문:** "ValueConnect X의 'Quiet Luxury' 에디토리얼 미학이 모든 화면에서 일관되는가?"

```
디자인 시스템 준수 체크:

색상 팔레트 감사:
  Primary BG    #F5F0E8 적용 여부
  Near Black    #1A1A1A 주요 텍스트
  Gold Accent   #C9A84C (또는 #b8902a) 버튼·강조·배지
  Body Text     #4B5563 본문
  Border        #E5E7EB 구분선

타이포그래피 감사:
  Display Font  Georgia / Noto Serif KR (대형 타이틀, 히어로)
  UI Font       Pretendard (본문, 버튼, 레이블)
  둘 이상의 font-family 혼용 여부

카피 언어 감사:
  ✅ '연결', '기회', '초대', '선택', '탐색'
  ❌ '지원하기', '입사', '구직', '등록', '제출'

브랜드 일관성 점검:
  ① 서브 페이지(멤버 디렉터리, 포지션, 게시판)가 메인과 같은 디자인 언어를 쓰는가?
  ② VCX의 배타성 느낌이 화면 전반에 흐르는가?
  ③ Anthropic.com / Linear의 절제된 레이아웃이 참고되었는가?
  ④ 금색 액센트가 과하게 쓰이지 않고 절제되어 있는가?
  ⑤ 여백(whitespace)이 의도적으로 설계되어 '고급스러움'이 느껴지는가?
  ⑥ 마이크로카피(tooltip, placeholder, 에러메시지)가 브랜드 목소리를 유지하는가?
```

---

### 💼 CBO (Chief Business Officer)

> `personas/cbo.md` 참조

**핵심 질문:** "이 서비스가 헤드헌팅 수수료 수익 모델을 실제로 작동시키는가?"

```
수익 모델 구현 점검:
① CEO Coffee Chat 계약 동의 플로우
   - 세션 신청 전 "채용 성사 시 VCX 수수료 동의" 모달이 있는가?
   - 동의 없이 신청 불가 처리가 되는가?
   - 동의 기록이 DB에 저장되는가? (법적 효력 필요)

② Peer Referral / Self Introduction 추천 흐름
   - 멤버가 동료를 추천할 수 있는 경로가 있는가?
   - 추천 → 채용 성사 → 보상 지급까지의 플로우가 설계되어 있는가?

③ Position Board 관심 데이터 수집
   - '관심 있음' 클릭 시 데이터가 실제로 저장되는가?
   - '관심 없음' 피드백이 큐레이션 개선에 연결되는가?

④ Cold Start BM 검증
   - 채용정보 뉴스레터 구독 플로우가 있는가?
   - 관심 분야 태그 입력이 실제로 뉴스레터 발송과 연결되는가? (Phase 1: 수동 발송 OK)

⑤ 수익 추적 인프라
   - Mixpanel에서 Coffee Chat 신청, 포지션 관심, 프로필 완성 이벤트가 로깅되는가?
   - 채용 성사 수동 입력 플로우(어드민)가 있는가?
```

---

### 🖥️ UI Designer

> `personas/ui-designer.md` 참조

**핵심 질문:** "익명 게시판 컴포넌트(제공된 JSX)가 프로덕션 품질인가?"

익명 게시판 컴포넌트 심층 분석:

```
컴포넌트 구조 점검 (AnonymousBoard.jsx 기준):

① 반응형 레이아웃
   - 1440px: 레이아웃 의도대로 렌더링?
   - 768px (태블릿): 카테고리 탭 줄바꿈 처리?
   - 390px (모바일): padding 48px → 모바일에서 과도하게 넓음 (16px으로 조정 필요)

② 접근성 (A11y)
   - 카테고리 버튼에 aria-pressed 속성 있는가?
   - 이모지 버튼에 aria-label 있는가? (스크린 리더)
   - 키보드 네비게이션이 논리적 순서인가?
   - focus indicator가 보이는가?

③ 성능
   - 글 목록이 많아질 때 가상 스크롤 or 페이지네이션이 있는가?
   - 이모지 피커가 렌더 시마다 새로 생성되는가? (메모이제이션 필요)
   - 스크린샷 찍어 실제 렌더링 확인

④ 인터랙션 완성도
   - 이모지 피커가 화면 밖으로 잘리는 케이스 처리?
   - showEmojiPicker 외부 클릭 시 닫힘 처리가 있는가?
   - PostCard 애니메이션이 부드러운가? (isOpen transition)
   - 댓글 입력 후 스크롤이 새 댓글로 이동하는가?

⑤ 엣지 케이스
   - 긴 제목 (100자+)이 레이아웃을 깨는가?
   - 이모지가 0개일 때 공감 영역이 이상하게 렌더링되는가?
   - 댓글 0개 상태의 빈 화면이 잘 디자인되어 있는가?
   - 글 body가 매우 짧을 때 카드 높이가 어색한가?

⑥ 코드 품질
   - inline style 남용 → CSS 모듈/Tailwind로 전환 필요성
   - 하드코딩된 색상값이 디자인 토큰으로 분리되어 있는가?
   - 컴포넌트 재사용성 — EmojiPicker가 별도 컴포넌트로 분리되어야 하는가?
```

---

## Phase 3 : 인증 여정 (VCX 특화)

VCX는 **초대 전용 서비스**라는 특성이 인증 여정에 그대로 반영되어야 한다.

### 3-A. 초대 수락 → 회원가입 여정

```python
async def test_vcx_signup(page, invite_token, signup_email, out):
    # 초대 링크 접근
    invite_url = f"{VCX_URL}/invite/{invite_token}"
    await page.goto(invite_url)
    await page.screenshot(path=f"{out}/signup_01_invite_landing.png")

    # 체크: 이름이 자동으로 채워지는가? (name_prefill 체크)
    name_field = await page.query_selector("input[name='name'], input[placeholder*='이름']")
    prefilled_name = await name_field.input_value() if name_field else ""
    
    # 체크: LinkedIn URL 필드가 자동채움 아닌 수동 입력인가?
    linkedin_field = await page.query_selector("input[name='linkedin_url'], input[placeholder*='linkedin']")

    # PRD 이슈 체크: 이름/LinkedIn이 초대 수락 화면에서 한 번만 수집하는가?
    checks = {
        "name_prefilled": bool(prefilled_name),  # True = PRD 준수
        "linkedin_manual_input": bool(linkedin_field),  # True = PRD 준수 (자동채움 ❌)
        "signup_step_count": 0,  # 이후 step 수 카운트
    }
    
    await page.screenshot(path=f"{out}/signup_02_form_filled.png")
    return checks
```

**VCX 전용 체크리스트:**

| 항목 | PRD 명세 | 실제 구현 |
|------|----------|----------|
| 이름 초대 수락 시 1회만 수집 | ✅ 초대 수락 = 이름 수집, 온보딩 재요청 ❌ | ⬜ |
| LinkedIn URL 수동 입력 (자동채움 ❌) | ✅ URL 직접 입력, API 자동채움 금지 | ⬜ |
| 온보딩 GNB 숨김 | ✅ /onboarding 경로에서 GNB 완전 숨김 | ⬜ |
| 온보딩 진행률 0% 아님 | ✅ 기입력 데이터 반영해 0% 아닌 상태로 시작 | ⬜ |
| 전문 분야 자유 태그 | ✅ 고정 카테고리 ❌ → 자유 태그 최대 5개 | ⬜ |
| 온보딩 Step 1 필수 필드 | 현재 회사, 직함, 관심 분야 태그 | ⬜ |
| 온보딩 Step 2 선택 필드 | Bio, 위치, 총 경력 연수 | ⬜ |
| 웰컴 메시지 이름 반영 | 'OOO님, ValueConnect X에 오신 것을 환영합니다' | ⬜ |

### 3-B. 로그인 여정 (Magic Link 검증)

```python
async def test_vcx_login(page, email, password, out):
    await page.goto(f"{VCX_URL}/login")
    await page.screenshot(path=f"{out}/login_01_form.png")

    # Magic Link vs 이메일+패스워드 확인
    has_magic_link = await page.query_selector("text=이메일로 로그인, text=Magic Link, text=링크 발송")
    has_pw_form = await page.query_selector("input[type='password']")

    if has_magic_link:
        print("✅ Magic Link 방식 확인 (PRD: Supabase Auth Magic Link)")
    
    if has_pw_form and password:
        # 패스워드 로그인 방식
        await page.fill("input[type='email']", email)
        await page.fill("input[type='password']", password)
        await page.screenshot(path=f"{out}/login_02_filled.png")  # PW 입력 후 즉시 스크린샷 금지 → 숨김 처리
        await page.click("button[type='submit']")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=f"{out}/login_03_result.png")

    return {
        "magic_link_available": bool(has_magic_link),
        "pw_login_available": bool(has_pw_form),
        "post_login_url": page.url,
        "login_success": "/onboarding" in page.url or "/members" in page.url or "/lounge" in page.url,
    }
```

**로그인 후 체크:**
- [ ] 로그인 성공 후 이동 경로가 적절한가? (온보딩 미완료 → /onboarding)
- [ ] 로그인 후 GNB에 멤버 정보 반영되는가?
- [ ] 이미 온보딩 완료 멤버 → 메인 피드로 직행

### 3-C. 실패 시나리오 (CISO 연계)

```
① 만료된 초대 토큰 접근 → 에러 처리 품질
② 이미 사용된 초대 토큰 재사용 → 차단 여부
③ 잘못된 패스워드 3회 연속 → 계정 잠금 or 캡차
④ 비로그인으로 /members, /lounge, /positions 직접 접근 → 리다이렉트?
⑤ 온보딩 미완료 상태에서 /lounge 직접 접근 → /onboarding 리다이렉트?
```

---

## Phase 4 : Dogfooding 루프 (개밥먹기)

> 핵심: Claude가 실제 유저처럼 서비스를 이용하며 더미 데이터를 누적한다.
> 데이터가 쌓이는 과정에서 발생하는 마찰·버그·이상한 동작을 모두 기록한다.

```
DOGFOOD_ROUNDS = {사용자 설정값, 기본 1}
```

### 4-A. Round 구성

각 Round는 아래 시나리오를 순서대로 실행:

```python
DOGFOOD_SCENARIOS = [
    ("scenario_01_browse_landing",    "랜딩 페이지 탐색 — 비로그인 상태에서 5분 탐색"),
    ("scenario_02_login",             "로그인 — 제공된 계정으로 로그인"),
    ("scenario_03_complete_profile",  "프로필 완성 — 관심 분야 태그 5개 입력"),
    ("scenario_04_browse_directory",  "멤버 디렉터리 — 20명 브라우징, 3명 프로필 상세 조회"),
    ("scenario_05_browse_positions",  "포지션 탐색 — 관심있음 2개, 관심없음 1개, 나중에보기 1개"),
    ("scenario_06_read_lounge",       "라운지 읽기 — 카테고리 전체 탐색, 글 3개 열람"),
    ("scenario_07_write_lounge",      "라운지 글 작성 — 더미 커리어 고민 글 1개 작성"),
    ("scenario_08_comment_lounge",    "라운지 댓글 — 다른 글에 익명 댓글 1개 작성"),
    ("scenario_09_react_emoji",       "이모지 반응 — 글 2개, 댓글 1개에 이모지 반응"),
    ("scenario_10_coffeechat_browse", "Coffee Chat 탐색 — CEO/Peer 세션 목록 조회"),
    ("scenario_11_logout_relogin",    "로그아웃 후 재로그인 — 세션 지속성 확인"),
]
```

### 4-B. 시나리오별 실행 & 기록

```python
async def run_dogfood_scenario(page, scenario_id, scenario_name, out_dir, round_num):
    scenario_out = f"{out_dir}/round_{round_num}/{scenario_id}"
    os.makedirs(scenario_out, exist_ok=True)
    
    issues = []
    
    # 시나리오 시작 스크린샷
    await page.screenshot(path=f"{scenario_out}/start.png")
    
    # 각 중요 액션 후 스크린샷
    # 콘솔 에러 모니터링
    # 네트워크 이상 감지
    # 소요 시간 측정
    
    return {
        "scenario": scenario_id,
        "round": round_num,
        "issues": issues,
        "duration_ms": ...,
        "screenshots": [...],
        "console_errors": [...],
        "api_errors": [...],
    }
```

### 4-C. 더미 데이터 시드

로그인 후 누적할 더미 데이터 목록:

```python
DUMMY_DATA = {
    "profile_tags": [
        "딥테크 백엔드", "Series B 스타트업", "B2B SaaS", "ML/AI 플랫폼", "핀테크"
    ],
    "lounge_posts": [
        {
            "category": "커리어 고민",
            "title": "시리즈 B 스타트업 CTO 제안 받았는데, 대기업 현재 TC가 더 높습니다",
            "body": "현재 대기업 Senior Engineer로 3년째 재직 중입니다. 최근 인연이 있던 Series B 스타트업에서 CTO 포지션 오퍼를 받았는데요. 기본급은 20% 낮고 스톡옵션은 있습니다. 40대 초반, 가정도 있어서 선뜻 결정이 어렵습니다. 비슷한 결정을 하신 분들의 경험이 궁금합니다."
        },
        {
            "category": "조직 갈등",
            "title": "리더십과 현장 사이 — 샌드위치 팀장의 고민",
            "body": "경영진의 방향과 팀원들의 현실이 너무 달라서 중간에서 매일 갈립니다. 위로는 설득하기 어렵고, 아래로는 모티베이션 유지해야 하는 상황. 이 상황을 어떻게 건강하게 헤쳐나가셨는지 경험 나눠주실 분 있으신가요?"
        }
    ],
    "comments": [
        {
            "post_title_keyword": "CTO 오퍼",
            "text": "스톡옵션 행사가격과 클리프 기간이 핵심입니다. 4년 베스팅 기준 클리프 1년 지나기 전 퇴사하면 아무것도 없어요. 유동성 이벤트 타임라인을 꼭 물어보세요."
        }
    ]
}
```

### 4-D. 개밥 품질 지표

각 Round 종료 후 측정:

```
📊 Dogfood Quality Metrics (Round N):

작업 완료율: N/11 시나리오 성공
평균 소요 시간: N초/시나리오
콘솔 에러: N건
API 에러: N건
레이아웃 깨짐: N건

가장 마찰 높은 시나리오:
  1위: {시나리오명} — {이유}
  2위: {시나리오명} — {이유}

예상치 못한 버그:
  - {버그 설명}
  - {버그 설명}

"실제 유저라면 이탈했을 순간" TOP 3:
  1. {상황 설명}
  2. {상황 설명}
  3. {상황 설명}
```

---

## Phase 5 : 피드백 루프 & 개선 로드맵

### 5-A. 이슈 통합 집계

모든 Phase에서 발생한 이슈를 심각도·담당 페르소나별로 집계:

```
[이슈 통합 테이블]

ID        | 페르소나 | 심각도   | 카테고리     | 이슈 요약                          | Phase
---------|---------|---------|------------|----------------------------------|-------
GAP-01   | CPO     | Critical | PRD 갭      | GNB 온보딩 중 노출 (리다이렉트 루프)  | 1
CISO-01  | CISO    | Critical | 보안        | 사용된 초대 토큰 재사용 차단 미흡     | 3
UX-01    | UR      | High     | UX 마찰     | 온보딩 진행률 0% 시작              | 3
BRAND-01 | Brand   | High     | 브랜드      | 서브페이지 디자인 시스템 미적용       | 0
CTO-01   | CTO     | Medium   | 성능        | Member Directory N+1 쿼리 의심    | 0
...
```

### 5-B. 피드백 루프 구조

```
QA 실행
  ↓
이슈 수집 (자동 분류)
  ↓
Sprint 1 / Sprint 2 / Backlog 배정
  ↓
수정 완료 → 재검증 (같은 Skill로 재실행)
  ↓
개선 확인 후 이슈 Close
  ↓
다음 Round Dogfood 실행
  ↓ (반복)
```

### 5-C. Sprint 1 액션 아이템 (PRD Phase 1 기준)

```
🔴 이번 주 즉시 수정 (Critical):
□ gnb-visibility.tsx에 /onboarding 경로 추가 (1줄 수정)
□ 온보딩 이름/LinkedIn 중복 수집 제거
□ [CISO 발견 항목] 즉시 패치

🟡 이번 Sprint:
□ 전문 분야 → 자유 태그 전환 (PROFESSIONAL_FIELDS 제거)
□ Progress bar 기입력 데이터 반영
□ Mixpanel 온보딩 이탈 이벤트 로깅 추가
□ [Brand Manager 발견 서브페이지 디자인 개선]

🟢 다음 Sprint:
□ 커뮤니티 라운지 빈 상태 디자인 개선
□ CEO Coffee Chat 계약 동의 모달 구현
□ Anti-Scraping Redis 슬라이딩 윈도우 실제 동작 검증
```

---

## 리포트 출력 형식

```markdown
# 🔍 ValueConnect X — QA Report
**버전**: {서비스 버전 또는 배포일}
**PRD 기준**: v6.0
**점검일시**: {YYYY-MM-DD HH:MM}
**Dogfood Rounds**: N회

---

## 📊 총평 스코어카드

| 페르소나 | 점수 (/10) | 핵심 발견 |
|---------|-----------|---------|
| 👑 CPO | N | {한줄 요약} |
| ⚙️ CTO | N | {한줄 요약} |
| 🔒 CISO | N | {한줄 요약} |
| 🔬 User Researcher | N | {한줄 요약} |
| 🎨 Brand Manager | N | {한줄 요약} |
| 💼 CBO | N | {한줄 요약} |
| 🖥️ UI Designer | N | {한줄 요약} |
| **종합** | **N** | {전체 한줄} |

---

## 🚨 Critical 이슈 (즉시 패치 필요)
{Critical 등급 전체 이슈}

---

## PRD v6.0 갭 요약
구현 완료: N개 / 미구현: N개 / 스펙 이탈: N개

---

## 7-Persona 상세 발견

### CPO 발견
{CPO-N 이슈 목록}

### CTO 발견
{CTO-N 이슈 목록}

### CISO 발견
{CISO-N 이슈 목록}

### User Researcher 발견
{UR-N 이슈 목록}

### Brand Manager 발견
{BRAND-N 이슈 목록}

### CBO 발견
{CBO-N 이슈 목록}

### UI Designer 발견
{UI-N 이슈 목록}

---

## 🐶 Dogfood 결과 (N Rounds)
{시나리오별 완료율, 마찰 TOP 3, 예상치 못한 버그}

---

## 🗺️ 개선 로드맵
{5-C Sprint 계획}
```

---

## 부분 실행 모드

| SCOPE 값 | 실행 내용 |
|----------|---------|
| `PRD` | Phase 0 + Phase 1 (PRD 갭만) |
| `PERSONA:CPO` | Phase 0 + CPO 관점만 |
| `PERSONA:CISO` | Phase 0 + CISO 보안 점검만 |
| `AUTH` | Phase 0 + Phase 3 (인증 여정만) |
| `DOGFOOD` | Phase 3 + Phase 4 (실 계정 루프) |
| `BRAND` | Phase 0 + Brand Manager 관점만 |
| *(기본)* | Phase 0 ~ Phase 5 전체 |

---

## 에러 처리

| 상황 | 대응 |
|------|------|
| 초대 토큰 없음 | Signup 여정 스킵, 로그인 여정만 실행 |
| 로그인 실패 | 실패 자체를 CISO+UX 이슈로 기록, Phase 4 스킵 |
| 이메일 인증 필요 | 가입 완료 불가 → Auth 이슈 기록, 로그인만 테스트 |
| Playwright 미설치 | curl + DOM 분석으로 대체, 인터랙션 테스트 제한 |
| Anti-Scraping 발동 | CISO 이슈 ✅로 기록 후 대기 후 재시도 |

---

## 참고 파일

| 파일 | 용도 |
|------|------|
| `personas/cpo.md` | CPO 세부 평가 기준 + BM 프레임워크 |
| `personas/cto.md` | CTO 기술 점검 상세 (Next.js 15, Supabase) |
| `personas/ciso.md` | CISO 보안 체크리스트 (OWASP 매핑) |
| `personas/user-researcher.md` | UR 페르소나 3종 상세 여정 |
| `personas/brand-manager.md` | VCX 디자인 토큰 + 브랜드 가이드 |
| `personas/cbo.md` | CBO 수익 모델 검증 프레임 |
| `personas/ui-designer.md` | UI 컴포넌트 심층 분석 기준 |
| `scenarios/dogfood-scripts.md` | Dogfood 시나리오 상세 스크립트 |
| `references/prd-v6.md` | PRD v6.0 요약 (갭 분석 기준) |