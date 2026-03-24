export default function ServiceOverviewPage() {
  return (
    <main
      style={{
        background: "#f0ebe2",
        minHeight: "100vh",
        fontFamily: "Georgia, serif",
      }}
    >
      {/* Hero Section */}
      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "80px 40px 60px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "55% 1fr",
            gap: "60px",
            alignItems: "start",
          }}
        >
          {/* Left Column */}
          <div>
            {/* Label Row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "28px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "1.5px",
                  background: "#c9a84c",
                }}
              />
              <span
                style={{
                  fontSize: "10px",
                  fontFamily: "system-ui, sans-serif",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#c9a84c",
                }}
              >
                SERVICE OVERVIEW · PRIVATE TALENT NETWORK
              </span>
            </div>

            {/* H1 */}
            <h1
              style={{
                fontSize: "52px",
                fontWeight: 800,
                letterSpacing: "-2px",
                lineHeight: 1.15,
                color: "#1a1a1a",
                margin: "0 0 28px 0",
                fontFamily: "Georgia, serif",
              }}
            >
              검증된 인재와
              <br />
              <em style={{ color: "#c9a84c", fontStyle: "italic" }}>
                기업 리더를 연결하다
              </em>
            </h1>

            {/* Body Text */}
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.85,
                color: "#444",
                margin: "0 0 20px 0",
                fontFamily: "Georgia, serif",
              }}
            >
              현재 채용 시장에는 후보자의 커리어에 부정적 영향을 미치는 구조적
              리스크가 존재합니다.{" "}
              <strong style={{ color: "#1a1a1a" }}>경영자 리스크</strong>,{" "}
              <strong style={{ color: "#1a1a1a" }}>회사 리스크</strong>,{" "}
              <strong style={{ color: "#1a1a1a" }}>채용 채널 리스크</strong> —
              ValueConnect X는 이 모든 필터를 통과한 연결만을 제공합니다.
            </p>
            <p
              style={{
                fontSize: "15px",
                lineHeight: 1.85,
                color: "#444",
                margin: "0 0 40px 0",
                fontFamily: "Georgia, serif",
              }}
            >
              <strong style={{ color: "#1a1a1a" }}>
                Selective Hiring × Selective Talent.
              </strong>{" "}
              기업은 더 적은 인원으로 높은 성과를 요구하고 있으며, 핵심 인재
              역시 아무 기업과도 매칭되지 않습니다.
            </p>

            {/* CTA */}
            <a
              href="#pillars"
              style={{
                display: "inline-block",
                background: "#1a1a1a",
                color: "#f0ebe2",
                fontSize: "14px",
                fontFamily: "system-ui, sans-serif",
                padding: "14px 28px",
                textDecoration: "none",
                borderRadius: 0,
              }}
            >
              서비스 살펴보기 →
            </a>
          </div>

          {/* Right Column - WHY THIS EXISTS */}
          <div
            style={{
              borderTop: "1.5px solid #c9a84c",
            }}
          >
            {[
              {
                risk: "경영자 리스크",
                desc: "비전 불일치, 과장된 채용 조건",
                action: "필터링",
              },
              {
                risk: "회사 리스크",
                desc: "재무 불안정, 조직 문화 괴리",
                action: "검증",
              },
              {
                risk: "채용 채널 리스크",
                desc: "후보자 정보 무단 유통",
                action: "차단",
              },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: "24px 0",
                  borderBottom: "1px solid rgba(0,0,0,0.08)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "10px",
                      fontFamily: "system-ui, sans-serif",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#c9a84c",
                      marginBottom: "6px",
                    }}
                  >
                    WHY THIS EXISTS
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: "4px",
                      fontFamily: "Georgia, serif",
                    }}
                  >
                    {item.risk}
                  </div>
                  <div
                    style={{
                      fontSize: "13.5px",
                      color: "#666",
                      lineHeight: 1.7,
                      fontFamily: "system-ui, sans-serif",
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "system-ui, sans-serif",
                    color: "#c9a84c",
                    border: "1px solid #c9a84c",
                    padding: "4px 10px",
                    letterSpacing: "0.1em",
                    whiteSpace: "nowrap",
                    marginLeft: "16px",
                    marginTop: "20px",
                  }}
                >
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
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "60px 40px 80px",
          borderTop: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "48px",
          }}
        >
          <div
            style={{ width: "32px", height: "1.5px", background: "#c9a84c" }}
          />
          <span
            style={{
              fontSize: "10px",
              fontFamily: "system-ui, sans-serif",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#c9a84c",
            }}
          >
            FIVE PILLARS · CORE SERVICES
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
          {[
            {
              num: "01",
              en: "MEMBER DIRECTORY",
              ko: "검증된 핵심인재 디렉토리",
              desc: "Core Member와 Endorsed Member로 구성된 폐쇄형 인재 네트워크. 이름, 직군, 전문 분야로 검색하고, Member Profile을 통해 커리어 신뢰를 확인할 수 있습니다.",
              insight:
                "Anti-Scraping 정책으로 멤버 정보를 보호합니다. 1분 내 10 프로필 조회 시 경고, 20 프로필 조회 시 세션 종료, 하루 50 프로필 조회 시 접근 제한.",
            },
            {
              num: "02",
              en: "POSITION BOARD",
              ko: "검증된 포지션만 게시",
              desc: "기업이 직접 포지션을 등록하지 않습니다. CEO/HR 구두 동의 후 ValueConnect Admin이 내부 검증을 거쳐 등록합니다. 검증되지 않은 포지션은 게시하지 않습니다.",
              insight:
                "멤버는 관심 있음 / 관심 없음 / 나중에 보기로 반응할 수 있습니다. 포지션 관심 데이터만 채용에 활용되며, 커뮤니티 활동 데이터는 채용에 절대 활용되지 않습니다.",
            },
            {
              num: "03",
              en: "CEO COFFEE CHAT",
              ko: "의사결정자와의 직접 채널",
              desc: "CEO/Founder/C-Level이 직접 세션을 생성하고, 멤버가 신청하며, CEO가 선택하는 1:1 Coffee Chat. 세션 생성 시 약식 헤드헌팅 계약 조건에 동의해야 합니다.",
              insight:
                "채용이 발생할 경우 ValueConnect 소개 수수료가 적용됩니다. VCX Network를 우회하는 행동을 방지하는 구조입니다.",
            },
            {
              num: "04",
              en: "COMMUNITY BOARD",
              ko: "멤버 전용 익명 커뮤니티",
              desc: "커리어 고민, 조직 고민·리더쉽, 연봉 협상, 번아웃, 생산성·News, '이 회사 어때요?' 등 6개 카테고리. CEO는 접근할 수 없습니다.",
              insight:
                "모든 커뮤니티 글은 채용 활용이 불가합니다(Privacy Model). 사실 기반 정보만 허용되며, 가이드라인 위반 글은 Admin이 즉시 삭제합니다.",
            },
            {
              num: "05",
              en: "PEER COFFEE CHAT",
              ko: "멤버 간 신뢰 기반 연결",
              desc: "사연을 올리면 비밀 댓글로 신청받고, 작성자가 직접 선택하는 P2P 연결. 커리어 대화뿐 아니라 채용을 전제로 한 Coffee Chat도 가능합니다.",
              insight:
                "Coffee Chat을 통해 채용으로 이어지는 경우, 해당 채용은 ValueConnect의 소개·알선 구조를 통해 진행됩니다. Self Introduction Reward 지급.",
            },
          ].map((pillar, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 1fr",
                gap: "40px",
                padding: "40px 0",
                borderBottom: "1px solid rgba(0,0,0,0.08)",
                alignItems: "start",
              }}
            >
              {/* Number */}
              <div
                style={{
                  fontSize: "32px",
                  fontWeight: 800,
                  color: "#c9a84c",
                  fontFamily: "Georgia, serif",
                  letterSpacing: "-1px",
                }}
              >
                {pillar.num}
              </div>

              {/* Title Block */}
              <div>
                <div
                  style={{
                    fontSize: "10px",
                    fontFamily: "system-ui, sans-serif",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "#c9a84c",
                    marginBottom: "8px",
                  }}
                >
                  {pillar.en}
                </div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    margin: "0 0 14px 0",
                    letterSpacing: "-0.3px",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {pillar.ko}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.8,
                    color: "#555",
                    margin: 0,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {pillar.desc}
                </p>
              </div>

              {/* Insight Box */}
              <div
                style={{
                  background: "#e8e2d9",
                  padding: "20px 22px",
                  borderLeft: "2px solid #c9a84c",
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    fontFamily: "system-ui, sans-serif",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    color: "#c9a84c",
                    marginBottom: "8px",
                  }}
                >
                  INSIGHT
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: 1.75,
                    color: "#555",
                    margin: 0,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  {pillar.insight}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Closing Section - OUR THESIS */}
      <section
        style={{
          background: "#1a1a1a",
          padding: "80px 40px",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              marginBottom: "36px",
            }}
          >
            <div
              style={{ width: "32px", height: "1.5px", background: "#c9a84c" }}
            />
            <span
              style={{
                fontSize: "10px",
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#c9a84c",
              }}
            >
              OUR THESIS
            </span>
            <div
              style={{ width: "32px", height: "1.5px", background: "#c9a84c" }}
            />
          </div>

          <blockquote
            style={{
              fontSize: "22px",
              fontFamily: "Georgia, serif",
              fontStyle: "italic",
              lineHeight: 1.7,
              color: "#f0ebe2",
              maxWidth: "700px",
              margin: "0 auto 48px",
              padding: 0,
              borderLeft: "none",
            }}
          >
            "후보자 보호가 최우선 원칙입니다. 검증되지 않은 포지션은 게시하지
            않으며, 부정적 요소가 확인된 기업은 네트워크에서 제외합니다."
          </blockquote>

          <div
            style={{ display: "flex", gap: "16px", justifyContent: "center" }}
          >
            <a
              href="/member-directory"
              style={{
                display: "inline-block",
                background: "#c9a84c",
                color: "#1a1a1a",
                fontSize: "14px",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                padding: "14px 28px",
                textDecoration: "none",
                borderRadius: 0,
              }}
            >
              Member Directory 보기 →
            </a>
            <a
              href="/benefit"
              style={{
                display: "inline-block",
                background: "transparent",
                color: "#c9a84c",
                fontSize: "14px",
                fontFamily: "system-ui, sans-serif",
                fontWeight: 600,
                padding: "14px 28px",
                textDecoration: "none",
                border: "1px solid #c9a84c",
                borderRadius: 0,
              }}
            >
              멤버 혜택 확인하기
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
