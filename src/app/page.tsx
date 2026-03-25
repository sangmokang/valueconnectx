export default function ServiceOverviewPage() {
  return (
    <main className="bg-vcx-beige min-h-screen font-vcx-serif">
      {/* Hero Section */}
      <section className="max-w-[1100px] mx-auto px-5 pt-10 pb-8 md:px-10 md:pt-[60px] md:pb-[50px] lg:px-10 lg:pt-20 lg:pb-[60px]">
        <div className="grid grid-cols-1 gap-10 items-start md:grid-cols-[55%_1fr] md:gap-[60px]">
          {/* Left Column */}
          <div>
            {/* Label Row */}
            <div className="flex items-center gap-3 mb-7">
              <div className="w-8 h-[1.5px] bg-vcx-gold" />
              <span className="vcx-section-label">
                PRIVATE TALENT NETWORK · BY INVITATION ONLY
              </span>
            </div>

            {/* H1 */}
            <h1 className="text-[28px] sm:text-[36px] md:text-[44px] lg:text-[52px] font-extrabold tracking-[-1px] md:tracking-[-2px] leading-[1.15] text-vcx-dark mt-0 mb-7 font-vcx-serif">
              최고 수준의 인재들이
              <br />
              <em className="text-vcx-gold italic">함께 성장하는 네트워크</em>
            </h1>

            {/* Body Text */}
            <p className="text-[15px] leading-[1.85] text-vcx-sub-1 mb-5 font-vcx-serif">
              시장 최고 수준의 인재는 드뭅니다.
              <br />
              그리고 대부분, 지금 있는 자리에서 묵묵히 최선을 다하고 있습니다.
            </p>
            <p className="text-[15px] leading-[1.85] text-vcx-sub-1 mb-5 font-vcx-serif">
              ValueConnect X는 그런 분들이 가장 잘 맞는 기회와 제약 없이 직접
              연결되고, 같은 수준의 사람들과 허심탄회하게 커리어를 이야기하며,
              함께 성장할 수 있는 폐쇄형 네트워크입니다.
            </p>
            <p className="text-[15px] leading-[1.85] text-vcx-sub-1 mb-10 font-vcx-serif">
              <strong className="text-vcx-dark">
                Selective Hiring × Selective Talent.
              </strong>{" "}
              기업은 더 적은 인원으로 높은 성과를 요구하고 있으며, 핵심 인재
              역시 아무 기업과도 매칭되지 않습니다.
            </p>

            {/* CTA */}
            <a
              href="#pillars"
              className="block w-full text-center sm:inline-block sm:w-auto bg-vcx-dark text-vcx-beige text-[14px] font-vcx-sans px-7 py-[14px] no-underline"
            >
              서비스 살펴보기 →
            </a>
          </div>

          {/* Right Column - WHY THIS EXISTS */}
          <div className="border-t-[1.5px] border-vcx-gold">
            {[
              {
                risk: "직접 연결",
                desc: "중간 단계 없이, 결정권자와 바로 만납니다",
                action: "연결",
              },
              {
                risk: "최적의 기회",
                desc: "검증된 포지션만, 시장 최고의 선택지만",
                action: "큐레이션",
              },
              {
                risk: "커리어 자율성",
                desc: "내 정보, 내 결정, 내 속도로",
                action: "보호",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="py-6 border-b border-black/[0.08] flex justify-between items-start"
              >
                <div>
                  <div className="vcx-section-label mb-1.5">
                    WHY THIS EXISTS
                  </div>
                  <div className="text-[16px] font-bold text-vcx-dark mb-1 font-vcx-serif">
                    {item.risk}
                  </div>
                  <div className="text-[13.5px] text-vcx-sub-3 leading-[1.7] font-vcx-sans">
                    {item.desc}
                  </div>
                </div>
                <div className="text-[11px] font-vcx-sans text-vcx-gold border border-vcx-gold px-2.5 py-1 tracking-[0.1em] whitespace-nowrap ml-4 mt-5">
                  {item.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Five Pillars Section */}
      <section
        id="pillars"
        className="max-w-[1100px] mx-auto px-5 py-10 md:px-10 md:py-16 lg:px-10 lg:pt-[60px] lg:pb-20 border-t border-black/[0.08]"
      >
        <div className="flex items-center gap-3 mb-10 md:mb-12">
          <div className="w-8 h-[1.5px] bg-vcx-gold" />
          <span className="vcx-section-label">FIVE PILLARS · CORE SERVICES</span>
        </div>

        <div className="flex flex-col gap-0">
          {[
            {
              num: "01",
              en: "MEMBER DIRECTORY",
              ko: "높은 수준의 인재들이 있는 곳",
              desc: "검증이 필요 없을 정도의 인재들이 모입니다. Core Member와 Endorsed Member로 구성된 폐쇄형 네트워크에서 이름, 직군, 전문 분야로 탐색하고, 서로에게서 배우며 성장합니다.",
              insight:
                "스타트업 CTO, 유니콘 PM, 글로벌 기업 리더 등 각 분야에서 실질적인 영향력을 가진 인재들이 모입니다. 검증된 인재들과 같은 공간에서 커리어를 탐색하고, 서로에게서 성장의 기준을 발견할 수 있습니다.",
            },
            {
              num: "02",
              en: "POSITION BOARD",
              ko: "시장 최적의 기회와 직접 연결",
              desc: "기업이 직접 포지션을 올리지 않습니다. ValueConnect가 구두 동의 후 내부 검토를 거쳐 등록한 포지션만 존재합니다. 검증되지 않은 포지션은 처음부터 게시되지 않습니다.",
              insight:
                "일반 채용 플랫폼에서는 볼 수 없는 포지션들이 모입니다. ValueConnect가 직접 큐레이션한 기회만 게시되며, 성장 가능성 높은 조직의 핵심 포지션들과 시장에 공개되지 않는 기회들을 가장 먼저 만날 수 있습니다.",
            },
            {
              num: "03",
              en: "CEO COFFEE CHAT",
              ko: "의사결정자와의 직접 채널",
              desc: "CEO / Founder / C-Level이 직접 세션을 생성하고, 멤버가 신청하며, CEO가 선택하는 1:1 Coffee Chat. 불필요한 중간 단계 없이, 결정권자와 직접 만납니다.",
              insight:
                "일반적으로 만나기 어려운 결정권자와 중간 단계 없이 직접 대화할 수 있습니다. 조직 문화와 비전을 직접 확인하고, 커리어의 다음 스텝을 결정권자와 함께 논의하는 기회입니다.",
            },
            {
              num: "04",
              en: "COMMUNITY BOARD",
              ko: "허심탄회하게 이야기할 수 있는 공간",
              desc: "커리어 고민, 조직·리더십, 연봉 협상, 번아웃, 생산성·News, '이 회사 어때요?' — 6개 카테고리의 멤버 전용 커뮤니티. 같은 수준의 사람들과 솔직하게 이야기할 수 있는 유일한 공간입니다.",
              insight:
                "비슷한 고민을 가진 업계 동료들의 경험과 인사이트를 직접 들을 수 있습니다. 연봉 협상, 리더십, 커리어 전환 등 민감한 주제도 완전한 프라이버시가 보장되는 환경에서 솔직하게 나눌 수 있습니다.",
            },
            {
              num: "05",
              en: "PEER COFFEE CHAT",
              ko: "비슷한 경험을 하는 업계 동료를 만나는 경험",
              desc: "사연을 올리면 비밀 댓글로 신청받고, 직접 선택하는 P2P 연결. 커리어 대화부터 채용을 전제로 한 대화까지 — 모두 신뢰 기반으로 이루어집니다.",
              insight:
                "같은 직군, 같은 고민을 가진 동료와 1:1로 연결됩니다. 커리어 고민부터 업계 트렌드까지 신뢰 기반으로 나누고, 나와 비슷한 경험을 하는 사람과의 네트워킹을 통해 새로운 관점을 얻을 수 있습니다.",
            },
          ].map((pillar, i) => (
            <div
              key={i}
              className="grid grid-cols-1 gap-6 py-8 border-b border-black/[0.08] items-start md:grid-cols-[80px_1fr_1fr] md:gap-10 md:py-10"
            >
              {/* Number */}
              <div className="text-[32px] font-extrabold text-vcx-gold font-vcx-serif tracking-[-1px]">
                {pillar.num}
              </div>

              {/* Title Block */}
              <div>
                <div className="vcx-section-label mb-2">{pillar.en}</div>
                <h3 className="text-[20px] font-bold text-vcx-dark mt-0 mb-3.5 tracking-[-0.3px] font-vcx-serif">
                  {pillar.ko}
                </h3>
                <p className="text-[14px] leading-[1.8] text-vcx-sub-2 m-0 font-vcx-sans">
                  {pillar.desc}
                </p>
              </div>

              {/* Insight Box */}
              <div className="bg-[#e8e2d9] p-5 border-l-2 border-vcx-gold">
                <div className="vcx-label text-vcx-gold tracking-[0.2em] mb-2">
                  INSIGHT
                </div>
                <p className="text-[13px] leading-[1.75] text-vcx-sub-2 m-0 font-vcx-sans">
                  {pillar.insight}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing Section - OUR THESIS */}
      <section className="bg-vcx-dark px-5 py-[60px] sm:py-[70px] md:px-10 md:py-20">
        <div className="max-w-[1100px] mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-9">
            <div className="w-8 h-[1.5px] bg-vcx-gold" />
            <span className="vcx-section-label">OUR THESIS</span>
            <div className="w-8 h-[1.5px] bg-vcx-gold" />
          </div>

          <blockquote className="text-[16px] sm:text-[18px] lg:text-[22px] font-vcx-serif italic leading-[1.7] text-vcx-beige max-w-[700px] mx-auto mb-6 p-0 border-l-0">
            &ldquo;자신보다 더 나은 사람들과 어울리십시오.
            <br />
            당신보다 행동이 나은 사람을 곁에 두면,
            <br />
            자연스럽게 그 방향으로 나아가게 됩니다.&rdquo;
          </blockquote>

          <p className="text-[14px] font-vcx-sans text-vcx-gold mb-2 tracking-[0.05em]">
            — Warren Buffett
          </p>
          <p className="text-[12px] font-vcx-sans italic text-[rgba(240,235,226,0.5)] mb-12">
            &ldquo;It&apos;s better to hang out with people better than you.
            Pick out associates whose behavior is better than yours and
            you&apos;ll drift in that direction.&rdquo;
          </p>

          <div className="flex flex-col gap-3 items-stretch sm:flex-row sm:items-center sm:justify-center sm:gap-4">
            <a
              href="/member-directory"
              className="bg-vcx-gold text-vcx-dark text-[14px] font-vcx-sans font-semibold px-7 py-[14px] no-underline text-center"
            >
              멤버로 합류하기 →
            </a>
            <a
              href="#pillars"
              className="bg-transparent text-vcx-gold text-[14px] font-vcx-sans font-semibold px-7 py-[14px] no-underline border border-vcx-gold text-center"
            >
              네트워크 살펴보기
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
