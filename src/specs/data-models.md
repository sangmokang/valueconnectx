# Data Models & API Interface Spec

## 1. Overview

ValueConnect X의 프론트엔드에서 사용하는 데이터 모델(TypeScript 타입)과 API 인터페이스 정의.
Backend는 Supabase 기반이며, Auth는 Supabase Auth를 사용합니다.

---

## 2. Core Data Models

### 2.1 User & Member

```typescript
// 멤버 등급
type MemberTier = 'core' | 'endorsed';

// 시스템 권한
type SystemRole = 'super_admin' | 'admin' | 'member';

// 전문 분야 (태그)
type ProfessionalField =
  | 'engineering'
  | 'product'
  | 'design'
  | 'marketing'
  | 'sales'
  | 'operations'
  | 'finance'
  | 'hr'
  | 'data'
  | 'legal'
  | string; // 확장 가능

// 멤버 프로필
interface MemberProfile {
  id: string;                        // UUID
  name: string;                      // 실명
  email: string;                     // 이메일 (unique)
  currentCompany: string;            // 현재 회사
  title: string;                     // 직무/직함
  professionalFields: ProfessionalField[]; // 전문 분야 태그 (복수)
  yearsOfExperience: number;         // 총 경력 (년)
  bio: string;                       // 자기소개
  linkedinUrl: string;               // LinkedIn URL (필수)
  memberTier: MemberTier;            // Core / Endorsed
  systemRole: SystemRole;            // 시스템 권한
  joinDate: string;                  // ISO 8601 가입일
  endorsedBy?: string;               // Endorsed 멤버인 경우 추천한 Core Member ID
  endorsedByName?: string;           // 추천인 이름 (display용)
  avatarUrl?: string;                // 프로필 이미지 URL
  isActive: boolean;                 // 활성 상태
  createdAt: string;                 // ISO 8601
  updatedAt: string;                 // ISO 8601
}
```

### 2.2 Corporate User

```typescript
// 기업 사용자 유형
type CorporateRole = 'ceo' | 'founder' | 'c_level' | 'hr_leader';

interface CorporateUser {
  id: string;
  name: string;
  email: string;
  company: string;
  role: CorporateRole;
  title: string;                     // 구체적 직함 (e.g., "CTO")
  isVerified: boolean;               // ValueConnect 검증 여부
  createdAt: string;
  updatedAt: string;
}
```

### 2.3 Invite

```typescript
type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

interface Invite {
  id: string;
  email: string;                     // 초대 대상 이메일
  invitedBy: string;                 // 초대자 ID (Admin or Core Member)
  invitedByName: string;             // 초대자 이름
  memberTier: MemberTier;            // 초대 시 부여할 등급
  status: InviteStatus;
  token: string;                     // 초대 링크 토큰
  expiresAt: string;                 // 24시간 유효 (ISO 8601)
  acceptedAt?: string;
  createdAt: string;
}
```

### 2.4 Position

```typescript
type PositionInterest = 'interested' | 'not_interested' | 'save_for_later';

interface Position {
  id: string;
  company: string;                   // 회사명
  positionTitle: string;             // 포지션 (직무)
  teamSize?: string;                 // 조직 규모 (e.g., "10명")
  responsibilities: string;          // 주요 역할
  salaryBand?: string;               // 연봉 밴드 (선택, e.g., "1억~1.5억")
  tags: string[];                    // 태그 (직군, 기술스택 등)
  isActive: boolean;                 // 게시 상태
  registeredBy: string;              // Admin ID (등록자)
  createdAt: string;
  updatedAt: string;
}

// 멤버의 포지션 반응
interface PositionReaction {
  id: string;
  memberId: string;
  positionId: string;
  reaction: PositionInterest;
  createdAt: string;
}
```

### 2.5 Coffee Chat (Peer)

```typescript
type CoffeeChatStatus = 'open' | 'in_progress' | 'closed';

interface CoffeeChatPost {
  id: string;
  authorId: string;                  // 작성자 ID
  authorName: string;                // 작성자 이름
  authorTitle: string;               // 작성자 직함
  authorTier: MemberTier;            // 작성자 등급
  title: string;                     // 제목
  content: string;                   // 사연 내용
  tags: string[];                    // 태그
  status: CoffeeChatStatus;
  secretApplyCount: number;          // 비밀 신청 건수
  isNew: boolean;                    // NEW 뱃지 표시 (48시간 이내)
  createdAt: string;
  updatedAt: string;
}

// 비밀 댓글 (신청)
interface CoffeeChatApplication {
  id: string;
  postId: string;                    // 대상 게시글 ID
  applicantId: string;               // 신청자 ID
  applicantName: string;
  applicantTitle: string;
  applicantTier: MemberTier;
  introMessage: string;              // 자기소개 메시지
  isSelected: boolean;               // 작성자가 선택했는지
  createdAt: string;
}
```

### 2.6 CEO Coffee Chat

```typescript
type CEOSessionStatus = 'open' | 'in_progress' | 'closed';

interface CEOCoffeeChatSession {
  id: string;
  corporateUserId: string;           // CEO/기업 사용자 ID
  ceoName: string;                   // CEO 이름
  company: string;                   // 회사명
  ceoTitle: string;                  // 직함
  topic: string;                     // 세션 주제
  lookingFor: string;                // 찾는 인재 요건
  status: CEOSessionStatus;
  applicationCount: number;          // 신청 건수
  hasAgreedToHHA: boolean;           // Head Hunting Agreement 동의 여부
  createdAt: string;
  updatedAt: string;
}

// CEO 세션 신청
interface CEOSessionApplication {
  id: string;
  sessionId: string;
  memberId: string;
  memberName: string;
  memberTitle: string;
  memberTier: MemberTier;
  introMessage: string;
  isSelected: boolean;
  createdAt: string;
}
```

### 2.7 Community Board

```typescript
type CommunityCategory =
  | 'career'           // 커리어 고민
  | 'organization'     // 조직 고민·리더쉽
  | 'salary'           // 연봉 협상
  | 'burnout'          // 번아웃
  | 'productivity'     // 생산성·News
  | 'company_review';  // 이 회사 어때요?

interface CommunityPost {
  id: string;
  authorId: string;                  // 작성자 ID (서버에서만 알 수 있음)
  category: CommunityCategory;
  title: string;
  content: string;
  tags: string[];
  commentCount: number;
  isReported: boolean;               // 신고 접수 여부
  createdAt: string;
  updatedAt: string;
}

interface CommunityComment {
  id: string;
  postId: string;
  authorId: string;                  // 익명 처리
  content: string;
  isReported: boolean;
  createdAt: string;
}
```

---

## 3. API Interface

### 3.1 Convention

- Base path: `/api`
- 응답 형식: JSON
- 인증: Supabase Auth JWT (Bearer token)
- 날짜: ISO 8601 형식

### 3.2 Common Response

```typescript
interface ApiResponse<T> {
  data: T;
  error?: string;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
  };
}
```

### 3.3 Endpoints

#### Members

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/members` | 멤버 목록 (검색/필터) | Member |
| GET | `/api/members/:id` | 멤버 상세 | Member |
| PUT | `/api/members/:id` | 프로필 수정 | Owner |
| GET | `/api/members/me` | 내 프로필 | Member |

**Query Parameters (GET /api/members):**

| Param | Type | Description |
|-------|------|-------------|
| `q` | string | 이름/직군/전문분야 검색 |
| `tier` | `core` \| `endorsed` | 등급 필터 |
| `field` | string | 전문 분야 필터 |
| `page` | number | 페이지 번호 (default: 1) |
| `pageSize` | number | 페이지 크기 (default: 20) |

#### Invites

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/invites` | 초대 생성 | Admin / Core |
| GET | `/api/invites/verify/:token` | 초대 토큰 확인 | Public |
| POST | `/api/invites/accept` | 초대 수락 + 가입 | Public |

#### Positions

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/positions` | 포지션 목록 | Member |
| GET | `/api/positions/:id` | 포지션 상세 | Member |
| POST | `/api/positions` | 포지션 등록 | Admin |
| POST | `/api/positions/:id/reaction` | 관심 표명 | Member |

#### Coffee Chat (Peer)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/coffee-chat` | 게시글 목록 | Member |
| GET | `/api/coffee-chat/:id` | 게시글 상세 | Member |
| POST | `/api/coffee-chat` | 게시글 작성 | Member |
| POST | `/api/coffee-chat/:id/apply` | 비밀 신청 | Member |
| GET | `/api/coffee-chat/:id/applications` | 신청 목록 (작성자만) | Author |
| POST | `/api/coffee-chat/:id/select/:applicationId` | 신청자 선택 | Author |

#### CEO Coffee Chat

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/ceo-sessions` | 세션 목록 | Member |
| GET | `/api/ceo-sessions/:id` | 세션 상세 | Member |
| POST | `/api/ceo-sessions` | 세션 생성 | Corporate |
| POST | `/api/ceo-sessions/:id/apply` | 세션 신청 | Member |
| GET | `/api/ceo-sessions/:id/applications` | 신청 목록 (CEO만) | Corporate |
| POST | `/api/ceo-sessions/:id/select/:applicationId` | 멤버 선택 | Corporate |

#### Community Board

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/community` | 게시글 목록 | Member |
| GET | `/api/community/:id` | 게시글 상세 | Member |
| POST | `/api/community` | 게시글 작성 | Member |
| POST | `/api/community/:id/comments` | 댓글 작성 | Member |
| POST | `/api/community/:id/report` | 신고 | Member |

**Query Parameters (GET /api/community):**

| Param | Type | Description |
|-------|------|-------------|
| `category` | CommunityCategory | 카테고리 필터 |
| `page` | number | 페이지 번호 |
| `pageSize` | number | 페이지 크기 |

---

## 4. Privacy Model (Data Boundary)

### 채용 활용 가능 데이터

| Data | 채용 활용 |
|------|----------|
| 포지션 관심 (PositionReaction) | **가능** |
| Member Profile (공개 정보) | **가능** |

### 채용 활용 불가 데이터

| Data | 채용 활용 |
|------|----------|
| 커뮤니티 게시글/댓글 | **불가** |
| Coffee Chat 게시글/신청 | **불가** |
| 활동 데이터 (로그인, 조회 등) | **불가** |

---

## 5. Anti-Scraping Rate Limits

| Condition | Action |
|-----------|--------|
| 1분 내 10 프로필 조회 | 경고 표시 |
| 1분 내 20 프로필 조회 | 세션 종료 |
| 1일 50 프로필 조회 | 접근 제한 (24시간) |
| 비정상 탐색 패턴 | IP 차단 |

---

## 6. Supabase Table Mapping

| Model | Supabase Table | RLS Policy |
|-------|---------------|------------|
| MemberProfile | `members` | authenticated read, owner write |
| CorporateUser | `corporate_users` | admin manage |
| Invite | `invites` | admin/core create, public verify |
| Position | `positions` | admin create, member read |
| PositionReaction | `position_reactions` | member create/read own |
| CoffeeChatPost | `coffee_chat_posts` | member read/create |
| CoffeeChatApplication | `coffee_chat_applications` | member create, author read |
| CEOCoffeeChatSession | `ceo_sessions` | corporate create, member read |
| CEOSessionApplication | `ceo_session_applications` | member create, corporate read |
| CommunityPost | `community_posts` | member read/create (CEO blocked) |
| CommunityComment | `community_comments` | member read/create |
