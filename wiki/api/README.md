# API 엔드포인트 레퍼런스

## 엔드포인트 목록 (49개)

### Admin (4)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/admin/analytics` | 관리자 대시보드 통계 |
| GET/POST | `/api/admin/hiring-records` | 채용 기록 관리 |
| PATCH/DELETE | `/api/admin/hiring-records/[id]` | 채용 기록 수정/삭제 |
| GET/POST | `/api/admin/positions` | 관리자 포지션 관리 |

### CEO 커피챗 (7)
| Method | Path | 설명 |
|--------|------|------|
| GET/POST | `/api/ceo-coffeechat` | 세션 목록/생성 |
| GET/PATCH/DELETE | `/api/ceo-coffeechat/[id]` | 세션 상세/수정/삭제 |
| GET/POST | `/api/ceo-coffeechat/[id]/applications` | 신청 목록/관리 |
| PATCH | `/api/ceo-coffeechat/[id]/applications/[appId]` | 신청 상태 변경 |
| POST | `/api/ceo-coffeechat/[id]/apply` | 세션 신청 |
| GET | `/api/ceo-coffeechat/[id]/brief` | AI 브리프 조회 |
| POST | `/api/ceo-coffeechat/[id]/feedback` | 피드백 제출 |

### 피어 커피챗 (5)
| Method | Path | 설명 |
|--------|------|------|
| GET/POST | `/api/peer-coffeechat` | 피어챗 목록/생성 |
| GET/PATCH/DELETE | `/api/peer-coffeechat/[id]` | 피어챗 상세/수정/삭제 |
| GET/POST | `/api/peer-coffeechat/[id]/applications` | 신청 관리 |
| PATCH | `/api/peer-coffeechat/[id]/applications/[appId]` | 신청 상태 변경 |
| POST | `/api/peer-coffeechat/[id]/apply` | 피어챗 신청 |

### 커뮤니티 (6)
| Method | Path | 설명 |
|--------|------|------|
| GET/POST | `/api/community` | 게시글 목록/작성 |
| GET/PATCH/DELETE | `/api/community/[id]` | 게시글 상세/수정/삭제 |
| GET/POST | `/api/community/[id]/comments` | 댓글 |
| POST | `/api/community/[id]/reaction` | 리액션 |
| POST | `/api/community/[id]/report` | 신고 |
| GET | `/api/community/reports` | 신고 목록 (관리자) |

### 디렉토리 (3)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/directory` | 멤버 목록 |
| GET | `/api/directory/me` | 내 프로필 |
| GET/PATCH | `/api/directory/[id]` | 멤버 상세/수정 |

### 포지션 (4)
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/positions` | 포지션 목록 |
| GET | `/api/positions/[id]` | 포지션 상세 |
| POST | `/api/positions/[id]/interest` | 관심 표현 |
| GET | `/api/positions/matches` | 매칭 결과 |

### 피드 (4)
| Method | Path | 설명 |
|--------|------|------|
| GET/POST | `/api/feed` | 피드 목록/작성 |
| POST | `/api/feed/[id]/response` | 피드 응답 |
| GET/POST | `/api/feed/interests` | 관심 주제 |
| POST | `/api/feed/subscribe` | 구독 |

### 초대/추천 (10)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/invites/accept` | 초대 수락 |
| POST | `/api/invites/direct` | 직접 초대 |
| GET | `/api/invites/list` | 초대 목록 |
| POST | `/api/invites/[id]/revoke` | 초대 취소 |
| GET | `/api/invites/verify/[token]` | 토큰 검증 |
| POST | `/api/recommendations` | 추천 생성 |
| GET | `/api/recommendations/list` | 추천 목록 |
| POST | `/api/recommendations/[id]/approve` | 추천 승인 |
| POST | `/api/recommendations/[id]/reject` | 추천 거절 |
| GET | `/api/recommendations/matches` | 추천 매칭 |

### 기업/기타 (6)
| Method | Path | 설명 |
|--------|------|------|
| POST | `/api/corporate-users` | 기업 사용자 등록 |
| GET | `/api/corporate-users/list` | 기업 사용자 목록 |
| POST | `/api/corporate-users/[id]/verify` | 기업 사용자 검증 |
| GET | `/api/notifications` | 알림 목록 |
| GET | `/api/ops/health` | 시스템 헬스체크 |
| GET | `/api/pillars` | 필러 목록 |
