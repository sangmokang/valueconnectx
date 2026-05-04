import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anthropicKey = process.env.ANTHROPIC_API_KEY!

const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
const claude = new Anthropic({ apiKey: anthropicKey })

interface RawArticle {
  title: string
  url: string
  source: string
  publishedAt?: string
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
      items.push({ title: titleMatch[1].trim(), link: linkMatch[1].trim(), pubDate: pubDateMatch?.[1] })
    }
  }
  return items.slice(0, 25)
}

async function fetchTechCrunch(): Promise<RawArticle[]> {
  try {
    const res = await fetch('https://techcrunch.com/feed/', { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRssItems(xml).map((i) => ({ title: i.title, url: i.link, source: 'TechCrunch', publishedAt: i.pubDate }))
  } catch (e) { console.error('[TC]', e); return [] }
}

async function fetchHackerNewsJobs(): Promise<RawArticle[]> {
  try {
    const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/jobstories.json', { signal: AbortSignal.timeout(8000) })
    if (!idsRes.ok) return []
    const ids: number[] = await idsRes.json()
    const results = await Promise.allSettled(
      ids.slice(0, 30).map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) }).then((r) => r.json()),
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
  } catch (e) { console.error('[HN Jobs]', e); return [] }
}

async function fetchVentureBeat(): Promise<RawArticle[]> {
  try {
    const res = await fetch('https://venturebeat.com/feed/', { signal: AbortSignal.timeout(10000) })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRssItems(xml).map((i) => ({ title: i.title, url: i.link, source: 'VentureBeat', publishedAt: i.pubDate }))
  } catch (e) { console.error('[VB]', e); return [] }
}

async function main() {
  // 기존 샘플 데이터 삭제
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: delErr } = await (admin as any)
    .from('vcx_feed_items')
    .delete()
    .eq('exclusive', false)
    .in('company', ['OpenAI', 'Google', 'Anthropic'])
  console.log('샘플 삭제:', delErr ? delErr.message : 'OK')

  console.log('\n채용 기사 수집 중...')
  const [tc, hn, vb] = await Promise.allSettled([fetchTechCrunch(), fetchHackerNewsJobs(), fetchVentureBeat()])

  const all: RawArticle[] = [
    ...(tc.status === 'fulfilled' ? tc.value : []),
    ...(hn.status === 'fulfilled' ? hn.value : []),
    ...(vb.status === 'fulfilled' ? vb.value : []),
  ]

  const seen = new Set<string>()
  const deduped = all.filter((a) => { if (seen.has(a.url)) return false; seen.add(a.url); return true })
  console.log(`수집된 기사: ${deduped.length}건`)

  const limited = deduped.slice(0, 60)

  const systemPrompt = `당신은 ValueConnect X의 채용 큐레이션 에디터입니다.
한국 IT/비즈니스 인재 네트워크 멤버들에게 가치 있는 채용 기회를 선별합니다.

선별 기준 (채용 관련 콘텐츠만):
1. 글로벌 빅테크 채용: Google, Meta, Microsoft, Apple, OpenAI, Anthropic, Nvidia, Amazon 등
2. 한국 기업 채용: 삼성, LG, SK, 카카오, 네이버, 쿠팡, 크래프톤, 두나무 등
3. 주목받는 스타트업 채용 (시리즈 A 이상)
4. 시니어/임원급 포지션 변화: CTO, CPO, VP Engineering 등
5. 팀 대규모 확장, 한국 지사/R&D 센터 신설
6. HackerNews Jobs 직접 공고 (반드시 포함)

제외: 채용과 무관한 일반 기술 뉴스`

  const userPrompt = `다음 기사 목록에서 채용 관련 항목만 선별하여 JSON 배열로 반환하세요.
relevance_score 6점 이상만 선별. 최대 25개.

기사 목록:
${JSON.stringify(limited.map((a) => ({ title: a.title, url: a.url, source: a.source })), null, 2)}

응답 형식 (JSON 배열만):
[
  {
    "headline": "원문 제목",
    "company": "채용 주체 회사명",
    "role": "한국어 채용 헤드라인 (25자 내외)",
    "summary": "한국어 요약 (3-4문장, 어떤 포지션인지, 왜 주목할 만한지, 한국 인재에게 어떤 기회인지)",
    "tags": ["AI", "채용", "시니어"],
    "source_url": "원문 URL",
    "source_name": "출처명",
    "relevance_score": 8
  }
]`

  console.log('\nClaude AI 채용 큐레이션 중...')
  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 8192,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonText = text.replace(/^```(?:json)?\n?/m, '').replace(/\n?```$/m, '').trim()

  let curated: Array<{ headline: string; company: string; role: string; summary: string; tags: string[]; source_url: string; source_name: string; relevance_score: number }>
  try {
    curated = JSON.parse(jsonText)
  } catch {
    console.error('JSON 파싱 실패:', jsonText.slice(0, 300))
    return
  }

  const filtered = curated.filter((i) => i.relevance_score >= 6).slice(0, 25)
  console.log(`AI 선별: ${filtered.length}건`)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: { users } } = await (admin as any).auth.admin.listUsers()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminUser = (users as any[]).find((u) => u.email === 'e2e-admin@vcx-test.com')

  const toInsert = filtered.map((item) => {
    const srcArticle = limited.find((a) => a.url === item.source_url)
    return {
      company: item.company,
      company_tag: item.source_name,
      role: item.role,
      summary: item.summary,
      tags: item.tags.slice(0, 5),
      exclusive: false,
      published_at: srcArticle?.publishedAt ?? new Date().toISOString(),
      created_by: adminUser?.id ?? null,
    }
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertErr } = await (admin as any)
    .from('vcx_feed_items')
    .insert(toInsert)
    .select('id, company, role')

  if (insertErr) {
    console.error('삽입 오류:', insertErr.message)
    return
  }

  console.log(`\n✅ ${inserted?.length}건 삽입 완료`)
  for (const item of (inserted ?? [])) {
    console.log(`  - [${item.company}] ${item.role}`)
  }
}

main().catch(console.error)
