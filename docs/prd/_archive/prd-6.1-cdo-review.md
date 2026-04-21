# PRD v6.1 CDO 관점 전면 재검토

> **대상 문서**: `docs/prd6.1.md` (2026-04-19 rev 3)
> **작성**: 2026-04-19, Claude (CDO persona)
> **목적**: Critic round 2 승인 전 데이터 아키텍처·비즈니스 방향·거버넌스 공백 점검

---

## 한 줄 결론

**"Phase 3 AI Match를 위해 데이터를 심는다"는 방향은 옳다. 하지만 지금 설계로는 30→300에서 데이터 계약·거버넌스·PII 부채가 터진다.** 특히 `activity_events`·`tag_canonical`·`match_features`를 '테이블 3개'로 축약한 것이 본질적 문제다. 이건 **데이터 프로덕트**지 스키마가 아니다.

---

## 1. 잘한 것 (CDO가 인정)

| # | 잘한 결정 | 이유 |
|---|---------|----|
| A | Phase 1에 `activity_events` 테이블을 심은 것 | Phase 3 cold-start 방어. 사용자가 드물게 보는 혜안. |
| B | 태그 **raw + canonical 이원화** 원칙 | 자유 태그 UX와 구조화 분석을 분리. 정공법. |
| C | **Mixpanel은 analytics-only mirror**, Supabase가 source of truth | 데이터 주권을 지키는 유일한 답. |
| D | ADR로 Consequences·Alternatives를 명시 | 추후 번복 추적 가능. 드문 수준. |
| E | Pre-flight gates(G1~G4) | Phase 1 스코프 크립 방지 장치로 실효성 있음. |

여기까지는 PM·CTO 급 사고다. **아래부터는 CDO 렌즈에서만 보이는 구멍이다.**

---

## 2. 데이터 아키텍처 — 치명적 결함 7가지

### 🔴 D1. `activity_events` 스키마가 "테이블"이지 "이벤트 계약"이 아니다

현 설계: `id, actor_id, actor_type, event_type TEXT, context JSONB, created_at`.

**빠진 것**:

| 누락 컬럼 | 왜 필요한가 | 3000명에서 발생할 증상 |
|---------|-----------|-------------------|
| `event_version SMALLINT` | 스키마 진화 — `peer_chat_accept v1` → `v2`로 context 구조 변경 시 | 과거·현재 context 섞여 분석 코드가 매번 분기 폭발 |
| `idempotency_key UUID` | 클라이언트 재시도 / 네트워크 타임아웃 dedupe | 수락 이벤트 중복 → Directory Level 2 오진입 |
| `session_id UUID` | 세션 단위 행동 분석 (funnel, path analysis) | "이 사용자는 왜 커피챗 신청 안 했나" 추적 불가 |
| `target_id UUID`, `target_type TEXT` | 이벤트의 **대상** (position, chat, post) 정규화 — `context` JSON에 묻지 말 것 | 모든 FK 조인을 JSON operator(`->>`)로 — planner가 죽음 |
| `client_ts TIMESTAMPTZ` vs `server_ts`(=`created_at`) | late-arriving data / 클라이언트 시계 드리프트 감지 | 오프라인 앱 업로드 시 타임라인 붕괴 |
| `schema_ref TEXT` | 이 event_type의 JSON schema ID (registry 참조) | context 스키마 검증 불가 → 쓰레기 데이터 |

**더 심각한 문제**: `event_type TEXT`는 **자유 문자열**이다. 3000명에서 200+ 이벤트 타입이 생기고 `peer_chat_accepted` vs `peer_chat_accept` vs `peer-chat-accept` 혼재. 자유 태그를 canonical로 강제하는 ADR-002의 교훈이 자기 자신의 이벤트에는 적용 안 됨. **모순**.

**CDO 처방**:

```sql
-- 이벤트 레지스트리 (enum 강제)
CREATE TABLE event_catalog (
  event_type      TEXT PRIMARY KEY,
  version         SMALLINT NOT NULL DEFAULT 1,
  context_schema  JSONB NOT NULL,    -- JSON Schema
  pii_fields      TEXT[] NOT NULL DEFAULT '{}',
  deprecated_at   TIMESTAMPTZ,
  owner_team      TEXT NOT NULL
);

-- activity_events.event_type → event_catalog.event_type FK
```

Phase 1에 이것까지 못 한다면, **최소 `event_version` + `idempotency_key` + `target_type`/`target_id`는 지금 심어라**. 나중에 ALTER로 추가하면 기존 1M 행 backfill 지옥.

---

### 🔴 D2. Dual-write 패턴이 분산 트랜잭션을 가장하고 있다

> §4.2: "서버 API → `activity_events` INSERT 가 먼저, (b) 응답 확인 후 클라이언트에서 Mixpanel track. Mixpanel 실패는 경고 로그만."

이건 **Dual-Write 안티패턴**이다. CDO 교과서 1장.

- `activity_events` INSERT 성공 + Mixpanel 실패 = 불일치
- `activity_events` INSERT 실패 + Mixpanel 재시도 = 불일치
- 일 1회 pg_cron reconciliation(> 2% 차이 알림) = **탐지**지 **복구**가 아니다. 알림 받고 뭘 할 것인가? 수동 backfill?

**정답: Transactional Outbox Pattern**

```
API Request
  ├→ BEGIN TX
  │    ├→ INSERT business row (e.g. peer_coffee_applications.status='accepted')
  │    └→ INSERT INTO event_outbox (event_type, payload)
  └→ COMMIT

별도 worker (pg_boss 또는 pg_cron):
  outbox → activity_events (내부 SoT)
  outbox → Mixpanel HTTP (retry with backoff, DLQ on fail)
```

장점:

1. 비즈니스 상태와 이벤트 원자성
2. Mixpanel 장애 시 outbox에 쌓이고 복구 시 자동 재전송
3. Reconciliation 알림 대신 **outbox backlog 모니터링**(실무적)

Phase 1에 outbox가 부담이면, **최소 `trigger AFTER INSERT OR UPDATE`로 `activity_events` 자동 삽입**을 강제해라. 현재처럼 API 레이어에서 "잊지 마세요"는 반드시 잊는다.

---

### 🔴 D3. `tag_canonical` 설계에 **pgvector가 빠졌다**

Phase 3에 Claude Sonnet + GPT-4o로 매칭한다며 Phase 1 태그 구조에 **임베딩 컬럼이 없는 건 자기모순**.

```sql
-- 현재 설계
CREATE TABLE tag_canonical (
  id, canonical_slug, display_ko, synonyms TEXT[], usage_count INTEGER, ...
);

-- CDO가 추가 요구
ALTER TABLE tag_canonical
  ADD COLUMN embedding VECTOR(1024),     -- Claude embed / OpenAI text-embedding-3-small
  ADD COLUMN embed_model TEXT,            -- 모델 버전 추적 (re-embedding 시 필요)
  ADD COLUMN embed_updated_at TIMESTAMPTZ;

-- 멤버 관심사 벡터는 tag 벡터의 집합 또는 별도
ALTER TABLE vcx_members
  ADD COLUMN interest_embedding VECTOR(1024);

CREATE INDEX ON tag_canonical USING hnsw (embedding vector_cosine_ops);
```

**근거**:

- Synonyms TEXT[]는 '딥테크/deep tech/DeepTech'는 잡지만 '**웹3 ↔ 블록체인**', '**LLM ↔ 생성형 AI**' 같은 **의미적 근접**은 못 잡음. 이게 매칭 품질의 90%다.
- Phase 3에 "이제 임베딩 추가할게요"는 Phase 1~2 기간의 모든 태그 매핑을 re-compute해야 함. **지금 심는 비용이 나중의 100배 싸다**.
- Supabase는 pgvector extension 기본 지원. Pre-flight G1에 **pg_partman 대신 pgvector 가용성 확인**을 추가해야.

---

### 🔴 D4. `match_features` Feature Store가 장난감이다

```sql
CREATE TABLE match_features (
  member_id UUID, feature_key TEXT, feature_val NUMERIC, updated_at TIMESTAMPTZ,
  PRIMARY KEY (member_id, feature_key)
);
```

**Feature Store를 EAV 테이블로 구현한 것**. 다음이 전부 불가능:

| 요구사항 | 이 설계로 가능? |
|---------|--------------|
| 카테고리형 feature (`industry_primary='fintech'`) | ❌ NUMERIC only |
| 벡터 feature (`interest_embedding VECTOR(1024)`) | ❌ |
| 시계열 feature (`chat_apply_count_last_7d`, `_last_30d`) | ❌ 스냅샷만 |
| Point-in-time correctness (2주 전 매칭 재현) | ❌ updated_at 하나로는 불가, 이력 없음 |
| Feature lineage (어떤 event_type에서 파생됐나) | ❌ 메타데이터 없음 |
| Feature freshness SLA | ❌ |

**CDO 처방 — 최소 요건**:

```sql
-- 1. Feature Registry (정의)
CREATE TABLE feature_registry (
  feature_key       TEXT PRIMARY KEY,
  feature_type      TEXT CHECK (feature_type IN ('numeric','categorical','vector','bool','text')),
  source_events     TEXT[],              -- 파생 event_types
  computation_sql   TEXT,                 -- 재현 가능성
  freshness_sla_h   INTEGER,
  owner_team        TEXT,
  pii_sensitive     BOOL DEFAULT false
);

-- 2. Online serving (latest)
CREATE TABLE member_features_online (
  member_id UUID,
  feature_key TEXT,
  value_num NUMERIC, value_text TEXT, value_vec VECTOR(1024), value_bool BOOL,
  updated_at TIMESTAMPTZ,
  PRIMARY KEY (member_id, feature_key)
);

-- 3. Offline history (point-in-time)
CREATE TABLE member_features_history (
  member_id UUID, feature_key TEXT,
  value_num NUMERIC, value_text TEXT,
  valid_from TIMESTAMPTZ, valid_to TIMESTAMPTZ,
  PRIMARY KEY (member_id, feature_key, valid_from)
) PARTITION BY RANGE (valid_from);
```

Phase 1은 **registry 테이블만** 만들고 계산은 Phase 2. 하지만 `match_features`만 있는 현 설계는 **Phase 3에서 통째로 버려야 한다**. 그게 더 비싸다.

---

### 🔴 D5. Level 0 집계에 **k-anonymity 보호장치가 없다**

> §4.6: "이번 주 3명의 시리즈 A 창업자가 합류했습니다"

- 멤버 30명 시점에 "시리즈 A 창업자 3명" 중 내가 2명을 알면 → 3번째는 **추론 가능**. 디아노나이제이션.
- "당신의 관심사(딥테크)와 겹치는 멤버 12명" — 12명이 전체의 40%면 범위가 좁아 교집합 3-4개만 해도 개인 식별.

**Privacy Engineering 원칙 (Tim이 지켜야 할 것)**:

```sql
-- 집계 floor = k. k 미만 결과는 표시 금지 혹은 반올림
CREATE OR REPLACE FUNCTION vcx_safe_count(p_count BIGINT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT CASE
    WHEN p_count < 10 THEN '10명 미만'
    WHEN p_count < 50 THEN (FLOOR(p_count / 10.0) * 10)::TEXT || '+'
    ELSE p_count::TEXT
  END;
$$;
```

추가로:

- 집계 dimension 조합(산업 × 시리즈 × 지역)이 세밀해질수록 cell size 급락 → **mandatory suppression rules** 설계
- 뉴스레터 발송 시 "당신만" 타겟팅 카피(`5명이 당신의 '핀테크' 관심사와 겹칩니다`)는 → **수신자 본인을 제외한 count**여야 함. 아니면 "나를 포함해 5명" 조합으로 자기가 4명을 알면 5번째 추론.

§7 O9 옆에 **O9.1 Level 0 re-identification risk**를 신설해야 한다. 이건 보안팀 지적사항급이다.

---

### 🔴 D6. `vcx_anonymize_member` 함수가 **백업·아카이브·Mixpanel·Anthropic**에 닿지 않는다

```sql
-- 현재 함수가 건드리는 것
UPDATE vcx_members ...
DELETE FROM member_tag_mapping ...
UPDATE community_posts SET author_id = NULL ...
UPDATE activity_events SET actor_id = NULL WHERE actor_id = p_member;
```

**닿지 않는 PII 경로 (전부 GDPR/PIPA 삭제 의무 대상)**:

1. **Mixpanel** — distinct_id로 멤버 uuid를 넘겼을 것. Mixpanel GDPR Delete API 호출 미포함
2. **Anthropic Claude API** — AI Brief 생성 시 member 데이터 전송. Anthropic은 원칙적으로 Input data를 학습에 쓰지 않지만, **Zero Retention 옵션 유상 신청** 안 했으면 30일 로그 보관. 전달 데이터 범위·보관정책 서면화 필요
3. **Upstash Redis** — rate limit counter에 user_id. TTL로 자연 삭제되지만 명시적 삭제 경로 필요
4. **S3 Parquet 아카이브** — §4.5 "월 1회 activity_events 아카이브" → 거기 actor_id 남음. **쿼리 가능한 개인정보**
5. **pg_dump 백업** — Supabase가 자동 백업. 삭제 요청 후에도 백업에 잔존. **최소 보관기간** 정책 필요
6. **`vcx_invites.email`, `vcx_invites.name`** — 초대 받고 가입 안 한 사람. 함수가 손 안 댐
7. **Sentry 에러 로그** — stack trace에 member_id 있음. Sentry Data Scrubbing 미설정

**CDO 처방**: **데이터 삭제 파이프라인 다이어그램**을 PRD에 명시. 각 타겟별 삭제 메커니즘(API/쿼리/수동/자동) + SLA(예: 72시간 내). GDPR Article 17 증빙 가능해야.

PIPA(개인정보보호법)는 **국내 서비스** 기준 더 엄격함. §4.7에 GDPR만 언급되고 PIPA 없음. 한국 이용자 대상 서비스면 PIPA 우선.

---

### 🔴 D7. `vcx_has_mutual_peer_accept` RLS가 O(N) 스캔이다

```sql
CREATE OR REPLACE FUNCTION vcx_has_mutual_peer_accept(a uuid, b uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM peer_coffee_applications pa JOIN peer_coffee_chats pc ON ... )
$$;
```

Directory 페이지에서 **멤버 카드 20개 렌더 × RLS row 평가** → 20 × EXISTS 서브쿼리. §7 O4가 "1000명 돌파 시 MV로 전환"이라 했지만:

- **300명 ≠ 안전**. `peer_coffee_applications` rows가 쌓이는 속도가 변수. 100% accept rate로 300명 × 평균 4 chat = 1200 rows. 각 RLS 평가에서 이걸 스캔.
- MV로 전환하려면 accept 이벤트마다 MV refresh 또는 incremental update. 트리거 설계 없음.

**정공법 — 관계 상태를 denormalize**:

```sql
CREATE TABLE vcx_member_connections (
  user_a_id UUID NOT NULL,
  user_b_id UUID NOT NULL,
  connection_type TEXT CHECK (connection_type IN ('peer_chat_mutual','...')),
  established_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_a_id, user_b_id, connection_type),
  CHECK (user_a_id < user_b_id)           -- 정렬된 unordered pair
);
CREATE INDEX ON vcx_member_connections (user_b_id, user_a_id);  -- 역방향

-- peer_coffee_applications AFTER UPDATE 트리거로 자동 INSERT
```

RLS 평가는 **단일 INDEX LOOKUP**. 30명이든 30000명이든 O(1).

이 패턴은 `vcx_feed_subscriptions`, `position_interests` 등에도 확장 적용. **관계는 이벤트가 아니다** — 별개 엔티티로 모델링.

---

## 3. 비즈니스 방향 — 데이터 관점 재해석

### 🟡 B1. "3-Layer Funnel"은 프레임인데 **측정 계약이 없다**

Hook / Sticky / Revenue 각 레이어의 **North Star Metric**이 없다.

| Layer | 제안 NSM | 데이터 소스 |
|-------|---------|-----------|
| Hook | Weekly Feed Engagement Rate = (feed_item 응답 멤버) / WAU | `vcx_feed_responses` + `activity_events` |
| Sticky | **Directory Return Rate** = 주 2회 이상 Directory 방문 비율 (Level 0도 카운트) + **Community Contribution Rate** = 월 1회 이상 post 또는 reaction | `activity_events.event_type='directory_view'` + `community_reactions` |
| Revenue | **Mutual Accept → Placement Conversion** = peer_chat mutual accept 발생 후 N일 내 placement 성사율 | `vcx_member_connections` → `vcx_placements` (존재하지 않음!) |

**결정적 문제**: `vcx_placements` 테이블이 PRD에 없다. migration 016 `vcx_fee_tracking`이 있지만 거기에 의존하는 설계인지 안 보임.

**수수료 UI 비노출** ≠ **재무 데이터 모델 없음**. Revenue layer의 성공을 측정할 수 없으면 CDO 관점에서 **비즈니스 자체가 계측 불가**. §1.3에 "내부 구조" 한 줄이 아니라:

```sql
CREATE TABLE vcx_placements (
  id UUID PRIMARY KEY,
  member_id UUID REFERENCES vcx_members(id),
  position_id UUID REFERENCES positions(id),       -- null if inbound chat
  connection_id UUID REFERENCES vcx_member_connections(...),
  placement_date DATE NOT NULL,
  fee_amount_krw NUMERIC NOT NULL,                   -- 내부 전용
  fee_received_at TIMESTAMPTZ,
  referral_type TEXT CHECK (referral_type IN ('self','peer','curation','ceo_chat')),
  referrer_id UUID,
  attribution_path JSONB                             -- 여정 재구성
);
-- RLS: service_role only. 재무 팀만 직접 쿼리
```

없으면 **LTV:CAC, NRR, Cohort ARPU 측정 불가 = 시리즈 A 투자자 미팅에서 답 못 함**.

---

### 🟡 B2. Reputation 시스템은 **법적 리스크 채널**인데 가드레일 부족

> ADR-004: "서로 다른 3인 confirmed → tier 강등 자동화"

현 설계:

- 3회 중 1회라도 악의적 허위 신고면? → 무고한 tier 강등 → 명예훼손·모욕 민사 청구 가능
- 한국 정보통신망법 §44-10 (임시조치)는 게시물 대상. 사용자 **tier 강등**은 애플리케이션 이용약관 + 정보통신망법 §44-2(정보삭제 요청) 조합 필요
- 대상자(reportee)에게 **사전 고지·소명 기회**가 설계에 없음 — 이것만으로도 약관상 가처분 신청 대상

**CDO 처방**:

| 단계 | 현재 | 추가해야 |
|-----|-----|---------|
| 신고 수집 | `vcx_member_reports` INSERT | 동일 reporter가 24h 내 3회 이상 신고 시 자동 throttle |
| Admin review | `status='reviewing'` | **증거 품질 스코어링** + Admin 2명 승인 (4-eye principle) 강등일 경우 |
| 강등 결정 | 자동 배치 | **사전 고지 7일** + **소명 창 30일** + 고지 미달 시 강등 미실행 |
| 강등 집행 | `member_tier='endorsed'` 강제 | `vcx_tier_change_log` 감사 테이블에 사유·증거·결정자 기록 5년 보관 |
| 이의 제기 | 없음 | `vcx_tier_appeals` 엔티티 + 처리 SLA 14일 |

대시보드에 **reporter-reportee bipartite graph** 시각화로 coordinated attack (5명이 1명 신고) 탐지. 이런 어뷰즈는 인간 moderator도 못 잡음.

---

### 🟡 B3. AI Brief는 **고위험 AI 시스템**인데 거버넌스가 없다

유럽 AI Act 기준으로 "채용 보조 AI"는 **High Risk System**. 한국은 「인공지능 기본법」(2024-12 제정, 2026-01 시행) — **VCX는 정확히 적용 대상**.

| AI Act 요구사항 | v6.1 현황 |
|---------------|----------|
| Model card | ❌ |
| Bias audit (성별·나이·학벌) | ❌ |
| Human oversight 설계 | ⚠️ (Brief은 참고용이라 약함) |
| 설명가능성 (왜 이 사람이 추천됐나) | ❌ |
| 사용자 고지 ("이 요약은 AI가 생성") | ✅ (아마 UI에 있을 것으로 추정) |
| 모델 성능 모니터링 | `helpfulness ≥ 4.0/5` 하나. Insufficient |
| 로그 6개월 이상 보관 | ❌ 정책 없음 |

**Phase 2 작업 리스트에 추가해야**:

1. `ai_brief_generations` 테이블 — 모든 AI 호출 입력·출력·모델·토큰수·사용자 피드백 기록. 재훈련·감사·디버깅 용
2. `ai_model_cards.md` 문서 — 각 AI feature별 용도·학습데이터(없음)·알려진 한계
3. Quarterly bias audit 프로세스 (Admin이 무작위 샘플 50건 리뷰)

AI Match Engine (Phase 3)은 **영향이 훨씬 커서 규제 대상 확정**. 지금부터 로그 스키마 안 심으면 Phase 3에서 또 마이그레이션 폭탄.

---

### 🟡 B4. Concierge Onboarding — 이상적이지만 **데이터 모델의 이중화**를 낳음

`onboarding_channel='concierge'` 도입으로:

- Invite flow는 `vcx_invites.token_hash` 검증
- Concierge flow는 `vcx_concierge_credentials.pw_hash` 검증
- 둘 다 `vcx_members.id = auth.uid`

**문제**: Supabase Auth는 단일 비밀번호 모델. `vcx_concierge_credentials.pw_hash`는 Supabase auth.users.encrypted_password와 **병존**하는가? 아니면 Supabase Auth 자체를 bypass?

- 병존이면: 최초 로그인 시 어느 PW 검증? 로직 복잡도 폭발
- Bypass면: Supabase SSR 세션 관리와 충돌. 자체 JWT 발급?

§1.3 Feature 1.1이 이걸 정의 안 함. **아키텍처 결정 공백**.

**CDO 대안**: Supabase Auth의 `email_confirm=false` + `admin.createUser()` 로 사전 생성 + 초기 PW는 Supabase가 관리. `vcx_concierge_credentials`는 **발급 이력·배송 경로 감사용**으로만 보관하고 `pw_hash` 컬럼은 제거. 한 번의 진실원 유지.

---

### 🟡 B5. Community `free` 카테고리 — **내용 중재 리소스** 미계산

> "기본값 정렬에서 후순위로 두어 저질 사담의 홍수는 막는다."

후순위 정렬은 노출만 낮출 뿐, **신고 큐**에 쌓이는 양은 선형 증가. Moderator 1-2명(Tim + 1)으로 감당 가능한 신고/일 = 경험적으로 10건. 그 이상이면 backlog.

`free` 도입 전후 **신고율 baseline 설정** 필수:

- 도입 전 주간 신고 수 (현재)
- 도입 후 2주 모니터링
- 급증 시 `free` 전용 요율 제한(`vcx_rate_limits` table per category) — 현재 rate-limit 구현은 있음, 카테고리별 확장만 추가

---

## 4. 거버넌스·컴플라이언스 — 전반적 누락

| 누락 | 영향 | 최소 Phase 1 조치 |
|-----|------|---------------|
| **Data Dictionary** (컬럼 의미·단위·nullability 정의 문서) | 31개 마이그레이션, 신규 팀원 온보딩 불가 | `docs/data-dictionary.md` 자동 생성 (supabase introspection + 주석) |
| **Data Ownership Matrix** | 스키마 변경 책임자 불명 | RACI 1 페이지 (멤버: Tim / 기업: Tim / 이벤트: Tim / 커뮤니티: Tim → 솔직히 지금은 다 Tim, **그게 명시되어야** 함) |
| **PIPA 명시적 대응** | 한국 서비스인데 GDPR만 언급 | 개인정보처리방침 + 위탁 3자(Supabase US/Anthropic US/Mixpanel US) 국외이전 동의 획득 |
| **데이터 보관 정책** | 멤버 탈퇴·비활성·오래된 이벤트 — 언제 삭제? | 엔티티별 보관기간 표: `vcx_invites` 미수락 90일 삭제, `activity_events` 24개월 후 S3, `vcx_access_audit_log` 5년 등 |
| **Incident Runbook (Data)** | `ANTHROPIC_API_KEY` 장애 외 시나리오 없음 | Mixpanel 전면 장애, Supabase 리전 장애, pg_partman 드리프트, 스키마 마이그레이션 실패 롤백 등 |
| **Data Contract Tests** | DB 제약조건 외 검증 없음 | `vcx_invites.email` → 유효 email, `vcx_members.linkedin_url` → linkedin.com 도메인, `activity_events.event_type` → `event_catalog`에 존재 확인. CHECK constraint 또는 트리거 |
| **Backup·DR** | Supabase 자동 백업 의존. PITR(Point-In-Time Recovery) 테스트 경험? | 분기 1회 staging으로 복원 드릴 |

---

## 5. 인프라 비용 vs 가치 — CDO의 "No" 리스트

| Phase 1 항목 | CDO 판단 | 근거 |
|-------------|--------|-----|
| Read replica $125/mo | **보류** | 30명 규모에 불필요. `activity_events` 1M rows 돌파 전까진 MV + 단일 DB로 충분. Phase 2 중반 재평가. **§5.4 G3 pre-flight는 실은 Phase 1 전체 삭제**해도 됨 |
| pg_partman (월별) | **연간 파티션으로 시작** | 월별은 멤버 10k+ / 이벤트 1M+/mo에서 가치. 30명 × 100 events/mo = 3000/mo → 연간이면 충분 |
| `match_features` Phase 2 | **Phase 2 말~Phase 3 초**로 DEFER + 대체 전략 | 현 설계(EAV)로는 Phase 3에 재설계 불가피. 재설계할 거면 **등록부(`feature_registry`)만 Phase 1**에 심고, 구현은 Phase 3 AI Match와 일체화 |
| S3 Parquet 아카이브 | **deferred** | 12개월치 이벤트는 30k rows 이하. Postgres에 두고 인덱스면 됨. S3 이전은 1M rows / 쿼리 지연 체감 시 |
| Mixpanel | **재평가 필요** | 무료 tier(월 100k events)로 시작 가능. 하지만 dual-write 복잡도가 가치를 초과하면 **제거하고 Metabase/Superset 셀프호스트**가 CDO 기본 추천. Mixpanel $1500+/mo는 3000명 스케일에서 과투자 |

**절약액을 어디에 쓸 것인가**: pgvector 활성화(무료) + data-dictionary 자동생성 스크립트 + PIPA 컴플라이언스 변호사 자문 (일회성 200만 원).

---

## 6. 최종 CDO 권고 — Phase 1 재편 (Top 5)

현 Phase 1 MUST 리스트를 유지하되 **다음 5개를 추가**하라:

| 우선 | 신규 작업 | Effort | 근거 |
|-----|---------|-------|-----|
| **MUST+** | `activity_events`에 `event_version, idempotency_key, target_type, target_id` 4개 컬럼 사전 투입 + `event_catalog` 레지스트리 테이블 | 1d | D1. 나중 backfill 지옥 방지 |
| **MUST+** | `vcx_placements` + `vcx_deal_flow` 최소 스키마 신설 (RLS service_role only) | 1d | B1. Revenue 계측 불가 → 사업 의사결정 불가 |
| **MUST+** | `vcx_member_connections` denormalized 관계 테이블 + 트리거 | 0.5d | D7. RLS 성능 선제 방어 |
| **MUST+** | pgvector extension 활성화 + `tag_canonical.embedding`, `vcx_members.interest_embedding` 컬럼 추가 (계산은 Phase 2) | 0.5d | D3. Phase 3 매칭 엔진의 유일한 생존 경로 |
| **MUST+** | Level 0 집계 **k-anonymity floor ≥ 10** 함수 + 카테고리별 suppression 규칙 | 0.5d | D5. 법적·윤리적 최소선 |

**DEFER로 밀어야 할 것**:

- Read replica (G3 게이트 자체 제거)
- pg_partman 월별 (연간으로 완화)
- Mixpanel 전체 이벤트 계측 (핵심 4개 이벤트만 + 장기적으로 Metabase 검토)

**Phase 2 초반에 반드시 들어가야 할 것**:

- Transactional Outbox 전환 (D2)
- PIPA/GDPR/AI법 컴플라이언스 문서 + 데이터 보관 정책
- `feature_registry` + 최소 feature 10개 etl 파이프라인
- AI Brief 생성 로그 전수 보관 (`ai_brief_generations`) + bias audit 1회

---

## 7. 한 장 요약

> **"PRD v6.1은 엔지니어링 상세까진 훌륭하다. 하지만 '데이터 프로덕트'로서는 미숙하다.**
> 이벤트가 계약이 없고 (D1), 쓰기가 원자성 없고 (D2), 피처 스토어가 장난감이고 (D4), 관계가 조회마다 재계산되며 (D7), 집계가 재식별 위험을 방치하고 (D5), 삭제 파이프라인이 반쪽짜리(D6)다. **비즈니스 측에선 Revenue 엔티티 자체가 누락**(B1)되어 있어 성공을 측정할 수단이 없다.
> 지금 투입할 추가 3.5일(컬럼·테이블·벡터·floor)이 Phase 3에서 3개월을 벌어준다. 이건 CDO 관점에서 **거래할 여지가 없다**."

Critic round 2 승인 전 최소 위 Top 5 (MUST+)는 반영하고 승격하는 것을 강력 권고합니다.

---

## 부록. 제안 마이그레이션 번호 (v6.1 rev 4 반영 시)

| # | 파일명 | 내용 | Phase |
|---|--------|-----|------|
| 022 | `022_vcx_directory_tiered.sql` | (기존) | 1 |
| 023 | `023_vcx_member_reports.sql` | (기존) | 1 |
| 024 | `024_vcx_activity_events.sql` | **rev 4: `event_version`, `idempotency_key`, `target_id`, `target_type`, `session_id`, `client_ts`, `schema_ref` 추가** | 1 |
| **024a** | `024a_vcx_event_catalog.sql` | **신규 — 이벤트 레지스트리** | 1 |
| 025 | `025_vcx_tag_canonical.sql` | **rev 4: `embedding VECTOR(1024)`, `embed_model`, `embed_updated_at` 추가** | 1 |
| **025a** | `025a_pgvector_enable.sql` | **신규 — pgvector extension + `vcx_members.interest_embedding`** | 1 |
| **025b** | `025b_vcx_member_connections.sql` | **신규 — denormalized peer 관계 테이블 + 트리거** | 1 |
| **025c** | `025c_vcx_placements.sql` | **신규 — Revenue 엔티티** | 1 |
| **025d** | `025d_vcx_safe_count.sql` | **신규 — k-anonymity floor 함수** | 1 |
| 026 | `026_vcx_match_features.sql` | **rev 4: `feature_registry` 테이블만 Phase 1, 나머지는 Phase 3으로 이동** | 1 (registry) / 3 (online/history) |
| 027 | `027_vcx_pii_audit_and_anonymize.sql` | **rev 4: 외부 시스템(Mixpanel/Anthropic/Sentry/S3) 삭제 파이프라인 명시** | 2 |
| 028 | `028_vcx_community_fulltext.sql` | (기존) | 2 |
| 029 | `029_vcx_feed_newsletter_metrics.sql` | (기존) | 1 |
| 030 | `030_vcx_community_categories_v2.sql` | (기존) | 1 |
| 031 | `031_vcx_concierge_onboarding.sql` | **rev 4: `pw_hash` 컬럼 제거, Supabase Auth 위임** | 1 |
| **032** | `032_vcx_ai_brief_generations.sql` | **신규 — AI 호출 감사 로그** | 2 |
| **033** | `033_vcx_tier_change_log.sql` | **신규 — Reputation 거버넌스 감사** | 1 (스키마) / 2 (워크플로우) |

---

**END OF CDO REVIEW** — 본 문서는 `docs/prd6.1.md` rev 4 논의의 기초 자료로 사용된다.
