import { describe, it, expect } from 'vitest'

import { POST as canonicalPost } from '@/app/api/admin/feed/route'
import { POST } from '@/app/api/admin/feed/items/route'

describe('POST /api/admin/feed/items', () => {
  it('reuses the canonical admin feed creation handler', () => {
    expect(POST).toBe(canonicalPost)
  })
})

