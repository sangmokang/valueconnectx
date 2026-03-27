'use client'

import { PositionForm } from '@/components/admin/position-form'

export default function AdminPositionCreatePage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-vcx-serif font-bold text-[#1a1a1a] text-xl">새 포지션 등록</h2>
      </div>
      <PositionForm />
    </div>
  )
}
