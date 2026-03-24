# ValueConnect X Design System Spec

## 1. Color Palette

### Primary Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-bg` | `#f0ebe2` | 전체 배경 (warm off-white) |
| `--color-dark` | `#1a1a1a` | 텍스트, 다크 서피스, 버튼 배경 |
| `--color-gold` | `#c9a84c` | 액센트, 강조, 언더라인, 뱃지 |

### Secondary / Utility Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-card-bg` | `#f7f3ed` | 카드 배경, 인풋 배경 |
| `--color-card-hover` | `#ebe5da` | 카드 호버 상태 |
| `--color-text-primary` | `#1a1a1a` | 본문 제목 |
| `--color-text-body` | `#444444` | 본문 텍스트 |
| `--color-text-secondary` | `#555555` | 카드 본문 |
| `--color-text-muted` | `#666666` | 설명 텍스트 |
| `--color-text-caption` | `#888888` | 캡션, 라벨, 서브텍스트 |
| `--color-text-dim` | `#999999` | 날짜, 메타 정보 |
| `--color-border` | `rgba(0,0,0,0.08)` | 기본 구분선 |
| `--color-border-strong` | `rgba(0,0,0,0.10)` | 강조 구분선 |
| `--color-border-pill` | `rgba(0,0,0,0.15)` | 태그 필 테두리 |
| `--color-overlay` | `rgba(15,12,8,0.75)` | 모달 오버레이 |

### Badge Colors

| Badge | Background | Text |
|-------|-----------|------|
| CORE | `#1a1a1a` | `#c9a84c` |
| ENDORSED | `#e8e2d9` | `#666666` |
| NEW | `#c9a84c` | `#ffffff` |
| CEO | `#c9a84c` | `#1a1a1a` |

---

## 2. Typography

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `--font-serif` | `Georgia, 'Times New Roman', serif` | 본문, 제목, H1~H3 |
| `--font-sans` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | UI 라벨, 뱃지, 캡션, 필터 버튼 |

### Type Scale

| Element | Size | Weight | Font | Letter-spacing | Line-height |
|---------|------|--------|------|---------------|-------------|
| H1 (Hero) | 52px | 800 | serif | -2px | 1.1 |
| H1 italic (gold) | 52px | 800 italic | serif | -2px | 1.1 |
| H2 (Section) | 22~28px | bold (700) | serif | -0.5px | 1.3 |
| H3 (Card title) | 18px | bold (700) | serif | -0.3px | 1.4 |
| Body | 15px | normal (400) | serif | normal | 1.85 |
| Body bold | 15px | bold (700) | serif | normal | 1.85 |
| Card body | 13.5px | normal | serif | normal | 1.75 |
| Step title | 18px | bold | serif | normal | 1.4 |
| Step desc | 13.5px | normal | serif | normal | 1.7 |
| Label (uppercase) | 10px | normal | sans-serif | 0.22em | 1.2 |
| Nav menu | 13.5px | normal/semibold | sans-serif | normal | 1 |
| Caption | 12~12.5px | normal | sans-serif | normal | 1.4 |
| Badge | 9px | bold | sans-serif | 0.05em | 1 |
| Tag pill | 11px | normal | sans-serif | normal | 1 |
| Button | 14px | medium (500) | sans-serif | normal | 1 |
| Small text | 11px | normal | sans-serif | normal | 1.3 |

---

## 3. Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | 최소 간격 |
| `--space-2` | 8px | 인라인 간격 |
| `--space-3` | 12px | 작은 패딩 |
| `--space-4` | 16px | 기본 패딩 |
| `--space-5` | 20px | 섹션 내 간격 |
| `--space-6` | 24px | 모달 내부 |
| `--space-7` | 28px | 카드 패딩 (vertical) |
| `--space-8` | 32px | 카드 패딩 (horizontal) |
| `--space-10` | 40px | 섹션 간격 |
| `--space-12` | 48px | 큰 패딩 |
| `--space-16` | 64px | 섹션 구분 |
| `--space-20` | 80px | Hero 상단 패딩 |

---

## 4. Layout

### Container

| Property | Value |
|----------|-------|
| Max width | `1100px` |
| Horizontal padding | `48px` (desktop), `24px` (mobile) |
| Centering | `margin: 0 auto` |

### Grid (Hero Section)

| Property | Value |
|----------|-------|
| Type | CSS Grid, 2-column |
| Left column | 55% |
| Right column | 45% |
| Gap | 48px |

---

## 5. Components - Visual Rules

### Border Radius

**전역 원칙: border-radius 없음 (0px)**
- 예외: 없음. 모든 버튼, 카드, 인풋, 모달에 border-radius 적용 금지

### Shadows

**전역 원칙: drop shadow 없음**
- 예외: 모달 오버레이에만 `backdrop-filter: blur(8px)` 허용

### Gradients

**전역 원칙: gradient 사용 금지**

### Dividers

| Type | Style |
|------|-------|
| 기본 구분선 | `1px solid rgba(0,0,0,0.08)` |
| 강조 구분선 | `1px solid rgba(0,0,0,0.10)` |
| 골드 액센트 라인 | `1.5~2px solid #c9a84c` |
| 카드 좌측 보더 (hover) | `3px solid #c9a84c` |

### Gold Accent Line

- 높이: 1.5~2px
- 너비: 32px (라벨 앞) 또는 full-width (섹션 상단)
- 색상: `#c9a84c`

---

## 6. Tone & Manner

### 디자인 철학

> "Michelin 3-star restaurant meets premium private members club"

| 원칙 | 설명 |
|------|------|
| Refined | 정제된 시각 언어. 과도한 장식 없음 |
| Quiet Luxury | 골드 포인트를 절제하여 사용. 로고와 강조에만 |
| Trust | 다크 + 베이지 조합으로 신뢰감 전달 |
| Exclusivity | Invite-only 느낌의 폐쇄적이지만 따뜻한 분위기 |

### 카피 톤

- 문어체 기반, 짧고 단정한 문장
- 강조 키워드는 bold 처리
- 영문 용어는 원문 유지 (Coffee Chat, Position Board 등)
- 한글과 영문 혼용 시 자연스러운 문맥 유지

---

## 7. Interactive States

### Button States

| State | Primary (Dark) | Gold Outline |
|-------|---------------|-------------|
| Default | bg: `#1a1a1a`, text: `#f0ebe2` | bg: transparent, border: `#c9a84c`, text: `#c9a84c` |
| Hover | bg: `#333333`, text: `#f0ebe2` | bg: `rgba(201,168,76,0.08)` |
| Active | bg: `#000000` | bg: `rgba(201,168,76,0.15)` |

### Card Hover

| Property | Default | Hover |
|----------|---------|-------|
| Background | `#f7f3ed` | `#ebe5da` |
| Left border | `2px transparent` | `3px solid #c9a84c` |
| Transform | none | `translateX(4px)` |
| Transition | - | `all 0.2s ease` |

### Nav Active Item

- Color: `#1a1a1a`
- Font-weight: `600` (semibold)
- 하단: `1.5px solid #c9a84c` underline
