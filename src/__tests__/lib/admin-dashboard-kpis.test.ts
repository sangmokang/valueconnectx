import { describe, it, expect, vi } from 'vitest'
import { loadDashboardKpis } from '@/lib/admin/dashboard-kpis'

type CountFixture = { count: number; error?: { message: string } | null }
type SelectFixture = { data: Array<{ overall_rating: number | null }> | null; error?: { message: string } | null }

interface MockState {
  countByTable: Record<string, CountFixture[]>
  feedback: SelectFixture
}

function createMockSupabase(state: MockState) {
  const callIndex: Record<string, number> = {}

  return {
    from(table: string) {
      const select = (_columns: string, opts?: { count?: string; head?: boolean }) => {
        if (opts?.head) {
          // count head query
          const builder: Record<string, unknown> = {}
          const finalize = () => {
            const fixtures = state.countByTable[table] ?? []
            const i = callIndex[table] ?? 0
            callIndex[table] = i + 1
            const fx = fixtures[i] ?? { count: 0, error: null }
            return Promise.resolve({ count: fx.count, error: fx.error ?? null })
          }
          const passthrough = () => builder
          builder.gte = passthrough
          builder.eq = passthrough
          builder.not = passthrough
          builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
            finalize().then(resolve, reject)
          return builder
        }
        // non-head: feedback select
        return Promise.resolve(state.feedback)
      }
      return { select }
    },
  }
}

describe('loadDashboardKpis', () => {
  it('aggregates counts and computes ratios', async () => {
    const supabase = createMockSupabase({
      countByTable: {
        vcx_members: [{ count: 120 }, { count: 7 }],
        vcx_coffee_applications: [{ count: 30 }, { count: 12 }],
        peer_coffee_applications: [
          { count: 50 }, // peerTotal
          { count: 20 }, // peerAccepted
          { count: 50 }, // peerBriefTotal
          { count: 25 }, // peerBriefGenerated
        ],
        vcx_ceo_coffee_sessions: [{ count: 4 }],
        community_posts: [{ count: 9 }],
        vcx_community_reactions: [{ count: 33 }],
      },
      feedback: {
        data: [
          { overall_rating: 5 },
          { overall_rating: 4 },
          { overall_rating: 3 },
        ],
      },
    })

    const result = await loadDashboardKpis(supabase as unknown as Parameters<typeof loadDashboardKpis>[0])

    expect(result.totalMembers).toBe(120)
    expect(result.weeklyNewMembers).toBe(7)
    expect(result.coffeechat.total).toBe(80) // 30 + 50
    expect(result.coffeechat.acceptedRate).toBeCloseTo(32 / 80, 5)
    expect(result.coffeechat.completed).toBe(4)
    expect(result.community.weeklyPosts).toBe(9)
    expect(result.community.weeklyReactions).toBe(33)
    expect(result.aiBrief.ratio).toBeCloseTo(25 / 50, 5)
    expect(result.aiBrief.generated).toBe(25)
    expect(result.aiBrief.total).toBe(50)
    expect(result.feedback.available).toBe(true)
    expect(result.feedback.averageRating).toBeCloseTo(4, 5)
    expect(result.feedback.count).toBe(3)
  })

  it('falls back to placeholder when feedback table is unavailable', async () => {
    const supabase = createMockSupabase({
      countByTable: {
        vcx_members: [{ count: 0 }, { count: 0 }],
        vcx_coffee_applications: [{ count: 0 }, { count: 0 }],
        peer_coffee_applications: [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }],
        vcx_ceo_coffee_sessions: [{ count: 0 }],
        community_posts: [{ count: 0 }],
        vcx_community_reactions: [{ count: 0 }],
      },
      feedback: { data: null, error: { message: 'relation does not exist' } },
    })

    const result = await loadDashboardKpis(supabase as unknown as Parameters<typeof loadDashboardKpis>[0])

    expect(result.coffeechat.acceptedRate).toBeNull()
    expect(result.aiBrief.ratio).toBeNull()
    expect(result.feedback.available).toBe(false)
    expect(result.feedback.averageRating).toBeNull()
    expect(result.feedback.count).toBe(0)
  })

  it('treats query errors as zero counts so the dashboard stays stable', async () => {
    const supabase = createMockSupabase({
      countByTable: {
        vcx_members: [{ count: 5 }, { count: 1 }],
        vcx_coffee_applications: [{ count: 0, error: { message: 'permission denied' } }, { count: 0 }],
        peer_coffee_applications: [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }],
        vcx_ceo_coffee_sessions: [{ count: 0 }],
        community_posts: [{ count: 0 }],
        vcx_community_reactions: [{ count: 0 }],
      },
      feedback: { data: [] },
    })

    const result = await loadDashboardKpis(supabase as unknown as Parameters<typeof loadDashboardKpis>[0])
    expect(result.totalMembers).toBe(5)
    expect(result.coffeechat.total).toBe(0)
  })
})

// satisfy unused import lint if vitest changes
void vi
