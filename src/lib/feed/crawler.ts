export interface CrawledItem {
  company: string
  role: string
  headline: string
  source_url: string
  source_name: string
  tags: string[]
  summary: string | null
  published_at: string
  item_type: 'news'
}

function extractXmlField(block: string, tag: string): string {
  const cdataMatch = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`, 'i').exec(block)
  if (cdataMatch) return cdataMatch[1].trim()
  const plainMatch = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(block)
  if (plainMatch) return plainMatch[1].trim()
  return ''
}

async function crawlTechCrunch(): Promise<CrawledItem[]> {
  const res = await fetch('https://techcrunch.com/feed/', {
    headers: { 'User-Agent': 'VCX-Feed-Crawler/1.0' },
  })
  if (!res.ok) throw new Error(`TechCrunch fetch failed: ${res.status}`)
  const xml = await res.text()

  const itemBlocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((m) => m[1])

  return itemBlocks.slice(0, 10).map((block) => {
    const title = extractXmlField(block, 'title')
    const link = extractXmlField(block, 'link')
    const pubDate = extractXmlField(block, 'pubDate')
    const description = extractXmlField(block, 'description').slice(0, 200)

    const publishedAt = pubDate ? new Date(pubDate).toISOString() : new Date().toISOString()

    return {
      company: 'TechCrunch',
      role: title,
      headline: title,
      source_url: link,
      source_name: 'TechCrunch',
      tags: ['tech', 'startup'],
      summary: description || null,
      published_at: publishedAt,
      item_type: 'news' as const,
    }
  }).filter((item) => item.source_url.length > 0)
}

interface HNHit {
  title: string
  url: string | null
  created_at: string
  points: number
}

async function crawlHackerNews(): Promise<CrawledItem[]> {
  const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=10')
  if (!res.ok) throw new Error(`HackerNews fetch failed: ${res.status}`)
  const json = (await res.json()) as { hits: HNHit[] }

  return json.hits
    .filter((hit) => hit.url && hit.url.length > 0)
    .map((hit) => ({
      company: 'Hacker News',
      role: hit.title,
      headline: hit.title,
      source_url: hit.url!,
      source_name: 'Hacker News',
      tags: ['tech', 'hn'],
      summary: null,
      published_at: hit.created_at ? new Date(hit.created_at).toISOString() : new Date().toISOString(),
      item_type: 'news' as const,
    }))
}

interface RedditChild {
  data: {
    title: string
    url: string
    created_utc: number
    selftext: string
    is_self: boolean
  }
}

async function crawlReddit(): Promise<CrawledItem[]> {
  const res = await fetch('https://www.reddit.com/r/technology/top.json?limit=10&t=day', {
    headers: { 'User-Agent': 'VCX-Feed-Crawler/1.0' },
  })
  if (!res.ok) throw new Error(`Reddit fetch failed: ${res.status}`)
  const json = (await res.json()) as { data: { children: RedditChild[] } }

  return json.data.children
    .filter((child) => !child.data.is_self)
    .map((child) => {
      const { title, url, created_utc, selftext } = child.data
      const summary = selftext ? selftext.slice(0, 200) : null
      return {
        company: 'Reddit',
        role: title,
        headline: title,
        source_url: url,
        source_name: 'Reddit',
        tags: ['tech', 'reddit'],
        summary,
        published_at: new Date(created_utc * 1000).toISOString(),
        item_type: 'news' as const,
      }
    })
}

export async function crawlAllSources(): Promise<CrawledItem[]> {
  const results = await Promise.allSettled([
    crawlTechCrunch(),
    crawlHackerNews(),
    crawlReddit(),
  ])

  const items: CrawledItem[] = []
  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value)
    } else {
      console.error('Feed crawler source failed:', result.reason)
    }
  }

  // 중복 source_url 제거
  const seen = new Set<string>()
  const deduped: CrawledItem[] = []
  for (const item of items) {
    if (!seen.has(item.source_url)) {
      seen.add(item.source_url)
      deduped.push(item)
    }
  }

  return deduped.slice(0, 30)
}
