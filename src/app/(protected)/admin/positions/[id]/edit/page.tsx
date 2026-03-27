'use client'

import { useEffect, useState, use } from 'react'
import { PositionForm, type PositionFormData } from '@/components/admin/position-form'

interface PositionRaw {
  id: string
  company_name: string
  title: string
  team_size: string | null
  role_description: string
  salary_range: string | null
  status: 'active' | 'closed' | 'draft'
  location: string | null
  min_experience: number
  requirements: string[]
  benefits: string[]
  required_fields: string[]
}

export default function AdminPositionEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<PositionFormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/positions/${id}`)
        if (!res.ok) {
          setError('포지션을 불러올 수 없습니다')
          setLoading(false)
          return
        }
        const json = await res.json()
        const p: PositionRaw = json.data
        setData({
          company_name: p.company_name,
          title: p.title,
          team_size: p.team_size ?? '',
          role_description: p.role_description,
          salary_range: p.salary_range ?? '',
          location: p.location ?? '',
          requirements: (p.requirements ?? []).join(', '),
          benefits: (p.benefits ?? []).join(', '),
          required_fields: (p.required_fields ?? []).join(', '),
          min_experience: p.min_experience ?? 0,
          status: p.status,
        })
      } catch {
        setError('네트워크 오류가 발생했습니다')
      }
      setLoading(false)
    }
    void load()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white border border-[#e0d9ce] p-6 h-64 animate-pulse" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm font-vcx-sans text-red-600">{error ?? '포지션을 찾을 수 없습니다'}</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-vcx-serif font-bold text-[#1a1a1a] text-xl">포지션 수정</h2>
      </div>
      <PositionForm initialData={data} positionId={id} />
    </div>
  )
}
