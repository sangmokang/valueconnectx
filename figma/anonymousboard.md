===================================================
FIGMA DESIGN PROMPT — ValueConnect X: 익명 게시판 페이지
===================================================

DESIGN SYSTEM (공통 기준 — 전 페이지 동일 적용)
---------------------------------------------------
Brand Colors:
  - Background:       #F5F0E8  (크림/베이지)
  - Surface:          #FFFFFF  (카드 배경)
  - Primary Text:     #1A1A1A
  - Secondary Text:   #666666, #777777, #888888, #AAAAAA
  - Gold Accent:      #B8902A
  - Gold Light:       #E8D5A3
  - Dark Hero BG:     #1A1A1A
  - Input BG:         #FAF8F4
  - Subtle BG:        #FAF8F4
  - Notice Gold BG:   #FFF8ED  (익명 보증 배너)
  - Notice Gold Border: #E8D5A3

Anonymous Identity Symbol:
  - ◎ (double circle) — used exclusively for all anonymous avatars
  - Avatar: 32px circle, bg #F0ECE4, border 1px #E0D9CE, symbol 14px centered
  - This replaces the initial-letter avatars used in other pages

Category Badge Colors:
  - 커리어 고민: bg #F0F7FF,  border #C8DFF5, text #3A7BBF
  - 연봉·협상:   bg #FFF8ED,  border #E8D5A3, text #A07820
  - 조직 갈등:   bg #FFF0F0,  border #F5C8C8, text #B84040
  - 이직 고민:   bg #F0FFF4,  border #B8E8C8, text #2A8050
  - 번아웃:      bg #F5F0FF,  border #D8C8F5, text #6040A0
  - 관계·리더십: bg #F5F0E8,  border #E0D9CE, text #7A6545

Typography: (same design system)
  - H1: Noto Serif KR ExtraBold 48px, letter-spacing -1px, color #F5F0E8 (on dark hero)
  - Post Title: Pretendard Bold 16px, letter-spacing -0.2px, line-height 1.45
  - Body: Pretendard Regular 15px, line-height 1.9
  - Comment: Pretendard Regular 14px, line-height 1.75
  - Label: Pretendard SemiBold 11px, letter-spacing 0.15-0.18em, ALL CAPS


NAVIGATION BAR
---------------------------------------------------
(Identical to other pages)
- Active item: "익명 게시판" — color #1A1A1A, weight 600, underline 1.5px #B8902A
- All other nav specs: same as design system


HERO SECTION
---------------------------------------------------
- Background: #1A1A1A (full width)
- Padding: 72px top, 80px bottom
- Decorative: subtle full-bleed radial gradient (rgba(184,144,42,0.04) at 80% right)
  + 1px horizontal gradient line at bottom of hero (transparent → rgba(184,144,42,0.2) → transparent)

Layout: Two-column (philosophy left, rules right)

[Left Column — max-width 680px]
Top label row:
  - Gold line 28px + "ANONYMOUS · TRUST-BASED SPACE"
  - 11px, #B8902A, letter-spacing 0.18em, weight 600

H1:
  - "익명 게시판"
  - 48px ExtraBold, #F5F0E8, letter-spacing -1px

Philosophy block:
  - Left border: 2px solid #B8902A, padding-left 24px
  - Para 1: "익명성에 기반하지만 신뢰를 기반으로 — 나의 취약함도 편히 드러낼 수 있는 구조적 안전망."
    Italic highlight: "나의 취약함도 편히 드러낼 수 있는 구조적 안전망" in #E8D5A3, italic
  - Para 2: "커리어의 고민, 연봉 협상의 불안, 조직 내 갈등 — 우리는 이 공간에서 평가 없이 말하고, 집단 지성으로 응답한다."
    Highlight: "평가 없이 말하고, 집단 지성으로 응답한다" in #E8D5A3
  - Font: 15px, #C8BFAF, line-height 1.9

[Right Column — min-width 220px]
Three rule rows, each:
  - ◎ icon in #B8902A (12px) + rule text (13px, #888, line-height 1.5)
  Rules:
    1. 발신자는 익명, 신뢰는 실명
    2. 평가 없는 응답만 허용됩니다
    3. 멤버만 읽고 쓸 수 있습니다


TOOLBAR SECTION
---------------------------------------------------
- Padding: 36px top, 48px horizontal

Layout: [Category filter pills] ←→ [+ 익명으로 쓰기 button]

Category pills:
  전체 / 커리어 고민 / 연봉·협상 / 조직 갈등 / 이직 고민 / 번아웃 / 관계·리더십
  - Active: bg #1A1A1A, color #F5F0E8, border #1A1A1A, radius 100px, weight 600
  - Inactive: transparent, border #DDD, color #777
  - Padding: 6px 16px, font 12px

[+ 익명으로 쓰기] button:
  - bg #1A1A1A, color #F5F0E8, radius 6px, 10px × 22px padding, weight 700

Count row: "N개의 글 · 모든 답글은 익명으로 처리됩니다" — 13px, #888


POST CARD (collapsed state)
---------------------------------------------------
- bg #FFFFFF, border 1px #E8E2D8, radius 12px
- Shadow: 0 2px 8px rgba(0,0,0,0.04)
- Padding: 28px 32px

[Top Row]
Left column (flex 1):
  - Meta row: [Category badge] · [time] · [조회 N]
    - Category badge: rounded pill, category-specific color (see color map above), 11px weight 600
    - Separator dots and meta info: 11px, #BBB or #CCC
  - Post title: 16px Bold, #1A1A1A, letter-spacing -0.2px, line-height 1.45

Right column (flex-shrink 0):
  - Reaction summary: small pills (emoji + count), bg #F5F0E8, radius 100px, 12px
  - Comment count: 💬 N — 12px, #BBB
  - Chevron ▾ — rotates on expand

[Preview Body]
  - Below top row, full width
  - 2-line truncated, 14px, #777, line-height 1.7
  - Top margin: 12px


POST CARD (expanded state)
---------------------------------------------------
Collapsed header remains. Added sections below 1px #F0ECE4 divider:

[Body Section]
  - Padding: 24px 32px
  - Full post body: 15px, #3A3A3A, line-height 1.9

[Post Reactions Row]
  - Background: #FAF8F4, border-top 1px #F0ECE4
  - Padding: 14px 32px
  - "공감" label: 11px, #BBB, letter-spacing 0.05em
  - Reaction pills: bg #FFFFFF, border 1px #E0D9CE, emoji + count, radius 100px
  - "+ 이모지" button: bg #FFFFFF, border 1px #DDD, radius 100px, 12px, color #888
  - Emoji picker popup: bg #FFFFFF, border #E0D9CE, radius 10px, shadow, 10 emoji grid (2 rows × 5)

[Comments Section]
  - Padding: 24px 32px, border-top 1px #F0ECE4
  
  Each comment:
    Layout: [◎ Avatar 32px] + [Content block]
    - Avatar: circle, bg #F0ECE4, border #E0D9CE, ◎ symbol at center
    - Anon name: "익명 멤버 X" — 12px Bold, #555
    - Time: 11px, #CCC (inline with name)
    - Comment text: 14px, #444, line-height 1.75
    - Comment reactions: small pills, bg #F5F0E8, border #E8E2D8, radius 100px, 12px
    - "+ 공감" button: dashed border #DDD, radius 100px, 12px, color #AAA
    - Comment-level emoji picker: same popup style, smaller (18px emoji)
    - Divider between comments: 1px solid #F5F0E8

  Empty state (no comments):
    - Centered text: "첫 번째 응답을 남겨보세요" — 14px, #CCC

  [Comment Input Row]
    - ◎ Avatar (32px, same style)
    - Textarea: flex 1, 3 rows, border #E0D9CE, radius 8px, bg #FAF8F4, 13px, line-height 1.7
    - Placeholder: "익명으로 응답하기 — 평가 없이, 경험으로 답해주세요"
    - Below textarea: hint text left "⇧ + Enter로 줄바꿈, Enter로 전송" (11px, #CCC)
    - Submit button right: "익명 답글" — bg #1A1A1A, color #F5F0E8, radius 6px, 13px weight 600


WRITE MODAL (overlay)
---------------------------------------------------
- Backdrop: rgba(0,0,0,0.65)
- Card: bg #F5F0E8, radius 14px, padding 44px, max-width 600px
- Close ✕: top-right, 20px, color #888

Header:
  - Gold line + "ANONYMOUS POST" label (11px, #B8902A)
  - H3: "익명으로 글 남기기" — 22px ExtraBold
  - Subtitle: "작성자 정보는 어디에도 표시되지 않습니다. ValueConnect X 멤버만 볼 수 있습니다."
    13px, #AAA, line-height 1.6

[Category selector]
  - Label: "카테고리" — 11px, #888, SemiBold
  - Button group: same pill style as toolbar filters
  - Selected: bg #1A1A1A, text #F5F0E8 / Unselected: transparent, border #DDD, text #777

[Title input]
  - Full width, border #DDD, radius 6px, bg #FFFFFF, 14px
  - Placeholder: "어떤 고민인지 한 줄로 적어주세요"

[Body textarea]
  - 6 rows, full width, line-height 1.75
  - Placeholder: "상황을 구체적으로 적을수록 더 의미 있는 응답을 받을 수 있습니다. 회사명, 이름 등 특정 가능한 정보는 제외해주세요."

[Anonymous Guarantee Banner]
  - bg #FFF8ED, border 1px #E8D5A3, radius 8px, padding 12px 16px
  - Layout: 🔒 icon (14px) + text block
  - Text: "이 글은 완전히 익명으로 게시됩니다. 운영팀도 작성자를 특정하지 않습니다. 단, 커뮤니티 가이드라인 위반 시 삭제될 수 있습니다."
    12px, #8A6A1A, line-height 1.6

Action buttons:
  - [취소]: border #DDD, bg none, flex 1, 14px, color #666
  - [익명으로 게시하기 →]: bg #1A1A1A, color #F5F0E8, flex 2, 14px weight 700


SAMPLE POST CONTENT (use for realistic mockup)
---------------------------------------------------
Post 1 (연봉·협상):
  Title: "Series B 스타트업 CTO 오퍼 받았는데, 연봉 협상 어떻게 해야 할까요"
  Body: "현재 대기업 시니어 개발자로 재직 중이고, 스타트업 CTO 포지션 오퍼를 받았습니다..."
  Reactions: 🤝 23  💡 14  🔥 8   Comments: 2

Post 2 (조직 갈등):
  Title: "팀장인데 위에서 내려오는 방향이 팀원들에게 납득이 안 됩니다"
  Reactions: 🤝 41  🧠 19  ✨ 6   Comments: 1

Post 3 (번아웃):
  Title: "5년 만에 처음으로 일이 아무 의미없게 느껴집니다"
  Reactions: 🤝 67  🌱 33  💎 12  Comments: 2

Post 4 (이직 고민):
  Title: "외국계 임원 제안 — 한국 스타트업 파운더 경험 vs 안정적 커리어트랙"
  Reactions: 🎯 38  🤝 29  🔥 17  Comments: 0 (empty state)


TOTAL PAGE SPECS
---------------------------------------------------
- Desktop: 1440px (content 960px centered)
- Frames needed:
  1. Full page — all cards collapsed, list view
  2. Post card expanded — body + reactions + 2 comments + comment input
  3. Write modal open — all fields visible including guarantee banner
  4. Emoji picker open state (on post reaction row)
  5. Mobile 375px — full width cards, hero rules stacked below text


KEY DESIGN PRINCIPLE FOR THIS PAGE
---------------------------------------------------
The anonymous symbol ◎ is the visual language of this space.
It should feel distinct from other pages — less personal, more structural.
The overall tone is: "safe container for vulnerability, not confessional."
Every UI decision should reinforce that: anonymity with dignity, not hiding in shame.

===================================================
END OF PROMPT — ValueConnect X: 익명 게시판
===================================================