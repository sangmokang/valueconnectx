import { claude } from '@/lib/ai/claude'

export interface RawArticle {
  title: string
  url: string
  source: string
  publishedAt?: string
}

export interface CuratedNewsItem {
  company: string
  company_tag: string | null
  role: string
  level: string | null
  team_size: string | null
  salary_band: string | null
  location: string | null
  tags: string[]
  summary: string
  exclusive: false
  item_type: 'news'
  source_url: string
  source_name: string
  headline: string
  published_at: string
}

function parseRssItems(xml: string): Array<{ title: string; link: string; pubDate?: string }> {
  const items: Array<{ title: string; link: string; pubDate?: string }> = []
  const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const content = match[1]
    const titleMatch =
      content.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>/) ||
      content.match(/<title[^>]*>(.*?)<\/title>/)
    const linkMatch = content.match(/<link[^>]*>(.*?)<\/link>/)
    const pubDateMatch = content.match(/<pubDate[^>]*>(.*?)<\/pubDate>/)
    if (titleMatch?.[1] && linkMatch?.[1]) {
      items.push({
        title: titleMatch[1].trim(),
        link: linkMatch[1].trim(),
        pubDate: pubDateMatch?.[1],
      })
    }
  }
  return items.slice(0, 20)
}

async function fetchTechCrunch(): Promise<RawArticle[]> {
  try {
    const res = await fetch('https://techcrunch.com/feed/', { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRssItems(xml).map((i) => ({
      title: i.title,
      url: i.link,
      source: 'TechCrunch',
      publishedAt: i.pubDate,
    }))
  } catch (err) {
    console.error('[curator] TechCrunch fetch error:', err)
    return []
  }
}

async function fetchHackerNewsJobs(): Promise<RawArticle[]> {
  try {
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json', {
      signal: AbortSignal.timeout(8000),
    })
    if (!idsRes.ok) return []
    const ids: number[] = await idsRes.json()
    const results = await Promise.allSettled(
      ids.slice(0, 20).map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
          signal: AbortSignal.timeout(5000),
        }).then((r) => r.json()),
      ),
    )
    const articles: RawArticle[] = []
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.title) {
        articles.push({
          title: r.value.title,
          url: r.value.url ?? `https://news.ycombinator.com/item?id=${r.value.id}`,
          source: 'HackerNews Jobs',
          publishedAt: r.value.time ? new Date(r.value.time * 1000).toISOString() : undefined,
        })
      }
    }
    return articles
  } catch (err) {
    console.error('[curator] HackerNews Jobs fetch error:', err)
    return []
  }
}

async function fetchVentureBeat(): Promise<RawArticle[]> {
  try {
    const res = await fetch('https://venturebeat.com/feed/', { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRssItems(xml).map((i) => ({
      title: i.title,
      url: i.link,
      source: 'VentureBeat',
      publishedAt: i.pubDate,
    }))
  } catch (err) {
    console.error('[curator] VentureBeat fetch error:', err)
    return []
  }
}

async function fetchRedditJobs(): Promise<RawArticle[]> {
  try {
    const res = await fetch('https://www.reddit.com/r/cscareerquestions/top.json?limit=25&t=week', {
      headers: { 'User-Agent': 'VCX-Curator/1.0' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const data = await res.json()
    const posts: Array<{ data: { title: string; url: string; created_utc: number } }> =
      data?.data?.children ?? []
    return posts.map((p) => ({
      title: p.data.title,
      url: p.data.url,
      source: 'Reddit r/cscareerquestions',
      publishedAt: p.data.created_utc
        ? new Date(p.data.created_utc * 1000).toISOString()
        : undefined,
    }))
  } catch (err) {
    console.error('[curator] Reddit Jobs fetch error:', err)
    return []
  }
}

export async function fetchRawArticles(): Promise<RawArticle[]> {
  const results = await Promise.allSettled([
    fetchTechCrunch(),
    fetchHackerNewsJobs(),
    fetchVentureBeat(),
    fetchRedditJobs(),
  ])

  const all: RawArticle[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      all.push(...result.value)
    }
  }

  const seen = new Set<string>()
  const deduped: RawArticle[] = []
  for (const article of all) {
    if (!seen.has(article.url)) {
      seen.add(article.url)
      deduped.push(article)
    }
  }

  return deduped
}

interface AIResponseItem {
  headline: string
  company: string
  role: string
  summary: string
  tags: string[]
  source_url: string
  source_name: string
  relevance_score: number
}

export async function curateWithAI(articles: RawArticle[]): Promise<CuratedNewsItem[]> {
  if (!claude) {
    console.error('[curator] Claude client not initialized (missing ANTHROPIC_API_KEY)')
    return []
  }

  const limited = articles.slice(0, 40)

  const systemPrompt = `당신은 ValueConnect X의 채용 큐레이션 에디터입니다.
한국 IT/비즈니스 인재 네트워크 멤버들에게 가치 있는 글로벌·국내 채용 기회를 선별합니다.

선별 기준 (다음 중 하나 이상):
1. 글로벌 빅테크 채용 공고: Google, Meta, Microsoft, Apple, OpenAI, Anthropic, Nvidia, Amazon 등
2. 한국 주요 기업 채용: 삼성, LG, SK, 카카오, 네이버, 현대, 쿠팡, 크래프톤, 하이브, 두나무 등
3. 주목할 스타트업 채용: 시리즈 A 이상 투자받은 AI, 핀테크, SaaS 스타트업
4. 경영진/임원급 채용 변화: CTO, CPO, VP Engineering 등 시니어 포지션
5. 팀 확장/대규모 채용: 엔지니어링 팀 확장, 한국 지사 설립, R&D 센터 개설
6. 한국 개발자·기술 인재가 지원 가능한 포지션

제외 기준:
- 채용과 무관한 일반 기술 뉴스
- 한국 인재와 무관한 순수 로컬 뉴스
- 저수준 또는 검증 불가한 채용 정보`

  const articlesPayload = limited.map((a) => ({
    title: a.title,
    url: a.url,
    source: a.source,
  }))

  const userPrompt = `다음 기사/공고 목록에서 채용 관련 콘텐츠를 선별하고 JSON 배열로 반환하세요.
relevance_score 6점 이상만 선별. 최대 15개.

기사 목록:
${JSON.stringify(articlesPayload, null, 2)}

응답 형식 (JSON 배열만, 다른 텍스트 없음):
[
  {
    "headline": "원문 제목",
    "company": "채용 주체 회사명",
    "role": "한국어 채용 헤드라인 (25자 내외, 직무·직급 명시)",
    "summary": "한국어 요약 (3-4문장, 어떤 포지션인지, 왜 주목할 만한지, 한국 인재에게 어떤 기회인지)",
    "tags": ["AI", "채용", "시니어", "엔지니어링"],
    "source_url": "원문 URL",
    "source_name": "출처명",
    "relevance_score": 8
  }
]`

  try {
    const response = await claude.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonText = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

    let parsed: AIResponseItem[]
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      console.error('[curator] JSON parse error, raw text:', text.slice(0, 200))
      return []
    }

    const filtered = parsed
      .filter((item) => typeof item.relevance_score === 'number' && item.relevance_score >= 6)
      .slice(0, 15)

    return filtered.map((item): CuratedNewsItem => {
      const sourceArticle = limited.find((a) => a.url === item.source_url)
      return {
        company: item.company || item.source_name,
        company_tag: null,
        role: item.role,
        level: null,
        team_size: null,
        salary_band: null,
        location: null,
        tags: Array.isArray(item.tags) ? item.tags.slice(0, 5) : [],
        summary: item.summary,
        exclusive: false,
        item_type: 'news',
        source_url: item.source_url,
        source_name: item.source_name,
        headline: item.headline,
        published_at: sourceArticle?.publishedAt ?? new Date().toISOString(),
      }
    })
  } catch (err) {
    console.error('[curator] Claude API error:', err)
    return []
  }
}

export async function runCuration(): Promise<CuratedNewsItem[]> {
  const articles = await fetchRawArticles()
  if (articles.length === 0) return []
  return curateWithAI(articles)
}
