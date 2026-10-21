import { MEMBERS_DATA, CORPORATE_USERS_DATA, SEED_EMAIL_DOMAIN } from './fixtures'
import { checkResult, type DemoClient } from './common'

// 소유권 근거: 001 (Auth/프로필/추천/초대), 006~009 (작성자와 부모 FK),
// 011/014 (사용자/게시글), 016 (채용 당사자), 020~026/028 (부가 관계).
type Row = Record<string, unknown> & { id: string }
type Filter = [column: string, values: string[]]
const pendingEmails = ['mingi.jo', 'sua.lim', 'doyoon.kang'].map(name => `${name}@${SEED_EMAIL_DOMAIN}`)

function failOwnership(table: string): never {
  throw new Error(`[DEMO_OWNERSHIP] ${table}: fixture 소유관계가 불명확하여 보존합니다.`)
}

export async function cleanupDemoData(admin: DemoClient) {
  console.log('🧹 시드 데이터 정리 사전 점검...')
  const memberEmails = MEMBERS_DATA.map(member => member.email)
  const companyEmails = CORPORATE_USERS_DATA.map(company => company.email)
  const fixtureEmails = [...memberEmails, ...companyEmails]
  const auth = new Map<string, string>()
  for (let page = 1; ; page++) {
    const result = checkResult(await admin.auth.admin.listUsers({ page, perPage: 100 }), 'Auth 목록 조회')
    for (const user of result.data.users) {
      if (user.email && fixtureEmails.includes(user.email)) {
        if (auth.has(user.email)) failOwnership('중복 Auth 이메일')
        auth.set(user.email, user.id)
      }
    }
    if (result.data.users.length < 100) break
  }

  // 분할 조회로 PostgREST 기본 최대 행 수를 전체 목록으로 오인하지 않습니다.
  async function related(table: string, filters: Filter[]): Promise<Row[]> {
    const rows = new Map<string, Row>()
    for (const [column, values] of filters) {
      if (!values.length) continue
      for (let offset = 0; ; offset += 100) {
        const result = checkResult(await admin.from(table).select('*').in(column, values).order('id').range(offset, offset + 99), table)
        if (!Array.isArray(result.data)) failOwnership(table)
        for (const row of result.data as Row[]) {
          if (typeof row.id !== 'string') failOwnership(table)
          rows.set(row.id, row)
        }
        if (result.data.length < 100) break
      }
    }
    return [...rows.values()]
  }
  // Auth 삭제는 양쪽 프로필로 CASCADE됩니다. 이메일 조회에 숨은 겸역할도 ID로 수집합니다.
  const authIds = [...auth.values()]
  const members = await related('vcx_members', [['email', memberEmails], ['id', authIds]])
  const companies = await related('vcx_corporate_users', [['email', companyEmails], ['id', authIds]])
  for (const [rows, expectedEmails] of [[members, memberEmails], [companies, companyEmails]] as [Row[], string[]][]) {
    for (const profile of rows) {
      if (typeof profile.email !== 'string' || !expectedEmails.includes(profile.email) || auth.get(profile.email) !== profile.id) failOwnership('Auth/프로필 역할 대조')
    }
  }
  const profiles = [...members, ...companies]
  if (profiles.length !== auth.size) failOwnership('프로필 없는 Auth 사용자')
  const memberIds = members.map(row => row.id)
  const companyIds = companies.map(row => row.id)
  const userIds = [...memberIds, ...companyIds]
  const member = (value: unknown) => typeof value === 'string' && memberIds.includes(value)
  const company = (value: unknown) => typeof value === 'string' && companyIds.includes(value)
  const user = (value: unknown) => typeof value === 'string' && userIds.includes(value)
  const ids = (rows: Row[]) => rows.map(row => row.id)
  const belongs = (rows: Row[], value: unknown) => rows.some(row => row.id === value)
  const verify = (table: string, rows: Row[], predicate: (row: Row) => boolean) => {
    if (rows.some(row => !predicate(row))) failOwnership(table)
  }

  // 모든 읽기와 관계 검사를 완료한 뒤에만 첫 삭제를 시작합니다.
  const sessions = await related('vcx_ceo_coffee_sessions', [['host_id', companyIds]])
  const chats = await related('peer_coffee_chats', [['author_id', userIds]])
  const posts = await related('community_posts', [['author_id', userIds]])
  const positions = await related('positions', [['created_by', userIds]])
  const applications = await related('vcx_coffee_applications', [['session_id', ids(sessions)], ['applicant_id', userIds]])
  const peerApplications = await related('peer_coffee_applications', [['chat_id', ids(chats)], ['applicant_id', userIds]])
  const comments = await related('community_comments', [['post_id', ids(posts)], ['author_id', userIds]])
  const reactions = await related('vcx_community_reactions', [['post_id', ids(posts)], ['user_id', userIds]])
  const interests = await related('position_interests', [['position_id', ids(positions)], ['user_id', userIds]])
  const recommendations = await related('vcx_recommendations', [['recommender_id', memberIds], ['reviewed_by', memberIds], ['recommended_email', [...fixtureEmails, ...pendingEmails]]])
  const hiring = await related('vcx_hiring_records', [['candidate_id', memberIds], ['company_id', companyIds], ['introducer_id', memberIds], ['coffeechat_id', [...ids(sessions), ...ids(chats)]]])
  const notifications = await related('vcx_notifications', [['user_id', userIds]])
  verify('CEO 세션', sessions, row => company(row.host_id))
  verify('피어 커피챗', chats, row => member(row.author_id))
  verify('게시글', posts, row => member(row.author_id))
  verify('포지션', positions, row => user(row.created_by))
  verify('CEO 신청', applications, row => member(row.applicant_id) && belongs(sessions, row.session_id))
  verify('피어 신청', peerApplications, row => member(row.applicant_id) && belongs(chats, row.chat_id))
  verify('댓글', comments, row => member(row.author_id) && belongs(posts, row.post_id))
  verify('반응', reactions, row => user(row.user_id) && belongs(posts, row.post_id))
  verify('관심', interests, row => user(row.user_id) && belongs(positions, row.position_id))
  verify('알림', notifications, row => user(row.user_id))
  verify('추천', recommendations, row => member(row.recommender_id) && (row.reviewed_by == null || member(row.reviewed_by)) && [...fixtureEmails, ...pendingEmails].includes(String(row.recommended_email)))
  verify('채용', hiring, row => member(row.candidate_id) && company(row.company_id) && (row.introducer_id == null || member(row.introducer_id)) && (row.coffeechat_type === 'ceo' ? belongs(sessions, row.coffeechat_id) : row.coffeechat_type === 'peer' && belongs(chats, row.coffeechat_id)))
  const endorsed = await related('vcx_members', [['endorsed_by', memberIds]])
  verify('추천받은 회원', endorsed, row => member(row.id))

  // 이 시드가 만들지 않는 참조는 추측해서 지우지 않고 전체 정리를 거부합니다.
  const preserve: [string, Filter[]][] = [
    ['vcx_invites', [['invited_by', userIds], ['recommendation_id', ids(recommendations)], ['email', fixtureEmails]]],
    ['community_reports', [['reporter_id', userIds], ['post_id', ids(posts)], ['comment_id', ids(comments)]]],
    ['vcx_coffeechat_feedback', [['reviewer_id', userIds], ['session_id', ids(sessions)], ['application_id', ids(applications)]]],
    ['peer_coffeechat_feedback', [['reviewer_id', userIds], ['chat_id', ids(chats)], ['application_id', ids(peerApplications)]]],
    ['vcx_feed_items', [['created_by', userIds]]],
    ['vcx_feed_interests', [['user_id', userIds]]],
    ['vcx_feed_responses', [['user_id', userIds]]],
    ['vcx_feed_subscriptions', [['user_id', userIds]]],
    ['vcx_newsletter_campaigns', [['created_by', userIds]]],
  ]
  for (const [table, filters] of preserve) {
    if ((await related(table, filters)).length) failOwnership(table)
  }

  async function remove(table: string, rows: Row[]) {
    for (let start = 0; start < rows.length; start += 100) {
      checkResult(await admin.from(table).delete().in('id', ids(rows.slice(start, start + 100))), `${table} 삭제`)
    }
  }
  // 자식부터 삭제합니다. 전역 delete/neq 및 이메일 suffix 조건은 사용하지 않습니다.
  for (const [table, rows] of [
    ['vcx_hiring_records', hiring], ['vcx_notifications', notifications],
    ['vcx_community_reactions', reactions], ['community_comments', comments], ['community_posts', posts],
    ['position_interests', interests], ['positions', positions],
    ['vcx_coffee_applications', applications], ['vcx_ceo_coffee_sessions', sessions],
    ['peer_coffee_applications', peerApplications], ['peer_coffee_chats', chats],
    ['vcx_recommendations', recommendations],
  ] as [string, Row[]][]) await remove(table, rows)
  if (memberIds.length) {
    checkResult(await admin.from('vcx_members').update({ endorsed_by: null, endorsed_by_name: null }).in('id', memberIds), '멤버 추천관계 해제')
  }
  await remove('vcx_members', members)
  await remove('vcx_corporate_users', companies)
  for (const id of userIds) checkResult(await admin.auth.admin.deleteUser(id), 'Auth 삭제')
  console.log('✅ 정리 완료!')
}
