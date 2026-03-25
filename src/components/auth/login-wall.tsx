import Link from 'next/link'

interface LoginWallProps {
  currentPath?: string
}

export function LoginWall({ currentPath = '/' }: LoginWallProps) {
  const loginUrl = `/login${currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : ''}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[8px] bg-[rgba(15,12,8,0.75)]">
      <div className="bg-[#f0ebe2] p-8 sm:py-12 sm:px-10 max-w-[420px] w-[90%] text-center">
        <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-[#c9a84c]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="0" ry="0" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="font-vcx-serif text-[20px] sm:text-[22px] font-extrabold text-[#1a1a1a] mb-3 tracking-[-0.5px]">
          멤버 전용 콘텐츠입니다
        </h2>
        <p className="font-vcx-sans text-[14px] text-[#666] leading-[1.7] mb-8">
          초대된 멤버만 열람할 수 있습니다
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={loginUrl}
            className="block bg-[#1a1a1a] text-[#f0ebe2] font-vcx-sans text-[14px] font-semibold py-[14px] px-7 text-center no-underline"
          >
            로그인
          </Link>
          <Link
            href="/invite/accept"
            className="block bg-transparent text-[#1a1a1a] font-vcx-sans text-[14px] font-semibold py-[14px] px-7 text-center no-underline border border-[#1a1a1a]"
          >
            초대 코드 입력
          </Link>
        </div>
      </div>
    </div>
  )
}
