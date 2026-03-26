import Link from 'next/link'
import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { PostForm } from '@/components/community/post-form'

export default function CommunityCreatePage() {
  return (
    <ProtectedPageWrapper currentPath="/community/create">
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '80px 40px 60px' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/community"
            style={{ fontFamily: 'system-ui, sans-serif', fontSize: '13px', color: '#888888', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}
          >
            ← 커뮤니티
          </Link>
          <p style={{ fontFamily: 'system-ui, sans-serif', fontSize: '11px', letterSpacing: '0.12em', color: '#c9a84c', textTransform: 'uppercase', marginBottom: '8px' }}>
            Community
          </p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '24px', fontWeight: 800, color: '#1a1a1a' }}>
            글 작성
          </h1>
        </div>

        <PostForm />
      </div>
    </ProtectedPageWrapper>
  )
}
