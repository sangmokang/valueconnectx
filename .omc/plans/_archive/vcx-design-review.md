# VCX Design Review — figma-design-prompt.md 종합 검증 분석

**Plan ID:** vcx-design-review
**Date:** 2026-03-13
**Scope:** figma-design-prompt.md vs 실제 사이트 vs PRD 5.1 교차 검증

---

## Part 1: 톤앤매너 불일치 (색상 / 폰트 / 분위기)

### 1.1 [CRITICAL] 색상 팔레트 완전 불일치

figma-design-prompt.md Section 7에서 명시한 색상이 실제 사이트와 전혀 다릅니다.

| 요소 | figma-design-prompt.md | 실제 사이트 | 심각도 |
|------|----------------------|------------|--------|
| Primary BG | Deep Navy `#0F172A` | Near-Black `#1A1A18` (Warm Charcoal, NOT Navy) | **CRITICAL** |
| Light BG | Off-White `#F1F5F9` (Cool Slate tint) | Warm Off-White `#F0EBE2` (Warm Beige tint) | **CRITICAL** |
| Accent Gold | `#EAB308` (Vivid Yellow-Gold) | `#C9A84C` (Muted Warm Gold) | **CRITICAL** |
| Secondary Text | Slate `#64748B` (Cool Blue-Gray) | `#3A3A36` (Warm Dark Gray) | **MAJOR** |
| 카드 배경 | 명시 없음 | Warm Cream `#F7F3ED` | MINOR |
| 네비게이션 BG | 명시 없음 | Warm Beige `#EDE9E1` | MAJOR |
| 푸터 BG | 명시 없음 | Dark Charcoal `#30302E` | MAJOR |
| 골드 티커 | 명시 없음 | `#B8995A` | MINOR |
| 버튼 Gold | 명시 없음 | `rgba(201,168,76,0.08)` / `rgba(201,168,76,0.15)` | MAJOR |
| Muted Text | 명시 없음 | `#B0A898` (Warm Muted) | MINOR |

**핵심 문제:** 실제 사이트는 **Warm Tone 기반** (Beige / Cream / Warm Gold / Charcoal)인데, figma-design-prompt.md는 **Cool Tone 기반** (Navy / Slate / Vivid Gold)을 지정하고 있습니다. 이대로 Figma에 적용하면 기존 사이트와 완전히 다른 톤이 됩니다.

**수정 권고:**
```
Section 7 색상 교체 필요:
- Primary BG: #0F172A → #1A1A18 (Near-Black Warm)
- Light BG: #F1F5F9 → #F0EBE2 (Warm Off-White)
- Accent Gold: #EAB308 → #C9A84C (Muted Warm Gold)
- Secondary Text: #64748B → #3A3A36 (Warm Dark Gray)
- 추가 필요: Nav BG #EDE9E1, Card BG #F7F3ED, Footer BG #30302E
- 추가 필요: Gold Ticker #B8995A, Muted Text #B0A898
- 추가 필요: Button Gold rgba(201,168,76,0.08) / hover rgba(201,168,76,0.15)
```

### 1.2 [CRITICAL] 폰트 불일치

| 요소 | figma-design-prompt.md | 실제 사이트 | 심각도 |
|------|----------------------|------------|--------|
| Headline | Playfair Display / Crimson Text (Serif) | Georgia, serif | **CRITICAL** |
| Body | Inter / Pretendard (Sans-serif) | Georgia, serif | **CRITICAL** |
| Navigation | 명시 없음 | Georgia, serif | MAJOR |

**핵심 문제:** 실제 사이트는 **전체가 Georgia serif**로 통일되어 있습니다. figma-design-prompt.md는 Headline은 다른 Serif체, Body는 Sans-serif로 지정하여 기존 톤앤매너와 완전히 다릅니다.

**수정 권고:**
```
- Headline Font: Playfair Display / Crimson Text → Georgia, serif
- Body Font: Inter / Pretendard → Georgia, serif (또는 기존 톤을 유지하면서 본문만 sans-serif 전환 시 명시적 결정 필요)
```

### 1.3 [MAJOR] 전반적 분위기 불일치

| 측면 | figma-design-prompt.md가 암시하는 분위기 | 실제 사이트 분위기 |
|------|---------------------------------------|------------------|
| 색감 | Cool, Tech-forward (Navy + Slate) | Warm, Luxurious (Beige + Gold + Cream) |
| 타이포 | Modern Mixed (Serif headline + Sans body) | Classic Unified (All Georgia serif) |
| 톤 | SaaS / Fintech 느낌 | Private Club / Luxury Membership 느낌 |

figma-design-prompt.md의 Branding.md 참조 값이 실제 사이트와 다른 것으로 보입니다. Branding.md 자체가 오래된 버전이거나, 실제 구현 시 변경된 것으로 추정됩니다.

---

## Part 2: PRD 5.1 요구사항 vs figma-design-prompt.md 매핑

### 2.1 반영 완료 항목

| PRD 요구사항 | figma-design-prompt.md 위치 | 상태 |
|-------------|---------------------------|------|
| Invite-only + Login Wall (Section 3) | Section 1.1 | OK |
| Member Types Core/Endorsed (Section 2.1) | Section 4.2, 5 | OK (Intro 권장 포함) |
| Member Directory (Section 5.2) | Section 3.2 | OK |
| Position Board (Section 5.3) | Section 2.2 | OK |
| Coffee Chat (Section 5.4) | Section 2.4 | OK (변경 없음) |
| CEO Coffee Chat + Head Hunting Agreement (Section 5.5) | Section 2.5 | OK |
| Community Board 카테고리 (Section 5.6) | Section 2.3 | OK |
| "이 회사 어때요?" 운영 정책 (Section 5.6) | Section 2.3 | OK |
| Hiring Risk Filter (Section 6) | Section 2.1 (Trust Badge), 2.6 | OK |
| Privacy Model (Section 7) | 간접 반영 ("이 회사 어때요?" 채용 불가 안내) | 부분 |

### 2.2 [MAJOR] 누락 또는 불충분 항목

#### 2.2.1 Privacy Model 시각적 표현 부재 — MAJOR

PRD Section 7은 커뮤니티/채용 데이터 분리를 명시합니다. figma-design-prompt.md에서는 "이 회사 어때요?" 카테고리의 동의 체크박스에서만 간접 언급됩니다.

**누락된 디자인:**
- 커뮤니티 게시판 전체에 "이 공간의 활동은 채용에 활용되지 않습니다" 푸터/배너 없음
- Coffee Chat 게시판에도 동일한 Privacy 안내 없음
- 멤버 프로필에서 "활동 데이터 채용 비활용" 안내 없음

**수정 권고:** 익명 게시판과 커피챗 페이지 하단에 Privacy 안내 배너 디자인 추가

#### 2.2.2 Member Profile 페이지 디자인 부재 — MAJOR

PRD 5.1 Section 5.1에서 Member Profile 구조를 상세 정의했으나 (Name, Company, Title, Field, Experience, Bio, LinkedIn, Tier, Join Date), figma-design-prompt.md에는 멤버 디렉토리의 **카드 레이아웃만** 있고 **프로필 상세 페이지** 디자인이 없습니다.

Section 3.2에서 "[프로필]" 버튼이 있으나 클릭 시 표시되는 상세 화면 디자인이 누락되었습니다.

#### 2.2.3 Anti-Scraping 경고 모달 구체화 부족 — MINOR

Section 3.2에서 "과도 조회 시 '잠시 후 다시 시도해주세요' 모달"만 언급. PRD 5.2의 4단계 제한 (경고 → 세션 종료 → 접근 제한 → IP 차단)에 대응하는 단계별 UI가 없습니다.

#### 2.2.4 멤버 디렉토리 필터에 "산업" 누락 — MINOR

PRD 5.2: 검색(이름/직군/전문분야) + 필터(직무/산업)
figma-design-prompt.md Section 3.2: 필터에 "Core/Intro" 추가 (좋음), 검색/필터 구조 OK.
하지만 PRD에는 "산업" 필터가 있는데, 와이어프레임에는 "[필터: 산업 ▾]" 표기는 있으나 Profile Structure에 Industry 필드가 없음 — PRD 자체의 gap.

#### 2.2.5 Position Board 멤버 액션 UI 불충분 — MAJOR

PRD 5.3: 멤버는 "관심 있음 / 관심 없음 / 나중에 보기" 3가지 행동 가능.
figma-design-prompt.md Section 2.2: 비로그인 상태 디자인만 상세히 다루고, **로그인 후 포지션 카드의 3가지 액션 버튼 디자인이 없습니다.** 현재 사이트의 "관심 표명" 단일 버튼에서 3가지 액션으로의 변경 디자인이 필요합니다.

#### 2.2.6 CEO 접근 제한 UI 없음 — MINOR

PRD 5.6: "CEO는 [커뮤니티 게시판에] 접근할 수 없습니다."
figma-design-prompt.md에서 CEO/Corporate User가 커뮤니티 게시판 접근 시 표시되는 차단 화면이 없습니다.

#### 2.2.7 Invite Flow UI 없음 — MAJOR

PRD Section 3: Invite Flow (추천 제출 → 검토 → 초대 이메일 → 인증 → 가입)와 Email Invite System (24시간 유효 링크)이 상세히 정의되어 있으나, figma-design-prompt.md에서는 로그인 페이지에 "초대 코드 입력"만 있고:
- 초대 이메일 디자인 없음
- 초대 수락 → 프로필 작성 흐름 없음
- 24시간 만료 안내 UI 없음

#### 2.2.8 Coffee Chat 채용 연결 원칙 안내 UI 없음 — MINOR

PRD 5.4: "Coffee Chat을 통해 채용으로 이어지는 경우 ValueConnect 소개 수수료 적용" + "Self Introduction Reward"
이에 대한 안내 UI가 커피챗 페이지에 없습니다.

---

## Part 3: 레이아웃 / 구조적 어색함

### 3.1 [MAJOR] 네비게이션 과밀

변경된 네비게이션 (비로그인):
```
ValueConnect X | 서비스 소개 ▾ | 채용 포지션 | 커피챗 🔒 | CEO Coffeechat 🔒 | 익명 게시판 🔒 | [로그인] [회원가입 →]
```

로그인 후에는 여기에 **멤버 디렉토리**도 추가되어야 합니다 (PRD 5.2 핵심 기능). 그러나 figma-design-prompt.md Section 4.1의 로그인 후 네비게이션에 "멤버 디렉토리"가 빠져 있습니다.

```
현재 (Section 4.1 로그인 후):
ValueConnect X | 서비스 소개 ▾ | 채용 포지션 | 커피챗 신청 | CEO Coffeechat N | 익명 게시판 N | [알림 🔔] [프로필]

필요 (멤버 디렉토리 추가):
ValueConnect X | 서비스 소개 ▾ | 멤버 디렉토리 | 채용 포지션 | 커피챗 | CEO Coffeechat N | 익명 게시판 N | [알림 🔔] [프로필]
```

8개 항목으로 데스크탑에서도 밀집됩니다. 모바일 대응 미언급.

**수정 권고:**
- "서비스 소개" 드롭다운에 일부 통합 검토
- 또는 "커피챗"과 "CEO Coffeechat"을 "커피챗 ▾" 드롭다운으로 통합
- 모바일 햄버거 메뉴 디자인 추가 필요

### 3.2 [MAJOR] 모바일 반응형 디자인 전면 부재

figma-design-prompt.md 전체에서 모바일 레이아웃 언급이 Section 3.2의 "1-column (Mobile)" 한 줄뿐입니다.

다음 페이지의 모바일 디자인이 필요합니다:
- 네비게이션 (햄버거 메뉴)
- 로그인 페이지
- 로그인 유도 화면 (블러 오버레이)
- 채용 포지션 카드 (블러 처리 모바일 대응)
- 익명 게시판 카테고리 탭 (7개 가로 스크롤?)
- Hiring Risk Filter 3-column → 모바일

### 3.3 [MINOR] 로그인 페이지 배경색 어색함

Section 3.1: "Deep Navy (#0F172A) 배경"으로 명시. 그러나 실제 사이트의 다크 색상은 `#1A1A18` (Warm Charcoal)입니다. Navy 배경의 로그인 페이지가 나머지 Warm Tone 사이트와 이질적일 수 있습니다.

### 3.4 [MINOR] "이 회사 어때요?" 태그 색상 톤 불일치

Section 4.3: Gold `#EAB308` 15% 배경 지정. 그러나 실제 사이트의 Gold는 `#C9A84C`입니다. 다른 카테고리의 Slate `#64748B`도 실제 사이트의 색상 체계와 다릅니다.

### 3.5 [MINOR] Hiring Risk Filter 섹션의 Red/Emerald 색상

Section 2.6: Red `#EF4444` + Emerald `#10B981` 사용. 이 색상 자체는 기능적 (위험/해결)이므로 톤앤매너 충돌은 적지만, 실제 사이트에서 이 색상들이 사용된 적이 없어 시각적 이질감 가능성 있음.

### 3.6 [MAJOR] 비로그인 네비게이션에서 멤버 디렉토리 메뉴 부재

비로그인 시 멤버 디렉토리 메뉴가 없는 것은 맞지만 (로그인 필수), 로그인 후 네비게이션에도 멤버 디렉토리가 빠져 있습니다. PRD 5.2에서 "네트워크 핵심 기능"으로 정의된 만큼 네비게이션에 반드시 포함되어야 합니다.

---

## Part 4: 종합 수정 권고 (우선순위순)

### CRITICAL (즉시 수정 — Figma 작업 전 필수)

| # | 항목 | 현재 문제 | 수정 방향 |
|---|------|---------|----------|
| C1 | Section 7 색상 팔레트 전면 교체 | Cool Tone (Navy/Slate) ≠ 실제 사이트 Warm Tone | 실제 사이트 색상으로 교체. 전체 팔레트 10색 이상 명시 |
| C2 | Section 7 폰트 교체 | Playfair/Inter ≠ 실제 Georgia serif | Georgia, serif 통일 또는 의도적 변경이면 명시적 근거 추가 |
| C3 | Section 3.1 로그인 페이지 배경색 | Navy #0F172A | #1A1A18 (Warm Charcoal)로 변경 |

### MAJOR (Phase 1 착수 전 수정)

| # | 항목 | 현재 문제 | 수정 방향 |
|---|------|---------|----------|
| M1 | 네비게이션에 멤버 디렉토리 추가 | 로그인 후 네비게이션에 멤버 디렉토리 누락 | Section 1.2, 4.1에 멤버 디렉토리 메뉴 추가 |
| M2 | Member Profile 상세 페이지 디자인 | 카드만 있고 상세 페이지 없음 | PRD 5.1 Profile Structure 기반 상세 페이지 와이어프레임 추가 |
| M3 | Position Board 로그인 후 액션 UI | "관심 있음/없음/나중에 보기" 3버튼 디자인 없음 | 포지션 카드 로그인 후 상태 디자인 추가 |
| M4 | Invite Flow UI 디자인 | 초대 이메일, 수락 흐름, 프로필 작성 없음 | 3-step 온보딩 흐름 디자인 추가 |
| M5 | 모바일 반응형 디자인 | 전면 부재 | 최소 네비게이션, 로그인, 카드 레이아웃 모바일 버전 추가 |
| M6 | Privacy Model 안내 UI | 커뮤니티/커피챗 Privacy 안내 없음 | 해당 페이지에 Privacy 안내 배너/푸터 추가 |
| M7 | 네비게이션 과밀 해결 | 8개 메뉴 항목 밀집 | 드롭다운 통합 또는 그룹핑 디자인 |

### MINOR (Phase 2에서 보완 가능)

| # | 항목 | 현재 문제 | 수정 방향 |
|---|------|---------|----------|
| m1 | Anti-Scraping 단계별 경고 UI | 4단계 제한에 1개 모달만 | 경고/세션종료/접근제한 단계별 UI 추가 |
| m2 | CEO 커뮤니티 접근 차단 화면 | 디자인 없음 | 역할 기반 접근 차단 화면 추가 |
| m3 | Coffee Chat 수수료/리워드 안내 | UI 없음 | 커피챗 페이지 하단 안내 텍스트 추가 |
| m4 | "이 회사 어때요?" 태그 Gold 색상 | #EAB308 ≠ 사이트 #C9A84C | 사이트 Gold로 통일 |
| m5 | Hiring Risk Filter Red/Emerald | 사이트에 미사용 색상 | 사이트 톤에 맞는 시맨틱 색상 검토 |
| m6 | 카드/네비게이션/푸터 배경색 명시 | Section 7에 미포함 | 전체 컬러 팔레트에 추가 |

---

## 검증 결론

### 심각도 요약

| 심각도 | 건수 | 핵심 |
|--------|------|------|
| CRITICAL | 3건 | 색상 팔레트 + 폰트 = 톤앤매너 근본 불일치 |
| MAJOR | 7건 | PRD 요구사항 누락 + 구조적 문제 |
| MINOR | 6건 | 세부 UI/색상 보완 |

### 근본 원인

figma-design-prompt.md Section 7의 "비주얼 참조"가 **Branding.md 기반**이라고 명시되어 있으나, 실제 구현된 사이트는 Branding.md와 다른 색상/폰트를 사용합니다. Branding.md가 초기 계획이었고 실제 개발 시 Warm Tone으로 변경된 것으로 추정됩니다.

**최우선 조치:** Section 7을 실제 사이트 기준으로 전면 교체한 뒤 Figma 작업을 시작해야 합니다. 현재 상태로 Figma에 반영하면 기존 사이트와 완전히 다른 디자인이 생성됩니다.
