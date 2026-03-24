# 서비스 소개 (Service Overview) Page Spec & AC

## 1. Overview

ValueConnect X의 랜딩/서비스 소개 페이지. PRD 5.1의 핵심 메시지와 5대 서비스 기둥을 소개하며, Hiring Risk Filter 개념을 전달합니다.

---

## 2. Page Structure

```
[GNB]
[Hero Section]
  ├─ Left: 카피 + CTA
  └─ Right: WHY THIS EXISTS (3 리스크 필터링)
[Five Pillars Section]
  ├─ Block 01: Member Directory
  ├─ Block 02: Position Board
  ├─ Block 03: CEO Coffee Chat
  ├─ Block 04: Community Board
  └─ Block 05: Peer Coffee Chat
[Closing Section (OUR THESIS)]
  ├─ 인용문
  └─ 2 CTAs
[Footer]
```

---

## 3. Hero Section

### Layout

| Property | Value |
|----------|-------|
| Background | `#f0ebe2` |
| Padding | `80px 0 60px` |
| Max-width | `1100px`, centered |
| Grid | 2-column, left 55% / right 45%, gap 48px |

### Left Column

#### Label Row
| Property | Value |
|----------|-------|
| Gold line | 32px wide, 1.5px height, `#c9a84c` |
| Text | "SERVICE OVERVIEW · PRIVATE TALENT NETWORK" |
| Font | sans-serif, 10px uppercase, letter-spacing 0.22em |
| Color | `#c9a84c` |

#### H1 Headline
| Property | Value |
|----------|-------|
| Line 1 | "검증된 인재와" |
| Line 2 | "기업 리더를 연결하다" (italic, gold `#c9a84c`) |
| Font | Georgia serif, 52px, weight 800 |
| Letter-spacing | -2px |

#### Body Text
- **Paragraph 1**: "현재 채용 시장에는 후보자의 커리어에 부정적 영향을 미치는 구조적 리스크가 존재합니다. 경영자 리스크, 회사 리스크, 채용 채널 리스크 — ValueConnect X는 이 모든 필터를 통과한 연결만을 제공합니다."
  - "경영자 리스크, 회사 리스크, 채용 채널 리스크"는 bold 처리
- **Paragraph 2**: "Selective Hiring × Selective Talent. 기업은 더 적은 인원으로 높은 성과를 요구하고 있으며, 핵심 인재 역시 아무 기업과도 매칭되지 않습니다."
  - "Selective Hiring × Selective Talent"는 bold 처리
- Font: 15px, line-height 1.85, color `#444444`

#### CTA Button
| Property | Value |
|----------|-------|
| Text | "Member Directory 보기 →" |
| Background | `#1a1a1a` |
| Text color | `#f0ebe2` |
| Font | sans-serif, 14px |
| Padding | `14px 28px` |
| Border-radius | 0px |
| Link | `/members` |

### Right Column: WHY THIS EXISTS

#### Structure
- 상단에 `1.5px solid #c9a84c` gold line
- 3개 row, 각 row 사이 `1px solid rgba(0,0,0,0.08)` divider

#### Row Data

| # | Label | Title | Description | Badge |
|---|-------|-------|-------------|-------|
| 01 | RISK FILTER | 경영자 리스크 | 비전 불일치, 과장된 채용 조건 | 필터링 |
| 02 | RISK FILTER | 회사 리스크 | 재무 불안정, 조직 문화 괴리 | 검증 |
| 03 | RISK FILTER | 채용 채널 리스크 | 후보자 정보 무단 유통 | 차단 |

#### Row Style
| Element | Style |
|---------|-------|
| Step number + label | 10px uppercase, gold `#c9a84c`, sans-serif |
| Title | 18px bold, serif |
| Description | 13.5px, `#666666`, line-height 1.7, serif |
| Badge | 10px uppercase, gold, 1px gold border pill |

---

## 4. Five Pillars Section

### Layout

| Property | Value |
|----------|-------|
| Max-width | `1100px`, centered |
| Padding | `80px 48px` |
| Section title | "FIVE PILLARS" label + "ValueConnect X의 핵심 서비스" H2 |

### Block Template (각 블록 공통)

| Property | Value |
|----------|-------|
| Background | `#f7f3ed` |
| Left border | `2px transparent` → hover: `3px solid #c9a84c` |
| Padding | `32px 36px` |
| Margin-bottom | `16px` |
| Hover | bg → `#ebe5da`, translateX(4px) |

### Five Blocks Data

#### Block 01 — MEMBER DIRECTORY
| Field | Content |
|-------|---------|
| Number | 01 |
| Label | MEMBER DIRECTORY |
| Title | 검증된 핵심인재 디렉토리 |
| Description | Core Member와 Endorsed Member로 구성된 폐쇄형 인재 네트워크. 이름, 직군, 전문 분야로 검색하고, Member Profile을 통해 커리어 신뢰를 확인할 수 있습니다. |
| Insight | Anti-Scraping 정책으로 멤버 정보를 보호합니다. 1분 내 10 프로필 조회 시 경고, 20 프로필 조회 시 세션 종료, 하루 50 프로필 조회 시 접근 제한. |

#### Block 02 — POSITION BOARD
| Field | Content |
|-------|---------|
| Number | 02 |
| Label | POSITION BOARD |
| Title | 검증된 포지션만 게시 |
| Description | 기업이 직접 포지션을 등록하지 않습니다. CEO/HR 구두 동의 후 ValueConnect Admin이 내부 검증을 거쳐 등록합니다. 검증되지 않은 포지션은 게시하지 않습니다. |
| Insight | 멤버는 관심 있음 / 관심 없음 / 나중에 보기로 반응할 수 있습니다. 포지션 관심 데이터만 채용에 활용되며, 커뮤니티 활동 데이터는 채용에 절대 활용되지 않습니다. |

#### Block 03 — CEO COFFEE CHAT
| Field | Content |
|-------|---------|
| Number | 03 |
| Label | CEO COFFEE CHAT |
| Title | 의사결정자와의 직접 채널 |
| Description | CEO/Founder/C-Level이 직접 세션을 생성하고, 멤버가 신청하며, CEO가 선택하는 1:1 Coffee Chat. 세션 생성 시 약식 헤드헌팅 계약 조건에 동의해야 합니다. |
| Insight | 채용이 발생할 경우 ValueConnect 소개 수수료가 적용됩니다. VCX Network를 우회하는 행동을 방지하는 구조입니다. |

#### Block 04 — COMMUNITY BOARD
| Field | Content |
|-------|---------|
| Number | 04 |
| Label | COMMUNITY BOARD |
| Title | 멤버 전용 익명 커뮤니티 |
| Description | 커리어 고민, 조직 고민·리더쉽, 연봉 협상, 번아웃, 생산성·News, '이 회사 어때요?' 등 6개 카테고리. CEO는 접근할 수 없습니다. |
| Insight | 모든 커뮤니티 글은 채용 활용이 불가합니다(Privacy Model). 사실 기반 정보만 허용되며, 가이드라인 위반 글은 Admin이 즉시 삭제합니다. |

#### Block 05 — PEER COFFEE CHAT
| Field | Content |
|-------|---------|
| Number | 05 |
| Label | PEER COFFEE CHAT |
| Title | 멤버 간 신뢰 기반 연결 |
| Description | 사연을 올리면 비밀 댓글로 신청받고, 작성자가 직접 선택하는 P2P 연결. 커리어 대화뿐 아니라 채용을 전제로 한 Coffee Chat도 가능합니다. |
| Insight | Coffee Chat을 통해 채용으로 이어지는 경우, 해당 채용은 ValueConnect의 소개·알선 구조를 통해 진행됩니다. Self Introduction Reward 지급. |

---

## 5. Closing Section (OUR THESIS)

### Layout

| Property | Value |
|----------|-------|
| Background | `#1a1a1a` |
| Padding | `80px 48px` |
| Max-width | `1100px`, centered |
| Text align | center |

### Content

#### Label
- "OUR THESIS" — 10px uppercase, `#c9a84c`, letter-spacing 0.22em

#### Quote
- "후보자 보호가 최우선 원칙입니다. 검증되지 않은 포지션은 게시하지 않으며, 부정적 요소가 확인된 기업은 네트워크에서 제외합니다."
- Font: Georgia serif, 20px italic, color `#f0ebe2`, line-height 1.8
- 좌우 인용 부호 (em dash 또는 quotation)

#### CTA Buttons (horizontal, centered)

| Button | Style | Link |
|--------|-------|------|
| "Member Directory 보기 →" | bg: `#c9a84c`, text: `#1a1a1a`, padding 14px 28px | `/members` |
| "멤버 혜택 확인하기" | bg: transparent, border: `1px solid #c9a84c`, text: `#c9a84c`, padding 14px 28px | `/benefit` |

---

## 6. Acceptance Criteria

### AC-SI-01: Hero 렌더링
- [ ] 라벨 "SERVICE OVERVIEW · PRIVATE TALENT NETWORK"이 gold 색상, uppercase로 표시된다
- [ ] 32px gold line이 라벨 왼쪽에 표시된다
- [ ] H1 "검증된 인재와"가 dark로, "기업 리더를 연결하다"가 gold italic으로 표시된다
- [ ] 본문 2개 단락이 올바른 내용으로 렌더링된다
- [ ] "Member Directory 보기 →" CTA 버튼이 표시된다

### AC-SI-02: WHY THIS EXISTS
- [ ] 우측에 3개 리스크 필터링 row가 표시된다
- [ ] 상단에 gold line이 있다
- [ ] 각 row에 번호, 라벨, 제목, 설명, 뱃지가 표시된다
- [ ] Row 사이에 구분선이 있다

### AC-SI-03: Five Pillars 블록
- [ ] 5개 블록이 순서대로 렌더링된다 (Member Directory → Position Board → CEO Coffee Chat → Community Board → Peer Coffee Chat)
- [ ] 각 블록에 번호, 라벨, 제목, 설명, Insight가 포함된다
- [ ] 블록 hover 시 좌측 gold border + 배경 변경 + 4px 이동 애니메이션이 작동한다

### AC-SI-04: Closing Section
- [ ] 다크 배경 (`#1a1a1a`)에 인용문이 표시된다
- [ ] "OUR THESIS" 라벨이 gold 색상으로 표시된다
- [ ] 2개 CTA 버튼이 수평 배치된다: gold filled + gold outline
- [ ] 각 CTA가 올바른 경로로 링크된다

### AC-SI-05: 반응형
- [ ] 모바일에서 Hero가 1-column으로 스택된다 (Left → Right 순서)
- [ ] 모바일에서 Five Pillars 블록이 세로로 쌓인다
- [ ] H1 폰트 사이즈가 모바일에서 축소된다 (32~36px)

### AC-SI-06: 접근성
- [ ] 모든 CTA 버튼에 적절한 `aria-label`이 있다
- [ ] 헤딩 계층 구조가 올바르다 (H1 → H2 → H3)
- [ ] 색상 대비가 WCAG AA 기준을 충족한다
