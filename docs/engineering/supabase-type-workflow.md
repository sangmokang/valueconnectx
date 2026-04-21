# Supabase Type Workflow

ValueConnect X는 현재 Supabase CLI를 devDependency로 설치하지 않고 `src/types/supabase.ts`를 수동으로 관리합니다.

---

## 현재 구조

```
src/types/
├── supabase.ts          # 수동 관리 타입 (현재 사용 중)
├── supabase-generated.ts # CLI 자동 생성 시 출력 대상 (gitignore 가능)
└── index.ts             # 도메인 타입 (Member, Position 등)
```

---

## 수동 타입 관리 규칙

### 1. 새 테이블 추가 시

`src/types/supabase.ts`의 `Database.public.Tables`에 Row / Insert / Update 세 가지 타입을 모두 추가한다.

```ts
my_new_table: {
  Relationships: []
  Row: {
    id: string
    // ... 모든 컬럼
  }
  Insert: {
    id?: string
    // ... optional 처리된 컬럼
  }
  Update: {
    // ... 모두 optional
  }
}
```

### 2. 컬럼 추가/변경 시

- Row, Insert, Update 세 섹션을 모두 업데이트한다.
- nullable 컬럼은 반드시 `T | null` 로 표기한다.
- DB default가 있는 Insert 컬럼은 `?` (optional)로 표기한다.

### 3. RPC 함수 추가 시

`Database.public.Functions`에 Args / Returns 타입을 추가한다.

```ts
my_rpc_function: {
  Args: { p_param: string }
  Returns: boolean
}
```

### 4. FTS 컬럼

`fts` 컬럼은 PostgreSQL `tsvector` 타입이며 TypeScript에서 `unknown | null`로 표기한다.
`.textSearch('fts', query)` 패턴으로 사용한다.

---

## 마이그레이션 시 타입 동기화 체크리스트

DB 스키마를 변경할 때마다 아래를 순서대로 수행한다.

- [ ] Supabase SQL Editor 또는 마이그레이션 파일에서 스키마 변경 적용
- [ ] `src/types/supabase.ts`의 해당 테이블 Row / Insert / Update 업데이트
- [ ] `npm run build` 실행 → TypeScript 타입 에러 0개 확인
- [ ] 관련 API route의 `.select()` 컬럼 목록이 새 스키마와 일치하는지 검토
- [ ] PR description에 "supabase.ts 타입 동기화 완료" 명시

---

## Supabase CLI 자동 생성으로 전환하는 방법

### 설치

```bash
npm install --save-dev supabase
```

### `.env.local`에 프로젝트 ID 추가

```
SUPABASE_PROJECT_ID=your-project-ref-here
```

### 타입 생성 실행

```bash
npm run db:types
# → src/types/supabase-generated.ts 생성됨
```

`package.json`의 `db:types` 스크립트가 이미 등록되어 있다:

```json
"db:types": "supabase gen types typescript --project-id $SUPABASE_PROJECT_ID > src/types/supabase-generated.ts"
```

### 전환 절차

1. `npm run db:types` 실행
2. `src/types/supabase-generated.ts`와 현재 `src/types/supabase.ts`를 diff 비교
3. 차이가 없으면 `supabase.ts`를 `supabase-generated.ts`의 내보내기로 교체:

```ts
// src/types/supabase.ts
export type { Database } from './supabase-generated'
```

4. `npm run build`로 검증
5. `src/types/supabase-generated.ts`를 `.gitignore`에 추가하고 CI에서 재생성하도록 설정

---

## 알려진 drift 이력

| 날짜 | 항목 | 설명 |
|------|------|------|
| 2026-03-25 | `vcx_members.fts` | tsvector FTS 컬럼 누락 → `unknown \| null` 타입으로 추가 |
| 2026-03-25 | `community/[id]/route.ts` | `.from('members')` → `.from('vcx_members')` 수정 |
| 2026-03-25 | `positions/[id]/route.ts` | `.from('members')` → `.from('vcx_members')` 수정 |
