# CISO 보안 체크리스트 — ValueConnect X

## VCX 특화 위협 모델

VCX는 초대 전용 서비스로, 아래 3가지가 핵심 보안 자산이다:
1. **멤버 신원 정보** — 이름, LinkedIn, 현재 회사, 직함
2. **커뮤니티 익명성** — 작성자가 노출되면 서비스 신뢰 붕괴
3. **초대 토큰 무결성** — 아무나 가입 가능해지면 Exclusive 가치 파괴

---

## 1. Invite System 보안

### 1-1. 토큰 검증
```
테스트:
① 정상 토큰 접근 → 가입 진행 가능
② 만료된 토큰 (24h+) → 적절한 에러 페이지 (403/expired)
③ 이미 사용된 토큰 (used_at IS NOT NULL) → 차단
④ 존재하지 않는 토큰 UUID → 404 or 403
⑤ 토큰을 URL 파라미터에 노출 → Referrer 헤더로 제3자에게 누출 위험 확인
   예: /invite?token=xxx → 링크드인/구글 등 외부 링크 클릭 시 Referrer에 토큰 포함?
```

### 1-2. Rate Limiting
```
① 초대 링크 브루트포스 시도 — UUID를 무작위로 100번 시도
  → IP 레이트리밋이 발동하는가?
② 동일 이메일로 복수 초대 가입 시도
  → 중복 계정 생성 방지되는가?
```

---

## 2. 인증 보안

### 2-1. Magic Link 보안
```
① Magic Link URL 형식: 토큰이 충분히 랜덤한가? (최소 32바이트 엔트로피)
② 만료 시간: 15분~1시간 이내인가? (너무 길면 위험)
③ 1회 사용 후 무효화: 같은 링크로 재로그인 시도 → 차단?
④ 이메일 전송: Resend를 통해 TLS 암호화 전송인가?
```

### 2-2. 세션 보안
```
① Supabase JWT 저장 위치:
   - httpOnly Cookie: ✅ (XSS 방어)
   - localStorage: ❌ (XSS 취약)
   - sessionStorage: ⚠️ (탭 종료 시 소멸)
   
   확인 방법: DevTools → Application → Cookies vs localStorage

② JWT 만료 시간 확인:
   - Access Token: 1시간 이하 권장
   - Refresh Token: 7일~30일, httpOnly Cookie

③ 로그아웃 시 서버 토큰 무효화:
   - supabase.auth.signOut() 호출 확인
   - 로그아웃 후 이전 토큰으로 API 요청 → 401 반환?
```

---

## 3. 커뮤니티 익명성 보안

### 3-1. 데이터 분리 검증
```sql
-- 예상 RLS 정책 (실제 적용 확인)
CREATE POLICY "community_posts_select"
ON community_posts FOR SELECT
USING (auth.uid() IS NOT NULL);  -- 로그인 멤버만 조회 가능

-- 채용 활용 금지: is_recruiting_restricted = TRUE인 데이터는
-- 채용 관련 쿼리에서 제외되어야 함
```

확인 방법:
```
① /api/community/posts 응답에 author_id가 포함되는가?
   → 포함되어도 되지만, 해당 id로 멤버 신원 특정이 가능한지 확인
② 익명 글 API 응답에 이름, 이메일, 회사명 등이 노출되는가?
③ 비로그인 상태에서 커뮤니티 API 직접 호출 → 데이터 반환?
```

### 3-2. 익명성 우회 가능성
```
① 타이밍 공격: 특정 시간에 글이 올라온 것과 멤버 활동 로그 교차 분석?
   → 로그에 게시글 작성 이벤트가 개인 식별자와 함께 저장되지 않는가?
② 관리자 API: 어드민이 익명 글 작성자를 조회할 수 있는 API가 있는가?
   → 있다면 RLS가 아닌 어드민 권한으로 조회 → 남용 위험
③ Mixpanel 이벤트: 익명 글 작성 이벤트에 user_id가 포함되는가?
   → 포함 시 외부 분석 툴에서 익명성 우회 가능
```

---

## 4. Member Directory & IDOR

### 4-1. IDOR (Insecure Direct Object Reference)
```
테스트:
① 정상 멤버 프로필: /members/[my-id] → 내 프로필 조회 ✅
② 다른 멤버 ID로 접근: /members/[other-id] → 허용? 제한?
   (멤버끼리 프로필 조회 허용인 경우 OK, 비공개 필드 노출 여부 확인)
③ 비로그인으로 /members/[id] 직접 접근 → 401 리다이렉트?
④ 존재하지 않는 ID → 500 Error vs 404 (500은 내부 구조 노출 위험)
```

### 4-2. Anti-Scraping 실제 동작
```
테스트 스크립트:
for i in range(25):
    await page.goto(f"{VCX_URL}/members/{member_ids[i % len(member_ids)]}")
    await asyncio.sleep(0.5)  # 1분에 50건 시도

예상 동작:
- 10건: 경고 토스트
- 20건: 세션 종료
- 50건/일: IP 차단 (Cloudflare WAF)

실제 동작 기록
```

---

## 5. XSS & Injection

### 5-1. 커뮤니티 글/댓글 XSS
```
테스트 페이로드:
① <script>alert('xss')</script>
② <img src=x onerror="alert('xss')">
③ javascript:alert('xss')
④ "><script>alert('xss')</script>

확인: 위 페이로드가 저장 후 렌더링될 때 실행되는가?
→ dangerouslySetInnerHTML 사용 여부 코드 확인
→ DOMPurify 또는 sanitize-html 적용 여부
```

### 5-2. 관심사 태그 XSS
```
interest_tags 필드에 악성 태그 입력:
"<script>alert('xss')</script>"

→ 멤버 디렉터리에서 해당 태그가 렌더링될 때 실행되는가?
```

---

## 6. API 데이터 노출

### 6-1. 민감 필드 노출 확인
```python
# 확인할 API 엔드포인트
endpoints = [
    "/api/members",           # 멤버 목록
    "/api/members/[id]",      # 멤버 상세
    "/api/community/posts",   # 커뮤니티 글 목록
    "/api/positions",         # 포지션 목록
]

# 응답에서 아래 필드가 있으면 ❌
SENSITIVE_FIELDS = [
    "password", "password_hash",
    "invited_by_email",    # 추천인 이메일 노출
    "member_tier_internal",
    "supabase_id",
    "refresh_token",
    "invite_token",
]
```

### 6-2. 환경변수 클라이언트 노출
```javascript
// 브라우저 DevTools Console에서 실행
console.log(window.__NEXT_DATA__)

// 확인 항목:
// - SUPABASE_SERVICE_ROLE_KEY 포함 여부 (❌ 절대 안됨)
// - 내부 API 엔드포인트 노출 여부
// - 내부 webhook URL 노출 여부
```

---

## OWASP Top 10 매핑

| OWASP | VCX 관련 항목 |
|-------|-------------|
| A01 Broken Access Control | IDOR, 비로그인 API 접근, RLS 우회 |
| A02 Cryptographic Failures | 패스워드 저장 방식, 토큰 엔트로피 |
| A03 Injection | XSS in 커뮤니티 글, SQL Injection |
| A05 Security Misconfiguration | 환경변수 노출, 에러 메시지 내부 정보 노출 |
| A07 Identification/Auth Failures | 초대 토큰 재사용, 세션 관리 |
| A09 Security Logging Failures | 보안 이벤트 로깅 부재 |

---

## CISO 이슈 포맷

```
[CISO-N] {이슈명}
심각도: Critical / High / Medium / Low
OWASP: {A0N - 분류명}
재현 방법:
  1. {단계}
  2. {단계}
예상 피해: {실제 공격 시나리오}
즉시 조치: {코드/설정 수정 방법}
검증 방법: {수정 후 테스트 방법}
```