# SKILL: Vitest 테스팅 — ValueConnect X 전용 교과서

> AI 코딩 에이전트가 VCX 프로젝트에서 테스트를 작성할 때 반드시 참조하는 규범 문서.
> 이 파일의 규칙은 일반적인 Vitest 관행보다 우선한다.

---

## 목차

1. [프로젝트 테스트 구조](#1-프로젝트-테스트-구조)
2. [CRITICAL: lucide-react 금지 규칙](#2-critical-lucide-react-금지-규칙)
3. [vi.hoisted() 패턴 — Supabase mock 필수](#3-vihoisted-패턴--supabase-mock-필수)
4. [beforeEach 필수 패턴](#4-beforeeach-필수-패턴)
5. [렌더 제한 규칙](#5-렌더-제한-규칙)
6. [Supabase 체인 mock 패턴](#6-supabase-체인-mock-패턴)
7. [금지 패턴 총정리](#7-금지-패턴-총정리)
8. [명령어 레퍼런스](#8-명령어-레퍼런스)
9. [파일 작성 체크리스트](#9-파일-작성-체크리스트)

---

## 1. 프로젝트 테스트 구조

### 디렉토리 레이아웃

```
src/
└── __tests__/
    ├── setup.ts                    # 전역 setup (자동 실행)
    ├── utils/
    │   └── supabase-mock.ts        # 공용 Supabase mock 유틸
    ├── app/                        # src/app/ 구조 미러링
    ├── components/                 # src/components/ 구조 미러링
    ├── lib/                        # src/lib/ 구조 미러링
    └── types/                      # src/types/ 구조 미러링
```

### 규칙

- **DO**: 테스트 파일은 소스 파일과 동일한 경로에 위치시킨다.
  - 소스: `src/components/directory/MemberCard.tsx`
  - 테스트: `src/__tests__/components/directory/MemberCard.test.tsx`
- **DO**: `@/` alias를 사용한다. `vitest.config.ts`에서 `./src/*`로 매핑되어 있다.
- **DO**: 테스트 환경은 `jsdom`이다. DOM API 사용 가능.
- **DO**: setup 파일(`src/__tests__/setup.ts`)은 모든 테스트 전에 자동 실행된다.

---

## 2. CRITICAL: lucide-react 금지 규칙

> **이 규칙을 위반하면 테스트가 영원히 멈춘다(무한 hang). 복구 불가.**

### 문제

`vi.importActual('lucide-react')`를 호출하면 lucide-react의 모든 아이콘 모듈을 실제로 로드하려 시도하고, 이 과정에서 테스트 프로세스가 무한 대기 상태에 빠진다.

### 금지 패턴

```typescript
// ❌ 절대 금지 — 무한 hang 발생
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react')
  return { ...actual }
})

// ❌ 금지 — importActual 사용 자체가 위험
const actual = await vi.importActual<typeof import('lucide-react')>('lucide-react')
```

### 올바른 패턴

```typescript
// ✅ 완전 mock — 사용하는 아이콘만 나열
vi.mock('lucide-react', () => ({
  Search: () => 'SearchIcon',
  X: () => 'XIcon',
  ChevronDown: () => 'ChevronDownIcon',
  User: () => 'UserIcon',
  Settings: () => 'SettingsIcon',
  // 해당 컴포넌트에서 import하는 아이콘만 추가
}))
```

### 아이콘 mock 작성 규칙

1. 컴포넌트 소스에서 `import { ... } from 'lucide-react'`를 확인한다.
2. 사용된 아이콘만 mock 객체에 포함한다.
3. mock 함수는 문자열을 반환하는 단순 화살표 함수로 충분하다.
4. `() => null` 또는 `() => <svg />`도 허용되지만 문자열이 가장 단순하다.

---

## 3. vi.hoisted() 패턴 — Supabase mock 필수

### 왜 hoisted가 필요한가

`vi.mock()` 호출은 파일 최상단으로 호이스팅되지만, 일반 변수 선언은 그렇지 않다. mock 팩토리 함수 안에서 외부 변수를 참조하면 "변수가 초기화되기 전에 참조" 오류가 발생한다. `vi.hoisted()`는 이 문제를 해결한다.

### 표준 패턴

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// 1단계: vi.hoisted()로 mock 함수를 먼저 선언
const { mockGetUser, mockFrom, mockSelect } = vi.hoisted(() => {
  const mockGetUser = vi.fn()
  const mockFrom = vi.fn()
  const mockSelect = vi.fn()
  return { mockGetUser, mockFrom, mockSelect }
})

// 2단계: vi.mock()에서 hoisted 변수를 참조
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

// 3단계: 테스트 내에서 mock 동작 설정
describe('MyComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@vcx.com' } },
      error: null,
    })
  })

  it('인증된 사용자에게 콘텐츠를 표시한다', async () => {
    // ...
  })
})
```

### Route Handler 테스트 패턴

```typescript
import { NextRequest } from 'next/server'

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))
```

---

## 4. beforeEach 필수 패턴

### 규칙

모든 `describe` 블록은 `beforeEach`에서 mock을 초기화해야 한다. 테스트 간 상태 누수를 방지한다.

```typescript
beforeEach(() => {
  // ✅ 필수: 모든 mock 초기화
  vi.clearAllMocks()

  // ✅ 권장: 기본 성공 상태 설정
  mockGetUser.mockResolvedValue({
    data: { user: { id: 'user-123' } },
    error: null,
  })
})
```

### DO / DON'T

```typescript
// ✅ DO: beforeEach에서 clearAllMocks
beforeEach(() => {
  vi.clearAllMocks()
  setupDefaultMocks()
})

// ❌ DON'T: afterEach에서만 정리 (테스트 실행 순서 의존성 생김)
afterEach(() => {
  vi.clearAllMocks() // 불충분
})

// ❌ DON'T: clearAllMocks 없이 각 테스트에서 mock 재설정
it('test', () => {
  mockGetUser.mockResolvedValue({ data: null, error: null })
  // 이전 테스트의 다른 mock이 남아있을 수 있다
})
```

---

## 5. 렌더 제한 규칙

### 규칙

**파일 하나당 `render()` 호출 최대 6회.**

메모리 사용량과 실행 시간이 급격히 증가하는 것을 방지한다.

### 위반 시 대응

```typescript
// ❌ DON'T: 한 파일에 render 7회 이상
describe('MemberCard', () => {
  it('이름을 표시한다', () => { render(<MemberCard />) })          // 1
  it('타이틀을 표시한다', () => { render(<MemberCard />) })        // 2
  it('회사를 표시한다', () => { render(<MemberCard />) })          // 3
  it('뱃지를 표시한다', () => { render(<MemberCard />) })          // 4
  it('클릭 이벤트', () => { render(<MemberCard />) })              // 5
  it('로딩 상태', () => { render(<MemberCard />) })                 // 6
  it('에러 상태', () => { render(<MemberCard />) })                 // 7 — 금지!
  it('빈 상태', () => { render(<MemberCard />) })                   // 8 — 금지!
})
```

```typescript
// ✅ DO: 관련 assertion을 하나의 it에 묶거나 파일을 분할
it('기본 정보를 모두 표시한다', () => {
  render(<MemberCard name="김철수" title="CTO" company="VCX" />)
  expect(screen.getByText('김철수')).toBeInTheDocument()
  expect(screen.getByText('CTO')).toBeInTheDocument()
  expect(screen.getByText('VCX')).toBeInTheDocument()
})
```

```
// ✅ DO: 파일 분할
MemberCard.test.tsx          — 기본 렌더링 (≤6 renders)
MemberCard.interaction.test.tsx — 인터랙션 테스트 (≤6 renders)
```

---

## 6. Supabase 체인 mock 패턴

### 표준 체인 mock 객체

Supabase 쿼리는 메서드 체인으로 구성된다. `mockReturnThis()`로 체이닝을 지원하고 마지막 메서드만 실제 값을 반환한다.

```typescript
const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  filter: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  // 체인 없이 바로 resolve되는 경우 (await supabase.from(...).select(...))
  // 위에서 select가 mockReturnThis이므로 체인 마지막에 묵시적 resolve 필요 시:
  // then: 직접 사용하지 않고 아래처럼 처리
}

// mockFrom은 항상 mockChain을 반환
mockFrom.mockReturnValue(mockChain)
```

### 쿼리 결과 오버라이드

```typescript
it('멤버 목록을 반환한다', async () => {
  const mockMembers = [
    { id: '1', name: '김철수', tier: 'core' },
    { id: '2', name: '이영희', tier: 'endorsed' },
  ]

  // 특정 테스트에서만 다른 값 반환
  mockChain.select.mockReturnThis()
  mockChain.order.mockResolvedValue({ data: mockMembers, error: null })

  // ... 테스트 로직
})
```

### insert / update / delete 패턴

```typescript
const mockInsertChain = {
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: { id: 'new-id' }, error: null }),
}

mockFrom.mockReturnValue(mockInsertChain)
```

---

## 7. 금지 패턴 총정리

| 금지 패턴 | 올바른 대안 | 이유 |
|-----------|-------------|------|
| `jest.fn()` | `vi.fn()` | Vitest 프로젝트 |
| `jest.mock()` | `vi.mock()` | Vitest 프로젝트 |
| `jest.spyOn()` | `vi.spyOn()` | Vitest 프로젝트 |
| `vi.importActual('lucide-react')` | 완전 mock 작성 | 무한 hang |
| 실제 Supabase 연결 | 항상 mock | 테스트 환경에 DB 없음 |
| `render()` 7회 이상 / 파일 | 파일 분할 또는 assertion 묶기 | 메모리/성능 |
| mock 변수를 `vi.hoisted()` 없이 `vi.mock()` 팩토리에서 참조 | `vi.hoisted()` 사용 | 초기화 순서 오류 |
| `beforeEach` 없이 mock 상태 공유 | `beforeEach(() => vi.clearAllMocks())` | 테스트 간 오염 |
| `import { render } from '@testing-library/react'` — 7번째 render | it 블록 병합 또는 파일 분리 | 성능 |

```typescript
// ❌ 금지 패턴 모음
jest.fn()                                        // jest → vi
jest.mock('@/lib/something')                      // jest → vi
const actual = await vi.importActual('lucide-react') // 무한 hang
const client = createClient()                    // 실제 Supabase 연결

// ✅ 올바른 패턴 모음
vi.fn()
vi.mock('@/lib/something', () => ({ ... }))
vi.mock('lucide-react', () => ({ Search: () => 'SearchIcon' }))
// Supabase는 항상 vi.hoisted() + vi.mock()으로
```

---

## 8. 명령어 레퍼런스

```bash
# 전체 단위 테스트 실행
npm test

# Watch 모드 (개발 중 실시간 피드백)
npm run test:watch

# 특정 파일만 실행
npx vitest run src/__tests__/components/directory/MemberCard.test.tsx

# 특정 테스트 이름 패턴으로 실행
npx vitest run --testNamePattern="멤버 목록"

# 커버리지 리포트
npx vitest run --coverage

# Playwright e2e 테스트
npm run test:e2e

# e2e 특정 파일
npx playwright test e2e/auth.spec.ts

# e2e UI 모드 (디버깅)
npx playwright test --ui
```

---

## 9. 파일 작성 체크리스트

테스트 파일을 새로 작성할 때 아래 항목을 순서대로 확인한다.

```
[ ] 파일 위치: src/__tests__/ 하위에 소스 경로 미러링
[ ] import: vi, describe, it, expect, beforeEach — vitest에서
[ ] lucide-react: vi.importActual 미사용, 완전 mock 작성
[ ] Supabase mock: vi.hoisted() → vi.mock() 순서로 작성
[ ] beforeEach: vi.clearAllMocks() + 기본 mock 상태 설정
[ ] render 횟수: 파일당 6회 이하
[ ] Supabase 체인: mockReturnThis() 체인 구성 확인
[ ] jest 키워드: 코드 내 jest.* 전혀 없는지 확인
[ ] 실제 네트워크/DB 호출: 없는지 확인
[ ] 경로 alias: @/ 사용 (상대 경로 ../../../ 금지)
```

---

## 부록: 전체 테스트 파일 예시

```typescript
// src/__tests__/components/directory/MemberCard.test.tsx

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MemberCard from '@/components/directory/MemberCard'

// lucide-react 완전 mock (importActual 절대 금지)
vi.mock('lucide-react', () => ({
  User: () => 'UserIcon',
  ExternalLink: () => 'ExternalLinkIcon',
  Star: () => 'StarIcon',
}))

// Supabase mock — vi.hoisted() 필수
const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  })),
}))

const mockChain = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
}

describe('MemberCard', () => {
  beforeEach(() => {
    vi.clearAllMocks() // 필수
    mockFrom.mockReturnValue(mockChain)
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    })
  })

  it('멤버 이름과 직책을 표시한다', () => {       // render 1
    render(<MemberCard name="김철수" title="CTO" company="ValueConnect" tier="core" />)
    expect(screen.getByText('김철수')).toBeInTheDocument()
    expect(screen.getByText('CTO')).toBeInTheDocument()
    expect(screen.getByText('ValueConnect')).toBeInTheDocument()
  })

  it('core 티어 뱃지를 표시한다', () => {         // render 2
    render(<MemberCard name="이영희" title="CPO" company="VCX" tier="core" />)
    expect(screen.getByText('Core')).toBeInTheDocument()
  })

  it('endorsed 티어 뱃지를 표시한다', () => {     // render 3
    render(<MemberCard name="박민수" title="VP" company="ABC" tier="endorsed" />)
    expect(screen.getByText('Endorsed')).toBeInTheDocument()
  })

  it('클릭 시 onSelect 콜백을 호출한다', () => {  // render 4
    const onSelect = vi.fn()
    render(<MemberCard name="최지현" title="CTO" company="DEF" tier="core" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledOnce()
  })
})
// 총 render 호출: 4회 (제한 6회 이내)
```
