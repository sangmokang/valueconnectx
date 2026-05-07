# Domain Expert Auto-Routing + RLVR Self-Learning Loop

**Revision:** 2 (post Architect + Critic review)
**Created:** 2026-04-03
**Scope:** User-level (`~/.claude/skills/omc-learned/`)
**Complexity:** HIGH (4 skills, new skill ecosystem)

---

## Context

oh-my-claudecode currently routes tasks by mode (autopilot, ralph, ultrawork, etc.) but has no concept of **domain expertise**. When a user asks "What's the ROI of this marketing campaign?" or "How should we structure this database migration?", the system doesn't know to route to a marketing expert vs. a backend architect.

This plan introduces 18 domain expert personas, a two-axis classification engine, intelligent routing with user selection, and a semi-automatic RLVR feedback loop that learns from every interaction.

## User Decisions

| Decision | Choice |
|----------|--------|
| Scope | User-level (`~/.claude/skills/omc-learned/`) |
| RLVR Automation | Semi-automatic: auto-detect feedback + accumulate knowledge, but require user approval before applying SKILL.md reflections |
| Routing UX | Recommendation + user selection: classify request, recommend 2-3 experts, user picks |

---

## Relationship to Existing OMC Routing

- Expert-router **AUGMENTS** existing routing, does **NOT** replace it
- Activated **ONLY** via `/ask` trigger or explicit phrases like "전문가에게 물어봐", "전문가 의견", "expert opinion"
- Standard OMC routing (autopilot, ralph, ultrawork, plan, etc.) continues to work as before with zero changes
- If user is already in an execution mode (ralph, autopilot, ultrawork), expert-router does **NOT** intercept
- Expert-router is for **advisory/consultation queries**, not execution tasks
- No modification of existing OMC plugin skills -- only creates new `omc-learned` skills

---

## File Structure

```
~/.claude/skills/omc-learned/
├── expert-router/
│   ├── SKILL.md                    # Main skill (classify + route + dispatch + feedback detect)
│   ├── registry.json               # 18 expert definitions
│   └── templates/                  # Per-expert prompt templates
│       ├── cfo.md
│       ├── investment-officer.md
│       ├── qa-engineer.md
│       ├── cto.md
│       ├── ux-designer.md
│       ├── ui-designer.md
│       ├── user-researcher.md
│       ├── ml-engineer.md
│       ├── data-scientist.md
│       ├── business-data-analyst.md
│       ├── cpo.md
│       ├── ciso.md
│       ├── frontend-lead.md
│       ├── backend-lead.md
│       ├── infra-engineer.md
│       ├── brand-manager.md
│       ├── marketer.md
│       └── growth-marketer.md
├── expert-reflect/
│   └── SKILL.md                    # Reflection + proposals (with registry backup)
└── expert-knowledge/
    ├── knowledge.jsonl             # Accumulated feedback entries (append-only, max 200)
    ├── expert-scores.json          # Running success rates per expert per quadrant
    └── registry-backup-*.json      # Up to 5 rolling backups of registry.json
```

**Note:** There is no separate `expert-feedback` skill. Feedback detection is a section within `expert-router/SKILL.md` (see Component 4 below).

---

## Data Structures

### 1. Expert Registry (`registry.json`)

```json
{
  "version": 1,
  "experts": [
    {
      "id": "cfo",
      "name": "CFO",
      "role_kr": "최고재무책임자",
      "expertise_areas": ["financial planning", "budgeting", "cash flow", "fundraising", "valuation", "unit economics", "financial modeling"],
      "trigger_keywords": ["예산", "재무", "매출", "비용", "ROI", "투자", "현금흐름", "밸류에이션", "burn rate", "runway", "P&L", "손익"],
      "quadrant_affinity": {
        "task_specific": 0.9,
        "task_ambiguous": 0.6,
        "fact_specific": 0.8,
        "fact_ambiguous": 0.5
      },
      "default_model": "sonnet",
      "template": "templates/cfo.md"
    }
  ]
}
```

**All 18 experts follow this schema.** Full registry entries specified in Phase 1 implementation.

Expert-to-domain mapping summary:

| Expert | Primary Domain | Key Triggers (KR) |
|--------|---------------|-------------------|
| CFO | Finance, budgets, valuation | 예산, 매출, ROI, 밸류에이션 |
| Investment Officer | Due diligence, deal flow | 투자, 딜플로우, 심사, 포트폴리오 |
| QA Engineer | Testing, quality, reliability | 테스트, QA, 버그, 품질, 커버리지 |
| CTO | Architecture, tech strategy | 아키텍처, 기술스택, 확장성, 마이그레이션 |
| UX Designer | User flows, usability, research | UX, 사용성, 플로우, 와이어프레임 |
| UI Designer | Visual design, components | UI, 디자인시스템, 컴포넌트, 스타일 |
| User Researcher | User interviews, personas | 사용자조사, 인터뷰, 페르소나, 설문 |
| ML Engineer | Models, training, MLOps | 모델, 학습, 파이프라인, MLOps, 추론 |
| Data Scientist | Analysis, statistics, experiments | 분석, 통계, A/B테스트, 상관관계, 회귀 |
| Business Data Analyst | Metrics, dashboards, reporting | 지표, 대시보드, 리포트, KPI, 퍼널 |
| CPO | Product strategy, roadmap, prioritization | 로드맵, 우선순위, PRD, 제품전략 |
| CISO | Security, compliance, risk | 보안, 취약점, 인증, 컴플라이언스, GDPR |
| Frontend Lead | Frontend architecture, performance | 프론트엔드, 렌더링, 번들, SSR, 컴포넌트설계 |
| Backend Lead | APIs, databases, services | 백엔드, API설계, DB, 마이크로서비스, 캐싱 |
| Infra Engineer | DevOps, CI/CD, cloud, scaling | 인프라, 배포, CI/CD, 쿠버네티스, 모니터링 |
| Brand Manager | Brand identity, messaging, positioning | 브랜드, 포지셔닝, 메시징, 톤앤매너 |
| Marketer | Campaigns, content, channels | 마케팅, 캠페인, 콘텐츠, 채널, CTR |
| Growth Marketer | Growth loops, retention, activation | 그로스, 리텐션, 활성화, 퍼널최적화, AARRR |

### 2. Classification Output

```json
{
  "intent": "task" | "fact",
  "clarity": "ambiguous" | "specific",
  "quadrant": "task_specific" | "task_ambiguous" | "fact_specific" | "fact_ambiguous",
  "confidence": 0.0-1.0,
  "keywords": ["extracted", "keywords", "from", "query"],
  "reasoning": "One-line explanation of classification"
}
```

### 3. Knowledge Entry (`knowledge.jsonl` -- one JSON per line)

```json
{
  "timestamp": "2026-04-03T14:30:00Z",
  "session_id": "abc123",
  "expert_id": "cfo",
  "quadrant": "task_specific",
  "query_summary": "월간 burn rate 계산 방법",
  "feedback_type": "positive" | "negative" | "neutral",
  "feedback_signal": "explicit_approval" | "explicit_rejection" | "correction" | "accepted" | "ignored" | "followup",
  "feedback_detail": "User said '좋아' after receiving the answer",
  "confidence_delta": 0.05,
  "tags": ["finance", "burn-rate"]
}
```

### 4. Expert Scores (`expert-scores.json`)

```json
{
  "version": 1,
  "updated": "2026-04-03T14:30:00Z",
  "last_compaction": null,
  "cold_start": true,
  "total_interactions": 0,
  "scores": {
    "cfo": {
      "task_specific": { "attempts": 0, "positive": 0, "negative": 0, "neutral": 0, "score": 0.5 },
      "task_ambiguous": { "attempts": 0, "positive": 0, "negative": 0, "neutral": 0, "score": 0.5 },
      "fact_specific": { "attempts": 0, "positive": 0, "negative": 0, "neutral": 0, "score": 0.5 },
      "fact_ambiguous": { "attempts": 0, "positive": 0, "negative": 0, "neutral": 0, "score": 0.5 }
    }
  }
}
```

**Cold-start defaults:** All experts initialize with `0.5` score across all quadrants, `0` attempts. The `cold_start` flag is `true` until `total_interactions >= 10`. During cold start, the router shows extra candidates (top 3-4 instead of 2-3) to gather diverse feedback faster.

---

## Tool Usage

This section specifies which Claude Code tools each skill component uses.

| Tool | Used By | Purpose |
|------|---------|---------|
| **Read** | Router, Reflect | Load `registry.json`, `expert-scores.json`, `knowledge.jsonl`, template files |
| **Write** | Router (feedback), Reflect | Create/overwrite `expert-scores.json`, `registry.json`, backup files |
| **Edit** | Not used | JSON files use full Write (not partial Edit) for atomicity |
| **Agent** (Task tool) | Router | Dispatch expert subagents with template as prompt |
| **AskUserQuestion** | Router | Present expert recommendations as clickable options for user selection |
| `state_write` MCP | Router | Save `last_expert_dispatch` state after dispatching an expert |
| `state_read` MCP | Router (feedback section) | Read `last_expert_dispatch` to attribute feedback to correct expert |

---

## Component Designs

### Component 1: Two-Axis Classification Engine

**Location:** Inline in `expert-router/SKILL.md` (no separate file; it's a prompt-based classification)

**Algorithm (pseudocode):**

```
function classify(user_input: string) -> Classification:
    # Step 1: Intent axis -- Task vs Fact
    task_signals = [
        imperative verbs ("만들어", "구현해", "설계해", "개선해", "수정해", "배포해"),
        action requests ("해줘", "해주세요", "하고 싶어"),
        deliverable words ("구현", "개발", "빌드", "설정", "마이그레이션")
    ]
    fact_signals = [
        question markers ("뭐야", "무엇", "어떻게", "왜", "언제", "얼마나"),
        knowledge verbs ("알려줘", "설명해", "비교해", "분석해"),
        conceptual words ("차이", "장단점", "원리", "개념", "의미")
    ]

    intent = "task" if count(task_signals) > count(fact_signals) else "fact"

    # Step 2: Clarity axis -- Ambiguous vs Specific
    specific_signals = [
        named entities (file paths, function names, product names, metrics),
        numeric constraints ("3일 안에", "50% 이상", "100만원"),
        bounded scope ("로그인 페이지의", "CFO 대시보드에서", "이 API의")
    ]
    ambiguous_signals = [
        vague qualifiers ("좋은", "더 나은", "적절한", "효율적인"),
        open scope ("전반적으로", "전체", "시스템", "개선"),
        no file/function/metric references
    ]

    clarity = "specific" if count(specific_signals) > count(ambiguous_signals) else "ambiguous"

    # Step 3: Confidence
    total_signals = count(all_matched_signals)
    agreement = abs(task_score - fact_score) + abs(specific_score - ambiguous_score)
    confidence = min(1.0, 0.5 + (agreement / total_signals) * 0.5)

    # Step 4: Keyword extraction
    keywords = extract_nouns_and_domain_terms(user_input)

    return {
        intent, clarity,
        quadrant: f"{intent}_{clarity}",
        confidence, keywords,
        reasoning: f"Intent={intent} (signals: {...}), Clarity={clarity} (signals: {...})"
    }
```

**Note:** This runs as LLM prompt reasoning within the SKILL.md, not as executable code. The skill instructs Claude to perform this classification mentally and output the JSON structure.

### Component 2: Semantic Elimination Routing (Replaces Weighted Scoring)

**Why not weighted scoring:** The previous formula `0.4*keyword + 0.3*affinity + 0.2*history + 0.1*recency` requires LLM arithmetic across 18 candidates -- unreliable and error-prone. Instead, we use a tiered semantic approach that plays to LLM strengths.

**Routing algorithm -- 4-step semantic elimination:**

```
Step 1: FILTER -- Eliminate by quadrant affinity threshold
    For each expert in registry.json:
        if expert.quadrant_affinity[classified_quadrant] < 0.3:
            eliminate (not relevant for this type of query)
    Typically reduces 18 -> 8-12 candidates

Step 2: MATCH -- Semantic match against expertise areas
    For remaining candidates:
        Compare query keywords + context against expert.expertise_areas
        LLM judges: "Is this query within this expert's domain?" (yes/no/partial)
        Keep only "yes" and "partial" matches
    Typically reduces to 3-6 candidates

Step 3: RANK -- Prefer historically successful experts (simple comparison)
    If expert-scores.json has data for these candidates:
        Sort by success rate (score field) for this quadrant -- descending
        This is a simple sort, NOT a multiplication formula
    If no historical data (cold start):
        Sort by quadrant_affinity for this quadrant -- descending

Step 4: PRESENT -- Show top candidates to user
    Normal mode (total_interactions >= 10): top 2-3
    Cold-start mode (total_interactions < 10): top 3-4
    Format with expert name, role_kr, and 1-line reasoning
```

**Fallback -- Passthrough mode:**
If after Step 2, no expert has a semantic match confidence > 0.3 (i.e., no expert is clearly relevant), skip routing entirely and respond directly as Claude with the note:
> "전문가 매칭 결과가 낮아 일반 모드로 응답합니다."

**Lazy template loading:** Templates are NOT loaded during Steps 1-3. Only `registry.json` metadata is read. The selected expert's template file is loaded ONLY after the user makes their selection in Step 4.

**Quadrant-to-strategy mapping:**

| Quadrant | Strategy | Candidates to Show | Rationale |
|----------|----------|-------------------|-----------|
| Task x Specific | Direct match | Top 1-2 (cold: 2-3) | Clear task, clear domain -> best expert |
| Task x Ambiguous | Broad panel | Top 3-4 (cold: 4) | Vague task needs multiple perspectives |
| Fact x Specific | Lookup | Top 1 (cold: 2) | Specific question -> one domain expert |
| Fact x Ambiguous | Multi-perspective | Top 2-3 (cold: 3-4) | Exploratory -> diverse viewpoints |

**Presentation format to user (via AskUserQuestion tool):**

```
[Expert Router] 요청을 분석했습니다.

분류: 과업(Task) x 구체적(Specific) | 신뢰도: 0.85
키워드: 재무, 매출, ROI

추천 전문가:
1. CFO (최고재무책임자)
   이유: 재무 분석 및 매출 관련 전문 영역과 높은 일치
2. Business Data Analyst (비즈니스 데이터 분석가)
   이유: 데이터 분석 관점에서 보완적 시각 제공

선택해주세요 (번호 또는 "all"):
```

### Component 3: Expert Dispatch Mechanism

**Location:** Inline in `expert-router/SKILL.md`, after user selects expert(s).

**Dispatch flow:**

```
After user selects expert(s):

1. Read the selected expert's template file using Read tool
   - Path: ~/.claude/skills/omc-learned/expert-router/{expert.template}
   - This is the ONLY point where template files are loaded (lazy loading)

2. Dispatch expert subagent using Agent tool (Task tool):
   - subagent_type: "oh-my-claudecode:executor" (or "general-purpose" if unavailable)
   - model: expert.default_model from registry (e.g., "sonnet", "opus")
   - prompt: Combine three parts:
     a. Template content (persona, approach, constraints, output format)
     b. User's original query verbatim
     c. Classification context (quadrant, keywords, confidence)

3. Save dispatch state via state_write MCP tool:
   {
     "key": "last_expert_dispatch",
     "value": {
       "expert_id": "cfo",
       "quadrant": "task_specific",
       "query_summary": "월간 매출 분석 대시보드 설계",
       "timestamp": "2026-04-03T14:30:00Z"
     }
   }

4. Present expert's response to user

5. Proceed to feedback detection (Component 4, below)
```

**If user selects "all" (multiple experts):**
- Dispatch each expert sequentially (not in parallel, to avoid context confusion)
- Save each dispatch to state with an array of expert_ids
- After all responses, detect feedback for the set

### Component 3b: Expert Prompt Templates

Each template in `templates/<expert>.md` follows this structure:

```markdown
# {Expert Name} ({role_kr})

## Persona
You are a {role} with deep expertise in {expertise_areas}.
You think in terms of {domain-specific frameworks}.
Your communication style is {style_description}.

## Approach
When answering Task requests:
- {task-specific heuristics}

When answering Fact requests:
- {fact-specific heuristics}

## Constraints
- Always ground answers in evidence or established frameworks
- If the question is outside your expertise, say so explicitly
- Provide actionable next steps, not just analysis

## Output Format
- For Tasks: Problem framing -> Approach -> Deliverable outline -> Risk flags
- For Facts: Direct answer -> Context/nuance -> Sources/frameworks referenced
```

### Component 4: Post-Dispatch Feedback Detection

**Location:** Inline section within `expert-router/SKILL.md` (NOT a separate skill).

**Why merged:** SKILL.md files cannot auto-trigger after another skill completes. Since feedback detection must run immediately after the expert responds, it must be part of the same skill flow.

**State handoff:** Before detecting feedback, read `last_expert_dispatch` from state_read MCP tool to know which expert and quadrant to attribute the feedback to.

**Detection runs after every expert subagent response.** The skill instructs Claude to scan the user's next message for signals:

| Signal | Type | Detection Pattern | Confidence Delta |
|--------|------|-------------------|-----------------|
| Explicit approval | positive | "좋아", "맞아", "완벽", "정확", "고마워", thumbs-up | +0.05 |
| Explicit rejection | negative | "아니", "틀려", "다시", "이건 아닌데", "다른 방법" | -0.10 |
| Correction | negative | User provides alternative answer or modifies the expert's output | -0.07 |
| Accepted (implicit) | positive | User proceeds with expert's suggestion without modification | +0.03 |
| Ignored (implicit) | negative | User changes topic or asks different expert the same question | -0.05 |
| Follow-up in domain | neutral | User asks deeper question in same domain | +0.01 |

**Accumulation logic:**
1. Read `last_expert_dispatch` state via `state_read` MCP tool
2. Detect signal from user's response
3. Create knowledge entry (JSON line)
4. Read current `knowledge.jsonl` line count; if >= 200, trigger compaction (see Knowledge Compaction below)
5. Append entry to `knowledge.jsonl` via Write tool
6. Read `expert-scores.json`, update the relevant expert's quadrant stats, recalculate score = positive / attempts
7. Increment `total_interactions`; set `cold_start = false` if `total_interactions >= 10`
8. Write updated `expert-scores.json`

### Component 5: Reflection Mechanism

**Location:** `expert-reflect/SKILL.md`
**Trigger:** Manual (`/reflect`) or when `knowledge.jsonl` exceeds 50 entries since last reflection

**Registry backup (REQUIRED before any mutation):**
Before applying any changes to `registry.json`:
1. Copy current `registry.json` to `expert-knowledge/registry-backup-{YYYY-MM-DDTHH:MM}.json`
2. Check existing backups in `expert-knowledge/`; if more than 5, delete the oldest
3. Log the backup file path in the reflection knowledge entry

**Reflection algorithm:**

```
function reflect(knowledge_entries, current_registry, current_scores):
    # 1. Pattern detection
    patterns = {
        "underperforming_experts": experts with score < 0.4 in any quadrant (min 5 attempts),
        "overperforming_experts": experts with score > 0.9 in quadrants outside their primary affinity,
        "missing_coverage": keywords that appear often but no expert scores well on them,
        "quadrant_drift": experts whose best quadrant differs from their registry affinity
    }

    # 2. Generate proposed changes
    proposals = []
    for pattern in patterns:
        if underperforming:
            propose: adjust quadrant_affinity down, or add new trigger_keywords
        if overperforming:
            propose: increase quadrant_affinity for the surprise quadrant
        if missing_coverage:
            propose: add trigger_keywords to most relevant expert, or flag need for new expert
        if quadrant_drift:
            propose: update quadrant_affinity to match observed performance

    # 3. Format as diff
    for proposal in proposals:
        show: current value -> proposed value, with evidence (N interactions, score delta)

    # 4. Present to user for approval
    display: "다음 전문가 라우팅 업데이트를 제안합니다:"
    for each proposal:
        display: expert name, change description, evidence summary
    ask: "적용하시겠습니까? (yes/no/선택적 적용)"

    # 5. On approval -- BACKUP FIRST
    create registry backup (see above)
    apply changes to registry.json and/or expert-scores.json
    log reflection event to knowledge.jsonl with type "reflection_applied"
    log includes: backup file path, changes applied, evidence counts
```

### Knowledge Compaction Strategy

**Location:** Triggered within feedback detection (Component 4) when `knowledge.jsonl` exceeds 200 entries.

```
Compaction algorithm:
1. Read all entries from knowledge.jsonl
2. If count < 200: do nothing
3. If count >= 200:
   a. Take the OLDEST 100 entries
   b. Summarize into aggregate stats per expert per quadrant:
      - total attempts, positive count, negative count, neutral count
      - most common feedback signals
      - most common query tags
   c. Merge these aggregate stats INTO expert-scores.json (add to existing counts)
   d. Set last_compaction timestamp in expert-scores.json
   e. Rewrite knowledge.jsonl keeping ONLY the most recent 100 entries
   f. Log a compaction event as a knowledge entry: { "feedback_type": "system", "feedback_signal": "compaction", ... }
```

**Data safety:** The oldest entries are summarized into `expert-scores.json` before removal, so no learning data is lost -- only the granular details of old interactions.

---

## Task Flow (Implementation Phases)

### Phase 1: Foundation -- Expert Registry + Templates + Cold-Start Data
**Acceptance Criteria:**
- [ ] `registry.json` exists at `~/.claude/skills/omc-learned/expert-router/registry.json` with all 18 experts fully defined (id, name, role_kr, expertise_areas, trigger_keywords, quadrant_affinity, default_model, template path)
- [ ] All 18 `templates/<expert>.md` files exist with persona, approach, constraints, and output format sections
- [ ] `expert-scores.json` initialized with all 18 experts, all quadrants at 0 attempts, 0.5 default score, `cold_start: true`, `total_interactions: 0`, `last_compaction: null`
- [ ] `knowledge.jsonl` created as empty file
- [ ] Directory `expert-knowledge/` exists for future backups

**Files created:** 22 files (registry.json, 18 templates, expert-scores.json, knowledge.jsonl, directory structure)

### Phase 2: Classification + Routing + Dispatch + Feedback Skill (Single SKILL.md)
**Acceptance Criteria:**
- [ ] `expert-router/SKILL.md` exists with valid YAML frontmatter (name: `expert-router`, description, triggers including `/ask` and Korean phrases like "전문가에게 물어봐")
- [ ] SKILL.md contains the two-axis classification instructions with signal lists for Korean + English
- [ ] SKILL.md contains the 4-step semantic elimination routing (Filter -> Match -> Rank -> Present) -- NO weighted scoring formula
- [ ] SKILL.md specifies lazy template loading: only `registry.json` is read for classification/routing; template loaded only after user selection
- [ ] SKILL.md contains the explicit dispatch mechanism: Read template -> Agent tool with model from registry -> state_write of dispatch context
- [ ] SKILL.md contains passthrough fallback: if no expert semantic match > 0.3, respond directly with "전문가 매칭 결과가 낮아 일반 모드로 응답합니다"
- [ ] SKILL.md contains cold-start behavior: show 3-4 candidates when `total_interactions < 10`
- [ ] SKILL.md contains Post-Dispatch Feedback Detection section with 6 signal patterns, state_read for attribution, and knowledge accumulation logic
- [ ] SKILL.md contains knowledge compaction trigger (when knowledge.jsonl >= 200 entries)
- [ ] SKILL.md includes the "Relationship to Existing OMC Routing" guardrails (no interception of active execution modes)
- [ ] SKILL.md uses AskUserQuestion tool for presenting expert recommendations
- [ ] Manual test: invoke `/ask "매출 분석 대시보드를 만들어줘"` and verify: classification output appears, expert recommendations shown via AskUserQuestion, user selects, template is loaded and expert dispatched, state_write occurs, feedback detection runs on next message

**Files created:** 1 file (SKILL.md)
**Dependencies:** Phase 1 (needs registry.json and templates)

### Phase 3: Reflection Skill (with Registry Backup)
**Acceptance Criteria:**
- [ ] `expert-reflect/SKILL.md` exists with valid YAML frontmatter, triggered by `/reflect`
- [ ] SKILL.md reads `knowledge.jsonl` and `expert-scores.json`, runs pattern detection (underperforming, overperforming, missing coverage, quadrant drift)
- [ ] SKILL.md generates proposed changes as a human-readable diff with evidence
- [ ] SKILL.md creates a backup of `registry.json` to `expert-knowledge/registry-backup-{timestamp}.json` BEFORE applying any changes
- [ ] SKILL.md enforces max 5 backups (deletes oldest if exceeded)
- [ ] SKILL.md presents proposals to user and waits for explicit approval before applying
- [ ] On approval, SKILL.md updates `registry.json` (trigger_keywords, quadrant_affinity) and `expert-scores.json`
- [ ] Reflection event is logged to `knowledge.jsonl` including backup file path
- [ ] Manual test: after 10+ knowledge entries, run `/reflect` and verify proposals appear with evidence and backup is created

**Files created:** 1 file (SKILL.md)
**Dependencies:** Phase 2 (needs accumulated knowledge data)

### Phase 4: Integration + End-to-End Verification
**Acceptance Criteria:**
- [ ] Expert router is detectable by OMC's skill system (appears in skill listing)
- [ ] `/ask` trigger works from any project directory (user-level skill)
- [ ] Expert router gracefully handles: empty registry, no knowledge history, missing template file, zero-match passthrough
- [ ] Expert router does NOT activate when user is in an active execution mode (ralph, autopilot, ultrawork)
- [ ] Feedback detection activates silently after expert dispatch (no extra user action needed)
- [ ] State handoff via MCP tools works correctly (state_write after dispatch, state_read before feedback detection)
- [ ] Cold-start behavior verified: shows 3-4 candidates initially, transitions to 2-3 after 10 interactions
- [ ] Passthrough mode verified: query with no matching domain triggers direct Claude response
- [ ] Knowledge compaction verified: after 200+ entries, oldest 100 are summarized and truncated
- [ ] All skills reference each other correctly (paths, shared data files)
- [ ] End-to-end test: `/ask` -> classify -> recommend -> user selects -> expert responds -> feedback detected -> knowledge stored -> `/reflect` shows insights with backup

**Files modified:** Potentially `~/.claude/settings.json` if a hook is needed for auto-activation
**Dependencies:** Phases 1-3

---

## Guardrails

### Must Have
- All 18 experts defined with Korean trigger keywords (this is a Korean-first system)
- Two-axis classification with confidence score
- Semantic elimination routing (NOT weighted arithmetic scoring)
- Lazy template loading (only load selected expert's template, never all 18)
- User always selects the expert (no auto-dispatch without user choice)
- Passthrough fallback when no expert matches well (confidence < 0.3)
- Cold-start defaults: all experts at 0.5 score, extra candidates shown until 10 interactions
- Feedback detection is automatic and inline in expert-router SKILL.md
- SKILL.md reflection requires explicit user approval
- Registry backup before any mutation (max 5 rolling backups)
- Knowledge compaction at 200 entries (summarize oldest 100, keep recent 100)
- State handoff via MCP tools for cross-turn attribution
- Expert-router only activates via `/ask` trigger, never intercepts execution modes
- Knowledge stored as append-only JSONL (never lose data, compaction preserves aggregates)
- Graceful degradation: if no history exists, fall back to quadrant affinity sorting only

### Must NOT Have
- No executable code files (.ts, .js, .py) -- everything is SKILL.md prompt instructions + JSON data
- No weighted scoring formula (0.4*x + 0.3*y + ...) -- use semantic elimination instead
- No loading all 18 templates at once -- lazy loading only
- No separate expert-feedback skill -- feedback detection is merged into expert-router
- No auto-applying reflection changes without user approval
- No modification of existing OMC plugin skills (only create new omc-learned skills)
- No dependency on any specific project (user-level only)
- No interception of active execution modes (ralph, autopilot, ultrawork)
- No registry mutation without backup

---

## Success Criteria

1. A user can type `/ask "우리 서비스의 리텐션 개선 전략을 세워줘"` and receive a classified recommendation of 2-3 relevant experts (e.g., Growth Marketer, CPO, Business Data Analyst) via AskUserQuestion UI
2. After selecting an expert, the expert's template is loaded (lazy) and the expert responds in-character with domain-specific frameworks via Agent tool dispatch
3. Dispatch state is saved via MCP state_write; feedback detection reads it via state_read for correct attribution
4. User feedback ("좋아" / "다시 해줘") is automatically captured without explicit action
5. When no expert matches confidently, the system falls back to passthrough mode with a Korean explanation
6. During cold start (first 10 interactions), extra candidates are shown to accelerate learning
7. After 20+ interactions, `/reflect` produces meaningful proposals like "Growth Marketer의 task_ambiguous 적합도를 0.6에서 0.8로 상향 (15회 중 13회 긍정)" with a registry backup created before applying
8. After 200+ knowledge entries, compaction runs and keeps the JSONL file manageable
9. The system works alongside existing OMC routing without interference
10. The entire system works across any project directory (user-level installation)
