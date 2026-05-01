import Link from 'next/link'

interface LoginWallProps {
  currentPath?: string
}

export function LoginWall({ currentPath = '/' }: LoginWallProps) {
  const loginUrl = `/login${currentPath !== '/' ? `?redirect=${encodeURIComponent(currentPath)}` : ''}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-[8px] bg-[#050507]/85 px-4">
      <div className="bg-[#101010] border border-[#3d3a39] p-7 sm:py-10 sm:px-10 max-w-[420px] w-full text-center">
        <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-[#00d992]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d992" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="0" ry="0" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h2 className="font-vcx-sans text-[21px] sm:text-[23px] font-bold text-[#f2f2f2] mb-3 tracking-normal leading-tight">
          멤버 전용 콘텐츠입니다
        </h2>
        <p className="font-vcx-sans text-[15px] text-[#b8b3b0] leading-[1.7] mb-8">
          초대된 멤버만 열람할 수 있습니다
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href={loginUrl}
            className="block bg-[#101010] border border-[#3d3a39] text-[#2fd6a1] font-vcx-sans text-[15px] font-semibold py-[14px] px-7 text-center no-underline"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="block bg-transparent text-[#f2f2f2] font-vcx-sans text-[15px] font-semibold py-[14px] px-7 text-center no-underline border border-[#3d3a39]"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}
