import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { InterestSelector } from '@/components/feed/interest-selector'

vi.mock('lucide-react', () => ({
  Check: () => 'CheckIcon',
  Plus: () => 'PlusIcon',
  X: () => 'XIcon',
}))

describe('InterestSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('관심 태그를 선택하고 제거한다', () => {
    const onChange = vi.fn()
    render(<InterestSelector selectedChips={['AI / ML']} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: '딥테크' }))
    expect(onChange).toHaveBeenCalledWith(['AI / ML', '딥테크'])

    fireEvent.click(screen.getByRole('button', { name: 'AI·머신러닝 관심 분야 제거' }))
    expect(onChange).toHaveBeenCalledWith([])
  })

  it('직접 입력한 관심 태그를 정규화해서 추가한다', () => {
    const onChange = vi.fn()
    render(<InterestSelector selectedChips={[]} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText('예: B2B 소프트웨어 세일즈'), {
      target: { value: '  B2B   소프트웨어   세일즈  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: /추가/ }))

    expect(onChange).toHaveBeenCalledWith(['B2B 소프트웨어 세일즈'])
  })

  it('관심 태그가 최대 개수에 도달하면 추가 버튼을 비활성화한다', () => {
    const selectedChips = Array.from({ length: 10 }, (_, index) => `태그 ${index + 1}`)

    render(<InterestSelector selectedChips={selectedChips} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /추가/ })).toBeDisabled()
    expect(screen.getByText('Enter 또는 추가 버튼으로 등록 · 0개 남음')).toBeInTheDocument()
  })
})
