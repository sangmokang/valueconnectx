# VCX Dogfood 시나리오 상세 스크립트

## 실행 원칙

```
- 각 시나리오는 실제 유저 행동을 모방한다
- 주요 분기점마다 스크린샷 저장
- 콘솔 에러 실시간 모니터링
- "이 순간 실제 유저라면 이탈했을까?" 메모 필수
- 소요 시간 측정 (유저 인내 한계: 시나리오당 3분)
```

---

## Scenario 01: 랜딩 탐색 (비로그인)

```python
async def scenario_01_browse_landing(page, vcx_url, out):
    observations = []
    
    await page.goto(vcx_url, wait_until="networkidle")
    await page.screenshot(path=f"{out}/01_landing_hero.png")
    
    # 5초 안에 "이 서비스가 나를 위한 것인가" 판단 가능한가?
    hero_text = await page.inner_text("h1, [class*='hero']")
    observations.append(f"히어로 텍스트: {hero_text[:100]}")
    
    # 스크롤 탐색
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight / 3)")
    await page.screenshot(path=f"{out}/01_landing_mid.png")
    
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.screenshot(path=f"{out}/01_landing_bottom.png")
    
    # CTA 버튼 찾기
    cta_buttons = await page.query_selector_all("button, a[href*='invite'], a[href*='signup']")
    observations.append(f"CTA 버튼 수: {len(cta_buttons)}")
    
    # 평가 항목
    checks = {
        "value_prop_clear": None,         # 5초 내 서비스 목적 파악 가능?
        "exclusivity_felt": None,          # 초대 전용 느낌이 오는가?
        "cta_visible_atf": None,           # 스크롤 없이 CTA 보이는가?
        "brand_luxury_feel": None,         # Quiet Luxury 느낌?
        "no_recruiter_vibe": None,         # 구직사이트 느낌 없는가?
    }
    
    return {"scenario": "01", "observations": observations, "checks": checks}
```

---

## Scenario 02: 로그인

```python
async def scenario_02_login(page, vcx_url, login_email, login_pw, out):
    await page.goto(f"{vcx_url}/login", wait_until="networkidle")
    await page.screenshot(path=f"{out}/02_login_form.png")
    
    observations = []
    
    # 로그인 방식 확인
    has_magic = bool(await page.query_selector("text=메일로 로그인, text=Magic Link"))
    has_pw = bool(await page.query_selector("input[type='password']"))
    has_social = bool(await page.query_selector("text=Google, text=카카오, text=네이버"))
    
    observations.append(f"Magic Link: {'✅' if has_magic else '❌'}")
    observations.append(f"패스워드 로그인: {'있음' if has_pw else '없음'}")
    observations.append(f"소셜 로그인: {'있음' if has_social else '없음'}")
    
    # 로그인 실행
    if has_pw and login_pw:
        await page.fill("input[type='email'], input[name='email']", login_email)
        # 패스워드 필드 채운 후 스크린샷 찍지 않음 (보안)
        await page.fill("input[type='password']", login_pw)
        await page.click("button[type='submit']")
        await page.wait_for_load_state("networkidle")
    
    await page.screenshot(path=f"{out}/02_after_login.png")
    
    post_url = page.url
    login_success = (
        "/onboarding" in post_url or
        "/members" in post_url or
        "/lounge" in post_url or
        "/dashboard" in post_url
    )
    
    observations.append(f"로그인 후 URL: {post_url}")
    observations.append(f"로그인 성공: {'✅' if login_success else '❌'}")
    
    # 로그인 후 GNB 변화 확인
    await page.screenshot(path=f"{out}/02_gnb_logged_in.png")
    
    return {
        "scenario": "02",
        "success": login_success,
        "post_url": post_url,
        "observations": observations,
    }
```

---

## Scenario 03: 프로필 완성 (관심 분야 태그 입력)

```python
DUMMY_TAGS = ["딥테크 백엔드", "Series B 스타트업", "B2B SaaS", "AI/ML 플랫폼", "핀테크"]

async def scenario_03_complete_profile(page, vcx_url, out):
    # 프로필 편집 페이지로 이동
    await page.goto(f"{vcx_url}/profile/edit", wait_until="networkidle")
    await page.screenshot(path=f"{out}/03_profile_edit.png")
    
    observations = []
    
    # 자유 태그 입력 확인 (PRD: 자유 태그, 고정 카테고리 ❌)
    tag_input = await page.query_selector("input[placeholder*='태그'], input[placeholder*='관심']")
    fixed_dropdown = await page.query_selector("select[name*='field'], select[name*='industry']")
    
    if fixed_dropdown:
        observations.append("⚠️ 고정 드롭다운 발견 — PRD 스펙 이탈 (자유 태그로 변환 필요)")
    if tag_input:
        observations.append("✅ 자유 태그 입력 확인")
        # 더미 태그 입력
        for tag in DUMMY_TAGS[:5]:
            await tag_input.fill(tag)
            await tag_input.press("Enter")
            await asyncio.sleep(0.3)
    
    await page.screenshot(path=f"{out}/03_tags_filled.png")
    
    # 저장
    save_btn = await page.query_selector("button:has-text('저장'), button[type='submit']")
    if save_btn:
        await save_btn.click()
        await page.wait_for_load_state("networkidle")
    
    await page.screenshot(path=f"{out}/03_after_save.png")
    
    return {"scenario": "03", "observations": observations}
```

---

## Scenario 04: 멤버 디렉터리 탐색

```python
async def scenario_04_browse_directory(page, vcx_url, out):
    await page.goto(f"{vcx_url}/members", wait_until="networkidle")
    await page.screenshot(path=f"{out}/04_directory_list.png")
    
    observations = []
    
    # 멤버 카드 수 확인
    member_cards = await page.query_selector_all("[class*='member-card'], [class*='MemberCard'], li[data-member]")
    observations.append(f"노출된 멤버 수: {len(member_cards)}")
    
    # 검색/필터 기능 확인
    search_input = await page.query_selector("input[placeholder*='검색'], input[type='search']")
    observations.append(f"검색 기능: {'✅' if search_input else '❌'}")
    
    # 3명 프로필 상세 조회 (N+1 쿼리 탐지)
    if len(member_cards) >= 3:
        for i in range(3):
            await member_cards[i].click()
            await page.wait_for_load_state("networkidle")
            await page.screenshot(path=f"{out}/04_member_detail_{i+1}.png")
            await page.go_back()
            await page.wait_for_load_state("networkidle")
    
    # Anti-Scraping 발동 테스트 (15건 시도)
    api_calls_count = 0
    # [네트워크 모니터링으로 실제 API 호출 수 계산]
    observations.append(f"API 호출 수: {api_calls_count}")
    
    return {"scenario": "04", "observations": observations}
```

---

## Scenario 05: 포지션 탐색 및 반응

```python
POSITION_REACTIONS = [
    ("관심 있음", 2),    # 2개
    ("관심 없음", 1),    # 1개
    ("나중에 보기", 1),  # 1개
]

async def scenario_05_browse_positions(page, vcx_url, out):
    await page.goto(f"{vcx_url}/positions", wait_until="networkidle")
    await page.screenshot(path=f"{out}/05_positions_list.png")
    
    observations = []
    
    # 포지션 카드 확인
    position_cards = await page.query_selector_all("[class*='position-card'], [class*='PositionCard']")
    observations.append(f"노출된 포지션 수: {len(position_cards)}")
    
    # 반응 버튼 확인
    interest_btns = await page.query_selector_all("button:has-text('관심 있음'), button:has-text('관심있음')")
    not_interest_btns = await page.query_selector_all("button:has-text('관심 없음'), button:has-text('관심없음')")
    bookmark_btns = await page.query_selector_all("button:has-text('나중에'), button:has-text('북마크')")
    
    observations.append(f"관심있음 버튼: {'✅' if interest_btns else '❌'}")
    observations.append(f"관심없음 버튼: {'✅' if not_interest_btns else '❌'}")
    observations.append(f"나중에보기 버튼: {'✅' if bookmark_btns else '❌'}")
    
    # 실제 클릭
    if interest_btns and len(interest_btns) >= 2:
        await interest_btns[0].click()
        await asyncio.sleep(0.5)
        await page.screenshot(path=f"{out}/05_interest_clicked.png")
        await interest_btns[1].click()
    
    if not_interest_btns:
        await not_interest_btns[0].click()
        await asyncio.sleep(0.5)
        await page.screenshot(path=f"{out}/05_not_interest_clicked.png")
    
    return {"scenario": "05", "observations": observations}
```

---

## Scenario 06~09: 라운지 탐색·작성·댓글·이모지

```python
DUMMY_POST = {
    "category": "커리어 고민",
    "title": "시리즈 B CTO 오퍼 vs 대기업 시니어 — 40대 초반의 결정",
    "body": """현재 대기업 시니어 엔지니어로 8년째 재직 중입니다. 
    최근 인연이 있던 Series B 스타트업에서 CTO 포지션 오퍼를 받았습니다. 
    기본급은 현재보다 15% 낮지만 스톡옵션 3% 패키지가 있어요.
    40대 초반, 가정도 있어서 리스크 감수가 쉽지 않은데
    이 기회를 놓치면 다시 오지 않을 것 같다는 생각도 듭니다.
    비슷한 결정을 하신 분들의 솔직한 경험이 궁금합니다."""
}

DUMMY_COMMENT = "스톡옵션 조건에서 행사가격, 클리프 기간, 베스팅 스케줄 세 가지가 핵심입니다. 클리프 1년 지나기 전 퇴사하면 아무것도 못 가져가요. 유동성 이벤트 타임라인을 꼭 직접 물어보세요."

async def scenario_06_read_lounge(page, vcx_url, out):
    await page.goto(f"{vcx_url}/lounge", wait_until="networkidle")
    await page.screenshot(path=f"{out}/06_lounge_landing.png")
    
    # 카테고리 탭 전체 탐색
    category_tabs = await page.query_selector_all("[class*='tab'], button[class*='cat']")
    for tab in category_tabs[:6]:
        await tab.click()
        await asyncio.sleep(0.3)
    
    await page.screenshot(path=f"{out}/06_lounge_categories.png")
    
    # 글 3개 열기
    posts = await page.query_selector_all("[class*='post-card'], [class*='PostCard']")
    for i, post in enumerate(posts[:3]):
        await post.click()
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=f"{out}/06_post_detail_{i+1}.png")
        await page.go_back()
    
    return {"scenario": "06"}

async def scenario_07_write_lounge(page, vcx_url, out):
    await page.goto(f"{vcx_url}/lounge", wait_until="networkidle")
    
    # 글쓰기 버튼 찾기
    write_btn = await page.query_selector("button:has-text('익명으로 쓰기'), button:has-text('글 작성'), button:has-text('+')")
    
    if not write_btn:
        return {"scenario": "07", "error": "글쓰기 버튼 없음"}
    
    await write_btn.click()
    await asyncio.sleep(0.3)
    await page.screenshot(path=f"{out}/07_write_modal_open.png")
    
    # 카테고리 선택
    cat_btn = await page.query_selector(f"button:has-text('{DUMMY_POST[\"category\"]}')")
    if cat_btn:
        await cat_btn.click()
    
    # 제목 입력
    title_input = await page.query_selector("input[placeholder*='제목'], input[name='title']")
    if title_input:
        await title_input.fill(DUMMY_POST["title"])
    
    # 본문 입력
    body_input = await page.query_selector("textarea[placeholder*='내용'], textarea[name='body']")
    if body_input:
        await body_input.fill(DUMMY_POST["body"])
    
    await page.screenshot(path=f"{out}/07_write_filled.png")
    
    # 게시
    submit_btn = await page.query_selector("button:has-text('익명으로 게시'), button:has-text('게시하기')")
    if submit_btn:
        await submit_btn.click()
        await page.wait_for_load_state("networkidle")
    
    await page.screenshot(path=f"{out}/07_after_submit.png")
    
    # 작성한 글이 목록에 나타나는가?
    new_post = await page.query_selector(f"text={DUMMY_POST['title'][:20]}")
    
    return {"scenario": "07", "post_visible": bool(new_post)}

async def scenario_08_comment(page, vcx_url, out):
    await page.goto(f"{vcx_url}/lounge", wait_until="networkidle")
    
    # 첫 번째 글 열기
    posts = await page.query_selector_all("[class*='post']")
    if posts:
        await posts[0].click()
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=f"{out}/08_post_for_comment.png")
        
        # 댓글 입력
        comment_input = await page.query_selector("textarea[placeholder*='응답'], textarea[placeholder*='댓글']")
        if comment_input:
            await comment_input.fill(DUMMY_COMMENT)
            submit = await page.query_selector("button:has-text('익명 답글'), button:has-text('댓글')")
            if submit:
                await submit.click()
                await page.wait_for_load_state("networkidle")
        
        await page.screenshot(path=f"{out}/08_after_comment.png")
    
    return {"scenario": "08"}

async def scenario_09_react_emoji(page, vcx_url, out):
    await page.goto(f"{vcx_url}/lounge", wait_until="networkidle")
    
    # 이모지 반응 테스트
    emoji_btns = await page.query_selector_all("button:has-text('이모지'), button:has-text('공감'), button:has-text('+')")
    
    for btn in emoji_btns[:2]:
        await btn.click()
        await asyncio.sleep(0.3)
        await page.screenshot(path=f"{out}/09_emoji_picker.png")
        
        # 이모지 선택
        emoji = await page.query_selector(".emoji-picker button, [class*='emoji'] button")
        if emoji:
            await emoji.click()
    
    await page.screenshot(path=f"{out}/09_after_react.png")
    return {"scenario": "09"}
```

---

## Scenario 10: Coffee Chat 탐색

```python
async def scenario_10_coffeechat(page, vcx_url, out):
    observations = []
    
    # CEO Coffee Chat
    await page.goto(f"{vcx_url}/coffeechat/ceo", wait_until="networkidle")
    await page.screenshot(path=f"{out}/10_ceo_coffeechat.png")
    
    # 세션 카드 확인
    session_cards = await page.query_selector_all("[class*='session-card'], [class*='SessionCard']")
    observations.append(f"CEO 세션 수: {len(session_cards)}")
    
    # 신청 버튼 클릭 시도 (계약 동의 모달 확인 목적)
    apply_btns = await page.query_selector_all("button:has-text('신청'), button:has-text('Apply')")
    if apply_btns:
        await apply_btns[0].click()
        await asyncio.sleep(0.5)
        await page.screenshot(path=f"{out}/10_apply_modal.png")
        
        # 계약 동의 모달 확인 (PRD 필수)
        contract_modal = await page.query_selector("text=수수료, text=동의, [class*='contract']")
        observations.append(f"계약 동의 모달: {'✅' if contract_modal else '❌ PRD 미구현'}")
        
        # 취소
        cancel = await page.query_selector("button:has-text('취소'), button:has-text('닫기')")
        if cancel:
            await cancel.click()
    
    # Peer Coffee Chat
    await page.goto(f"{vcx_url}/coffeechat/peer", wait_until="networkidle")
    await page.screenshot(path=f"{out}/10_peer_coffeechat.png")
    
    return {"scenario": "10", "observations": observations}
```

---

## Scenario 11: 로그아웃 & 재로그인

```python
async def scenario_11_logout_relogin(page, vcx_url, out):
    observations = []
    
    # 로그아웃
    logout_btn = await page.query_selector("button:has-text('로그아웃'), a:has-text('로그아웃')")
    if logout_btn:
        await logout_btn.click()
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path=f"{out}/11_after_logout.png")
        observations.append(f"로그아웃 후 URL: {page.url}")
    
    # 로그아웃 후 뒤로가기 → 보호된 페이지 접근 방지?
    await page.go_back()
    await asyncio.sleep(1)
    await page.screenshot(path=f"{out}/11_back_after_logout.png")
    
    is_protected = page.url.endswith("/login") or "/login" in page.url
    observations.append(f"로그아웃 후 뒤로가기 보호: {'✅' if is_protected else '❌ 캐시된 페이지 노출'}")
    
    # 보호된 URL 직접 접근
    await page.goto(f"{vcx_url}/members", wait_until="networkidle")
    redirected_to_login = "/login" in page.url
    observations.append(f"/members 비로그인 접근 차단: {'✅' if redirected_to_login else '❌'}")
    
    return {"scenario": "11", "observations": observations}
```

---

## 더미 데이터 누적 전략

Round를 반복할수록 데이터가 쌓이며 더 풍부한 서비스 경험을 테스트할 수 있다:

```
Round 1: 기본 탐색 + 첫 글 1개 + 댓글 1개
Round 2: 다른 글 탐색 + 이모지 반응 + 포지션 관심 누적
Round 3: 검색/필터 테스트 (누적된 데이터로)
Round N: 실제 서비스처럼 콘텐츠가 쌓인 상태에서의 경험 측정
```

---

## 개밥 품질 로그 포맷

```yaml
dogfood_log:
  round: 1
  date: "2026-04-03"
  tester: "Claude (automated)"
  
  scenario_results:
    - id: "01"
      name: "랜딩 탐색"
      status: "pass|fail|partial"
      duration_ms: 4200
      issues: []
      ux_notes: "히어로 텍스트가 5초 내 서비스 목적 파악에 충분함"
    
    - id: "07"
      name: "라운지 글 작성"
      status: "partial"
      duration_ms: 8100
      issues:
        - "모달 닫기 버튼이 모바일에서 잘림"
        - "카테고리 선택 후 저장 안 됨 (새로고침 시 리셋)"
      ux_notes: "실제 유저라면 카테고리 선택이 왜 안 되는지 몰라 이탈했을 것"
  
  overall:
    completion_rate: "9/11 (81%)"
    critical_findings: 1
    high_findings: 3
    ux_friction_moments:
      - "온보딩 progress bar 0% 시작"
      - "라운지 모달 모바일 잘림"
      - "포지션 관심 없음 클릭 후 피드 변화 없음"
```