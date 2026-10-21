// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanupDemoData } from '../../../scripts/demo-seed/cleanup'
import { seedDemoData } from '../../../scripts/demo-seed/seed'
import { MEMBERS_DATA, CORPORATE_USERS_DATA } from '../../../scripts/demo-seed/fixtures'
import type { DemoClient } from '../../../scripts/demo-seed/common'

type Row = Record<string, unknown> & { id: string }
type Failure = { table: string; operation: string; thrown?: boolean }

function database() {
  const rows = new Map<string, Row[]>()
  const users: { id: string; email: string }[] = []
  const writes: string[] = []
  let failure: Failure | undefined
  const table = (name: string) => {
    if (!rows.has(name)) rows.set(name, [])
    return rows.get(name)!
  }
  const listUsers = vi.fn(async ({ page = 1, perPage = 100 } = {}) => ({ data: { users: users.slice((page - 1) * perPage, page * perPage) }, error: null }))
  const deleteUser = vi.fn(async (id: string) => {
    if (failure?.table === 'auth' && failure.operation === 'delete') return { error: { message: 'private URL/key must not be logged' } }
    writes.push('auth.delete')
    const index = users.findIndex(user => user.id === id)
    if (index >= 0) users.splice(index, 1)
    return { error: null }
  })
  const createUser = vi.fn(async ({ email }: { email: string }) => {
    const user = { id: `fixture-${users.length}`, email }
    users.push(user)
    return { data: { user }, error: null }
  })
  const client = {
    auth: { admin: { listUsers, deleteUser, createUser } },
    from(name: string) {
      let operation = 'select'
      let payload: Row | Row[] | Record<string, unknown> | undefined
      let first = 0
      let last = Number.MAX_SAFE_INTEGER
      const predicates: ((row: Row) => boolean)[] = []
      const query = {
        select() { return query },
        insert(value: Row) { operation = 'insert'; payload = value; return query },
        upsert(value: Row) { operation = 'upsert'; payload = value; return query },
        update(value: Record<string, unknown>) { operation = 'update'; payload = value; return query },
        delete() { operation = 'delete'; return query },
        eq(column: string, value: unknown) { predicates.push(row => row[column] === value); return query },
        in(column: string, values: unknown[]) { predicates.push(row => values.includes(row[column])); return query },
        order() { return query },
        limit(amount: number) { last = amount - 1; return query },
        range(start: number, end: number) { first = start; last = end; return query },
        then(resolve: (result: unknown) => unknown, reject: (error: unknown) => unknown) {
          const execute = async () => {
            if (operation !== 'select') writes.push(`${name}.${operation}`)
            if (failure?.table === name && failure.operation === operation) {
              if (failure.thrown) throw new Error('SIMULATED_THROW')
              return { data: null, count: null, error: { message: 'SIMULATED_ERROR_OBJECT' } }
            }
            const matches = (row: Row) => predicates.every(predicate => predicate(row))
            const data = table(name)
            if (operation === 'insert') data.push(payload as Row)
            if (operation === 'upsert') {
              const item = payload as Row
              const index = data.findIndex(row => row.id === item.id)
              if (index >= 0) data[index] = { ...data[index], ...item }
              else data.push(item)
            }
            if (operation === 'update') for (const row of data.filter(matches)) Object.assign(row, payload)
            if (operation === 'delete') rows.set(name, data.filter(row => !matches(row)))
            return { data: data.filter(matches).slice(first, last + 1), count: data.filter(matches).length, error: null }
          }
          return execute().then(resolve, reject)
        },
      }
      return query
    },
  } as unknown as DemoClient
  return { client, users, rows, table, writes, listUsers, deleteUser, createUser, fail: (value: Failure) => { failure = value } }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('demo seed 실패 전파', () => {
  const operations = [
    ['vcx_members', 'upsert'], ['vcx_members', 'update'], ['vcx_corporate_users', 'upsert'],
    ['vcx_recommendations', 'insert'], ['vcx_ceo_coffee_sessions', 'insert'], ['vcx_coffee_applications', 'insert'],
    ['peer_coffee_chats', 'insert'], ['peer_coffee_applications', 'insert'], ['community_posts', 'insert'],
    ['community_comments', 'insert'], ['community_posts', 'update'], ['vcx_community_reactions', 'insert'],
    ['positions', 'insert'], ['position_interests', 'insert'], ['vcx_notifications', 'insert'], ['vcx_hiring_records', 'insert'],
  ]
  it.each(operations)('%s.%s 오류 객체 이후 쓰기를 멈추며 전체 성공을 출력하지 않는다', async (table, operation) => {
    const db = database()
    db.fail({ table, operation })
    await expect(seedDemoData(db.client)).rejects.toThrow('[DEMO_DB]')
    expect(db.writes.at(-1)).toBe(`${table}.${operation}`)
    expect(console.log).not.toHaveBeenCalledWith('🎉 시딩 완료!', expect.anything())
    expect(console.warn).not.toHaveBeenCalled()
  })

  it('SDK가 던진 예외도 호출자에게 전파한다', async () => {
    const db = database()
    db.fail({ table: 'vcx_members', operation: 'upsert', thrown: true })
    await expect(seedDemoData(db.client)).rejects.toThrow('SIMULATED_THROW')
    expect(db.writes).toEqual(['vcx_members.upsert'])
  })

  it('스키마 조회 오류면 Auth 생성과 쓰기를 시작하지 않는다', async () => {
    const db = database()
    db.fail({ table: 'positions', operation: 'select' })
    await expect(seedDemoData(db.client)).rejects.toThrow('[DEMO_DB]')
    expect(db.createUser).not.toHaveBeenCalled()
    expect(db.writes).toEqual([])
  })
})

describe('demo cleanup 소유관계', () => {
  async function seeded() {
    const db = database()
    await seedDemoData(db.client)
    db.writes.length = 0
    vi.mocked(console.log).mockClear()
    return db
  }

  it('21개 fixture 계정과 연결된 seed만 지우고 각 테이블의 무관 행을 보존한다', async () => {
    const db = await seeded()
    const preserved = new Map<string, Row>()
    for (const table of db.rows.keys()) {
      const row = { id: `unrelated-${table}`, email: 'outside@vcx-seed.com', author_id: 'outsider', user_id: 'outsider', host_id: 'outsider', created_by: 'outsider', applicant_id: 'outsider', recommender_id: 'outsider', company_id: 'outsider' }
      db.table(table).push(row)
      preserved.set(table, { ...row })
    }
    db.users.push({ id: 'outsider', email: 'outside@vcx-seed.com' })
    await cleanupDemoData(db.client)
    for (const [table, row] of preserved) expect(db.table(table)).toEqual([row])
    expect(db.users).toEqual([{ id: 'outsider', email: 'outside@vcx-seed.com' }])
    expect(db.deleteUser).toHaveBeenCalledTimes(MEMBERS_DATA.length + CORPORATE_USERS_DATA.length)
    expect(console.log).toHaveBeenCalledWith('✅ 정리 완료!')
  })

  const crossBoundary = [
    ['community_comments', 'post_id', 'community_posts', 'author_id'],
    ['vcx_community_reactions', 'post_id', 'community_posts', 'user_id'],
    ['vcx_coffee_applications', 'session_id', 'vcx_ceo_coffee_sessions', 'applicant_id'],
    ['peer_coffee_applications', 'chat_id', 'peer_coffee_chats', 'applicant_id'],
    ['position_interests', 'position_id', 'positions', 'user_id'],
  ]
  it.each(crossBoundary)('%s의 외부 사용자를 부모 CASCADE로 지우기 전에 전체 정리를 거부한다', async (table, parentField, parentTable, ownerField) => {
    const db = await seeded()
    db.table(table).push({ id: 'foreign-child', [parentField]: db.table(parentTable)[0].id, [ownerField]: 'outsider' })
    const before = JSON.stringify([...db.rows])
    await expect(cleanupDemoData(db.client)).rejects.toThrow('[DEMO_OWNERSHIP]')
    expect(db.writes).toEqual([])
    expect(JSON.stringify([...db.rows].filter(([, rows]) => rows.length))).toBe(JSON.stringify(JSON.parse(before).filter(([, rows]: [string, Row[]]) => rows.length)))
    expect(db.deleteUser).not.toHaveBeenCalled()
  })

  it('외부 기업이 참여한 채용 행과 외부 회원의 추천관계는 변경하지 않는다', async () => {
    const db = await seeded()
    db.table('vcx_hiring_records').push({ id: 'real-hiring', candidate_id: db.users[0].id, company_id: 'outside-company' })
    await expect(cleanupDemoData(db.client)).rejects.toThrow('[DEMO_OWNERSHIP]')
    expect(db.writes).toEqual([])
    db.rows.set('vcx_hiring_records', [])
    db.table('vcx_members').push({ id: 'real-member', email: 'outside@example.invalid', endorsed_by: db.users[0].id })
    await expect(cleanupDemoData(db.client)).rejects.toThrow('[DEMO_OWNERSHIP]')
    expect(db.writes).toEqual([])
  })

  it('레거시 Auth FK의 기업 계정 작성물도 추측 삭제하지 않는다', async () => {
    const db = await seeded()
    const corporateId = db.users.find(user => user.email === CORPORATE_USERS_DATA[0].email)!.id
    db.table('community_posts').push({ id: 'corporate-post', author_id: corporateId })
    await expect(cleanupDemoData(db.client)).rejects.toThrow('[DEMO_OWNERSHIP]')
    expect(db.writes).toEqual([])
  })

  it.each([
    { role: '멤버→숨은 기업', email: MEMBERS_DATA[0].email, shadowTable: 'vcx_corporate_users', parentTable: 'vcx_ceo_coffee_sessions', parentOwner: 'host_id', childTable: 'vcx_coffee_applications', childParent: 'session_id' },
    { role: '기업→숨은 멤버', email: CORPORATE_USERS_DATA[0].email, shadowTable: 'vcx_members', parentTable: 'peer_coffee_chats', parentOwner: 'author_id', childTable: 'peer_coffee_applications', childParent: 'chat_id' },
  ])('$role 겸역할 Auth CASCADE가 외부 신청을 삭제하기 전에 정리를 거부한다', async scenario => {
    const db = await seeded()
    const fixtureAuthId = db.users.find(user => user.email === scenario.email)!.id
    db.table(scenario.shadowTable).push({ id: fixtureAuthId, email: 'outside@example.invalid' })
    const parent = { id: 'shadow-parent', [scenario.parentOwner]: fixtureAuthId }
    const externalApplication = { id: 'outside-application', [scenario.childParent]: parent.id, applicant_id: 'outsider' }
    db.table(scenario.parentTable).push(parent)
    db.table(scenario.childTable).push(externalApplication)
    // 001/006/028: Auth → 겸역할 프로필 → 부모 → 외부 신청의 FK CASCADE.
    db.deleteUser.mockImplementation(async id => {
      db.writes.push('auth.delete')
      if (id === fixtureAuthId) {
        db.rows.set(scenario.shadowTable, db.table(scenario.shadowTable).filter(row => row.id !== id))
        db.rows.set(scenario.parentTable, db.table(scenario.parentTable).filter(row => row.id !== parent.id))
        db.rows.set(scenario.childTable, db.table(scenario.childTable).filter(row => row.id !== externalApplication.id))
      }
      return { error: null }
    })
    let failure: unknown
    try { await cleanupDemoData(db.client) } catch (error) { failure = error }
    expect(db.table(scenario.childTable)).toContainEqual(externalApplication)
    expect(db.table(scenario.parentTable)).toContainEqual(parent)
    expect(failure).toBeInstanceOf(Error)
    expect((failure as Error).message).toContain('[DEMO_OWNERSHIP] Auth/프로필 역할 대조')
    expect(db.writes).toEqual([])
    expect(db.deleteUser).not.toHaveBeenCalled()
    expect(console.log).not.toHaveBeenCalledWith('✅ 정리 완료!')
  })

  it('Auth와 프로필 ID가 다르면 첫 쓰기 전에 거부한다', async () => {
    const db = await seeded()
    db.users[0].id = 'mismatched-id'
    await expect(cleanupDemoData(db.client)).rejects.toThrow('[DEMO_OWNERSHIP]')
    expect(db.writes).toEqual([])
  })

  it('시드가 만들지 않는 피드 참조는 추측해서 삭제하지 않는다', async () => {
    const db = await seeded()
    db.table('vcx_feed_responses').push({ id: 'real-response', user_id: db.users[0].id, feed_item_id: 'real-feed' })
    await expect(cleanupDemoData(db.client)).rejects.toThrow('vcx_feed_responses')
    expect(db.writes).toEqual([])
  })

  it('100명보다 뒤에 있는 fixture Auth도 페이지를 끝까지 대조한다', async () => {
    const db = await seeded()
    db.users.unshift(...Array.from({ length: 101 }, (_, i) => ({ id: `other-${i}`, email: `other-${i}@example.invalid` })))
    await cleanupDemoData(db.client)
    expect(db.listUsers).toHaveBeenCalledWith({ page: 2, perPage: 100 })
    expect(db.users).toHaveLength(101)
  })

  it('조회 결과가 100행을 넘으면 다음 페이지의 외부 관계도 검출한다', async () => {
    const db = await seeded()
    const postId = db.table('community_posts')[0].id
    db.rows.set('community_comments', Array.from({ length: 101 }, (_, index) => ({ id: `comment-${index}`, post_id: postId, author_id: db.users[0].id })))
    db.table('community_comments').push({ id: 'last-foreign', post_id: postId, author_id: 'outsider' })
    await expect(cleanupDemoData(db.client)).rejects.toThrow('[DEMO_OWNERSHIP]')
    expect(db.writes).toEqual([])
  })

  it('관계 조회 오류면 아무 행도 지우지 않는다', async () => {
    const db = await seeded()
    db.fail({ table: 'community_comments', operation: 'select' })
    await expect(cleanupDemoData(db.client)).rejects.toThrow('[DEMO_DB]')
    expect(db.writes).toEqual([])
  })

  it.each([false, true])('삭제 오류 객체/예외(thrown=%s)를 삼키지 않고 이후 삭제를 멈춘다', async thrown => {
    const db = await seeded()
    db.fail({ table: 'vcx_hiring_records', operation: 'delete', thrown })
    await expect(cleanupDemoData(db.client)).rejects.toThrow()
    expect(db.writes).toEqual(['vcx_hiring_records.delete'])
    expect(console.log).not.toHaveBeenCalledWith('✅ 정리 완료!')
  })

  it('Auth 삭제 오류도 최종 성공을 출력하지 않는다', async () => {
    const db = await seeded()
    db.fail({ table: 'auth', operation: 'delete' })
    await expect(cleanupDemoData(db.client)).rejects.toThrow('[DEMO_DB]')
    expect(db.deleteUser).toHaveBeenCalledTimes(1)
    expect(console.log).not.toHaveBeenCalledWith('✅ 정리 완료!')
  })
})
