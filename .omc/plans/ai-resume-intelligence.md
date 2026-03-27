# VCX Resume Intelligence - Comprehensive Plan
**Plan Version:** 2.0
**Created:** 2026-03-26
**Revised:** 2026-03-26
**Status:** v2.0 — Revised per Architect/Critic feedback
**Complexity:** HIGH (new feature pillar, LLM pipeline, file processing, PDF generation, background jobs)

---

## 1. Context & Rationale

### Problem Statement
S-tier candidates (Core/Endorsed members) are too busy to maintain resumes. They have accomplished so much that compiling it into a structured, well-designed resume is a significant burden. This creates friction in VCX's core placement business -- better resumes lead to more/faster placements.

### Strategic Fit
- **Drives core revenue**: Better resumes -> faster CEO Coffee Chat conversions -> more 25% placement fees
- **Increases retention**: Members who maintain a "living resume" on VCX have strong lock-in
- **New revenue stream**: Per-generation pricing
- **Data moat**: Structured career data becomes VCX's proprietary intelligence asset

### Integration Points (Existing VCX Architecture)
- **Member Profile** (`vcx_members`): Resume data enriches `bio`, `professional_fields`, `years_of_experience`
- **Directory** (`/directory`): Enhanced profiles with resume-backed credentials
- **CEO Coffee Chat**: CEOs see structured candidate summaries instead of raw profiles
- **Position Matching**: Parsed career data enables future AI matching (BMplan 4.8 synergy -- see Section 6)
- **AI Matching (BMplan 4.8)**: Structured `vcx_career_data` becomes the canonical data source for AI-powered position matching. Resume Intelligence creates the data, AI Matching consumes it.

### Opportunity Cost Acknowledgment
Building Resume Intelligence requires significant engineering effort (estimated 4-6 weeks MVP). This time could alternatively be spent on:
- Completing remaining auth flows or admin features
- CEO Coffee Chat enhancements
- Community feature polish

The team should weigh this against current sprint priorities. Resume Intelligence is high strategic value but not blocking any existing user flows.

---

## 2. Competitive Analysis

### 2.1 Global Resume Tools

| Tool | Price | Features | VCX Differentiator |
|------|-------|----------|-------------------|
| resume.io | $2.95-24.95/mo | Templates, AI suggestions | Generic, no Korean, no placement integration |
| Teal | Free-$9/wk | AI resume, job tracking | No Korean market, no verified network |
| Rezi | $3-29/mo | ATS optimization | No Korean, no premium network context |

### 2.2 Korean Resume Tools

| Tool | Price | Features | VCX Differentiator |
|------|-------|----------|-------------------|
| 사라민 AI 이력서 | Free | Basic AI generation | Mass market, no curation, low quality output |
| 잡코리아 AI | Free | Basic generation | Same limitations as Saramin |

### 2.3 DIY with ChatGPT

Users CAN paste career info into ChatGPT, but this approach lacks:
- Multi-source file parsing (no file upload pipeline)
- Cross-source deduplication
- Structured data extraction with schema validation
- Designed PDF output with branding
- VCX-branded social proof for CEO Coffee Chat
- Integration with placement pipeline

### 2.4 VCX's Real Moat

1. **Multi-source intelligent parsing** -- not just text input, but DOCX/PDF/Notion/ZIP processing with deduplication
2. **AI edge/difficulty assessment** -- unique scoring system that highlights what makes each candidate special
3. **Structured career data as platform asset** -- enables future AI matching (BMplan 4.8), not a one-off document
4. **VCX-branded resume = social proof** -- carries weight in CEO Coffee Chat context
5. **Direct integration with placement pipeline** -- resume data feeds into position matching (V1.0+)
6. **Privacy-first design** -- member-controlled data, no public exposure (vs. Saramin/JobKorea)
7. **Korean resume culture support** -- handles both Western-style and Korean 이력서+경력기술서 formats

---

## 3. Korean Resume Culture Support

### 3.1 Korean Resume Conventions

Korean hiring culture uses two distinct document types:

**이력서 (기본 이력서 - Standard Resume):**
- 증명사진 (formal photo) -- optional in VCX context
- 인적사항 (personal info): 생년월일 (date of birth), 연락처 (contact)
- 학력 (education history)
- 경력사항 (career summary -- company, title, dates)
- 자격증 (certifications/licenses)
- 병역사항 (military service -- optional, common for male candidates)

**경력기술서 (Detailed Career Description):**
- Separate document that accompanies 이력서
- Detailed project-by-project narrative
- Responsibilities, achievements, technologies used
- Common format at senior level (exactly VCX's target)

### 3.2 Template Strategy

Resume templates MUST support both formats:

| Template | Style | Output Format |
|----------|-------|---------------|
| `vcx-executive` (MVP) | Western-style, achievement-focused | Single combined document |
| `vcx-korean-standard` (V1.0) | Korean 이력서 format | 이력서 (1-2 pages) |
| `vcx-korean-career` (V1.0) | Korean 경력기술서 format | 경력기술서 (3-5 pages) |
| `vcx-technical` (V1.0) | Skills/project-heavy | Single combined document |

### 3.3 Career Data Schema: Korean-Specific Fields

The `CareerData` JSON schema must include:
- `military_service` (병역사항): `{ status: 'completed' | 'exempt' | 'n/a', branch?: string, period?: string }` -- optional field
- `certifications` (자격증): `{ name: string, issuer: string, date: string, number?: string }[]`
- `photo_url` (증명사진): optional, for Korean-format templates only

### 3.4 Future Data Sources (V2.0)

- Saramin (사라민) profile import
- JobKorea (잡코리아) profile import
- These require partnership/API agreements, deferred to V2.0

---

## 4. Feature Architecture

### 4.1 Data Flow

```
[Upload Sources]          [Processing Pipeline]           [Output]

Notion HTML/MD ──┐
LinkedIn PDF ────┤        ┌──────────────────┐       ┌──────────────┐
DOCX files ──────┼──────> │ 1. Parse & Extract│──────>│ Structured   │
PDF files ───────┤        │ 2. Deduplicate    │       │ Career JSON  │
ZIP (mixed) ─────┘        │ 3. Chronological  │       └──────┬───────┘
                          │    Ordering       │              │
                          └──────────────────┘              v
                                                  ┌──────────────────┐
                                                  │ 4. Edge & Impact │
                                                  │    Assessment    │
                                                  │ 5. Resume Draft  │
                                                  │ 6. PDF via       │
                                                  │    Gotenberg     │
                                                  └────────┬─────────┘
                                                           │
                                                           v
                                                  ┌──────────────────┐
                                                  │ VCX Branded PDF  │
                                                  │ + Profile Update │
                                                  └──────────────────┘
```

### 4.2 Background Processing Architecture

**Problem**: The LLM pipeline (parse + 2-3 LLM calls + PDF generation) will exceed Vercel's default 10s serverless timeout.

**Recommended Solution: Vercel `maxDuration` + Client Polling**

```
Client                          Server (Vercel)                    Supabase
  │                                │                                 │
  ├─ POST /api/resume/upload ─────>│                                 │
  │                                ├─ Store files ──────────────────>│
  │                                ├─ Create job (status: pending) ─>│
  │<─ { jobId } ───────────────────┤                                 │
  │                                │                                 │
  ├─ POST /api/resume/jobs/[id]/start ──>│                           │
  │                                │  (maxDuration: 300s, Pro plan)  │
  │<─ { status: processing } ──────┤                                 │
  │                                ├─ Step 1: Parse files            │
  │                                ├─ Update status: extracting ────>│
  │  (polling every 3s)            ├─ Step 2: LLM extraction         │
  │  GET /api/resume/jobs/[id] ───>├─ Update status: analyzing ─────>│
  │<─ { status: analyzing } ───────┤                                 │
  │                                ├─ Step 3: LLM generation         │
  │  GET /api/resume/jobs/[id] ───>├─ Update status: generating ────>│
  │<─ { status: generating } ──────┤                                 │
  │                                ├─ Step 4: PDF via Gotenberg      │
  │  GET /api/resume/jobs/[id] ───>├─ Update status: completed ─────>│
  │<─ { status: completed, url } ──┤                                 │
```

**Route config for long-running pipeline:**
```typescript
// src/app/api/resume/jobs/[id]/start/route.ts
export const maxDuration = 300; // 5 minutes (Vercel Pro plan)
```

**Fallback options (if Vercel Pro `maxDuration` is insufficient):**
1. **Supabase Edge Functions** -- triggered by database webhook on job creation
2. **External job queue** -- Inngest or Trigger.dev for reliable background processing
3. **Split pipeline** -- each LLM step as a separate API call, client orchestrates sequence

**Client-side polling**: SWR with `refreshInterval: 3000` on job status endpoint. Display progress bar with step indicators (uploading -> extracting -> analyzing -> generating -> complete).

### 4.3 Storage Strategy (Supabase)

**New Supabase Storage Buckets:**

| Bucket | Purpose | Access | Retention |
|--------|---------|--------|-----------|
| `resume-uploads` | Raw uploaded files (Notion, DOCX, PDF, ZIP) | Owner only (RLS) | 30 days after processing |
| `resume-outputs` | Generated PDF resumes | Owner + Admin | Permanent |

**New Database Tables:**

| Table | Purpose |
|-------|---------|
| `vcx_resume_jobs` | Processing job tracking (status, timestamps, error, daily count for rate limiting) |
| `vcx_resume_sources` | Per-source metadata (file type, original name, parsed status) |
| `vcx_career_data` | Structured career JSON (projects, roles, education, certifications, military service) |
| `vcx_resume_outputs` | Generated resume metadata (template, version, PDF storage path) |

### 4.4 DB-backed Rate Limiting

Add columns to `vcx_resume_jobs` for rate limit enforcement:

```sql
-- In vcx_resume_jobs table
generation_tier TEXT CHECK (generation_tier IN ('free', 'standard', 'premium')),
created_at TIMESTAMPTZ DEFAULT now()
```

**Rate limit check** (before allowing new generation):
```sql
SELECT
  COUNT(*) FILTER (WHERE generation_tier IN ('free', 'standard')) as standard_count,
  COUNT(*) FILTER (WHERE generation_tier = 'premium') as premium_count
FROM vcx_resume_jobs
WHERE member_id = $1
  AND created_at > now() - interval '24 hours'
  AND status != 'failed';
```

**Limits**: 5 Standard + 2 Premium per day per member.

### 4.5 Privacy Design

- All uploaded files stored in member-scoped Supabase Storage (RLS: `auth.uid() = member_id`)
- Raw files auto-deleted after 30 days (Supabase Edge Function cron)
- Career data owned by member, deletable on request (GDPR/PIPA-style)
- LLM calls use Anthropic API (no training on user data)
- No career data shared with corporate users unless member explicitly opts in
- Resume generation logs stored but content not logged (only token counts)

---

## 5. Technical Implementation

### 5.1 File Parsing Strategy

| Format | Library/Approach | Notes |
|--------|-----------------|-------|
| **Notion HTML/MD** | `unified` + `rehype` (HTML) / `remark` (MD) | Extract headings, lists, tables as structured text |
| **LinkedIn URL** | Not feasible (scraping TOS violation) | Accept **LinkedIn PDF export** only |
| **LinkedIn PDF Export** | `unpdf` | LinkedIn's "Save as PDF" produces structured text |
| **DOCX** | `mammoth` (DOCX->HTML->text) | Handles formatting, tables, bullet lists |
| **PDF (general)** | `unpdf` (modern wrapper around pdf.js) | Text-based PDFs only for MVP |
| **PDF (scanned)** | Error message | "스캔된 PDF는 지원되지 않습니다. 텍스트 기반 PDF를 업로드해 주세요." |
| **ZIP** | `jszip` | Extract, detect file types, route to appropriate parser |

**Note on scanned PDFs / OCR**: OCR is deferred entirely to V2.0. For MVP and V1.0, if a PDF yields no extractable text, display a clear Korean error message asking the user to upload a text-based PDF. V2.0 will use Google Cloud Vision API for OCR.

**FormData parsing note**: The upload endpoint must use `FormData` (not JSON). The existing `parseBody` utility is JSON-only; the upload route handler will parse `FormData` directly via `request.formData()`.

**Server-side only**: All parsing runs in Next.js Route Handlers (not client-side). Files are uploaded to Supabase Storage first, then processed by the background pipeline.

### 5.2 LLM Pipeline Design

#### MVP: 2-Step Pipeline (Sonnet)

For MVP, combine extraction+assessment into a single LLM call to reduce latency and complexity.

**Step 1: Extraction + Assessment (Sonnet)**
- **Input**: Concatenated parsed text from all sources + system prompt
- **Task**: Extract structured career data AND assess each item:
  - Work experience (company, title, dates, responsibilities, achievements)
  - Projects (name, role, impact, technologies)
  - Education, certifications (자격증), military service (병역사항, optional)
  - Skills & specialties
  - Per-item scores: edge (1-10), difficulty (1-10), impact (1-10)
  - Recommended emphasis for resume
- **Model**: Claude Sonnet
- **Output**: `CareerDataWithAssessment` JSON schema (validated with Zod)

**Step 2: Resume Generation (Sonnet)**
- **Input**: `CareerDataWithAssessment` + target template instructions
- **Task**: Generate polished resume content in Korean
  - Professional summary (3-4 sentences)
  - Optimally ordered sections based on assessment scores
  - Achievement-focused bullet points
  - Appropriate length (2-3 pages for senior professionals)
- **Model**: Claude Sonnet (strong Korean writing)
- **Output**: Structured resume sections (JSON with formatted text)

#### Premium / V1.0: 3-Step Pipeline

Expand to 3 steps for Premium tier, splitting extraction and assessment:

| Step | Task | Model (Standard) | Model (Premium) |
|------|------|-------------------|-----------------|
| 1. Extraction | Parse raw text -> structured CareerData JSON | Sonnet | Sonnet |
| 2. Assessment | Score edge/difficulty/impact per item | Sonnet | Sonnet |
| 3. Generation | Produce polished resume content in Korean | Sonnet | Opus |

#### Why Sonnet Default, Opus Premium Only?

Sonnet is sufficient for extraction and assessment (well-defined structured tasks). Opus provides noticeably better Korean prose quality for the final generation step, justifying the premium price. The 3-step split in Premium allows each step to be focused and debuggable.

### 5.3 Korean Font Strategy & PDF Generation

**Approach: Gotenberg (headless Chrome as a service)**

| Component | Technology | Reason |
|-----------|-----------|--------|
| Resume HTML | React Server Components (SSR to static HTML) | Reuse VCX design tokens, Tailwind |
| PDF engine | Gotenberg (self-hosted headless Chrome) | Perfect Korean font rendering, zero font-bundling complexity |
| Hosting | Railway or Fly.io (~$5/month) | Cheap, always-on, avoids Vercel serverless limits |

**Why NOT `@react-pdf/renderer`:**
- CJK (Korean) font registration is complex and fragile
- Limited CSS support (no Tailwind, no flexbox gaps)
- Font files bloat the serverless function

**Why NOT Puppeteer on Vercel:**
- Chrome binary exceeds 50MB function size limit
- Cold start times unacceptable for PDF generation

**PDF generation flow:**
```
Resume JSON → React SSR (HTML + inline CSS) → POST to Gotenberg /forms/chromium/convert/html → PDF bytes → Upload to Supabase Storage
```

**Templates (Phase 1: 1 template, V1.0: 3+):**

| Template | Style | Target |
|----------|-------|--------|
| `vcx-executive` | Clean, minimal, VCX gold accents | Default for all members (MVP) |
| `vcx-korean-standard` | Korean 이력서 format | Korean market (V1.0) |
| `vcx-korean-career` | Korean 경력기술서 format | Senior professionals (V1.0) |
| `vcx-technical` | Skills-heavy, project-focused | Engineering members (V1.0) |

**Design system**: Uses existing VCX `DESIGN_TOKENS` (accent gold `#c9a84c`, typography scale).

### 5.4 API Route Design

```
POST   /api/resume/upload                   # Upload files (FormData), create job
GET    /api/resume/jobs                      # List member's resume jobs
GET    /api/resume/jobs/[id]                 # Job status + progress (polling target)
POST   /api/resume/jobs/[id]/start           # Trigger processing pipeline (maxDuration: 300)
GET    /api/resume/jobs/[id]/career-data     # View extracted career data (for editing)
PUT    /api/resume/jobs/[id]/career-data     # Edit career data before generation
POST   /api/resume/jobs/[id]/generate        # Generate final PDF (from edited career data)
GET    /api/resume/jobs/[id]/download        # Download generated PDF
GET    /api/resume/jobs/[id]/outputs         # Version history (all generated PDFs for this job)
DELETE /api/resume/jobs/[id]                 # Delete job + all associated data
```

**Authentication**: All routes require VCX member auth (existing middleware pattern).
**Route registration**: Add `/resume` to `protectedRoutes` array in `src/lib/auth/routes.ts`.
**Validation**: Zod schemas for all request bodies. Upload route uses `request.formData()` (not `parseBody`).
**Error handling**: Existing `error.ts` helpers (`badRequest`, `unauthorized`, etc.).

### 5.5 Frontend Pages

```
/resume                    # Resume Intelligence landing + job list
/resume/new                # Multi-file upload wizard
/resume/[id]               # Job detail: status, career data review, PDF preview
/resume/[id]/edit          # Edit extracted career data before generation
```

All pages under `(protected)` route group (existing auth pattern via middleware).

---

## 6. Token Cost Analysis

### 6.1 Input Size Estimation

**Typical S-tier candidate's raw data:**

| Source | Pages | Characters | Tokens (approx) |
|--------|-------|------------|-----------------|
| LinkedIn PDF export | 3-5 pages | ~8,000 chars | ~2,500 tokens |
| Notion career page | 10-20 pages | ~30,000 chars | ~9,000 tokens |
| Existing resume (DOCX/PDF) | 2-5 pages | ~6,000 chars | ~2,000 tokens |
| Certificates/portfolio (PDF) | 5-10 pages | ~15,000 chars | ~4,500 tokens |
| **Total raw input** | **20-40 pages** | **~60,000 chars** | **~18,000 tokens** |

Heavy uploaders (ZIP with many files) could reach 80-100 pages (~30,000 tokens).

### 6.2 MVP 2-Step Pipeline Costs (Claude Sonnet: $3/M input, $15/M output)

| Step | Input Tokens | Output Tokens | Input Cost | Output Cost | Total |
|------|-------------|---------------|------------|-------------|-------|
| **Step 1: Extraction + Assessment** | ~22,000 | ~7,000 | $0.066 | $0.105 | **$0.171** |
| **Step 2: Generation** | ~10,000 | ~4,000 | $0.030 | $0.060 | **$0.090** |
| **Total per resume (MVP)** | **~32,000** | **~11,000** | **$0.096** | **$0.165** | **$0.261** |

### 6.3 V1.0 3-Step Pipeline Costs (Standard: Sonnet all steps)

| Step | Input Tokens | Output Tokens | Input Cost | Output Cost | Total |
|------|-------------|---------------|------------|-------------|-------|
| **Step 1: Extraction** | ~20,000 | ~5,000 | $0.060 | $0.075 | **$0.135** |
| **Step 2: Assessment** | ~7,000 | ~3,000 | $0.021 | $0.045 | **$0.066** |
| **Step 3: Generation** | ~12,000 | ~4,000 | $0.036 | $0.060 | **$0.096** |
| **Total per resume** | **~39,000** | **~12,000** | **$0.117** | **$0.180** | **$0.297** |

### 6.4 Premium Option: Opus Generation (Step 3 only)

Replace Step 3 with Opus ($15/M input, $75/M output):

| Step 3 (Opus) | Input Tokens | Output Tokens | Input Cost | Output Cost | Total Step 3 |
|---------------|-------------|---------------|------------|-------------|-------------|
| Standard case | ~12,000 | ~4,000 | $0.180 | $0.300 | **$0.480** |

**Opus premium total**: $0.135 + $0.066 + $0.480 = **$0.681** per resume

### 6.5 Heavy Uploader Scenario (100 pages)

| Scenario | Sonnet Only | Sonnet + Opus (Step 3) |
|----------|-------------|----------------------|
| **Standard (20-40 pages)** | **$0.30** | **$0.68** |
| **Heavy (100 pages)** | **$0.46** | **$0.84** |
| **With 2 regenerations** | **$0.50** | **$1.04** |

### 6.6 Infrastructure Costs (Per Resume)

| Item | Cost |
|------|------|
| Supabase Storage (temporary files, ~50MB) | ~$0.001 |
| Supabase DB operations | ~$0.001 |
| Gotenberg PDF generation | ~$0.005 |
| Gotenberg hosting (Railway/Fly.io amortized) | ~$0.005 |
| **Total infra per resume** | **~$0.01** |

### 6.7 Total COGS Per Resume

| Tier | LLM Cost | Infra Cost | Total COGS | Recommended Price | Gross Margin |
|------|----------|------------|------------|-------------------|-------------|
| **Standard (Sonnet)** | $0.30 | $0.01 | **$0.31** | 9,900원 (~$7.60) | **95.9%** |
| **Premium (Opus)** | $0.68 | $0.01 | **$0.69** | 19,900원 (~$15.30) | **95.5%** |

---

## 7. Business Model & Pricing

### 7.1 Pricing Tiers (Simplified)

| Tier | Price | Includes | Target |
|------|-------|----------|--------|
| **Free** (1회) | 0원 | 1 Standard generation per member | All members (onboarding hook) |
| **Standard** | 9,900원/회 | 2-step Sonnet pipeline, 1 template, 2 regenerations | Occasional users |
| **Premium** | 19,900원/회 | 3-step pipeline with Opus final step, all templates, 5 regenerations | Quality-conscious members |
| **Resume 갱신 패키지** | 24,900원/3회 | 3x Standard generations (8,300원/회) | Light bundling for repeat users |

**Removed**: "Unlimited 월 29,900원" subscription tier -- episodic resume generation has weak demand evidence for monthly subscription. Members generate resumes 1-3 times per year, not monthly.

**Future consideration**: Offer free Standard generation as Core+ membership benefit to drive subscription value.

### 7.2 Revenue Projections

**Assumptions:**
- Phase 3 (6-12 months): 100 members, 30% try resume feature
- Phase 4 (12-24 months): 200 members, 40% try resume feature

#### Phase 3 Monthly Revenue

| Revenue Source | Calculation | Monthly |
|---------------|-------------|---------|
| Free generation (onboarding) | 100 members x 1 free = cost only | -$31 (COGS) |
| Standard per-generation | 15 members x 1.5 gen/month x 9,900원 | 222,750원 |
| Premium per-generation | 5 members x 1 gen/month x 19,900원 | 99,500원 |
| 갱신 패키지 | 3 packages x 24,900원 | 74,700원 |
| **Total** | | **~397,000원/월 (~$305)** |
| **COGS** | ~30 generations x $0.40 avg | ~$12 (~15,600원) |
| **Gross Profit** | | **~381,000원/월** |

#### Phase 4 Monthly Revenue

| Revenue Source | Calculation | Monthly |
|---------------|-------------|---------|
| Standard per-generation | 40 members x 1.5 gen/month x 9,900원 | 594,000원 |
| Premium per-generation | 15 members x 1 gen/month x 19,900원 | 298,500원 |
| 갱신 패키지 | 10 packages x 24,900원 | 249,000원 |
| **Total** | | **~1,141,500원/월 (~$878)** |
| **COGS** | ~85 generations x $0.45 avg | ~$38 (~49,400원) |
| **Gross Profit** | | **~1,092,000원/월** |

### 7.3 Strategic Revenue Impact (Indirect)

The real value is not direct resume revenue but **acceleration of placement fees**:

| Impact | Mechanism | Estimated Value |
|--------|-----------|----------------|
| Faster placements | Better resumes -> CEO decides faster | +0.5 placements/month at Phase 4 |
| Higher placement rates | Structured data -> better matching | +10% conversion improvement |
| Member retention | Resume-as-a-service lock-in | -20% churn reduction |
| **Indirect revenue uplift** | 0.5 extra placements x 2,500만원 avg fee | **+1,250만원/월** |

**Combined Phase 4 monthly impact**: ~114만원 (direct) + ~1,250만원 (indirect) = **~1,364만원/월**

---

## 8. BMplan.md Integration: Section 4.11

### Proposed Addition: "4.11 AI Resume Intelligence"

```markdown
### 4.11 AI Resume Intelligence (VCX Resume Builder)

#### 4.11.1 개요

S-tier 인재는 이력서를 관리할 시간이 없습니다. VCX Resume Intelligence는 멤버가
다양한 소스(Notion, LinkedIn PDF, DOCX, 포트폴리오)를 업로드하면 AI가 자동으로
구조화된 커리어 데이터를 추출하고, VCX 브랜드의 프로페셔널 이력서 PDF를 생성합니다.

한국식 이력서(이력서+경력기술서) 및 Western-style 모두 지원합니다.

#### 4.11.2 경쟁 우위

| 경쟁사 | VCX 차별점 |
|--------|-----------|
| resume.io, Teal, Rezi | 한국어 미지원, 배치 연동 없음 |
| 사라민/잡코리아 AI | 매스마켓, 큐레이션 없음, 품질 낮음 |
| ChatGPT DIY | 파일 파싱/중복제거/PDF 디자인/브랜딩 없음 |

핵심 해자: 멀티소스 파싱, AI 엣지 평가, 구조화 데이터의 플랫폼 자산화,
VCX 브랜드 이력서의 CEO Coffee Chat 신뢰도, 채용 파이프라인 직접 연동.

#### 4.11.3 가격 구조

| 티어 | 가격 | 내용 |
|------|------|------|
| 무료 (1회) | 0원 | 온보딩 시 1회 Standard 생성 |
| Standard | 9,900원/회 | AI 추출 + 구조화 + PDF (Sonnet) |
| Premium | 19,900원/회 | 3단계 파이프라인 + Opus 최종 생성 + 전체 템플릿 |
| 갱신 패키지 | 24,900원/3회 | Standard 3회 묶음 |

#### 4.11.4 원가 구조 (COGS)

| 항목 | Standard | Premium |
|------|----------|---------|
| LLM 토큰 비용 | ~400원 | ~900원 |
| 인프라 비용 (Gotenberg 등) | ~13원 | ~13원 |
| **총 원가** | **~413원** | **~913원** |
| **마진율** | **95.8%** | **95.4%** |

#### 4.11.5 수익 전망

| Phase | 월 직접 매출 | 월 COGS | 월 순수익 |
|-------|------------|---------|----------|
| Phase 3 (100명) | ~40만원 | ~1.5만원 | ~38만원 |
| Phase 4 (200명) | ~114만원 | ~5만원 | ~109만원 |

#### 4.11.6 전략적 가치 (간접 수익)

- 더 나은 이력서 → CEO Coffee Chat 전환율 향상 → 월 0.5건 추가 성사 추정
- Phase 4 간접 수익 효과: **월 ~1,250만원** (추가 채용 수수료)
- 멤버 리텐션 향상: 이력서 갱신 = 플랫폼 재방문 루프

#### 4.11.7 AI Matching 시너지 (Section 4.8 연동)

Resume Intelligence의 `vcx_career_data` 테이블은 AI Matching(4.8)의 핵심 데이터 소스가 됩니다:
- 구조화된 경력 데이터 → 포지션 매칭 정확도 향상
- 엣지/난이도/임팩트 스코어 → 후보자 랭킹 알고리즘 입력값
- 멤버가 이력서를 생성할수록 매칭 데이터 품질 향상 (선순환)

#### 4.11.8 Core+ / Intro+ 번들 가능성

- Core+ 구독에 Premium 1회/분기 포함 → 구독 가치 강화
- 무료 Standard 1회를 온보딩 인센티브로 활용 → 가입 전환율 향상
```

---

## 9. Implementation Phases

### Phase MVP (4-6 weeks)

**Scope**: Single-file upload (DOCX/PDF only) -> 2-step Sonnet pipeline -> 1 template PDF via Gotenberg

**Deliverables:**
1. Route registration: Add `/resume` to `protectedRoutes` in `src/lib/auth/routes.ts`
2. File upload UI (`/resume/new`) - single file, DOCX or PDF only (FormData upload)
3. Supabase Storage buckets + `vcx_resume_jobs`, `vcx_resume_sources`, `vcx_career_data`, `vcx_resume_outputs` tables
4. Parsing pipeline (DOCX via `mammoth`, PDF via `unpdf`); scanned PDF detection with Korean error message
5. 2-step Sonnet LLM pipeline (extraction+assessment -> generation) with `maxDuration: 300`
6. Client-side polling UI with progress indicators (SWR `refreshInterval: 3000`)
7. Single PDF template (`vcx-executive`) via Gotenberg (self-hosted on Railway/Fly.io)
8. Career data viewer + editor UI (`/resume/[id]`, `/resume/[id]/edit`)
9. Job status tracking & version history (`/resume/[id]`, `/api/resume/jobs/[id]/outputs`)
10. DB-backed rate limiting (5 Standard + 2 Premium per day)

**Acceptance Criteria:**
- Member uploads a DOCX resume, gets a structured VCX-branded PDF within 2 minutes
- Career data is viewable and editable before final generation
- Korean career data fields (자격증, 병역사항) supported in schema
- Scanned PDFs show clear Korean error message (not silent failure)
- Cost per generation under $0.50
- Pipeline does not timeout (background processing with polling works)
- Rate limiting enforced at DB level

### Phase V1.0 (8-12 weeks from start)

**Added scope**: Multi-source upload, ZIP support, 3-step Premium pipeline, Korean templates, payment

**Additional Deliverables:**
11. Multi-file upload (Notion HTML/MD, LinkedIn PDF, multiple PDFs)
12. ZIP extraction and routing
13. 3-step pipeline for Premium tier (separate extraction and assessment steps)
14. Premium tier with Opus Step 3
15. Korean-format templates (`vcx-korean-standard`, `vcx-korean-career`)
16. Technical template (`vcx-technical`)
17. Payment integration (Toss Payments or Stripe)
18. 갱신 패키지 (3-pack) purchase flow
19. Regeneration with edits (update career data -> re-generate)

**Acceptance Criteria:**
- Member uploads ZIP with mixed files, gets deduplicated structured resume
- Member can edit extracted career data before generation
- 4 template choices available (including Korean-format)
- Payment flow works for Standard, Premium, and 갱신 패키지
- Premium generation uses Opus and produces noticeably higher-quality Korean prose

### Phase V2.0 (Future, 6+ months)

**Vision features:**
- OCR for scanned PDFs via Google Cloud Vision API
- Saramin/JobKorea profile import (partnership required)
- LinkedIn URL scraping (if legal path found, or browser extension)
- Notion API direct integration (connect Notion workspace)
- Auto-update: detect career changes and suggest resume updates
- Multi-language generation (Korean + English from same data)
- Portfolio page: public VCX profile with resume highlights (opt-in)
- Integration with Position matching: auto-tailor resume per position
- Bulk corporate view: anonymized candidate summaries for CEO review

---

## 10. Risk Analysis

### 10.1 Data Privacy Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Career data leak | HIGH | RLS on all tables, member-scoped storage, encryption at rest |
| LLM provider data retention | MEDIUM | Use Anthropic API (no training on data), verify data handling agreement |
| Raw files persisted too long | LOW | Auto-delete cron after 30 days |
| GDPR/PIPA compliance | MEDIUM | Full data deletion API, explicit consent on upload |

### 10.2 Token Cost Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Usage spike (all members generate at once) | LOW | DB-backed rate limiting (5+2/day per member) |
| Unexpectedly large uploads (500+ pages) | MEDIUM | Hard cap at 100 pages / 50MB per job |
| Regeneration abuse | LOW | Cap regenerations per tier (2/5) |
| Token price increases | LOW | Pricing model has 95%+ margin buffer |

**Worst case cost scenario**: 200 members all generate Premium in one month = 200 x $0.69 = **$138 total**. Trivially manageable.

### 10.3 Quality Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Poor extraction from messy PDFs | HIGH | Clear error for scanned PDFs + manual career data editor as fallback |
| Mediocre resume writing | MEDIUM | Carefully engineered prompts, Korean language QA, A/B test templates |
| Hallucinated achievements | HIGH | Career data review step before generation (member verifies) |
| Korean language issues | MEDIUM | Sonnet has strong Korean; test with real member data before launch |

### 10.4 Infrastructure Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Vercel 300s timeout exceeded | MEDIUM | Monitor pipeline duration; fallback to Inngest/Trigger.dev if needed |
| Gotenberg service downtime | LOW | Railway/Fly.io have good uptime; queue + retry logic |
| Vercel Pro plan required | LOW | Budget ~$20/month; essential for `maxDuration` |

### 10.5 Competitive Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Generic AI resume builders | LOW | VCX differentiator: network context, Korean culture, placement integration |
| LinkedIn adding similar feature | MEDIUM | VCX's value is curation + privacy + Korean market focus |
| Members prefer ChatGPT DIY | MEDIUM | Free first generation, superior UX (file parsing + designed PDF) |
| Korean competitors (Saramin AI) | LOW | Quality gap + VCX exclusivity + branded output |

---

## 11. New Dependencies Required

| Package | Purpose | Size | Notes |
|---------|---------|------|-------|
| `mammoth` | DOCX -> HTML parsing | ~2MB | |
| `unpdf` | PDF text extraction | ~1MB | Replaces abandoned `pdf-parse` (last updated 2020) |
| `jszip` | ZIP file extraction | ~200KB | |
| `@anthropic-ai/sdk` | Anthropic API client | ~500KB | |
| `unified` + `rehype` + `remark` | Notion HTML/MD parsing | ~3MB | V1.0 (multi-source) |

**PDF generation**: Gotenberg (self-hosted, not an npm dependency). Communicate via HTTP POST.

**Removed from plan**: `tesseract.js` (OCR deferred to V2.0), `pdf-parse` (replaced by `unpdf`), `puppeteer-core` (replaced by Gotenberg).

---

## 12. Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `ANTHROPIC_API_KEY` | Anthropic API for LLM pipeline | Yes |
| `GOTENBERG_URL` | Gotenberg service URL for PDF generation | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | (existing) Supabase URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (existing) Supabase anon key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | (existing) Admin client | Yes |

---

## 13. Database Migration Plan

**Migration file**: `013_vcx_resume_intelligence.sql`

```sql
-- Tables: vcx_resume_jobs, vcx_resume_sources, vcx_career_data, vcx_resume_outputs
-- Storage buckets: resume-uploads, resume-outputs
-- RLS: member_id = auth.uid() on all tables
-- Indexes: member_id, status, created_at
-- Rate limit support: generation_tier column + date range queries on vcx_resume_jobs
-- Korean-specific fields in vcx_career_data: military_service (JSONB), certifications (JSONB[])
```

Follows existing naming convention (`NNN_vcx_<description>.sql`).

---

## 14. Success Criteria

| Metric | Target (3 months post-launch) |
|--------|-------------------------------|
| Adoption rate | 30%+ of active members try resume generation |
| Completion rate | 80%+ of started jobs produce a PDF |
| Member satisfaction | 4.0+/5.0 average rating |
| Generation time | Under 2 minutes for standard |
| Cost per generation | Under $0.50 average |
| Direct monthly revenue | 40만원+ (Phase 3) |
| Indirect placement uplift | Measurable improvement in Coffee Chat conversion |
| Scanned PDF error rate | <5% of uploads (clear error messaging) |
| Pipeline timeout rate | <1% of jobs |

---

## 15. Open Questions

See `.omc/plans/open-questions.md` for tracked items.
