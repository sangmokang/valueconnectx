# ValueConnect X — PRD 5.1 Figma 반영 프롬프트 가이드

> **목적**: PRD 5.1 내용을 기존 Figma 디자인에 반영하기 위한 페이지별 프롬프팅 지침
> **원칙**: 기존 디자인 톤앤매너, 키컬러, 폰트, 레이아웃을 변경하지 않고 콘텐츠만 업데이트

---

## 공통 디자인 시스템 (변경 없음, 참조용)

```
Background: #f0ebe2 (warm off-white)
Dark surface: #1a1a1a (near black)
Accent gold: #c9a84c
Body font: Georgia (serif)
UI font: system sans-serif (labels, badges)
Tone: Michelin 3-star restaurant meets premium private members club
Nav height: 60px, sticky, bottom border 1px rgba(0,0,0,0.08)
Max content width: 1100px
No gradients, no rounded corners, no drop shadows (modals 제외)
```

---

## 공통 변경사항 (모든 페이지 적용)

### GNB (Global Navigation Bar) 메뉴 구조 변경

**프롬프트:**

> 기존 GNB 메뉴 구조를 유지하되, 다음 용어를 변경하라. 디자인 스타일(높이, 배경색, 폰트 크기, 골드 언더라인 등)은 그대로 유지한다.
>
> **메뉴 항목 변경:**
> - "서비스 소개" 드롭다운 유지 → 하위: 서비스 소개 / Member Directory / Benefit
> - "커피챗 신청" → "Coffee Chat" 으로 변경
> - "CEO Coffeechat" → "CEO Coffee Chat" 으로 변경 (띄어쓰기)
> - "익명 게시판" → "Community Board" 로 변경
> - "채용 포지션" → "Position Board" 로 변경
>
> **우측 버튼:**
> - "회원가입 →" 버튼 텍스트를 "초대 확인하기 →" 로 변경 (Invite-only 모델 반영)
> - "로그인" 텍스트 유지

---

## 페이지 1: 서비스 소개 (Service Overview)

### 변경 요약
- Hero 카피 수정 (PRD 5.1 핵심 메시지 반영)
- Five Pillars 서비스 항목 내용 업데이트 (PRD 5.1 기능 기준)
- "INTRO" 용어를 "Endorsed" 로 전체 변경
- Closing CTA 문구 업데이트

**프롬프트:**

> 서비스 소개 페이지의 기존 레이아웃과 디자인을 그대로 유지하면서 다음 콘텐츠를 업데이트하라.
>
> **HERO 섹션:**
> - 상단 라벨: "SERVICE OVERVIEW · PRIVATE TALENT NETWORK" 로 변경
> - H1: "검증된 인재와" (1줄) + "기업 리더를 연결하다" (2줄, gold italic) 로 변경
> - 좌측 본문 텍스트:
>   - 1단락: "현재 채용 시장에는 후보자의 커리어에 부정적 영향을 미치는 구조적 리스크가 존재합니다. 경영자 리스크, 회사 리스크, 채용 채널 리스크 — ValueConnect X는 이 모든 필터를 통과한 연결만을 제공합니다."
>   - 2단락: "Selective Hiring × Selective Talent. 기업은 더 적은 인원으로 높은 성과를 요구하고 있으며, 핵심 인재 역시 아무 기업과도 매칭되지 않습니다."
> - 우측 통계 박스 "WHY THIS EXISTS":
>   - 항목 1: "경영자 리스크 — 비전 불일치, 과장된 채용 조건" / "필터링"
>   - 항목 2: "회사 리스크 — 재무 불안정, 조직 문화 괴리" / "검증"
>   - 항목 3: "채용 채널 리스크 — 후보자 정보 무단 유통" / "차단"
>
> **FIVE PILLARS 서비스 블록** (기존 5개 블록 레이아웃 유지, 내용 교체):
>
> 블록 01 — "MEMBER DIRECTORY"
> - 제목: "검증된 핵심인재 디렉토리"
> - 설명: "Core Member와 Endorsed Member로 구성된 폐쇄형 인재 네트워크. 이름, 직군, 전문 분야로 검색하고, Member Profile을 통해 커리어 신뢰를 확인할 수 있습니다."
> - Insight: "Anti-Scraping 정책으로 멤버 정보를 보호합니다. 1분 내 10 프로필 조회 시 경고, 20 프로필 조회 시 세션 종료, 하루 50 프로필 조회 시 접근 제한."
>
> 블록 02 — "POSITION BOARD"
> - 제목: "검증된 포지션만 게시"
> - 설명: "기업이 직접 포지션을 등록하지 않습니다. CEO/HR 구두 동의 후 ValueConnect Admin이 내부 검증을 거쳐 등록합니다. 검증되지 않은 포지션은 게시하지 않습니다."
> - Insight: "멤버는 관심 있음 / 관심 없음 / 나중에 보기로 반응할 수 있습니다. 포지션 관심 데이터만 채용에 활용되며, 커뮤니티 활동 데이터는 채용에 절대 활용되지 않습니다."
>
> 블록 03 — "CEO COFFEE CHAT"
> - 제목: "의사결정자와의 직접 채널"
> - 설명: "CEO/Founder/C-Level이 직접 세션을 생성하고, 멤버가 신청하며, CEO가 선택하는 1:1 Coffee Chat. 세션 생성 시 약식 헤드헌팅 계약 조건에 동의해야 합니다."
> - Insight: "채용이 발생할 경우 ValueConnect 소개 수수료가 적용됩니다. VCX Network를 우회하는 행동을 방지하는 구조입니다."
>
> 블록 04 — "COMMUNITY BOARD"
> - 제목: "멤버 전용 익명 커뮤니티"
> - 설명: "커리어 고민, 조직 고민·리더쉽, 연봉 협상, 번아웃, 생산성·News, '이 회사 어때요?' 등 6개 카테고리. CEO는 접근할 수 없습니다."
> - Insight: "모든 커뮤니티 글은 채용 활용이 불가합니다(Privacy Model). 사실 기반 정보만 허용되며, 가이드라인 위반 글은 Admin이 즉시 삭제합니다."
>
> 블록 05 — "PEER COFFEE CHAT"
> - 제목: "멤버 간 신뢰 기반 연결"
> - 설명: "사연을 올리면 비밀 댓글로 신청받고, 작성자가 직접 선택하는 P2P 연결. 커리어 대화뿐 아니라 채용을 전제로 한 Coffee Chat도 가능합니다."
> - Insight: "Coffee Chat을 통해 채용으로 이어지는 경우, 해당 채용은 ValueConnect의 소개·알선 구조를 통해 진행됩니다. Self Introduction Reward 지급."
>
> **CLOSING 섹션 (OUR THESIS):**
> - 인용문: "후보자 보호가 최우선 원칙입니다. 검증되지 않은 포지션은 게시하지 않으며, 부정적 요소가 확인된 기업은 네트워크에서 제외합니다."
> - CTA 버튼 1: "Member Directory 보기 →" (골드 배경)
> - CTA 버튼 2: "멤버 혜택 확인하기" (골드 테두리)

---

## 페이지 2: Member Directory (기존 "멤버 소개")

### 변경 요약
- 페이지 타이틀을 "Member Directory"로 변경
- 멤버 카드에 PRD 5.1 Profile Structure 반영
- "MEMBER" 뱃지를 "CORE" / "ENDORSED"로 구분
- LinkedIn URL 필드 추가

**프롬프트:**

> 멤버 소개 페이지의 기존 레이아웃(Hero + 검색 + 카드 리스트)을 유지하면서 다음을 변경하라.
>
> **HERO 섹션:**
> - 라벨: "MEMBER DIRECTORY · PRIVATE NETWORK" 로 변경
> - H1: "Member Directory" 로 변경
> - 본문: "ValueConnect X의 검증된 핵심 인재 네트워크입니다. Core Member와 Endorsed Member로 구성되며, 모든 멤버는 LinkedIn 인증을 통해 커리어 신뢰를 확보합니다."
>
> **검색 영역:**
> - 검색 placeholder: "이름, 직군, 전문 분야로 검색..." 으로 변경
> - 필터 버튼 추가: "전체" / "Core" / "Endorsed" (기존 커피챗 게시판의 필터 스타일과 동일하게)
> - "+ 내 소개 작성" 버튼 제거 (Invite-only이므로 자체 가입 불가)
>
> **멤버 카드 구조 업데이트** (기존 카드 레이아웃 유지):
> - 뱃지: "MEMBER" → "CORE" (골드 텍스트, 다크 배경) 또는 "ENDORSED" (회색 텍스트, 연한 배경)
> - Endorsed 멤버 카드에 "추천: [Core Member 이름]" 라벨 추가 (12px, #888)
> - 카드 내 정보 항목:
>   - Name (실명)
>   - Current Company + Title
>   - Professional Field (전문 분야 태그)
>   - Years of Experience 표시 추가 ("경력 N년", 11px, #999)
>   - Bio (자기소개, 기존 intro와 동일)
>   - LinkedIn 아이콘 + 링크 (작은 외부 링크 아이콘, #c9a84c 색상)
>   - Member Tier (Core / Endorsed)
>   - Join Date
>
> **Anti-Scraping 안내 배너** (카드 리스트 상단에 추가):
> - 기존 디자인 톤에 맞춰, 연한 배경(#f7f3ed)에 1px 테두리, 좌측에 2px 골드 보더
> - 텍스트: "멤버 정보 보호를 위해 프로필 조회에 제한이 적용됩니다." (12px, #888)

---

## 페이지 3: Benefit

### 변경 요약
- "INTRO" 용어를 "ENDORSED"로 전체 변경
- Self Introduction Reward 내용 PRD 5.1 기준으로 수정
- 구체적 금액(500만원) 제거, 원칙 기반 설명으로 교체
- Endorsed Member 혜택 내용 PRD 5.1 기준 업데이트

**프롬프트:**

> Benefit 페이지의 기존 레이아웃(Hero + 탭 + 카드 그리드 + CTA)을 그대로 유지하면서 다음 콘텐츠를 변경하라.
>
> **HERO 섹션:**
> - 좌측 카피: 변경 없음 (기존 유지)
> - 우측 reward highlight 박스 3개 항목 변경:
>   - "셀프 소개 보상" / "500만원" → "셀프 소개 보상" / "Self Intro Reward" 로 변경 (구체적 금액 제거)
>   - "추천 성사 리워드" / "수수료 20%" → 유지
>   - "독점 데이터" / "월간 제공" → "Community Board" / "전체 접근" 으로 변경
>
> **탭 변경:**
> - "INTRO 소개인재" → "ENDORSED 추천인재" 로 변경
> - CORE 탭은 그대로 유지
>
> **CORE 멤버 혜택 카드 수정:**
>
> 카드 1 (하이라이트): "셀프 소개 보상"
> - 금액: "Self Introduction Reward" 로 변경 (구체적 금액 제거)
> - 설명: "멤버가 본인을 직접 추천하여 채용이 성사될 경우, Self Introduction Reward를 지급합니다. VCX Network의 파트너십 구조입니다."
> - 상세: "Coffee Chat 이후 채용 성사 시에도 ValueConnect 소개 수수료가 적용됩니다."
>
> 카드 2 (하이라이트): "지인 추천 리워드"
> - 설명 유지하되 "Core Member가 추천한 인재(Endorsed Member)가 채용 성사될 경우" 로 명확화
>
> 카드 3: "Position Board 우선 접근"
> - 제목 변경: "검증된 포지션 열람"
> - 설명: "ValueConnect Admin이 검증하여 등록한 포지션만 게시됩니다. 관심 있음 / 관심 없음 / 나중에 보기로 반응할 수 있습니다."
> - "AI 매치 스코어" 관련 문구 제거 (PRD 5.1에 AI 매칭 없음)
>
> 카드 4: "핵심인재 커피챗 네트워크" → 유지
>
> 카드 5: "CEO Coffee Chat" → "CEO 세션 신청" 으로 변경
> - 설명: "CEO/Founder/C-Level이 직접 생성한 세션에 신청할 수 있습니다. 채용·네트워크 목적 모두 가능."
>
> 카드 6: "독점 시장 분석 데이터" → "Community Board 전체 접근" 으로 교체
> - 설명: "6개 카테고리(커리어 고민, 조직 고민·리더쉽, 연봉 협상, 번아웃, 생산성·News, '이 회사 어때요?')에 글 작성 및 열람 권한."
>
> **ENDORSED 멤버 혜택 카드 수정:**
>
> 카드 1 (하이라이트): "추천 구조"
> - 설명: "Core Member의 추천으로 가입합니다. 추천한 Core Member는 1차 신뢰 보증 역할을 합니다. ValueConnect 검토 후 초대 기반으로 가입이 진행됩니다."
>
> 카드 2: "Coffee Chat 신청 권한"
> - 유지하되 "Core 전환 후" → "향후 Core Member 심사를 통해" 로 변경
>
> 카드 3: "Position Board 열람"
> - "AI 매치 스코어" 문구 제거
> - "검증된 포지션을 열람하고 관심 표명할 수 있습니다." 로 변경
>
> 카드 4: "Core 멤버 소개 권한" → 유지
>
> **하단 CTA 변경:**
> - 좌측 블록: "초대 확인하기 →" 로 버튼 텍스트 변경
> - 우측 블록: "추천하기 →" 유지

---

## 페이지 4: Coffee Chat (기존 "커피챗 신청")

### 변경 요약
- 수수료 원칙, Self Introduction Reward 안내 추가
- 채용 연결 원칙 명시
- Badge "INTRO" → "ENDORSED" 변경

**프롬프트:**

> 커피챗 신청 페이지의 기존 레이아웃(Hero + 게시판 + 모달)을 그대로 유지하면서 다음을 변경하라.
>
> **HERO 섹션:**
> - 라벨: "COFFEE CHAT · PRIVATE NETWORK" 로 변경
> - H1 유지: "연결은 밀도가 만든다" (변경 없음)
> - 본문 2단락 뒤에 추가 문구 삽입:
>   "Coffee Chat을 통해 채용으로 이어지는 경우, ValueConnect의 소개·알선 구조를 통해 진행됩니다."
>   (15px, bold, #1a1a1a)
>
> **우측 HOW IT WORKS** (기존 3단계 유지, 내용 미세 수정):
> - Step 01: 유지
> - Step 02: 유지
> - Step 03 설명 끝에 추가: "채용 연결 시 ValueConnect 소개 수수료가 적용됩니다."
>
> **게시판 섹션:**
> - 필터 버튼: "INTRO" → "ENDORSED" 로 변경
> - 포스트 카드 뱃지: "INTRO" → "ENDORSED" (동일한 스타일: #e8e2d9 배경, #666 텍스트)
>
> **게시판 하단에 안내 배너 추가** (기존 디자인 톤 유지):
> - 배경 #f7f3ed, 좌측 2px 골드 보더, padding 20px 24px
> - 아이콘 + 텍스트 레이아웃
> - 제목: "Self Introduction Reward" (14px, bold)
> - 설명: "본인이 직접 추천하여 채용이 성사될 경우, Self Introduction Reward를 지급합니다." (13px, #666)
>
> **작성 모달 / 상세 모달:**
> - 변경 없음 (기존 유지)

---

## 페이지 5: CEO Coffee Chat (신규 페이지 또는 기존 확장)

### 변경 요약
- PRD 5.1 CEO Coffee Chat 기능 전체 반영
- Head Hunting Agreement 동의 플로우 추가
- Corporate User 대상 명시

**프롬프트:**

> CEO Coffee Chat 페이지를 기존 디자인 시스템에 맞춰 구성하라. 커피챗 신청 페이지와 동일한 레이아웃 패턴을 따른다.
>
> **HERO 섹션** (커피챗 Hero와 동일한 구조):
> - 라벨: "CEO COFFEE CHAT · EXECUTIVE ACCESS"
> - H1: "의사결정자와" (1줄) + "직접 만나다" (2줄, gold italic)
> - 본문: "CEO/Founder/C-Level이 직접 세션을 생성하고, 멤버가 신청하며, CEO가 선택하는 1:1 Coffee Chat입니다. 채용 공고가 담지 못하는 것들 — 조직의 언어, 리더십의 결, 암묵적 기대치를 직접 확인할 수 있습니다."
>
> **우측 HOW IT WORKS** (커피챗 3단계와 동일 구조):
> - Step 01 "CEO SESSION FLOW": "CEO가 세션을 생성한다" — "Series A 스타트업, Product Leader와 대화하고 싶습니다 — 와 같은 형식으로 세션을 공개합니다."
> - Step 02 "MEMBER APPLY": "멤버가 신청한다" — "관심 있는 멤버가 세션에 신청합니다. CEO가 프로필을 검토합니다."
> - Step 03 "CEO SELECTS": "CEO가 선택하고 연결" — "CEO가 대화할 멤버를 직접 선택합니다. 1:1 Coffee Chat이 진행됩니다."
>
> **세션 목록 섹션** (커피챗 게시판과 유사한 카드 레이아웃):
> - 섹션 제목: "CEO Coffee Chat Sessions" + "기업 의사결정자가 직접 참여하는 세션입니다." (13px, #888)
> - 필터 없음 (전체 세션 리스트)
>
> **세션 카드 구조** (포스트 카드와 동일한 스타일):
> - 좌측: CEO 뱃지 ("CEO" = #c9a84c 배경, #1a1a1a 텍스트) + 이름 · 회사명 (12.5px, #888)
> - 제목: 세션 주제 (18px bold)
> - 설명: 찾고 있는 인재 요건 (13.5px, #555)
> - 우측: 날짜 + "신청 N건" 표시
>
> **Head Hunting Agreement 배너** (세션 목록 상단):
> - 배경 #1a1a1a, 골드 상단 2px 보더
> - 제목: "Head Hunting Agreement" (14px, gold)
> - 설명: "CEO Coffee Chat을 통해 채용이 발생할 경우, ValueConnect 소개 수수료가 적용됩니다. 세션 생성 시 약식 헤드헌팅 계약 조건에 동의해야 합니다." (13px, #999)
>
> **세션 상세 모달** (기존 커피챗 Detail 모달과 동일 스타일):
> - CEO 정보 (회사, 직함)
> - 세션 주제 + 찾는 인재 요건 전문
> - "세션 신청하기 →" 버튼

---

## 페이지 6: Community Board (기존 "익명 게시판")

### 변경 요약
- 6개 카테고리 탭 반영
- "이 회사 어때요?" 카테고리 특별 운영 정책 표시
- CEO 접근 불가 안내
- Privacy Model 안내 배너

**프롬프트:**

> 익명 게시판 페이지를 기존 디자인 시스템에 맞춰 구성하라. 커피챗 신청 페이지와 동일한 레이아웃 패턴(Hero + 게시판)을 따른다.
>
> **HERO 섹션:**
> - 라벨: "COMMUNITY BOARD · MEMBERS ONLY"
> - H1: "평가 없는" (1줄) + "솔직한 대화" (2줄, gold italic)
> - 본문: "커리어의 고민, 연봉 협상의 불안, 조직 내 갈등 — 실명으로는 말할 수 없는 것들이 있습니다. 멤버 인증된 공간에서, 평가 없이 집단 지성이 작동합니다."
> - 추가 안내: "CEO/기업 사용자는 이 게시판에 접근할 수 없습니다." (13px, #c9a84c, bold)
>
> **카테고리 필터 탭** (기존 필터 버튼 스타일 확장):
> - "전체" / "커리어 고민" / "조직 고민·리더쉽" / "연봉 협상" / "번아웃" / "생산성·News" / "이 회사 어때요?"
> - 활성 탭: 기존 스타일 (#1a1a1a filled)
> - "이 회사 어때요?" 탭에만 작은 안내 아이콘 표시
>
> **게시판 카드** (커피챗 포스트 카드와 동일한 구조):
> - 뱃지: 카테고리명 (10px uppercase)
> - 작성자: 익명 표시 (예: "익명 멤버")
> - 제목 + 본문 미리보기 + 태그
> - 우측: 날짜 + 댓글 수
>
> **"이 회사 어때요?" 카테고리 진입 시 안내 배너:**
> - 배경 #f7f3ed, 좌측 2px 골드 보더
> - 제목: "운영 정책 안내" (13px, bold)
> - 내용:
>   - "사실 기반 정보만 허용됩니다."
>   - "감정적 비방 및 근거 없는 주장은 금지됩니다."
>   - "이 카테고리의 모든 글은 채용 활용 불가합니다." (bold)
>   - "가이드라인 위반 글은 Admin이 즉시 삭제합니다."
>
> **Privacy Model 안내** (게시판 하단 고정 배너):
> - 배경 #1a1a1a, padding 20px 32px
> - "PRIVACY" 라벨 (10px, gold, uppercase)
> - "커뮤니티 글, Coffee Chat 글, 활동 데이터는 채용에 활용되지 않습니다. 포지션 관심 데이터만 채용에 활용됩니다." (13px, #999)

---

## 페이지 7: Position Board (기존 "채용 포지션")

### 변경 요약
- PRD 5.1 Position Board 전체 반영
- Admin 등록 방식 안내
- 포지션 정보 구조 반영
- 멤버 반응(관심/비관심/나중에) 인터랙션

**프롬프트:**

> 채용 포지션 페이지를 기존 디자인 시스템에 맞춰 구성하라. 커피챗 게시판과 동일한 레이아웃 패턴을 따른다.
>
> **HERO 섹션:**
> - 라벨: "POSITION BOARD · VERIFIED ONLY"
> - H1: "검증된 포지션만" (1줄) + "게시합니다" (2줄, gold italic)
> - 본문: "기업이 직접 포지션을 등록하지 않습니다. CEO/HR 구두 동의 후 ValueConnect Admin이 내부 검증을 거쳐 등록합니다. 검증되지 않은 포지션은 게시하지 않으며, 부정적 요소가 확인된 기업은 네트워크에서 제외합니다."
>
> **등록 프로세스 안내** (Hero 우측, 커피챗 HOW IT WORKS와 동일한 3단계 구조):
> - Step 01 "AGREEMENT": "CEO/HR 구두 동의" — "기업 의사결정자가 포지션 정보를 ValueConnect에 공유합니다."
> - Step 02 "VERIFICATION": "내부 검증" — "ValueConnect Admin이 기업과 포지션을 검증하고 등록합니다."
> - Step 03 "PUBLISH": "Board 게시" — "검증을 통과한 포지션만 Position Board에 게시됩니다."
>
> **포지션 카드** (커피챗 포스트 카드와 유사한 구조):
> - 좌측:
>   - 회사명 (뱃지 스타일, #1a1a1a 배경, #c9a84c 텍스트)
>   - 포지션명 (18px bold)
>   - 주요 역할 설명 (13.5px, #555)
>   - 태그: 조직 규모 / 연봉 밴드 (선택적 표시)
> - 우측:
>   - 등록일
>   - 3개 반응 버튼 (수직 배치):
>     - "관심 있음" (골드 테두리 버튼)
>     - "관심 없음" (연한 회색 버튼)
>     - "나중에 보기" (텍스트 링크)
>
> **포지션 상세 모달** (기존 커피챗 Detail 모달과 동일 스타일):
> - 포지션 정보 전체:
>   - 회사명
>   - 포지션 (직무)
>   - 조직 규모 (팀 규모)
>   - 주요 역할
>   - 연봉 밴드 (있는 경우만)
> - 하단: 3개 반응 버튼 (가로 배치)

---

## 페이지 8: 회원가입 / 초대 인증 (신규 페이지)

### 변경 요약
- Invite-only 가입 플로우 반영
- Email Invite System 구현
- Member Profile 작성 폼

**프롬프트:**

> 초대 기반 회원가입 페이지를 기존 디자인 시스템에 맞춰 새로 구성하라. 작성 모달의 디자인 톤을 따른다.
>
> **Step 1: 초대 확인 페이지**
> - 중앙 정렬 레이아웃, 최대 너비 540px
> - 상단: 골드 라인 + "INVITE VERIFICATION" 라벨
> - H1: "초대를 확인합니다" (28px, bold)
> - 설명: "ValueConnect X는 Invite-only Network입니다. 초대 링크를 통해 인증을 진행해 주세요." (15px, #666)
> - 이메일 입력 필드 (기존 모달 입력 스타일)
> - "초대 확인하기 →" 버튼 (#1a1a1a, 전체 너비)
> - 하단 안내: "초대 링크는 24시간 유효합니다." (12px, #999)
>
> **Step 2: 프로필 작성 페이지**
> - 동일한 중앙 정렬 레이아웃
> - 상단: 골드 라인 + "MEMBER PROFILE" 라벨
> - H2: "프로필 작성" (24px, bold)
> - 설명: "네트워크 참여를 위해 프로필을 작성해 주세요." (13.5px, #888)
> - 입력 필드 (모두 기존 모달 input 스타일):
>   - 이름 (Name) — 실명, 필수
>   - 현재 회사 (Current Company) — 필수
>   - 직함 (Title) — 필수
>   - 전문 분야 (Professional Field) — 태그 입력, 필수
>   - 총 경력 (Years of Experience) — 숫자 입력, 필수
>   - 자기소개 (Bio) — textarea, 필수
>   - LinkedIn URL — 필수, 안내 텍스트 "커리어 검증 및 네트워크 신뢰 확보를 위해 필요합니다."
> - "가입 완료하기 →" 버튼
> - 하단: "입력하신 정보는 Member Directory에 공개됩니다." (12px, #999)

---

## 페이지 9: Hiring Risk Filter 소개 (서비스 소개 하위 또는 독립 섹션)

### 변경 요약
- PRD 5.1 Section 6 "Hiring Risk Filter" 내용을 시각화

**프롬프트:**

> 서비스 소개 페이지의 CLOSING 섹션 바로 위에 "Hiring Risk Filter" 섹션을 추가하라. 기존 Five Pillars 블록과는 다른, 별도의 시각적 구분이 되는 섹션으로 디자인한다.
>
> **레이아웃**: 전체 너비 #1a1a1a 배경, padding 80px, 내부 max-width 1100px
>
> **상단:**
> - 골드 라인 + "HIRING RISK FILTER" 라벨 (10px, gold, uppercase)
> - H2: "후보자 보호가 최우선입니다" (32px, #f0ebe2, bold)
> - 설명: "현재 채용 시장의 구조적 리스크를 사전에 필터링하여, 후보자가 최선의 선택을 할 수 있도록 합니다." (15px, #b0a898)
>
> **3열 그리드** (기존 서비스 블록 스타일 응용):
>
> 열 1: "경영자 리스크 필터"
> - 아이콘: ◈
> - 리스크: "비전 불일치, 불투명한 의사결정, 과장된 채용 조건"
> - 필터링: "CEO/Founder 직접 참여, 세션 기반 신뢰 확인"
> - 상단 2px 골드 보더
>
> 열 2: "회사 리스크 필터"
> - 아이콘: ◉
> - 리스크: "재무 불안정, 조직 문화 괴리, 성장 정체"
> - 필터링: "Admin 내부 등록 방식, 포지션 품질 관리"
> - 상단 2px 골드 보더
>
> 열 3: "채용 채널 리스크 필터"
> - 아이콘: ◎
> - 리스크: "과장된 포지션 정보, 후보자 정보 무단 유통, 무분별한 매칭"
> - 필터링: "Invite-only 구조, 멤버 정보 보호, Anti-Scraping"
> - 상단 2px 골드 보더
>
> **하단 안내:**
> - "부정적 요소가 확인된 기업은 네트워크에서 제외합니다. 멤버 피드백을 기반으로 필터링 기준을 지속 개선합니다." (13px, #666, italic)

---

## 변경 사항 요약 매트릭스

| 페이지 | 변경 유형 | 핵심 변경 내용 |
|--------|----------|--------------|
| GNB (공통) | 수정 | 메뉴명 변경, "초대 확인하기" 버튼 |
| 서비스 소개 | 대규모 수정 | Hero 카피, Five Pillars 내용 전체 교체, Hiring Risk Filter 섹션 추가 |
| Member Directory | 수정 | 타이틀 변경, Profile 구조 업데이트, ENDORSED 뱃지, Anti-Scraping 안내 |
| Benefit | 수정 | INTRO→ENDORSED, AI매칭 제거, 카드 내용 PRD 5.1 기준 업데이트 |
| Coffee Chat | 소규모 수정 | INTRO→ENDORSED, 채용 연결 원칙/수수료 안내 추가 |
| CEO Coffee Chat | 신규/확장 | 전체 페이지 신규 구성, Head Hunting Agreement 배너 |
| Community Board | 신규/확장 | 6개 카테고리 탭, Privacy Model 안내, "이 회사 어때요?" 정책 |
| Position Board | 신규/확장 | Admin 등록 방식 안내, 포지션 카드, 3종 반응 버튼 |
| 회원가입/초대 | 신규 | Invite-only 인증 플로우, Profile 작성 폼 |

---

## 적용 시 주의사항

1. **디자인 톤 유지**: 모든 변경은 기존 #f0ebe2 / #1a1a1a / #c9a84c 컬러 팔레트 내에서만 진행
2. **폰트 유지**: Georgia serif (본문) + system sans-serif (라벨/뱃지) 조합 변경 없음
3. **레이아웃 패턴 재사용**: 신규 페이지는 기존 커피챗 신청 페이지의 Hero + 게시판 + 모달 패턴을 그대로 차용
4. **용어 통일**: "INTRO" → "ENDORSED" 전체 일괄 변경
5. **AI 매칭 관련 제거**: PRD 5.1에 AI 매칭 엔진 없음, 관련 문구 전체 제거
6. **Invite-only 강조**: 자체 가입 불가, 초대 기반 인증 흐름 일관성 유지
