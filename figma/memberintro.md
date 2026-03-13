===================================================
FIGMA DESIGN PROMPT — ValueConnect X: 멤버 소개 페이지
===================================================

DESIGN SYSTEM (공통 기준 — 전 페이지 동일 적용)
---------------------------------------------------
Brand Colors:
  - Background:     #F5F0E8  (크림/베이지)
  - Surface:        #FFFFFF  (카드 배경)
  - Primary Text:   #1A1A1A  (메인 텍스트)
  - Secondary Text: #666666, #888888, #AAAAAA
  - Gold Accent:    #B8902A  (브랜드 강조색 — 로고, 라인, 배지)
  - Gold Light:     #E8D5A3  (히어로 강조 텍스트)
  - Dark Hero BG:   #1A1A1A  (히어로 섹션 배경)
  - Border:         #E8E2D8, #E0D9CE

Typography:
  - Display (H1):   Noto Serif KR Bold 48px, letter-spacing -1px
  - Heading (H3):   Pretendard Bold 22px
  - Body:           Pretendard Regular 15px, line-height 1.9
  - Small/Label:    Pretendard SemiBold 11px, letter-spacing 0.15em, ALL CAPS
  - Card Title:     Pretendard ExtraBold 17px, letter-spacing -0.3px
  - Card Body:      Pretendard Regular 14px, line-height 1.7

Spacing & Shape:
  - Page max-width: 900px, horizontal padding 48px
  - Card border-radius: 10px
  - Button border-radius: 6px (CTA), 100px (pill tags/filters)
  - Card box-shadow: 0 2px 8px rgba(0,0,0,0.04)  /  open: 0 8px 32px rgba(0,0,0,0.08)


NAVIGATION BAR
---------------------------------------------------
- Background: #F5F0E8
- Height: 60px, sticky top
- Bottom border: 1px solid #E0D9CE
- Left: Logo "ValueConnect X" (X in #B8902A, weight 800)
- Center: Nav links — 멤버 소개 / 커피챗 신청 / CEO Coffeechat / 익명 게시판 / 채용 포지션
  - Active item (멤버 소개): color #1A1A1A, weight 600, underline 1.5px #B8902A
  - Inactive: color #666
- Right: "로그인" text + "회원가입 →" dark button (bg #1A1A1A, color #F5F0E8, radius 4px)


HERO SECTION
---------------------------------------------------
- Background: #1A1A1A (full width)
- Padding: 72px top, 80px bottom
- Max-width container: 900px, left-aligned
- Decorative: subtle radial gradient top-right (rgba(184,144,42,0.07))

[Top label row]
  - Short gold horizontal line (28px wide, 1px, #B8902A)
  - Label text: "MEMBERS · CORE NETWORK"
    Style: 11px, letter-spacing 0.18em, color #B8902A, SemiBold

[H1 Heading]
  - Text: "멤버 소개"
  - Style: 52px, ExtraBold, color #F5F0E8, letter-spacing -1px
  - Margin bottom: 32px

[Philosophy Quote Block]
  - Left border: 2px solid #B8902A
  - Padding left: 24px
  - Two paragraphs, color #C8BFAF, 15px, line-height 1.9
  - Italic highlights in #E8D5A3:
      "장(場, field)"  /  "아비투스(habitus)"  /  "사회적 자본이 실질적인 기회로 전환되는 공간"


TOOLBAR SECTION
---------------------------------------------------
- Background: #F5F0E8
- Padding: 40px top, 0 bottom, 48px horizontal
- Layout: [Search Input + lock notice] ←→ [+ 내 소개 작성 button]

[Search Input]
  - Width: flex 1
  - Height: 46px, border 1px #E0D9CE, radius 6px, bg #FFFFFF
  - Placeholder: "이름, 직군, 키워드로 검색..."
  - Right icon: 🔍 gray
  - Below input: small lock notice row
    - 6px gold dot + "나와 ValueConnect X만 검색할 수 있습니다" (11px, #999)

[Write Button]
  - Text: "+ 내 소개 작성"
  - Style: bg #1A1A1A, color #F5F0E8, radius 6px, 12px×24px padding, weight 600

[Filter Pills row] (below search/button row)
  - Pills: 전체 / VC·Investment / Product / Tech / Legal
  - Active pill: bg #1A1A1A, text #F5F0E8, border #1A1A1A, weight 600
  - Inactive pill: bg transparent, text #777, border #DDD
  - Pill shape: radius 100px, padding 5px 14px, font 12px

[Count row]
  - "총 N명의 멤버" — 13px, #888


MEMBER CARD (collapsed state)
---------------------------------------------------
- Background: #FFFFFF
- Border: 1px solid #E8E2D8
- Border-radius: 10px
- Shadow: 0 2px 8px rgba(0,0,0,0.04)
- Padding: 28px 32px

[Top Row — 3 columns]
Left: Avatar circle
  - Size: 52px diameter
  - Background: linear-gradient(135deg, #2A2A2A, #1A1A1A)
  - Initial letter, color #E8D5A3, 18px ExtraBold

Center: Member info
  - Name (17px ExtraBold, #1A1A1A) + "MEMBER" badge (11px, #B8902A, weight 600, letter-spacing 0.08em)
  - Role/Company: 14px, #555
  - Tag pills: 11px, bg #F5F0E8, border #E0D9CE, color #666, radius 100px, padding 3px 10px

Right: Meta info
  - "joined YYYY.MM" — 12px, #AAA
  - Reaction summary pills (emoji + count): 13px, bg #F5F0E8, radius 100px
  - Chevron ▾ icon — color #AAA, rotates 180° when open

[Preview Body] (below avatar row, left-aligned with center column)
  - 2-line truncated preview of intro text
  - 14px, color #666, line-height 1.7
  - Left padding: 72px (aligned to center column)


MEMBER CARD (expanded state)
---------------------------------------------------
Top section same as collapsed.
Added sections below a 1px #F0ECE4 divider:

[Full Intro Section]
  - Padding: 24px 32px, left-padding 72px
  - Full intro text: 15px, #444, line-height 1.85
  - Expertise block below intro:
    - bg #F5F0E8, radius 6px, left border 2px #B8902A, padding 14px 18px
    - Label "EXPERTISE" — 12px, #999, ALL CAPS, letter-spacing 0.08em
    - Value text: 13px, #555

[Reaction Row]
  - Background: #FAF8F4, border-top 1px #F0ECE4
  - Padding: 16px 32px 16px 104px
  - "리액션" label (12px, #AAA)
  - Existing reaction pills: bg #FFFFFF, border #E0D9CE, emoji + count
  - "+ 이모지" pill button: dashed border #DDD, color #888
  - Emoji picker popup: bg #FFFFFF, border #E0D9CE, radius 10px, shadow, 10 emoji grid

[Comments Section]
  - Padding: 20px 32px 24px 104px, border-top 1px #F0ECE4
  - Each comment:
    - Avatar: 30px circle, bg #E8E2D8, initial letter
    - Name: 13px Bold + time: 11px #BBB
    - Comment text: 13px, #555, line-height 1.6
  
  - Comment input row:
    - "나" avatar: 30px circle, bg #1A1A1A, color #E8D5A3
    - Input field: flex 1, border #E0D9CE, radius 6px, bg #FAF8F4, 13px
    - Send button: bg #1A1A1A, color #F5F0E8, 13px weight 600


WRITE MODAL (overlay)
---------------------------------------------------
- Backdrop: rgba(0,0,0,0.6)
- Modal card: bg #F5F0E8, radius 12px, padding 40px, max-width 580px
- Close ✕ button: top-right, 20px, color #888

Header:
  - Gold line (20px) + "MEMBER INTRODUCTION" label (11px, #B8902A)
  - H3: "내 소개 남기기" — 22px ExtraBold

Form fields (2-column grid):
  - Fields: 이름 / 직함·소속 / 전문 분야 / 태그
  - Input style: border 1px #DDD, radius 6px, bg #FFFFFF, 14px
  - Label style: 12px, #888, SemiBold, letter-spacing 0.05em

자기소개 textarea:
  - Full width, 5 rows, line-height 1.7

Action buttons:
  - [취소]: border 1px #DDD, bg none, flex 1
  - [소개 게시하기 →]: bg #1A1A1A, color #F5F0E8, flex 2, weight 700


TOTAL PAGE SPECS
---------------------------------------------------
- Desktop width: 1440px (centered 900px content)
- Frames needed:
  1. Full page — all cards collapsed (default view)
  2. One card fully expanded (interaction state)
  3. Write modal open (overlay state)
  4. Mobile 375px — nav collapsed to hamburger, cards full width

===================================================
END OF PROMPT — ValueConnect X: 멤버 소개
===================================================