'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export type MeProfile = {
  id: string
  name: string
  email: string | null
  current_company: string | null
  title: string | null
  bio: string | null
  professional_fields: string[]
  years_of_experience: number | null
  linkedin_url: string | null
  member_tier: string | null
  avatar_url: string | null
}

type CoffeechatItem = {
  id: string
  kind: 'peer_authored' | 'peer_applied' | 'ceo_applied'
  title: string
  status: string
  created_at: string
  link: string
}

type CommunityPost = {
  id: string
  title: string
  category: string
  status: string
  created_at: string
  likes_count: number | null
  comments_count: number | null
}

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
}

type TabId = 'profile' | 'coffeechat' | 'community' | 'account'

const TABS: { id: TabId; label: string }[] = [
  { id: 'profile', label: '내 프로필' },
  { id: 'coffeechat', label: '내 커피챗' },
  { id: 'community', label: '내 커뮤니티' },
  { id: 'account', label: '알림 · 계정' },
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

function profileCompletion(p: MeProfile): number {
  const fields: Array<unknown> = [
    p.name,
    p.current_company,
    p.title,
    p.bio,
    p.linkedin_url,
    p.professional_fields.length > 0 ? '1' : null,
  ]
  const filled = fields.filter((v) => Boolean(v)).length
  return Math.round((filled / fields.length) * 100)
}

const KIND_LABEL: Record<CoffeechatItem['kind'], string> = {
  peer_authored: '내가 쓴 커피챗',
  peer_applied: '내가 신청한 커피챗',
  ceo_applied: '내가 신청한 CEO 세션',
}

const STATUS_LABEL: Record<string, string> = {
  open: '모집중',
  matched: '매칭됨',
  closed: '종료',
  pending: '신청중',
  accepted: '수락됨',
  rejected: '거절됨',
  completed: '완료',
  cancelled: '취소됨',
}

const COMMUNITY_CATEGORY_LABEL: Record<string, string> = {
  career: '커리어',
  leadership: '리더십',
  salary: '연봉',
  burnout: '번아웃',
  productivity: '생산성',
  company_review: '회사 리뷰',
}

export function MeClient({ profile }: { profile: MeProfile }) {
  const [tab, setTab] = useState<TabId>('profile')

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <p className="vcx-section-label mb-1">마이페이지</p>
        <h1 className="font-vcx-serif font-bold text-vcx-dark text-3xl">{profile.name}님</h1>
        <p className="text-sm font-vcx-sans text-vcx-sub-4 mt-1">
          내 프로필과 활동을 한 곳에서 관리합니다
        </p>
      </div>

      <div
        role="tablist"
        aria-label="마이페이지 탭"
        className="mb-6 flex gap-1 border-b border-vcx-dark/10 overflow-x-auto"
        data-testid="me-tablist"
      >
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`me-panel-${t.id}`}
              id={`me-tab-${t.id}`}
              data-testid={`me-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={[
                'min-h-9 px-4 text-sm font-vcx-sans whitespace-nowrap transition-colors',
                active
                  ? 'text-vcx-dark border-b-2 border-vcx-dark font-medium'
                  : 'text-vcx-sub-4 hover:text-vcx-dark',
              ].join(' ')}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'profile' && <ProfileSection profile={profile} />}
      {tab === 'coffeechat' && <CoffeechatSection />}
      {tab === 'community' && <CommunitySection />}
      {tab === 'account' && <AccountSection email={profile.email} />}
    </div>
  )
}

function ProfileSection({ profile }: { profile: MeProfile }) {
  const completion = profileCompletion(profile)
  return (
    <section
      role="tabpanel"
      id="me-panel-profile"
      aria-labelledby="me-tab-profile"
      data-testid="me-panel-profile"
    >
      <div className="bg-white border border-vcx-dark/10 p-6 mb-4">
        <p className="text-xs font-vcx-sans text-vcx-sub-4 mb-2">프로필 완성도</p>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2 bg-vcx-dark/5">
            <div
              className="h-2 bg-vcx-dark"
              style={{ width: `${completion}%` }}
              data-testid="me-profile-completion-bar"
            />
          </div>
          <span className="text-sm font-vcx-sans text-vcx-dark font-medium" data-testid="me-profile-completion-value">
            {completion}%
          </span>
        </div>
        <dl className="grid grid-cols-1 gap-2 text-sm font-vcx-sans">
          <ProfileRow label="회사" value={profile.current_company} />
          <ProfileRow label="직함" value={profile.title} />
          <ProfileRow label="경력" value={profile.years_of_experience != null ? `${profile.years_of_experience}년` : null} />
          <ProfileRow
            label="전문 분야"
            value={profile.professional_fields.length > 0 ? profile.professional_fields.join(', ') : null}
          />
          <ProfileRow label="LinkedIn" value={profile.linkedin_url} />
        </dl>
      </div>
      <Link
        href="/directory/me"
        className="inline-flex min-h-9 items-center px-4 bg-vcx-dark text-white text-sm font-vcx-sans hover:opacity-90 transition-opacity"
        data-testid="me-edit-profile-link"
      >
        프로필 편집하기
      </Link>
    </section>
  )
}

function ProfileRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-3 py-1">
      <dt className="text-vcx-sub-4 min-w-20">{label}</dt>
      <dd className="text-vcx-dark flex-1 break-all">{value || <span className="text-vcx-sub-4">미입력</span>}</dd>
    </div>
  )
}

function CoffeechatSection() {
  const [items, setItems] = useState<CoffeechatItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'open' | 'closed'>('all')

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/coffeechats')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as { data: CoffeechatItem[] }
        if (!cancelled) setItems(json.data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '로딩 실패')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = items?.filter((i) => filter === 'all' || i.status === filter) ?? null

  return (
    <section
      role="tabpanel"
      id="me-panel-coffeechat"
      aria-labelledby="me-tab-coffeechat"
      data-testid="me-panel-coffeechat"
    >
      <div className="mb-3 flex gap-2 flex-wrap" data-testid="me-coffeechat-filters">
        {(['all', 'pending', 'accepted', 'open', 'closed'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            data-testid={`me-coffeechat-filter-${f}`}
            className={[
              'min-h-8 px-3 text-xs font-vcx-sans border transition-colors',
              filter === f
                ? 'border-vcx-dark text-vcx-dark'
                : 'border-vcx-dark/10 text-vcx-sub-4 hover:border-vcx-dark/30',
            ].join(' ')}
          >
            {f === 'all' ? '전체' : STATUS_LABEL[f] ?? f}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-700 font-vcx-sans">{error}</p>}
      {!items && !error && <p className="text-sm text-vcx-sub-4 font-vcx-sans">불러오는 중...</p>}
      {filtered && filtered.length === 0 && (
        <p className="text-sm text-vcx-sub-4 font-vcx-sans" data-testid="me-coffeechat-empty">
          표시할 커피챗이 없습니다
        </p>
      )}
      {filtered && filtered.length > 0 && (
        <ul className="space-y-2" data-testid="me-coffeechat-list">
          {filtered.map((item) => (
            <li key={item.id} className="bg-white border border-vcx-dark/10 p-4">
              <Link href={item.link} className="block hover:opacity-80">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-vcx-sub-4 font-vcx-sans mb-1">{KIND_LABEL[item.kind]}</p>
                    <p className="text-sm text-vcx-dark font-vcx-sans font-medium truncate">{item.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs text-vcx-dark font-vcx-sans">{STATUS_LABEL[item.status] ?? item.status}</span>
                    <p className="text-xs text-vcx-sub-4 font-vcx-sans mt-1">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CommunitySection() {
  const [posts, setPosts] = useState<CommunityPost[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/community')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as { data: CommunityPost[] }
        if (!cancelled) setPosts(json.data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '로딩 실패')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section
      role="tabpanel"
      id="me-panel-community"
      aria-labelledby="me-tab-community"
      data-testid="me-panel-community"
    >
      {error && <p className="text-sm text-red-700 font-vcx-sans">{error}</p>}
      {!posts && !error && <p className="text-sm text-vcx-sub-4 font-vcx-sans">불러오는 중...</p>}
      {posts && posts.length === 0 && (
        <p className="text-sm text-vcx-sub-4 font-vcx-sans" data-testid="me-community-empty">
          작성한 글이 없습니다
        </p>
      )}
      {posts && posts.length > 0 && (
        <ul className="space-y-2" data-testid="me-community-list">
          {posts.map((post) => (
            <li key={post.id} className="bg-white border border-vcx-dark/10 p-4">
              <Link href={`/community/${post.id}`} className="block hover:opacity-80">
                <p className="text-xs text-vcx-sub-4 font-vcx-sans mb-1">
                  {COMMUNITY_CATEGORY_LABEL[post.category] ?? post.category}
                </p>
                <p className="text-sm text-vcx-dark font-vcx-sans font-medium truncate mb-2">{post.title}</p>
                <div className="flex gap-3 text-xs text-vcx-sub-4 font-vcx-sans">
                  <span>좋아요 {post.likes_count ?? 0}</span>
                  <span>댓글 {post.comments_count ?? 0}</span>
                  <span>{formatDate(post.created_at)}</span>
                  {post.status !== 'active' && (
                    <span className="text-red-700">{post.status === 'hidden' ? '숨김' : '삭제됨'}</span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function AccountSection({ email }: { email: string | null }) {
  const [notifications, setNotifications] = useState<Notification[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/notifications')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as { data: Notification[] }
        if (!cancelled) setNotifications(json.data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '로딩 실패')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section
      role="tabpanel"
      id="me-panel-account"
      aria-labelledby="me-tab-account"
      data-testid="me-panel-account"
    >
      <div className="bg-white border border-vcx-dark/10 p-6 mb-4">
        <p className="vcx-section-label mb-2">계정 정보</p>
        <dl className="text-sm font-vcx-sans">
          <div className="flex gap-3 py-1">
            <dt className="text-vcx-sub-4 min-w-20">이메일</dt>
            <dd className="text-vcx-dark break-all">{email ?? '미등록'}</dd>
          </div>
        </dl>
        <p className="text-xs text-vcx-sub-4 font-vcx-sans mt-3">
          계정 탈퇴 등 추가 설정은 곧 제공될 예정입니다
        </p>
      </div>

      <div className="bg-white border border-vcx-dark/10 p-6">
        <p className="vcx-section-label mb-3">최근 알림</p>
        {error && <p className="text-sm text-red-700 font-vcx-sans">{error}</p>}
        {!notifications && !error && (
          <p className="text-sm text-vcx-sub-4 font-vcx-sans">불러오는 중...</p>
        )}
        {notifications && notifications.length === 0 && (
          <p className="text-sm text-vcx-sub-4 font-vcx-sans" data-testid="me-notifications-empty">
            새 알림이 없습니다
          </p>
        )}
        {notifications && notifications.length > 0 && (
          <ul className="space-y-2" data-testid="me-notifications-list">
            {notifications.map((n) => (
              <li
                key={n.id}
                className={[
                  'p-3 border-l-2 text-sm font-vcx-sans',
                  n.is_read ? 'border-vcx-dark/10 text-vcx-sub-4' : 'border-vcx-dark text-vcx-dark',
                ].join(' ')}
              >
                <p className="font-medium">{n.title}</p>
                {n.body && <p className="text-xs mt-1">{n.body}</p>}
                <p className="text-xs text-vcx-sub-4 mt-1">{formatDate(n.created_at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
