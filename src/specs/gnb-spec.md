# GNB (Global Navigation Bar) Component Spec & AC

## 1. Overview

ValueConnect X의 전역 네비게이션 바. 모든 페이지 상단에 고정되며 브랜드 아이덴티티와 주요 메뉴 접근을 제공합니다.

---

## 2. Layout Spec

### Container

| Property | Value |
|----------|-------|
| Height | `60px` |
| Position | `sticky`, `top: 0`, `z-index: 100` |
| Background | `#f0ebe2` |
| Border bottom | `1px solid rgba(0,0,0,0.08)` |
| Content max-width | `1100px` |
| Padding | `0 48px` (desktop), `0 24px` (mobile) |
| Display | `flex`, `align-items: center`, `justify-content: space-between` |

### Three-Zone Layout

```
[Logo]          [Center Menu]          [Right Actions]
 left             center                    right
```

---

## 3. Logo (Left)

| Property | Value |
|----------|-------|
| Text | "ValueConnect" + "X" |
| "ValueConnect" | color: `#1a1a1a`, font: Georgia serif, weight: 700 |
| "X" | color: `#c9a84c`, font: Georgia serif, weight: 700 |
| Font size | 18px |
| Cursor | pointer (홈 링크) |
| Link | `/` (홈) |

---

## 4. Center Menu

### Menu Items

| Index | Label | Path | Type |
|-------|-------|------|------|
| 1 | 서비스 소개 | - | Dropdown trigger |
| 2 | Coffee Chat | `/coffee-chat` | Link |
| 3 | CEO Coffee Chat | `/ceo-coffee-chat` | Link |
| 4 | Community Board | `/community` | Link |
| 5 | Position Board | `/positions` | Link |

### Dropdown: 서비스 소개

| Sub-item | Path |
|----------|------|
| 서비스 소개 | `/about` |
| Member Directory | `/members` |
| Benefit | `/benefit` |

### Menu Item Style

| Property | Value |
|----------|-------|
| Font | system sans-serif |
| Size | `13.5px` |
| Color (default) | `#666666` |
| Color (hover) | `#1a1a1a` |
| Color (active) | `#1a1a1a` |
| Weight (active) | `600` (semibold) |
| Active indicator | `1.5px solid #c9a84c` underline, offset 4px |
| Gap between items | `32px` |
| Cursor | pointer |

### Dropdown Indicator

- "서비스 소개" 옆에 `▾` (10px, color: inherit)
- Dropdown trigger에만 표시

### Dropdown Panel

| Property | Value |
|----------|-------|
| Position | absolute, below trigger |
| Background | `#f0ebe2` |
| Border | `1px solid rgba(0,0,0,0.08)` |
| Min-width | `180px` |
| Padding | `8px 0` |
| Shadow | none |
| Border-radius | `0px` |

### Dropdown Item Style

| Property | Value |
|----------|-------|
| Padding | `10px 20px` |
| Font | sans-serif, 13px |
| Color | `#666666` |
| Hover background | `#f7f3ed` |
| Hover color | `#1a1a1a` |

---

## 5. Right Actions

### Login Link

| Property | Value |
|----------|-------|
| Text | "로그인" |
| Font | sans-serif, 13.5px |
| Color | `#1a1a1a` |
| Weight | normal |
| Cursor | pointer |
| Link | `/login` |

### CTA Button: "초대 확인하기 →"

| Property | Value |
|----------|-------|
| Text | "초대 확인하기 →" |
| Background | `#1a1a1a` |
| Text color | `#f0ebe2` |
| Font | sans-serif, 13px |
| Weight | 500 |
| Padding | `10px 20px` |
| Border-radius | `0px` |
| Margin-left | `16px` |
| Hover background | `#333333` |
| Link | `/invite` |

---

## 6. Responsive Behavior

### Desktop (>= 1024px)
- 전체 메뉴 표시
- 3-zone 레이아웃

### Tablet / Mobile (< 1024px)
- 햄버거 메뉴 아이콘 (우측)
- 사이드 드로어 또는 풀스크린 메뉴
- 로고는 항상 좌측 표시
- "초대 확인하기 →" 버튼은 메뉴 내부로 이동

---

## 7. Acceptance Criteria

### AC-GNB-01: 기본 렌더링
- [ ] GNB가 페이지 상단에 60px 높이로 렌더링된다
- [ ] 배경색이 `#f0ebe2`이다
- [ ] 하단 보더 `1px solid rgba(0,0,0,0.08)`이 표시된다
- [ ] 콘텐츠 최대 너비가 1100px이고 중앙 정렬된다

### AC-GNB-02: 로고
- [ ] "ValueConnect"가 dark(`#1a1a1a`) serif로 표시된다
- [ ] "X"가 gold(`#c9a84c`) serif로 표시된다
- [ ] 로고 클릭 시 `/` (홈)으로 이동한다

### AC-GNB-03: 메뉴 항목
- [ ] 5개 메뉴 항목이 순서대로 표시된다: 서비스 소개, Coffee Chat, CEO Coffee Chat, Community Board, Position Board
- [ ] 현재 활성 페이지의 메뉴 항목이 semibold + gold underline으로 표시된다
- [ ] 비활성 메뉴 항목은 `#666666` 색상이다
- [ ] 각 메뉴 클릭 시 해당 페이지로 라우팅된다

### AC-GNB-04: 서비스 소개 Dropdown
- [ ] "서비스 소개" 옆에 `▾` 인디케이터가 표시된다
- [ ] 클릭 시 드롭다운이 열린다 (서비스 소개, Member Directory, Benefit)
- [ ] 드롭다운 외부 클릭 시 닫힌다
- [ ] 각 하위 메뉴 클릭 시 해당 페이지로 이동한다
- [ ] Escape 키로 드롭다운이 닫힌다

### AC-GNB-05: 우측 액션
- [ ] "로그인" 텍스트 링크가 표시된다
- [ ] "초대 확인하기 →" filled 버튼이 표시된다
- [ ] 버튼 배경이 `#1a1a1a`, 텍스트가 `#f0ebe2`이다
- [ ] 버튼에 border-radius가 없다 (0px)

### AC-GNB-06: Sticky Behavior
- [ ] 스크롤 시 GNB가 상단에 고정된다 (`position: sticky`)
- [ ] 콘텐츠가 GNB 뒤로 스크롤된다

### AC-GNB-07: 반응형
- [ ] 1024px 이하에서 햄버거 메뉴로 전환된다
- [ ] 모바일에서 로고가 항상 표시된다
- [ ] 모바일 메뉴에서 모든 항목 접근 가능하다

---

## 8. Component API (React)

```typescript
interface GNBProps {
  currentPath: string;          // 현재 라우트 경로
  isLoggedIn?: boolean;         // 로그인 상태
  userName?: string;            // 로그인 시 사용자 이름
}
```

### 로그인 상태에 따른 우측 변화

| 상태 | 표시 내용 |
|------|----------|
| 비로그인 | "로그인" + "초대 확인하기 →" |
| 로그인 | 사용자 이름 (또는 프로필 아이콘) + 로그아웃 |
