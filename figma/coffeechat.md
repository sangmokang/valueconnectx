Design a full web page for "ValueConnect X" — an invite-only premium headhunting and elite professional network platform in Korea. This is the Coffee Chat Request (커피챗 신청) page.

—— DESIGN SYSTEM (must follow exactly) ——
Background: #f0ebe2 (warm off-white)
Dark surface: #1a1a1a (near black)
Accent gold: #c9a84c
Body font: Georgia (serif)
UI font: system sans-serif for labels and badges
Tone: Michelin 3-star restaurant meets premium private members club. Refined, quiet luxury. No gradients, no rounded corners, no drop shadows except on modals.

—— NAVIGATION BAR ——
Sticky top nav. Height 60px. Background #f0ebe2. Bottom border 1px rgba(0,0,0,0.08).
Left: Logo "ValueConnect X" — "ValueConnect" in dark serif, "X" in gold #c9a84c
Center: Menu items in 13.5px — 서비스 소개 (with ▾ dropdown indicator) / 커피챗 신청 / CEO Coffeechat / 익명 게시판 / 채용 포지션
Active item "커피챗 신청" is dark #1a1a1a, semibold, with 1.5px gold underline.
Right: 로그인 text link + "회원가입 →" filled button in #1a1a1a with #f0ebe2 text.

—— HERO SECTION ——
Full width, beige background #f0ebe2. Padding top 80px bottom 60px. Max-width 1100px centered.
Two-column grid. Left column wider (55%).

LEFT COLUMN:
- Small label row: 32px gold horizontal line + text "COFFEECHAT · INVITE-ONLY NETWORK" in 10px uppercase, letter-spacing 0.22em, gold color
- H1 headline: "연결은 밀도가" on line 1, "만든다" in italic gold on line 2. Font size 52px, weight 800, letter-spacing -2px
- Two paragraphs of body text (15px, line-height 1.85, color #444). First para mentions "약한 연결(weak ties)" with the key phrase "맥락과 밀도가 일치하는 연결" in bold dark. Second para: "이 네트워크는 열려 있지 않다. 그것이 이 네트워크의 가치다."
- CTA button: "사연 올리기 →" — filled #1a1a1a, #f0ebe2 text, 14px, no border radius, padding 14px 28px

RIGHT COLUMN:
Three stacked rows separated by thin dividers (1px rgba(0,0,0,0.08)), with a 1.5px gold line at the very top.
Each row has:
- Step number + label in 10px uppercase gold (e.g. "01  HOW IT WORKS")
- Title in 18px bold (e.g. "사연을 올린다")
- Description in 13.5px #666, line-height 1.7
Row 1: 사연을 올린다 — 나의 상황, 고민, 찾고 있는 대화의 맥락을 솔직하게 작성합니다.
Row 2: 비밀 댓글로 신청 — 관심 있는 멤버가 비밀 댓글로 자신을 소개하며 커피챗을 신청합니다. 작성자만 볼 수 있습니다.
Row 3: 선택 후 연결 — 작성자가 댓글을 검토하고 대화를 원하는 사람을 직접 선택합니다. 서로의 연락처가 공유됩니다.

—— BOARD SECTION ——
Max-width 1100px, padding 20px 48px 80px.

Section header row (flex, space-between):
Left: H2 "커피챗 사연 게시판" 22px bold + subtitle "Core 멤버 인증 후 사연을 올릴 수 있습니다. 신청은 비밀 댓글로." in 13px #888 sans-serif
Right: Filter buttons "전체" / "CORE" / "INTRO" — small buttons with border, "전체" active in filled #1a1a1a

Below header: 1px divider in rgba(0,0,0,0.1)

—— POST CARD (repeat 4 times) ——
Each card: background #f7f3ed, no border radius, no drop shadow. 2px left border (transparent default, gold on hover). Padding 28px 32px.
On hover: background shifts to #ebe5da, left border becomes 3px solid #c9a84c, card translates 4px right.

Inside each card, two-column layout:
LEFT (flex 1):
- Top row: Badge pill (CORE = #1a1a1a bg + gold text OR INTRO = #e8e2d9 bg + #666 text, 9px uppercase) + optional "NEW" badge (gold bg, white text) + author name · role in 12.5px #888 sans-serif
- H3 title: 18px bold, letter-spacing -0.3px, max 1-2 lines
- Body text: 13.5px #555, line-height 1.75, truncated to ~120 characters with "..."
- Tags row: small bordered pills "#tag" in 11px, 1px border rgba(0,0,0,0.15)

RIGHT (shrink 0, min-width 96px, text-right):
- Date in 11px #999
- "🔒 비밀신청 N건" in 12px #888 with bold count

Cards to design: 4 posts total. Two with CORE badge, one with INTRO badge, one with NEW badge.

—— WRITE POST MODAL (show as overlay or side panel) ——
Dark overlay rgba(15,12,8,0.75) with backdrop blur.
Modal box: background #f0ebe2, width 640px, padding 48px, no border radius.
Close X button top-right.
Header: gold line + "COFFEECHAT REQUEST" label, H2 "사연 작성" 28px bold, subtitle in 13.5px #888
Three inputs (제목, 사연 as textarea, 태그) with labels in 11px uppercase #888, inputs in #f7f3ed background
Bottom row: disclaimer text left + "게시하기 →" filled dark button right

—— DETAIL / REPLY MODAL ——
Same overlay style. Width 680px.
Top: badge + author/role + date
H2 title 26px bold
Full body text
Tags
Divider
Secret comment section: "🔒 비밀 댓글로 커피챗 신청" heading + "작성자에게만 공개됩니다" note
Textarea for introduction message
"비밀 댓글 전송 →" button, dark, full-width-ish
After send: success state showing ✓ icon + "신청이 전달되었습니다." in centered dark box with gold text