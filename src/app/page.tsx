import Link from 'next/link'
import { ServicePillars } from '@/components/service-pillars'

export default function ServicePage() {
  return (
    <div className="bg-[#f5f0e8] min-h-screen font-[system-ui]">
      {/* HERO */}
      <div className="bg-[#1a1a1a] py-20 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 70% 50%, rgba(201,168,76,0.05) 0%, transparent 100%)' }}
        />
        <div className="max-w-[1100px] mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2.5 mb-7">
            <div className="w-7 h-px bg-[#c9a84c]" />
            <span className="text-[#c9a84c] text-[11px] tracking-[0.2em] font-semibold">
              VALUECONNECT X · PRIVATE NETWORK
            </span>
          </div>
          <h1
            className="text-[clamp(36px,5vw,60px)] font-extrabold text-[#f5f0e8] leading-[1.2] mt-0 mb-7 tracking-[-1.5px]"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            탁월한 사람들이 스스로 모이는 곳
          </h1>
          <div className="border-l-2 border-[#b8902a] pl-6 max-w-[640px]">
            <p className="text-[16px] leading-[1.9] text-[#b0a898] m-0">
              각 분야에서 깊이 있는 경험을 가진 사람들이 모이는 곳.<br />
              최적의 기회를 먼저 전달하고, 커뮤니티 라운지로 머물게 하고,<br />
              CEO Coffee Chat으로 연결한다.
            </p>
          </div>
          <div className="mt-10 flex gap-8 flex-wrap">
            {[
              { v: '초대 전용', l: 'Invite-Only Network' },
              { v: '25%', l: '성사 수수료 구조' },
              { v: 'CEO Direct', l: 'HR 경유 없는 채용' },
            ].map((m) => (
              <div key={m.l} className="border-l border-[rgba(201,168,76,0.3)] pl-4">
                <div
                  className="text-[22px] font-extrabold text-[#c9a84c] leading-none"
                  style={{ fontFamily: 'Georgia, serif' }}
                >
                  {m.v}
                </div>
                <div className="text-[12px] text-[#888] mt-1">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FIVE PILLARS */}
      <div className="max-w-[1100px] mx-auto px-6 md:px-12 py-[72px] pb-[100px]">
        <div className="flex items-center gap-2.5 mb-14">
          <div className="flex-1 h-px bg-black/[0.08]" />
          <span className="text-[10px] tracking-[0.2em] text-[#aaa]">FIVE PILLARS</span>
          <div className="flex-1 h-px bg-black/[0.08]" />
        </div>

        <ServicePillars />

        {/* CTA */}
        <div className="mt-20 p-12 bg-[#1a1a1a] relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-[300px] h-full pointer-events-none"
            style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.05) 100%)' }}
          />
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-5 h-px bg-[#c9a84c]" />
            <span className="text-[10px] text-[#c9a84c] tracking-[0.18em]">OUR THESIS</span>
          </div>
          <p
            className="text-[20px] font-bold text-[#f5f0e8] leading-[1.6] max-w-[680px] tracking-[-0.3px] mb-7"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            &ldquo;지금 가장 중요한 것은 사람을 모으는 것이 아니라,<br />사람이 머무는 이유를 설계하는 것이다.&rdquo;
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link
              href="/positions"
              className="px-7 py-3.5 bg-[#c9a84c] text-[#1a1a1a] text-[13.5px] font-bold no-underline"
            >
              큐레이션 피드 보기 →
            </Link>
            <Link
              href="/directory"
              className="px-7 py-3.5 bg-transparent text-[#c9a84c] text-[13.5px] border border-[rgba(201,168,76,0.4)] no-underline"
            >
              멤버 소개 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
