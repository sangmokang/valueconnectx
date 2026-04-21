# ValueConnect X
## Product Requirements Document
**v5.1 · 2026년 3월**

검증된 핵심 인재 네트워크와 기업 리더를 연결하는 Private Talent Network

---

## 1. Product Definition

### 1.1 Overview

ValueConnect X는 검증된 핵심 인재 네트워크와 기업 의사결정자(CEO / Founder / C-Level)를 연결하는 Private Talent Network입니다.

현재 채용 시장에는 후보자의 커리어에 부정적 영향을 미치는 구조적 리스크가 존재합니다.

**Selective Hiring × Selective Talent**

기업은 더 적은 인원으로 높은 성과를 요구하고 있으며, 핵심 인재 역시 아무 기업과도 매칭되지 않습니다.

ValueConnect X는 이 두 집단이 신뢰 기반으로 연결되는 Private Network를 구축합니다.
경영자, 회사, 채용 채널에 존재하는 부정적 요소를 사전에 필터링하여, 후보자가 최선의 선택을 할 수 있도록 지속적으로 개선하고 있습니다.

---

## 2. User Roles

### 2.1 Member

VCX 네트워크에 참여하는 개인 사용자입니다.

#### Member Types

#### Core Member

조직에서 실질적인 영향력을 가진 핵심 인재입니다.

**선발 기준 (3개 이상 충족)**

| 기준 | 설명 |
|------|------|
| 조직 영향력 | 해당 인재가 떠나면 조직에 영향 |
| 동료 평판 | 업계 추천 반복 |
| 실행력 | 실제 성과 / 제품 / 프로젝트 |
| 기술 깊이 | 특정 영역 전문가 |
| 성장 궤도 | 리더 가능성 |
| 커리어 일관성 | 전문 분야 집중 |

#### Endorsed Member

Core Member가 추천한 인재입니다.

**조건**

- Core Member 추천
- ValueConnect 검토
- 초대 기반 가입

추천한 Core Member는 1차 신뢰 보증 역할을 합니다.

### 2.2 Corporate User

기업 사용자입니다.

**대상**

- CEO
- Founder
- C-Level
- 제한된 HR 리더

기업 사용자는 다음 기능을 이용할 수 있습니다.

- CEO Coffee Chat Session 생성
- VCX 후보자 소개 요청
- Private Networking

---

## 3. Access Model

ValueConnect X는 Invite-only Network입니다.

### 3.1 Invite Flow

**가입 프로세스**

```
Admin / Core Member
↓
추천 제출
↓
ValueConnect 검토
↓
초대 이메일 발송
↓
초대 링크 인증
↓
회원 가입 완료
```

### 3.2 Email Invite System

회원 가입은 이메일 초대 기반으로 진행됩니다.

1. 초대 이메일 발송
2. 이메일 인증
3. 계정 생성
4. 프로필 작성
5. 네트워크 참여

초대 링크는 **24시간 유효**합니다.

---

## 4. System Roles

### 4.1 Permission Structure

#### Super Admin

**예시**

- sangmokang@valueconnect.kr

**권한**

- 시스템 설정
- 멤버 승인
- 관리자 권한 관리
- 전체 데이터 접근

#### Admin

**권한**

- 멤버 관리
- 포지션 관리
- 커뮤니티 관리
- 기업 계정 관리

#### Member

**권한**

- Member Directory 열람
- Coffee Chat 참여
- Community Board 참여
- Position Board 열람

---

## 5. Core Features

### 5.1 Member Profile

각 멤버는 표준화된 Member Profile을 가집니다.

Member Profile은 다음 목적을 가집니다.

- Network 내 인재 탐색
- 커리어 신뢰 확보
- 채용 및 Coffee Chat 연결

모든 멤버는 가입 시 프로필을 작성해야 합니다.

**Profile Structure**

| 항목 | 설명 |
|------|------|
| Name | 실명 |
| Current Company | 현재 회사 |
| Title | 직무 |
| Professional Field | 전문 분야 태그 |
| Years of Experience | 총 경력 |
| Bio | 자기소개 |
| LinkedIn | LinkedIn URL (필수) |
| Member Tier | Core / Endorsed |
| Join Date | 가입일 |

LinkedIn 정보는 다음 목적을 가집니다.

- 커리어 검증
- Network 신뢰 확보
- 경력 투명성 유지

### 5.2 Member Directory

Member Directory는 네트워크 핵심 기능입니다.

**기능**

| 기능 | 설명 |
|------|------|
| 검색 | 이름 / 직군 / 전문 분야 |
| 필터 | 직무 / 산업 |
| 프로필 조회 | 멤버 상세 정보 |
| Network 탐색 | 멤버 연결 |

#### Anti-Scraping Policy

멤버 정보 보호를 위해 다음 제한을 둡니다.

| 조건 | 대응 |
|------|------|
| 1분 내 10 프로필 조회 | 경고 |
| 1분 내 20 프로필 조회 | 세션 종료 |
| 하루 50 프로필 조회 | 접근 제한 |
| 비정상 탐색 | IP 차단 |

### 5.3 Position Board

기업 포지션은 ValueConnect Admin이 등록합니다.

기업이 직접 포지션을 등록하지 않습니다.

**포지션 확보 방식**

```
CEO / HR 구두 동의
↓
ValueConnect 내부 등록
↓
Position Board 게시
```

**포지션 정보**

| 항목 | 설명 |
|------|------|
| 회사 | 회사명 |
| 포지션 | 직무 |
| 조직 규모 | 팀 규모 |
| 역할 | 주요 역할 |
| 연봉 밴드 | 선택 |

멤버는 다음 행동을 할 수 있습니다.

- 관심 있음
- 관심 없음
- 나중에 보기

### 5.4 Coffee Chat

VCX Network 내 멤버 간 Coffee Chat 기능입니다.

멤버는 서로 커리어 대화뿐 아니라 채용을 전제로 한 Coffee Chat도 진행할 수 있습니다.

**Coffee Chat Flow**

```
멤버 글 작성
↓
다른 멤버 신청
↓
작성자가 대화 상대 선택
↓
연락처 공개
↓
Coffee Chat 진행
```

#### 채용 연결 원칙

Coffee Chat을 통해 채용으로 이어지는 경우, 해당 채용은 ValueConnect의 소개·알선 구조를 통해 진행됩니다.

이는 **VCX Network의 중요한 운영 원칙**입니다.

#### 수수료 원칙

Coffee Chat 이후 채용이 성사될 경우, **ValueConnect 소개 수수료 적용**합니다.

#### Self Introduction Reward

멤버가 본인을 직접 추천하여 채용이 성사될 경우, **Self Introduction Reward를 지급**합니다.

이는 VCX Network의 파트너십 구조입니다.

### 5.5 CEO Coffee Chat

CEO가 Network에 참여하는 방식입니다.

#### Session 생성

CEO는 다음 형식으로 세션을 생성할 수 있습니다.

**예시**

- Series A 스타트업
- Product Leader와 대화하고 싶습니다

**Session Flow**

```
CEO 세션 생성
↓
멤버 신청
↓
CEO 선택
↓
1:1 Coffee Chat
```

#### Head Hunting Agreement

CEO Coffee Chat을 신청하는 기업은 세션 생성 시 약식 헤드헌팅 계약 조건에 동의해야 합니다.

**목적**

- 채용 발생 시 VCX를 우회하는 행동 방지

**채용이 발생할 경우**

- **ValueConnect 소개 수수료 적용**

### 5.6 Community Board

멤버 전용 커뮤니티 게시판입니다.

**카테고리**

- 커리어 고민
- 조직 고민, 리더쉽
- 연봉 협상
- 번아웃
- 생산성, News
- 이 회사 어때요?

CEO는 접근할 수 없습니다.

#### "이 회사 어때요?" 운영 정책

멤버가 특정 회사에 대한 실제 경험과 정보를 공유하는 카테고리입니다.

**작성 가이드라인**

- 사실 기반 정보만 허용
- 감정적 비방 및 근거 없는 주장 금지

**Privacy 원칙**

- 해당 카테고리의 모든 글은 채용 활용 불가 (Privacy Model 적용)

**모더레이션**

- 가이드라인 위반 글은 Admin이 즉시 삭제 가능
- 멤버 신고 기능 제공
- 반복 위반 시 작성 권한 제한

---

## 6. Hiring Risk Filter

### 6.1 Problem

현재 채용 시장에는 다음과 같은 구조적 리스크가 존재합니다.

| 리스크 유형 | 설명 |
|-------------|------|
| 경영자 리스크 | 비전 불일치, 불투명한 의사결정, 과장된 채용 조건 |
| 회사 리스크 | 재무 불안정, 조직 문화 괴리, 성장 정체 |
| 채용 채널 리스크 | 과장된 포지션 정보, 후보자 정보 무단 유통, 무분별한 매칭 |

### 6.2 VCX 필터링 원칙

ValueConnect X는 후보자가 최선의 커리어 선택을 할 수 있도록 다음을 지속적으로 반영합니다.

| 필터링 영역 | 방식 |
|-------------|------|
| 경영자 검증 | CEO / Founder 직접 참여, 세션 기반 신뢰 확인 |
| 회사 검증 | Admin 내부 등록 방식, 포지션 품질 관리 |
| 채널 신뢰 | Invite-only 구조, 멤버 정보 보호, Anti-Scraping |

### 6.3 운영 방향

- 후보자 보호가 최우선 원칙입니다
- 검증되지 않은 포지션은 게시하지 않습니다
- 부정적 요소가 확인된 기업은 네트워크에서 제외합니다
- 멤버 피드백을 기반으로 필터링 기준을 지속 개선합니다

---

## 7. Privacy Model

커뮤니티 데이터와 채용 데이터를 분리합니다.

| 데이터 | 채용 활용 |
|--------|----------|
| 커뮤니티 글 | 불가 |
| Coffee Chat 글 | 불가 |
| 활동 데이터 | 불가 |
| 포지션 관심 | 가능 |

---

## 8. Technology Stack

**초기 스택**

| Layer | Technology |
|-------|------------|
| Frontend | Next.js |
| Backend | Supabase |
| Auth | Supabase Auth |
| Email | Resend |
| Analytics | Mixpanel |

---

## 9. CLI Interface

엔지니어 사용자를 위한 터미널 인터페이스입니다.

**예시**

- `vcx jobs`
- `vcx coffee`
- `vcx connect`

**명령어**

| 명령어 | 기능 |
|--------|------|
| `vcx jobs` | Position Board 탐색 |
| `vcx coffee` | Coffee Chat 신청 |
| `vcx connect` | 멤버 연결 |

---

## 10. Development Roadmap

### Phase 1 (1~2개월)

**개발 기능**

- Invite System
- Login
- Member Profile
- Member Directory
- Position Board

**목표**

- Core Member 30명

### Phase 2 (3~5개월)

**개발 기능**

- Coffee Chat
- CEO Sessions
- Community Board

**목표**

- Core Member 60명
- 첫 채용 성사

### Phase 3 (6~10개월)

**개발 기능**

- 추천 시스템
- 매칭 기능
- 데이터 분석

**목표**

- 월 채용 성사 3건
