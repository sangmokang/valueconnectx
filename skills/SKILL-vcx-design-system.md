# SKILL: VCX 디자인 시스템

VCX 프로젝트의 스타일링 규칙, 커스텀 토큰, 컴포넌트 패턴을 정의한다.
이 파일을 숙지하고 모든 UI 작업에 적용하라.

---

## 1. Tailwind CSS v4 — CSS-first 설정

VCX는 **Tailwind CSS v4**를 사용한다. v3와 설정 방식이 완전히 다르다.

### DO
- `globals.css`의 `@theme inline {}` 블록에서 커스텀 토큰 정의
- `bg-black/50` 형식으로 불투명도 적용

### DON'T
- `tailwind.config.ts` 파일 생성 — Tailwind v4에서 불필요, 충돌 유발
- `theme()` CSS 함수 사용 — v4에서 제거됨
- `bg-opacity-50` 사용 — v4에서 삭제됨, `bg-black/50`으로 대체
- `content: []` 설정 — Oxide 엔진이 자동 감지

```css
/* globals.css — 올바른 설정 방식 */
@import "tailwindcss";

@theme inline {
  --color-vcx-gold: #c9a84c;
  --color-vcx-beige: #f0ebe2;
  /* ... */
}
```

---

## 2. VCX 커스텀 색상 클래스 (전체 목록)

모든 색상은 Hex 직접 사용 대신 아래 vcx-* 클래스를 사용한다.

### 배경 (Background)

| 클래스 | 색상값 | 용도 |
|--------|--------|------|
| `bg-vcx-beige` | `#f0ebe2` | 기본 배경 |
| `bg-vcx-beige-light` | `#f7f3ed` | 카드, 서브 영역 배경 |
| `bg-vcx-beige-dark` | `#ebe5da` | 구분선, 강조 배경 |
| `bg-vcx-dark` | `#1a1a1a` | 다크 배경, 헤더 |
| `bg-vcx-gold` | `#c9a84c` | 강조 버튼, 액센트 배경 |

### 텍스트 (Text)

| 클래스 | 색상값 | 용도 |
|--------|--------|------|
| `text-vcx-dark` | `#1a1a1a` | 기본 본문 텍스트 |
| `text-vcx-gold` | `#c9a84c` | 강조 텍스트, 링크 |
| `text-vcx-beige` | `#f0ebe2` | 다크 배경 위 텍스트 |
| `text-vcx-sub-1` | `#444444` | 보조 텍스트 (가장 진함) |
| `text-vcx-sub-2` | `#555555` | 보조 텍스트 |
| `text-vcx-sub-3` | `#666666` | 보조 텍스트 |
| `text-vcx-sub-4` | `#888888` | 보조 텍스트 |
| `text-vcx-sub-5` | `#999999` | 보조 텍스트 (가장 연함) |

### 테두리 (Border)

| 클래스 | 색상값 | 용도 |
|--------|--------|------|
| `border-vcx-dark` | `#1a1a1a` | 기본 테두리 |
| `border-vcx-gold` | `#c9a84c` | 강조 테두리 |

### 타이포그래피 유틸리티

| 클래스 | 정의 | 용도 |
|--------|------|------|
| `font-vcx-serif` | `Georgia, serif` | 제목, 본문 |
| `font-vcx-sans` | `system-ui, sans-serif` | 라벨, 보조 텍스트 |
| `vcx-label` | `9px uppercase tracking-[0.22em] sans-serif` | 소형 라벨 |
| `vcx-section-label` | `10px uppercase tracking-[0.22em] sans-serif gold색` | 섹션 구분 라벨 |

---

## 3. 디자인 원칙

### border-radius: 0 (전역 강제)

VCX는 전역 CSS로 모든 요소의 radius를 0으로 강제한다.

```css
* {
  border-radius: 0 !important;
}
```

### DO
- 모든 컴포넌트를 각진 형태로 유지
- 차트 내부 요소(막대, 원 등)는 예외로 radius 허용

### DON'T
- `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full` 등 어떠한 rounded-* 클래스도 사용하지 않는다
- 인라인 style로 `borderRadius` 직접 지정

### 모바일 퍼스트

- 기준 해상도: **Galaxy 360px**
- Tailwind 브레이크포인트를 mobile-first 순서로 작성 (`sm:`, `md:`, `lg:`)
- 기본 스타일 = 모바일 스타일

### 액센트 컬러

- **단일 강조색**: `#c9a84c` (vcx-gold)
- CTA 버튼, 활성 상태, 강조 텍스트, 구분선에 사용

---

## 4. 타이포그래피 체계

| 요소 | 폰트 클래스 | 비고 |
|------|------------|------|
| `h1`, `h2` 제목 | `font-vcx-serif` | Georgia serif |
| 본문 | `font-vcx-serif` | `body`에 기본 설정됨 |
| 라벨, 보조 텍스트 | `font-vcx-sans` | system-ui sans-serif |
| 섹션 구분 라벨 | `vcx-section-label` 유틸리티 | gold, uppercase, tracking |
| 소형 라벨 | `vcx-label` 유틸리티 | 9px, uppercase, tracking |

```tsx
// DO
<h2 className="font-vcx-serif text-2xl text-vcx-dark">제목</h2>
<span className="vcx-section-label">섹션 이름</span>

// DON'T
<h2 style={{ fontFamily: 'Georgia' }}>제목</h2>
```

---

## 5. cn() 유틸리티

조건부 클래스 조합에는 반드시 `cn()`을 사용한다.

```typescript
import { cn } from '@/lib/utils'
// 내부 구현: clsx + tailwind-merge
```

```tsx
// DO
<div className={cn('bg-vcx-beige px-4 py-3', isActive && 'border-vcx-gold', className)} />

// DON'T
<div className={`bg-vcx-beige px-4 py-3 ${isActive ? 'border-vcx-gold' : ''}`} />
```

---

## 6. 컴포넌트 패턴

### @base-ui/react

VCX의 UI 프리미티브는 `@base-ui/react`를 사용한다.

#### DO
- 서브패스 import 사용

```tsx
import { Button } from '@base-ui/react/button'
import { Dialog } from '@base-ui/react/dialog'
```

#### DON'T
- 루트에서 import — 번들 크기 증가

```tsx
// 금지
import { Button, Dialog } from '@base-ui/react'
```

- Radix UI 패턴 적용 — `asChild` prop은 `@base-ui/react`에 없음
- `forwardRef` 래핑 — `@base-ui/react`는 불필요

### 아이콘

```tsx
// DO
import { ChevronRight, User } from 'lucide-react'

// DON'T
import * as Icons from 'lucide-react'
```

### shadcn/ui 사용 시 주의

shadcn/ui 기본 스타일은 VCX 디자인 토큰으로 반드시 덮어써야 한다.

```tsx
// DON'T — shadcn 기본값 그대로 사용
<Button className="bg-primary rounded-md">클릭</Button>

// DO — VCX 토큰으로 커스터마이징
<Button className={cn('bg-vcx-dark text-vcx-beige hover:bg-vcx-gold', className)}>
  클릭
</Button>
```

---

## 7. 금지 패턴 요약

| 금지 | 대체 |
|------|------|
| `#c9a84c` 직접 사용 | `text-vcx-gold` / `bg-vcx-gold` |
| `#f0ebe2` 직접 사용 | `bg-vcx-beige` / `text-vcx-beige` |
| `rounded-*` 클래스 | 사용 불가 (전역 0 radius) |
| `tailwind.config.ts` 생성 | `globals.css` `@theme inline {}` 사용 |
| `theme()` CSS 함수 | CSS 변수 직접 참조 |
| `bg-opacity-50` | `bg-black/50` |
| `import { X } from '@base-ui/react'` | `import { X } from '@base-ui/react/x'` |
| shadcn 기본 스타일 유지 | VCX 토큰으로 커스터마이징 |

---

## 8. 빠른 참조

```tsx
// 표준 카드 컴포넌트
<div className={cn(
  'bg-vcx-beige-light border border-vcx-dark p-4',
  className
)}>
  <span className="vcx-section-label">카테고리</span>
  <h3 className="font-vcx-serif text-lg text-vcx-dark mt-2">제목</h3>
  <p className="font-vcx-sans text-sm text-vcx-sub-3 mt-1">설명</p>
</div>

// 강조 버튼
<button className="bg-vcx-dark text-vcx-beige font-vcx-sans text-sm vcx-label px-6 py-3 hover:bg-vcx-gold transition-colors">
  확인
</button>

// 섹션 헤더
<div className="border-b border-vcx-dark pb-3 mb-6">
  <span className="vcx-section-label">섹션명</span>
  <h2 className="font-vcx-serif text-2xl text-vcx-dark mt-1">페이지 제목</h2>
</div>
```
