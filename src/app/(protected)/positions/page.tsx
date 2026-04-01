import { ProtectedPageWrapper } from '@/components/layout/protected-page-wrapper'
import { PositionHero } from '@/components/positions/position-hero'
import { PositionsClient } from '@/components/positions/positions-client'

export default async function PositionsPage() {
  return (
    <ProtectedPageWrapper currentPath="/positions">
      <div style={{ background: '#f5f0e8', minHeight: '100vh' }}>
        <PositionHero />
        <PositionsClient />
      </div>
    </ProtectedPageWrapper>
  )
}
