import { useState, useRef, useEffect } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const T = {
  bg: "#f5f0e8",
  bgAlt: "#ebe5da",
  dark: "#1a1a1a",
  gold: "#c9a84c",
  goldDeep: "#b8902a",
  body: "#555",
  light: "#888",
  border: "rgba(0,0,0,0.08)",
  white: "#fff",
  serif: "'Georgia', 'Noto Serif KR', serif",
  sans: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
};

// ─── GNB ─────────────────────────────────────────────────────────────────────
function GNB({ activePage, setActivePage }) {
  const [dropOpen, setDropOpen] = useState(false);
  const dropRef = useRef(null);
  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const servicePages = ["service", "members", "benefit"];
  const isServiceActive = servicePages.includes(activePage);

  const navItems = [
    { key: "feed", label: "큐레이션 피드", badge: "NEW" },
    { key: "lounge", label: "커뮤니티 라운지" },
    { key: "coffeechat", label: "커피챗 신청" },
    { key: "ceo", label: "CEO Coffeechat" },
    { key: "positions", label: "채용 포지션" },
  ];

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px", height: 60, background: T.bg,
      borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, zIndex: 200,
      fontFamily: T.sans,
    }}>
      <div onClick={() => setActivePage("service")} style={{ fontWeight: 800, fontSize: 16, cursor: "pointer", letterSpacing: "-0.5px", fontFamily: T.serif }}>
        ValueConnect <span style={{ color: T.gold }}>X</span>
      </div>

      <div style={{ display: "flex", gap: 28, fontSize: 13.5, alignItems: "center" }}>
        {/* 서비스 소개 dropdown */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <span onClick={() => setDropOpen(v => !v)} style={{
            cursor: "pointer", color: isServiceActive ? T.dark : "#666",
            fontWeight: isServiceActive ? 600 : 400,
            borderBottom: isServiceActive ? `1.5px solid ${T.gold}` : "none",
            paddingBottom: 2, display: "flex", alignItems: "center", gap: 4, userSelect: "none",
          }}>
            서비스 소개
            <span style={{ fontSize: 9, color: isServiceActive ? T.gold : "#bbb", transform: dropOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
          </span>
          {dropOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 12px)", left: "50%", transform: "translateX(-50%)", background: T.white, border: `1px solid ${T.border}`, boxShadow: "0 12px 40px rgba(0,0,0,0.12)", minWidth: 160, zIndex: 300, overflow: "hidden" }}>
              <div style={{ height: 2, background: T.gold }} />
              {[{ key: "service", label: "서비스 소개" }, { key: "members", label: "멤버 소개" }, { key: "benefit", label: "Benefit" }].map((s, i, arr) => (
                <div key={s.key} onClick={() => { setActivePage(s.key); setDropOpen(false); }} style={{
                  padding: "13px 20px", fontSize: 13, cursor: "pointer", color: activePage === s.key ? T.dark : "#666",
                  fontWeight: activePage === s.key ? 700 : 400, background: activePage === s.key ? "#faf8f4" : T.white,
                  borderBottom: i < arr.length - 1 ? `1px solid rgba(0,0,0,0.06)` : "none",
                  display: "flex", alignItems: "center", gap: 8,
                }}
                onMouseEnter={e => e.currentTarget.style.background = "#faf8f4"}
                onMouseLeave={e => e.currentTarget.style.background = activePage === s.key ? "#faf8f4" : T.white}
                >
                  {activePage === s.key && <div style={{ width: 3, height: 14, background: T.gold, flexShrink: 0 }} />}
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {navItems.map(item => (
          <span key={item.key} onClick={() => setActivePage(item.key)} style={{
            cursor: "pointer", color: activePage === item.key ? T.dark : "#666",
            fontWeight: activePage === item.key ? 600 : 400,
            borderBottom: activePage === item.key ? `1.5px solid ${T.gold}` : "none",
            paddingBottom: 2, display: "flex", alignItems: "center", gap: 6, position: "relative",
          }}>
            {item.label}
            {item.badge && (
              <span style={{ fontSize: 9, background: T.gold, color: T.dark, padding: "2px 5px", fontWeight: 800, letterSpacing: "0.05em", borderRadius: 2 }}>
                {item.badge}
              </span>
            )}
          </span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span style={{ fontSize: 13.5, color: "#666", cursor: "pointer" }}>로그인</span>
        <button style={{ background: T.dark, color: T.bg, border: "none", padding: "8px 18px", fontSize: 13, cursor: "pointer", letterSpacing: "0.02em", fontFamily: T.sans }}>
          회원가입 →
        </button>
      </div>
    </nav>
  );
}

// ─── CURATION FEED PAGE (신규) ────────────────────────────────────────────────
const INTEREST_CHIPS = [
  "딥테크", "핀테크 B2B", "AI / ML", "Series A 스타트업",
  "엔터프라이즈 SaaS", "모빌리티", "헬스케어 · 바이오",
  "컨슈머 앱", "콘텐츠 · 미디어", "클라우드 인프라",
];

const FEED_DATA = [
  {
    id: 1, company: "42dot", companyTag: "현대차그룹 · AV · 딥테크", role: "Head of Software Architecture",
    level: "VP / Executive", teamSize: "SW팀 180명", salaryBand: "2.2억 ~ 3억+",
    location: "판교", tags: ["딥테크", "자율주행", "SW Architecture"],
    summary: "자율주행 스택의 핵심 레이어를 설계할 SW 아키텍처 리더. 현대차 그룹의 AI 모빌리티 전환을 기술 레이어에서 주도합니다.",
    interest: null, exclusive: true,
  },
  {
    id: 2, company: "Upstage", companyTag: "AI · Series C · 글로벌", role: "VP of Product — Enterprise AI",
    level: "VP", teamSize: "PD팀 35명", salaryBand: "1.8억 ~ 2.5억",
    location: "서울 강남 · 하이브리드", tags: ["AI", "Enterprise", "Product"],
    summary: "국내 대표 AI 기업의 엔터프라이즈 제품 방향을 이끌 VP. LLM 기반 솔루션의 GTM 전략과 제품 로드맵을 동시에 책임합니다.",
    interest: null, exclusive: true,
  },
  {
    id: 3, company: "Naver Clova", companyTag: "네이버 · AI · 서비스", role: "Senior Research Engineer — LLM",
    level: "Senior IC", teamSize: "HyperCLOVA 팀", salaryBand: "1.5억 ~ 2억",
    location: "성남 그린팩토리", tags: ["LLM", "AI/ML", "Research"],
    summary: "HyperCLOVA X의 다음 세대를 만들 LLM 연구 엔지니어. 학습 인프라와 모델 개선에 동시에 기여하는 역할입니다.",
    interest: null, exclusive: false,
  },
  {
    id: 4, company: "Kakao Brain", companyTag: "카카오 · AI · 연구", role: "Head of Multimodal AI",
    level: "Director", teamSize: "AI Research 팀 60명", salaryBand: "1.9억 ~ 2.7억",
    location: "판교 · 원격 가능", tags: ["Multimodal", "딥테크", "AI/ML"],
    summary: "이미지-텍스트-음성의 경계를 허무는 멀티모달 AI 연구 리더. 카카오의 파운데이션 모델 전략에서 핵심 역할을 맡습니다.",
    interest: null, exclusive: false,
  },
  {
    id: 5, company: "Krafton Ignited", companyTag: "크래프톤 · 게임 AI · 딥테크", role: "AI Game Designer",
    level: "Senior", teamSize: "신규 AI Game Studio", salaryBand: "1.4억 ~ 1.9억",
    location: "서울 강남", tags: ["게임", "딥테크", "Generative AI"],
    summary: "AI가 스토리와 게임플레이를 생성하는 새로운 장르를 설계할 파이오니어. 크래프톤의 차세대 AI 스튜디오에서 처음부터 만들어가는 역할.",
    interest: null, exclusive: true,
  },
];

function CurationFeedPage() {
  const [selectedChips, setSelectedChips] = useState(["딥테크", "AI / ML"]);
  const [customInput, setCustomInput] = useState("");
  const [feed, setFeed] = useState(FEED_DATA);
  const [subscribed, setSubscribed] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [emailInput, setEmailInput] = useState("kim.junhyuk@example.com");

  const toggleChip = (chip) => {
    setSelectedChips(prev =>
      prev.includes(chip) ? prev.filter(c => c !== chip) : prev.length < 5 ? [...prev, chip] : prev
    );
  };

  const handleInterest = (id, value) => {
    setFeed(prev => prev.map(f => f.id === id ? { ...f, interest: value } : f));
    if (showDetail?.id === id) setShowDetail(prev => ({ ...prev, interest: value }));
  };

  const visibleFeed = feed.filter(f => f.interest !== "skip");
  const interestedCount = feed.filter(f => f.interest === "yes").length;

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.sans }}>
      {/* HERO */}
      <div style={{ background: T.dark, padding: "64px 0 72px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse 80% 50% at 80% 50%, rgba(201,168,76,0.06) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 28, height: 1, background: T.gold }} />
            <span style={{ color: T.gold, fontSize: 11, letterSpacing: "0.2em", fontWeight: 600 }}>CURATION FEED · WEEKLY</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: T.bg, lineHeight: 1.25, margin: "0 0 20px", letterSpacing: "-1px", fontFamily: T.serif }}>
            어떤 시장이<br />궁금하신가요?
          </h1>
          <p style={{ fontSize: 15.5, color: "#b0a898", lineHeight: 1.9, maxWidth: 540, margin: "0 0 36px" }}>
            관심 분야를 선택하면 — 해당 시장의 핵심 포지션을<br />
            매주 직접 받아보실 수 있습니다.
          </p>
          {/* Newsletter badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 18px", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 4 }}>
            <span style={{ fontSize: 14 }}>✉️</span>
            <span style={{ fontSize: 13, color: "#d4b56a" }}>이 내용이 매주 이메일로 전송됩니다</span>
          </div>
        </div>
      </div>

      {/* INTEREST SELECTOR */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 48px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 32, flexWrap: "wrap" }}>
            {/* Chips */}
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 11, color: T.light, letterSpacing: "0.12em", fontWeight: 600, marginBottom: 14 }}>
                관심 분야 선택 (최대 5개)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {INTEREST_CHIPS.map(chip => {
                  const active = selectedChips.includes(chip);
                  return (
                    <button key={chip} onClick={() => toggleChip(chip)} style={{
                      padding: "7px 14px", fontSize: 13, border: `1.5px solid ${active ? T.gold : "rgba(0,0,0,0.12)"}`,
                      background: active ? "rgba(201,168,76,0.1)" : "transparent",
                      color: active ? T.goldDeep : "#666", cursor: "pointer", borderRadius: 100,
                      fontWeight: active ? 700 : 400, transition: "all 0.15s", fontFamily: T.sans,
                    }}>
                      {active && "✓ "}{chip}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Free text */}
            <div style={{ minWidth: 240 }}>
              <div style={{ fontSize: 11, color: T.light, letterSpacing: "0.12em", fontWeight: 600, marginBottom: 14 }}>
                또는 직접 입력
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={customInput}
                  onChange={e => setCustomInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && customInput.trim() && selectedChips.length < 5) { setSelectedChips(p => [...p, customInput.trim()]); setCustomInput(""); } }}
                  placeholder="예: 'B2B SaaS 세일즈'"
                  style={{ flex: 1, padding: "9px 14px", border: `1px solid rgba(0,0,0,0.12)`, background: "#faf8f4", fontSize: 13.5, outline: "none", fontFamily: T.sans, borderRadius: 4 }}
                />
                <button
                  onClick={() => { if (customInput.trim() && selectedChips.length < 5) { setSelectedChips(p => [...p, customInput.trim()]); setCustomInput(""); }}}
                  style={{ padding: "9px 16px", background: T.dark, color: T.bg, border: "none", fontSize: 13, cursor: "pointer", fontFamily: T.sans, borderRadius: 4 }}
                >
                  추가
                </button>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: "#aaa" }}>
                Enter 또는 추가 버튼으로 등록 · {5 - selectedChips.length}개 남음
              </div>
            </div>
          </div>

          {/* Selected tags */}
          {selectedChips.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 12, color: T.light }}>구독 중:</span>
              {selectedChips.map(chip => (
                <span key={chip} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: T.bg, border: `1px solid rgba(0,0,0,0.1)`, fontSize: 12.5, borderRadius: 100 }}>
                  {chip}
                  <span onClick={() => toggleChip(chip)} style={{ cursor: "pointer", color: "#bbb", fontSize: 14, lineHeight: 1 }}>×</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FEED */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 48px 80px" }}>
        {/* Feed header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 11, color: T.light, letterSpacing: "0.15em", fontWeight: 600, marginBottom: 6 }}>
              THIS WEEK'S FEED · {new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric" })} 기준
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: T.dark, margin: 0, fontFamily: T.serif }}>
              이번 주 큐레이션 {visibleFeed.length}건
            </h2>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {interestedCount > 0 && (
              <div style={{ padding: "8px 16px", background: "rgba(201,168,76,0.12)", border: `1px solid rgba(201,168,76,0.25)`, fontSize: 13, color: T.goldDeep, borderRadius: 4, fontWeight: 600 }}>
                관심 포지션 {interestedCount}건
              </div>
            )}
          </div>
        </div>

        {/* Newsletter subscribe bar */}
        {!subscribed ? (
          <div style={{ marginBottom: 32, padding: "20px 24px", background: T.dark, borderRadius: 4, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.bg, marginBottom: 4 }}>매주 이메일로 받아보기</div>
              <div style={{ fontSize: 12.5, color: "#888" }}>선택한 관심 분야의 포지션을 매주 월요일 발송합니다</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                placeholder="이메일 주소"
                style={{ padding: "9px 14px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)", color: "#ddd", fontSize: 13.5, outline: "none", fontFamily: T.sans, borderRadius: 4, width: 220 }}
              />
              <button onClick={() => setSubscribed(true)} style={{ padding: "9px 20px", background: T.gold, color: T.dark, border: "none", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: T.sans, borderRadius: 4 }}>
                구독 시작 →
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginBottom: 32, padding: "16px 24px", background: "rgba(201,168,76,0.08)", border: `1px solid rgba(201,168,76,0.25)`, borderRadius: 4, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>✓</span>
            <div>
              <span style={{ fontSize: 13.5, color: T.goldDeep, fontWeight: 700 }}>구독 완료.</span>
              <span style={{ fontSize: 13.5, color: "#666", marginLeft: 6 }}>{emailInput} 으로 매주 월요일 발송됩니다.</span>
            </div>
          </div>
        )}

        {/* Feed cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {visibleFeed.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              onInterest={(v) => handleInterest(item.id, v)}
              onDetail={() => setShowDetail(item)}
            />
          ))}
        </div>

        {/* Empty state */}
        {visibleFeed.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0", color: T.light }}>
            <div style={{ fontSize: 32, marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.dark, marginBottom: 8 }}>이번 주 피드를 모두 확인했습니다</div>
            <div style={{ fontSize: 14, color: T.light }}>다음 주 월요일에 새로운 포지션이 도착합니다</div>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginTop: 40, padding: "20px 24px", background: "rgba(0,0,0,0.03)", borderRadius: 4, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: T.light, fontWeight: 600 }}>피드 안내</span>
          <span style={{ fontSize: 12, color: T.light }}>📌 관심 있음 — AI Match Engine의 학습 신호로 활용됩니다</span>
          <span style={{ fontSize: 12, color: T.light }}>⏭ 관심 없음 — 이 유형의 포지션 비중이 줄어듭니다</span>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <FeedDetailModal item={showDetail} onClose={() => setShowDetail(null)} onInterest={(v) => { handleInterest(showDetail.id, v); setShowDetail(p => ({ ...p, interest: v })); }} />
      )}
    </div>
  );
}

function FeedCard({ item, onInterest, onDetail }) {
  const [hovered, setHovered] = useState(false);
  const interested = item.interest === "yes";
  const skipped = item.interest === "skip";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.white, border: `1px solid ${hovered ? "rgba(0,0,0,0.12)" : T.border}`,
        transition: "all 0.18s", boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.06)" : "none",
        opacity: skipped ? 0.4 : 1,
      }}
    >
      <div style={{ padding: "24px 28px", display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Company avatar */}
        <div style={{ width: 44, height: 44, background: T.dark, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: 4 }}>
          <span style={{ color: T.gold, fontSize: 14, fontWeight: 800, fontFamily: T.serif }}>{item.company[0]}</span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 800, color: T.dark, fontFamily: T.serif }}>{item.company}</span>
                <span style={{ fontSize: 11.5, color: T.light }}>{item.companyTag}</span>
                {item.exclusive && <span style={{ fontSize: 10, padding: "2px 7px", background: T.dark, color: T.gold, fontWeight: 700, letterSpacing: "0.05em", borderRadius: 2 }}>EXCLUSIVE</span>}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.dark, marginBottom: 10 }}>{item.role}</div>
            </div>
          </div>

          <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.75, margin: "0 0 16px" }}>{item.summary}</p>

          {/* Meta row */}
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
            {[
              { icon: "👥", label: "팀 규모", value: item.teamSize },
              { icon: "💰", label: "연봉 밴드", value: item.salaryBand },
              { icon: "📍", label: "위치", value: item.location },
              { icon: "📊", label: "레벨", value: item.level },
            ].map(m => (
              <div key={m.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 12 }}>{m.icon}</span>
                <span style={{ fontSize: 11.5, color: T.light }}>{m.label}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: T.dark }}>{m.value}</span>
              </div>
            ))}
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {item.tags.map(tag => (
              <span key={tag} style={{ fontSize: 11.5, padding: "3px 10px", background: T.bg, border: `1px solid rgba(0,0,0,0.08)`, color: "#777", borderRadius: 100 }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, alignItems: "flex-end" }}>
          <button onClick={() => onInterest(interested ? null : "yes")} style={{
            padding: "9px 20px", background: interested ? T.gold : "transparent",
            border: `1.5px solid ${interested ? T.gold : "rgba(0,0,0,0.15)"}`,
            color: interested ? T.dark : "#555", fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, fontFamily: T.sans, borderRadius: 4, transition: "all 0.15s",
          }}>
            {interested ? "✓ 관심 있음" : "관심 있음"}
          </button>
          <button onClick={() => onInterest("skip")} style={{
            padding: "9px 20px", background: "transparent",
            border: `1px solid rgba(0,0,0,0.1)`, color: "#aaa", fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, fontFamily: T.sans, borderRadius: 4,
          }}>
            관심 없음
          </button>
          <button onClick={onDetail} style={{ padding: "6px 0", background: "none", border: "none", color: T.gold, fontSize: 12.5, cursor: "pointer", fontFamily: T.sans, textDecoration: "underline" }}>
            상세 보기
          </button>
        </div>
      </div>
    </div>
  );
}

function FeedDetailModal({ item, onClose, onInterest }) {
  const interested = item.interest === "yes";
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.white, width: "100%", maxWidth: 640, maxHeight: "90vh", overflow: "auto", position: "relative" }}>
        {/* header bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${T.gold}, ${T.goldDeep})` }} />
        <div style={{ padding: "32px 36px" }}>
          <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#aaa" }}>✕</button>

          {item.exclusive && (
            <div style={{ display: "inline-block", fontSize: 10, padding: "3px 9px", background: T.dark, color: T.gold, fontWeight: 800, letterSpacing: "0.1em", marginBottom: 16, borderRadius: 2 }}>EXCLUSIVE</div>
          )}
          <div style={{ fontSize: 12, color: T.light, marginBottom: 6 }}>{item.company} · {item.companyTag}</div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: T.dark, margin: "0 0 24px", fontFamily: T.serif, letterSpacing: "-0.5px" }}>{item.role}</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28, padding: "20px", background: T.bg, borderRadius: 4 }}>
            {[
              { label: "팀 규모", value: item.teamSize },
              { label: "연봉 밴드", value: item.salaryBand },
              { label: "위치", value: item.location },
              { label: "레벨", value: item.level },
            ].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 11, color: T.light, fontWeight: 600, marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.dark }}>{m.value}</div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 14.5, color: T.body, lineHeight: 1.85, marginBottom: 28 }}>{item.summary}</p>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 24, display: "flex", gap: 10 }}>
            <button onClick={() => onInterest(interested ? null : "yes")} style={{
              flex: 2, padding: "13px", background: interested ? T.gold : T.dark, color: interested ? T.dark : T.bg,
              border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: T.sans, borderRadius: 4,
            }}>
              {interested ? "✓ 관심 있음" : "관심 있음 →"}
            </button>
            <button onClick={() => { onInterest("skip"); onClose(); }} style={{
              flex: 1, padding: "13px", background: "transparent", border: `1px solid rgba(0,0,0,0.12)`,
              fontSize: 14, color: "#888", cursor: "pointer", fontFamily: T.sans, borderRadius: 4,
            }}>
              관심 없음
            </button>
          </div>

          <div style={{ marginTop: 20, padding: "14px 16px", background: "rgba(201,168,76,0.06)", border: `1px solid rgba(201,168,76,0.2)`, borderRadius: 4 }}>
            <div style={{ fontSize: 12, color: T.goldDeep }}>
              💌 관심 있음을 클릭하면 ValueConnect 헤드헌터가 직접 연락드립니다.
              이 정보는 채용 목적으로만 사용됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMMUNITY LOUNGE PAGE (신규) ─────────────────────────────────────────────
const LOUNGE_CATS = [
  { key: "all",          icon: "▤",  label: "전체" },
  { key: "reading",      icon: "📚", label: "독서 & 인사이트" },
  { key: "career",       icon: "💼", label: "이직 이야기" },
  { key: "company",      icon: "🏢", label: "회사 생활" },
  { key: "leadership",   icon: "🧠", label: "리더십 & 조직" },
  { key: "productivity", icon: "⚡", label: "생산성 & Tech" },
  { key: "casual",       icon: "☕", label: "가볍게" },
];

const LOUNGE_POSTS = [
  {
    id: 1, cat: "reading", title: "고수들은 왜 의사결정을 '빠르게' 하지 않는가",
    body: "최근 다니엘 카너만의 Thinking Fast and Slow를 다시 읽으면서, 우리가 '결단력'이라고 부르는 것의 상당 부분이 사실은 System 1의 과신이라는 생각이 들었습니다. 특히 시니어로 올라갈수록 의사결정의 속도보다 '어떤 정보를 더 수집할지 결정하는 능력'이 핵심인 것 같고요. 비슷한 경험이나 생각 있으신 분들과 이야기 나눠보고 싶습니다.",
    author: "익명 멤버 · Core", time: "6시간 전", views: 203,
    reactions: [{ e: "💡", n: 34 }, { e: "🤝", n: 18 }, { e: "📚", n: 12 }],
    comments: [
      { a: "익명 멤버 A", t: "맞습니다. 결단력보다는 '멈출 줄 아는 능력'이라고 부르고 싶어요. 충분히 아는 상태에서 멈추는 것과, 모르는 상태에서 그냥 진행하는 것의 차이가 커리어 어딘가에서 드러나더라고요.", time: "4시간 전", r: [{ e: "💡", n: 14 }] },
    ],
  },
  {
    id: 2, cat: "career", title: "스타트업 CPO 3년 차에 대기업 VP 제안 — 어떻게 판단하셨나요",
    body: "스타트업에서 CPO로 3년째 일하고 있는데, 최근 대기업 계열사 VP 포지션 제안이 왔습니다. 보상 패키지는 확실히 개선되고 안정성도 높지만, 지금의 자율성과 속도감을 포기해야 하는 게 마음에 걸립니다. 비슷한 갈림길에서 결정하신 분들의 실제 경험이 궁금합니다.",
    author: "익명 멤버 · Core", time: "1일 전", views: 487,
    reactions: [{ e: "🤝", n: 56 }, { e: "🎯", n: 29 }, { e: "🔥", n: 11 }],
    comments: [
      { a: "익명 멤버 B", t: "저는 비슷한 상황에서 대기업을 선택했고 2년 후 후회했습니다. 결정적 질문은 '이 회사에서 내가 제품보다 정치를 더 많이 할 것인가'였는데, 솔직히 대답이 이미 나왔었어요.", time: "20시간 전", r: [{ e: "🤝", n: 32 }] },
      { a: "익명 멤버 C", t: "반대 케이스도 있습니다. 스타트업의 '자율성'이 사실은 리소스 없음의 다른 말일 때가 많아요. 대기업에서 큰 조직을 이끄는 경험 자체가 커리어 자산이 되기도 합니다.", time: "15시간 전", r: [{ e: "💡", n: 19 }] },
    ],
  },
  {
    id: 3, cat: "company", title: "팀장은 왜 항상 맥락 없이 지시하는가 — 리버스 관리 실험기",
    body: "'팀장이 왜 이런 말을 하는가'를 이해하기 위해 6개월간 실험했습니다. 보고할 때마다 상위 맥락을 먼저 물어보는 것인데, 처음엔 어색했지만 이후로 일하는 방식이 바뀌었어요. 위에서 내려오는 지시의 80%는 맥락을 알면 다르게 실행할 수 있는 것들이었습니다.",
    author: "익명 멤버 · Endorsed", time: "2일 전", views: 341,
    reactions: [{ e: "🧠", n: 47 }, { e: "💡", n: 31 }, { e: "🤝", n: 22 }],
    comments: [],
  },
  {
    id: 4, cat: "productivity", title: "LLM을 업무에 진짜로 통합한 방식들 — 실전 워크플로우",
    body: "Claude API + 노션 + Zapier로 회의록 자동 요약 → 액션아이템 추출 → 담당자 슬랙 DM까지 연결했습니다. 세팅에 하루 걸렸고, 매주 약 3시간 절약됩니다. 생각보다 어렵지 않고, 가장 중요한 건 '어디서 병목이 생기는가'를 먼저 파악하는 거였어요. 다들 어떤 방식으로 AI를 업무에 쓰고 계신지 궁금합니다.",
    author: "익명 멤버 · Core", time: "3일 전", views: 612,
    reactions: [{ e: "⚡", n: 71 }, { e: "🔥", n: 38 }, { e: "💡", n: 28 }],
    comments: [
      { a: "익명 멤버 D", t: "저는 고객사 제안서 초안 생성에 GPT-4o를 쓰고 있는데, 프롬프트 엔지니어링보다 '좋은 예시 문서를 많이 쌓는 것'이 품질을 훨씬 많이 높여줬습니다.", time: "2일 전", r: [{ e: "💡", n: 24 }] },
    ],
  },
  {
    id: 5, cat: "leadership", title: "팀원이 성과가 낮을 때, 어디까지 기다려야 하는가",
    body: "매니저로서 가장 힘든 결정 중 하나입니다. 피드백을 주고 기회를 줬는데도 개선이 없을 때, 조직과 개인 사이에서 어떻게 균형을 잡으셨나요.",
    author: "익명 멤버 · Core", time: "5일 전", views: 294,
    reactions: [{ e: "🧠", n: 39 }, { e: "🤝", n: 28 }],
    comments: [
      { a: "익명 멤버 E", t: "저는 '90일 플랜'을 씁니다. 명확한 기준과 타임라인을 문서화하고, 그 안에 개선이 없으면 서로 맞지 않는다는 걸 확인하는 과정으로 받아들여요.", time: "3일 전", r: [{ e: "💡", n: 21 }] },
    ],
  },
  {
    id: 6, cat: "reading", title: "요즘 읽고 있는 것들 — 조직설계와 권력의 심리학",
    body: "HBR 아티클 몇 개를 엮어 읽으면서, 조직 내 권력 구조가 어떻게 정당성을 획득하는지에 대해 생각하게 됐습니다. 추천 읽을거리 있으신 분?",
    author: "익명 멤버 · Endorsed", time: "6일 전", views: 188,
    reactions: [{ e: "📚", n: 22 }, { e: "🤝", n: 9 }],
    comments: [],
  },
  {
    id: 7, cat: "casual", title: "10년 만에 처음으로 3주 휴가를 냈습니다",
    body: "항상 '나중에'라고 했던 긴 휴가를 드디어 냈습니다. 돌아오니 회사는 잘 돌아가고 있었고 (약간 서운하기도 했고), 제가 생각보다 대체 불가능하지 않다는 걸 깨달았습니다. 그게 오히려 일하는 방식을 바꾸게 해줬어요.",
    author: "익명 멤버 · Core", time: "7일 전", views: 388,
    reactions: [{ e: "🌱", n: 44 }, { e: "🤝", n: 33 }, { e: "☕", n: 19 }],
    comments: [],
  },
];

function CommunityLoungePage() {
  const [activeCat, setActiveCat] = useState("all");
  const [posts, setPosts] = useState(LOUNGE_POSTS);
  const [openPost, setOpenPost] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [showWrite, setShowWrite] = useState(false);
  const [newPost, setNewPost] = useState({ cat: "career", title: "", body: "", anon: true });

  const filtered = activeCat === "all" ? posts : posts.filter(p => p.cat === activeCat);
  const activeCatObj = LOUNGE_CATS.find(c => c.key === activeCat);

  // count per category
  const counts = LOUNGE_CATS.reduce((acc, cat) => {
    acc[cat.key] = cat.key === "all" ? posts.length : posts.filter(p => p.cat === cat.key).length;
    return acc;
  }, {});

  const reactPost = (pid, emoji) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== pid) return p;
      const ex = p.reactions.find(r => r.e === emoji);
      return { ...p, reactions: ex ? p.reactions.map(r => r.e === emoji ? { ...r, n: r.n + 1 } : r) : [...p.reactions, { e: emoji, n: 1 }] };
    }));
  };

  const addComment = (pid) => {
    const txt = commentInput[pid]?.trim();
    if (!txt) return;
    setPosts(prev => prev.map(p => p.id !== pid ? p : { ...p, comments: [...p.comments, { a: "나 (익명)", t: txt, time: "방금", r: [] }] }));
    setCommentInput(prev => ({ ...prev, [pid]: "" }));
  };

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.sans }}>
      {/* HERO */}
      <div style={{ background: T.dark, padding: "56px 0 64px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 80% at 90% 50%, rgba(201,168,76,0.04) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 28, height: 1, background: T.gold }} />
            <span style={{ color: T.gold, fontSize: 11, letterSpacing: "0.2em", fontWeight: 600 }}>COMMUNITY LOUNGE · INVITE-ONLY</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32 }}>
            <div>
              <h1 style={{ fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 800, color: T.bg, lineHeight: 1.25, margin: "0 0 16px", letterSpacing: "-1px", fontFamily: T.serif }}>
                실명으로는 말할 수 없는 것들
              </h1>
              <p style={{ fontSize: 15, color: "#b0a898", lineHeight: 1.8, maxWidth: 480, margin: 0 }}>
                익명이지만 멤버 인증된 공간. 평가 없이 집단 지성이 작동합니다.
              </p>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, flexShrink: 0 }}>
              <span style={{ fontSize: 12 }}>🔒</span>
              <span style={{ fontSize: 12.5, color: "#b0a898" }}>채용에 활용되지 않습니다</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN — sidebar + feed */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 48px 80px", display: "grid", gridTemplateColumns: "200px 1fr", gap: 24, alignItems: "start" }}>

        {/* ── SIDEBAR ── */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden", position: "sticky", top: 80 }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, color: T.light, letterSpacing: "0.15em", fontWeight: 600 }}>CATEGORIES</div>
          </div>
          {LOUNGE_CATS.map(cat => {
            const isActive = activeCat === cat.key;
            return (
              <div
                key={cat.key}
                onClick={() => { setActiveCat(cat.key); setOpenPost(null); }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 16px", cursor: "pointer", borderLeft: isActive ? `2px solid ${T.gold}` : "2px solid transparent",
                  background: isActive ? "#faf8f4" : "transparent",
                  borderBottom: `1px solid ${T.border}`,
                  transition: "all 0.12s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#fdfcf9"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{ fontSize: 13.5, color: isActive ? T.dark : "#666", fontWeight: isActive ? 700 : 400, display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 13 }}>{cat.icon}</span>
                  {cat.label}
                </span>
                <span style={{
                  fontSize: 11, padding: "2px 7px", borderRadius: 100,
                  background: isActive ? "rgba(201,168,76,0.12)" : "rgba(0,0,0,0.05)",
                  color: isActive ? T.goldDeep : T.light, fontWeight: isActive ? 700 : 400,
                }}>
                  {counts[cat.key]}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── FEED ── */}
        <div>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: T.dark, fontFamily: T.serif, marginBottom: 2 }}>
                {activeCatObj?.icon} {activeCatObj?.label}
              </div>
              <div style={{ fontSize: 12.5, color: T.light }}>
                {filtered.length}개의 대화
              </div>
            </div>
            <button onClick={() => setShowWrite(true)} style={{
              padding: "10px 20px", background: T.dark, color: T.bg, border: "none",
              fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 7,
              fontFamily: T.sans, borderRadius: 4,
            }}>
              ✏️ 글 쓰기
            </button>
          </div>

          {/* Post list */}
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 4, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "72px 0", textAlign: "center", color: T.light }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>✍️</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.dark, marginBottom: 6 }}>아직 글이 없습니다</div>
                <div style={{ fontSize: 13.5 }}>이 카테고리의 첫 번째 글을 남겨보세요</div>
              </div>
            ) : (
              filtered.map((post, idx) => (
                <LoungePostRow
                  key={post.id}
                  post={post}
                  showCatBadge={activeCat === "all"}
                  isOpen={openPost === post.id}
                  onToggle={() => setOpenPost(openPost === post.id ? null : post.id)}
                  onReact={(e) => reactPost(post.id, e)}
                  comment={commentInput[post.id] || ""}
                  onCommentChange={v => setCommentInput(p => ({ ...p, [post.id]: v }))}
                  onComment={() => addComment(post.id)}
                  isLast={idx === filtered.length - 1}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Write Modal */}
      {showWrite && (
        <div onClick={() => setShowWrite(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, width: "100%", maxWidth: 600, position: "relative", borderRadius: 4 }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${T.gold}, ${T.goldDeep})`, borderRadius: "4px 4px 0 0" }} />
            <div style={{ padding: "32px 36px" }}>
              <button onClick={() => setShowWrite(false)} style={{ position: "absolute", top: 20, right: 24, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#aaa" }}>✕</button>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 24px", fontFamily: T.serif }}>라운지에 글 쓰기</h3>

              {/* Anon toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, padding: "12px 16px", background: T.bg, borderRadius: 4 }}>
                <button onClick={() => setNewPost(p => ({ ...p, anon: !p.anon }))} style={{
                  width: 40, height: 22, background: newPost.anon ? T.dark : "#ddd", borderRadius: 11, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
                }}>
                  <div style={{ width: 16, height: 16, background: T.white, borderRadius: "50%", position: "absolute", top: 3, left: newPost.anon ? 20 : 4, transition: "left 0.2s" }} />
                </button>
                <span style={{ fontSize: 13.5, color: T.dark, fontWeight: 600 }}>익명으로 작성</span>
                <span style={{ fontSize: 12.5, color: T.light }}>— 멤버 인증은 유지됩니다</span>
              </div>

              {/* Category chips */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: T.light, fontWeight: 600, display: "block", marginBottom: 8 }}>카테고리</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                  {LOUNGE_CATS.filter(c => c.key !== "all").map(cat => (
                    <button key={cat.key} onClick={() => setNewPost(p => ({ ...p, cat: cat.key }))} style={{
                      padding: "6px 13px", fontSize: 13,
                      border: `1.5px solid ${newPost.cat === cat.key ? T.gold : "rgba(0,0,0,0.1)"}`,
                      background: newPost.cat === cat.key ? "rgba(201,168,76,0.1)" : "transparent",
                      color: newPost.cat === cat.key ? T.goldDeep : "#666",
                      cursor: "pointer", borderRadius: 100, fontFamily: T.sans,
                    }}>
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, color: T.light, fontWeight: 600, display: "block", marginBottom: 6 }}>제목</label>
                <input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="어떤 이야기를 나누고 싶으신가요?" style={{ width: "100%", padding: "11px 14px", border: `1px solid rgba(0,0,0,0.12)`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: T.sans, borderRadius: 4 }} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, color: T.light, fontWeight: 600, display: "block", marginBottom: 6 }}>내용</label>
                <textarea value={newPost.body} onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))} rows={6} placeholder="솔직하게 써주세요. 이 공간은 채용에 활용되지 않습니다." style={{ width: "100%", padding: "11px 14px", border: `1px solid rgba(0,0,0,0.12)`, fontSize: 14, resize: "none", outline: "none", lineHeight: 1.75, boxSizing: "border-box", fontFamily: T.sans, borderRadius: 4 }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowWrite(false)} style={{ flex: 1, padding: "12px", border: `1px solid rgba(0,0,0,0.12)`, background: "none", fontSize: 14, cursor: "pointer", borderRadius: 4, fontFamily: T.sans }}>취소</button>
                <button onClick={() => {
                  if (!newPost.title.trim() || !newPost.body.trim()) return;
                  setPosts(p => [{ id: Date.now(), cat: newPost.cat, title: newPost.title, body: newPost.body, author: newPost.anon ? "익명 멤버 · Core" : "나 (Core 멤버)", time: "방금", views: 1, reactions: [], comments: [] }, ...p]);
                  setShowWrite(false);
                  setNewPost({ cat: "career", title: "", body: "", anon: true });
                }} style={{ flex: 2, padding: "12px", background: T.dark, color: T.bg, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 4, fontFamily: T.sans }}>
                  게시하기 →
                </button>
              </div>
              <div style={{ marginTop: 14, fontSize: 12, color: T.light, textAlign: "center" }}>
                🔒 커뮤니티 게시물은 채용 활동에 절대 활용되지 않습니다
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LoungePostRow({ post, showCatBadge, isOpen, onToggle, onReact, comment, onCommentChange, onComment, isLast }) {
  const catObj = LOUNGE_CATS.find(c => c.key === post.cat);
  const QUICK_EMOJIS = ["🤝", "💡", "🔥", "🧠", "🌱", "🎯"];
  const [showEmoji, setShowEmoji] = useState(false);
  const badge = post.author.includes("Core") ? "Core" : "Endorsed";

  return (
    <div style={{ borderBottom: isLast ? "none" : `1px solid ${T.border}` }}>
      {/* Row header */}
      <div
        onClick={onToggle}
        style={{ padding: "18px 24px", cursor: "pointer", display: "flex", gap: 16, alignItems: "flex-start", background: isOpen ? "#faf8f4" : T.white, transition: "background 0.15s" }}
        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = "#fdfcf9"; }}
        onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = isOpen ? "#faf8f4" : T.white; }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Meta row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 7, flexWrap: "wrap" }}>
            {showCatBadge && (
              <span style={{ fontSize: 11, padding: "2px 8px", background: T.bg, border: `1px solid rgba(0,0,0,0.08)`, color: T.light, borderRadius: 100, flexShrink: 0 }}>
                {catObj?.icon} {catObj?.label}
              </span>
            )}
            <span style={{ fontSize: 11, padding: "1px 7px", background: badge === "Core" ? "rgba(26,26,26,0.07)" : "rgba(0,0,0,0.04)", color: badge === "Core" ? T.dark : T.light, borderRadius: 3, fontWeight: 600 }}>{badge}</span>
            <span style={{ fontSize: 12, color: T.light }}>{post.author.split(" · ")[0]}</span>
            <span style={{ fontSize: 12, color: "#ccc" }}>·</span>
            <span style={{ fontSize: 12, color: T.light }}>{post.time}</span>
          </div>
          {/* Title */}
          <div style={{ fontSize: 15, fontWeight: 700, color: T.dark, lineHeight: 1.45, fontFamily: T.serif, marginBottom: 6 }}>{post.title}</div>
          {/* Preview — only when collapsed */}
          {!isOpen && (
            <div style={{ fontSize: 13, color: T.light, lineHeight: 1.6, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
              {post.body}
            </div>
          )}
        </div>

        {/* Right stats */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ fontSize: 12, color: T.light }}>👁 {post.views}</span>
            <span style={{ fontSize: 12, color: T.light }}>💬 {post.comments.length}</span>
          </div>
          <div style={{ display: "flex", gap: 5 }}>
            {post.reactions.slice(0, 3).map(r => (
              <span key={r.e} style={{ fontSize: 11.5, background: T.bg, padding: "1px 7px", borderRadius: 100, color: T.light }}>{r.e} {r.n}</span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: "#ccc", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", marginTop: 2 }}>▾</span>
        </div>
      </div>

      {/* Expanded body */}
      {isOpen && (
        <div style={{ padding: "0 24px 24px", background: "#faf8f4", borderTop: `1px solid rgba(0,0,0,0.05)` }}>
          <p style={{ fontSize: 14.5, color: T.body, lineHeight: 1.9, padding: "20px 0", margin: 0 }}>{post.body}</p>

          {/* Reactions */}
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", paddingBottom: 20, borderBottom: `1px solid ${T.border}` }}>
            {post.reactions.map(r => (
              <button key={r.e} onClick={() => onReact(r.e)} style={{ padding: "5px 12px", background: T.white, border: `1px solid rgba(0,0,0,0.1)`, borderRadius: 100, fontSize: 13, cursor: "pointer", fontFamily: T.sans }}>
                {r.e} {r.n}
              </button>
            ))}
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowEmoji(!showEmoji)} style={{ padding: "5px 12px", background: "none", border: `1px dashed rgba(0,0,0,0.15)`, borderRadius: 100, fontSize: 13, cursor: "pointer", color: T.light, fontFamily: T.sans }}>
                + 반응
              </button>
              {showEmoji && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, background: T.white, border: `1px solid ${T.border}`, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: 10, display: "flex", gap: 6, flexWrap: "wrap", width: 156, zIndex: 10, borderRadius: 6 }}>
                  {QUICK_EMOJIS.map(e => (
                    <button key={e} onClick={() => { onReact(e); setShowEmoji(false); }} style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>{e}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          {post.comments.length > 0 && (
            <div style={{ paddingTop: 18, display: "flex", flexDirection: "column", gap: 12, marginBottom: 14 }}>
              {post.comments.map((c, i) => (
                <div key={i} style={{ display: "flex", gap: 10 }}>
                  <div style={{ width: 26, height: 26, background: T.bgAlt, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: T.dark, flexShrink: 0, marginTop: 1 }}>
                    {c.a[0]}
                  </div>
                  <div style={{ flex: 1, background: T.white, padding: "11px 14px", borderRadius: 6, border: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: T.dark }}>{c.a}</span>
                      <span style={{ fontSize: 12, color: T.light }}>{c.time}</span>
                    </div>
                    <p style={{ fontSize: 13.5, color: T.body, lineHeight: 1.75, margin: 0 }}>{c.t}</p>
                    <div style={{ marginTop: 7, display: "flex", gap: 5 }}>
                      {c.r.map(r => <span key={r.e} style={{ fontSize: 12 }}>{r.e} {r.n}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Comment input */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <div style={{ width: 26, height: 26, background: T.dark, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: T.gold, flexShrink: 0, marginTop: 3 }}>나</div>
            <div style={{ flex: 1, display: "flex", gap: 8 }}>
              <input value={comment} onChange={e => onCommentChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onComment()} placeholder="익명으로 댓글 달기..." style={{ flex: 1, padding: "9px 14px", border: `1px solid rgba(0,0,0,0.12)`, background: T.white, fontSize: 13.5, outline: "none", borderRadius: 4, fontFamily: T.sans }} />
              <button onClick={onComment} style={{ padding: "9px 16px", background: T.dark, color: T.bg, border: "none", fontSize: 13, cursor: "pointer", borderRadius: 4, fontFamily: T.sans }}>등록</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── POSITIONS PAGE (ENHANCED) ────────────────────────────────────────────────
const POSITIONS = [
  { id: 1, company: "Krafton", tag: "Series D+ · 게임 · 글로벌", role: "Head of Business Development", level: "Executive", location: "판교", score: 94, domain: "Business", tags: ["BD", "IP", "글로벌"], posted: "2일 전", exclusive: true, salaryBand: "2억~3억+", teamSize: "BD팀 40명", summary: "글로벌 IP 라이선싱과 전략적 파트너십을 통해 Krafton의 다음 성장 챕터를 설계할 리더.", fullDesc: "Krafton은 IP를 중심으로 엔터테인먼트, 테크, 콘텐츠의 교차점에서 새로운 시장을 만들어가고 있습니다. Head of BD는 그 교차점에서 가장 중요한 딜들을 주도할 사람입니다.", texture: ["직접 시장을 개척하는 사람", "불확실성을 설계로 바꾸는 사람", "한 문장으로 복잡한 딜을 설명하는 사람"], reqs: ["글로벌 엔터테인먼트 또는 테크 분야 BD 10년 이상", "복잡한 계약 구조를 직접 설계한 경험"] },
  { id: 2, company: "Toss Securities", tag: "핀테크 · 브로커리지", role: "VP of Product — 투자 플랫폼", level: "VP", location: "서울 강남", score: 88, domain: "Product", tags: ["Product", "FinTech", "투자"], posted: "5일 전", exclusive: false, salaryBand: "1.7억~2.3억", teamSize: "PD팀 25명", summary: "개인 투자자의 의사결정 경험을 근본적으로 재설계할 프로덕트 리더.", fullDesc: "토스증권은 '금융을 쉽게'라는 명제를 증권 영역에서 구현해가고 있습니다.", texture: ["숫자보다 사용자 심리를 먼저 읽는 사람", "조직을 제품처럼 설계하는 사람", "PRD보다 원칙을 먼저 쓰는 사람"], reqs: ["핀테크 또는 금융 프로덕트 7년 이상", "대규모 팀 리딩 경험"] },
  { id: 3, company: "Primer", tag: "AI · B2B SaaS · Series B", role: "CRO — Chief Revenue Officer", level: "C-Suite", location: "서울 · 원격 가능", score: 91, domain: "Sales", tags: ["Sales", "AI", "Enterprise"], posted: "1일 전", exclusive: true, salaryBand: "1.8억~2.5억", teamSize: "Sales 5→15명 (빌드)", summary: "한국 엔터프라이즈 AI 시장을 개척할 첫 번째 CRO. 제로에서 시작하는 세일즈 조직.", fullDesc: "Primer는 기업의 비정형 데이터를 구조화하는 AI 플랫폼입니다.", texture: ["파이프라인이 아니라 시장을 만드는 사람", "엔터프라이즈 세일즈를 문화로 바꿀 사람"], reqs: ["엔터프라이즈 SaaS 세일즈 리더십 8년 이상", "초기 기업 세일즈 조직 셋업 경험"] },
  { id: 4, company: "Moloco", tag: "AdTech · ML · 유니콘", role: "Senior Engineering Manager — ML Platform", level: "Senior Manager", location: "서울 · 하이브리드", score: 85, domain: "Engineering", tags: ["ML", "Engineering", "Platform"], posted: "3일 전", exclusive: false, salaryBand: "1.5억~2억", teamSize: "ML Platform 팀 12명", summary: "Moloco의 실시간 광고 최적화 ML 플랫폼을 이끌 엔지니어링 리더.", fullDesc: "Moloco의 ML Platform 팀은 실시간으로 수백만 광고주의 캠페인을 최적화하는 핵심 엔진을 개발합니다.", texture: ["시스템이 스스로 배우게 만드는 사람", "코드보다 구조를 먼저 생각하는 사람"], reqs: ["ML 시스템 엔지니어링 8년 이상", "엔지니어 팀 매니지먼트 3년 이상"] },
];

function PositionsPage() {
  const [filter, setFilter] = useState("전체");
  const [openPos, setOpenPos] = useState(null);
  const [interests, setInterests] = useState({});
  const filters = ["전체", "Business", "Product", "Engineering", "Finance", "Sales"];

  const filtered = filter === "전체" ? POSITIONS : POSITIONS.filter(p => p.domain === filter);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.sans }}>
      {/* HERO */}
      <div style={{ background: T.dark, padding: "64px 0 72px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 85% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 28, height: 1, background: T.gold }} />
            <span style={{ color: T.gold, fontSize: 11, letterSpacing: "0.2em", fontWeight: 600 }}>POSITIONS · CURATED BY VCX</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: T.bg, lineHeight: 1.25, margin: "0 0 20px", letterSpacing: "-1px", fontFamily: T.serif }}>
            ValueConnect이<br />직접 등록한 포지션
          </h1>
          <p style={{ fontSize: 15.5, color: "#b0a898", lineHeight: 1.9, maxWidth: 480 }}>
            공개 채용 공고가 아닙니다. ValueConnect가 기업과 직접 계약하고,<br />
            당신에게만 먼저 보여주는 포지션입니다.
          </p>
        </div>
      </div>

      {/* FILTER */}
      <div style={{ background: T.white, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px", display: "flex", gap: 0 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
              fontSize: 13.5, fontWeight: filter === f ? 700 : 400, color: filter === f ? T.dark : "#888",
              borderBottom: filter === f ? `2px solid ${T.gold}` : "2px solid transparent", fontFamily: T.sans,
            }}>{f}</button>
          ))}
        </div>
      </div>

      {/* POSITIONS LIST */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 48px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map(pos => (
            <div key={pos.id}>
              <PositionCard
                pos={pos}
                isOpen={openPos === pos.id}
                onToggle={() => setOpenPos(openPos === pos.id ? null : pos.id)}
                interest={interests[pos.id]}
                onInterest={(v) => setInterests(p => ({ ...p, [pos.id]: v }))}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PositionCard({ pos, isOpen, onToggle, interest, onInterest }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ background: T.white, border: `1px solid ${hovered && !isOpen ? "rgba(0,0,0,0.12)" : T.border}`, boxShadow: isOpen ? "0 4px 24px rgba(0,0,0,0.06)" : "none", transition: "all 0.18s" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {/* Header row */}
      <div onClick={onToggle} style={{ padding: "24px 28px", cursor: "pointer", display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Match score */}
        <div style={{ width: 52, height: 52, background: pos.score >= 90 ? "#f0faf5" : "#fafaf0", border: `1.5px solid ${pos.score >= 90 ? "#22c55e" : T.gold}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: pos.score >= 90 ? "#16a34a" : T.goldDeep, lineHeight: 1 }}>{pos.score}</span>
          <span style={{ fontSize: 9, color: T.light, letterSpacing: "0.05em" }}>MATCH</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 15.5, fontWeight: 800, color: T.dark, fontFamily: T.serif }}>{pos.company}</span>
            <span style={{ fontSize: 12, color: T.light }}>{pos.tag}</span>
            {pos.exclusive && <span style={{ fontSize: 10, padding: "2px 7px", background: T.dark, color: T.gold, fontWeight: 800, letterSpacing: "0.05em", borderRadius: 2 }}>EXCLUSIVE</span>}
            <span style={{ fontSize: 12, color: T.light, marginLeft: "auto" }}>{pos.posted}</span>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, color: T.dark, marginBottom: 10 }}>{pos.role}</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[{ icon: "📍", v: pos.location }, { icon: "📊", v: pos.level }, { icon: "💰", v: pos.salaryBand }].map(m => (
              <span key={m.v} style={{ fontSize: 12.5, color: T.light, display: "flex", alignItems: "center", gap: 4 }}>{m.icon} {m.v}</span>
            ))}
            {pos.tags.map(tag => <span key={tag} style={{ fontSize: 11.5, padding: "2px 9px", background: T.bg, border: `1px solid rgba(0,0,0,0.08)`, color: "#777", borderRadius: 100 }}>{tag}</span>)}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
          {interest === "bookmark" && <span style={{ fontSize: 13, color: T.gold }}>🔖</span>}
          <span style={{ fontSize: 12, color: "#ccc", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
        </div>
      </div>

      {/* Expanded detail */}
      {isOpen && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "28px 28px 28px 28px", background: "#fdfcf9" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            {/* Left */}
            <div>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, color: T.gold, letterSpacing: "0.15em", fontWeight: 700, marginBottom: 12 }}>POSITION SUMMARY</div>
                <p style={{ fontSize: 14, color: T.body, lineHeight: 1.85, margin: 0 }}>{pos.fullDesc}</p>
              </div>
              <div>
                <div style={{ fontSize: 10, color: T.light, letterSpacing: "0.15em", fontWeight: 700, marginBottom: 10 }}>주요 요건</div>
                {pos.reqs.map((req, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <div style={{ width: 4, height: 4, background: T.gold, flexShrink: 0, marginTop: 8, borderRadius: "50%" }} />
                    <span style={{ fontSize: 13.5, color: T.body, lineHeight: 1.65 }}>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Texture */}
            <div>
              <div style={{ fontSize: 10, color: T.light, letterSpacing: "0.15em", fontWeight: 700, marginBottom: 14 }}>이런 분을 찾습니다</div>
              {pos.texture.map((t, i) => (
                <div key={i} style={{ padding: "14px 18px", background: T.white, border: `1px solid rgba(0,0,0,0.07)`, marginBottom: 8, borderLeft: `3px solid ${T.gold}` }}>
                  <span style={{ fontSize: 13.5, color: T.dark, fontStyle: "italic", lineHeight: 1.6, fontFamily: T.serif }}>{t}</span>
                </div>
              ))}

              <div style={{ marginTop: 24, display: "flex", gap: 8 }}>
                <button onClick={() => onInterest(interest === "yes" ? null : "yes")} style={{
                  flex: 2, padding: "12px", background: interest === "yes" ? T.gold : T.dark, color: interest === "yes" ? T.dark : T.bg,
                  border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: T.sans, borderRadius: 4,
                }}>
                  {interest === "yes" ? "✓ 관심 있음" : "관심 있음 →"}
                </button>
                <button onClick={() => onInterest(interest === "bookmark" ? null : "bookmark")} style={{
                  flex: 1, padding: "12px", background: "transparent", border: `1px solid rgba(0,0,0,0.12)`,
                  fontSize: 14, color: "#888", cursor: "pointer", fontFamily: T.sans, borderRadius: 4,
                }}>
                  🔖 나중에
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CEO COFFEE CHAT PAGE (ENHANCED) ─────────────────────────────────────────
const CEO_SESSIONS = [
  { id: 1, name: "박지훈", title: "CEO & Co-founder", company: "Luminos AI", companyDesc: "엔터프라이즈 AI · Series B · 70명", avatar: "박", tags: ["AI Product", "B2B Enterprise", "Scale-up"], slots: 2, deadline: "4월 14일 마감", lookingFor: "AI 기반 엔터프라이즈 솔루션의 GTM을 새롭게 설계할 CRO 또는 VP of Sales 레벨의 분을 찾습니다. 단순한 세일즈가 아닌, 시장 자체를 새롭게 정의할 수 있는 분과 커피챗을 원합니다.", signal: "시장 재정의의 경험이 있는 분", applicants: 12 },
  { id: 2, name: "이미래", title: "Founder & CEO", company: "HealthOS", companyDesc: "디지털 헬스 · Series A · 40명", avatar: "이", tags: ["HealthTech", "Regulatory", "Product-Market Fit"], slots: 1, deadline: "4월 18일 마감", lookingFor: "헬스케어 규제 환경에서 제품을 시장에 안착시킨 경험이 있는 CPO를 찾습니다. 의료 도메인 이해와 빠른 실행력이 모두 필요한 자리입니다.", signal: "헬스케어 0-to-1 경험", applicants: 8 },
  { id: 3, name: "김도현", title: "CEO", company: "Veritrek", companyDesc: "Climate Tech · Pre-Series A · 25명", avatar: "김", tags: ["Climate", "Deep Tech", "Impact"], slots: 3, deadline: "4월 22일 마감", lookingFor: "기후 테크라는 새로운 영역에서 기술과 정책의 교차점에서 일할 용기 있는 분들을 만나고 싶습니다. 직군보다는 가치관이 맞는 분이 중요합니다.", signal: "임팩트에 대한 진정성", applicants: 5 },
];

function CEOCoffeeChatPage() {
  const [openSession, setOpenSession] = useState(null);
  const [appliedSessions, setAppliedSessions] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(null);
  const [applyMsg, setApplyMsg] = useState("");

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.sans }}>
      {/* HERO */}
      <div style={{ background: T.dark, padding: "64px 0 72px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 60% 100% at 80% 50%, rgba(201,168,76,0.06) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 28, height: 1, background: T.gold }} />
            <span style={{ color: T.gold, fontSize: 11, letterSpacing: "0.2em", fontWeight: 600 }}>CEO COFFEE CHAT · REVERSE RECRUITING</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: T.bg, lineHeight: 1.25, margin: "0 0 20px", letterSpacing: "-1px", fontFamily: T.serif }}>
            CEO가 먼저<br />손을 내밀었습니다
          </h1>
          <p style={{ fontSize: 15.5, color: "#b0a898", lineHeight: 1.9, maxWidth: 520 }}>
            채용 공고가 아닙니다. 의사결정자가 직접 만나고 싶은 사람의 조건을 공개하고,
            당신이 비공개로 신청하는 역방향 채용 구조입니다.
          </p>

          <div style={{ marginTop: 32, display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[{ label: "현재 열린 세션", val: CEO_SESSIONS.length + "건" }, { label: "총 신청자", val: CEO_SESSIONS.reduce((s, c) => s + c.applicants, 0) + "명" }, { label: "평균 선발률", val: "1/" + Math.round(CEO_SESSIONS.reduce((s, c) => s + c.applicants, 0) / CEO_SESSIONS.reduce((s, c) => s + c.slots, 0)) }].map(m => (
              <div key={m.label}>
                <div style={{ fontSize: 24, fontWeight: 800, color: T.gold, fontFamily: T.serif }}>{m.val}</div>
                <div style={{ fontSize: 12, color: "#888" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SESSIONS */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 48px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {CEO_SESSIONS.map(session => (
            <CEOSessionCard
              key={session.id}
              session={session}
              isOpen={openSession === session.id}
              onToggle={() => setOpenSession(openSession === session.id ? null : session.id)}
              isApplied={appliedSessions.includes(session.id)}
              onApply={() => setShowApplyModal(session)}
            />
          ))}
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div onClick={() => setShowApplyModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, width: "100%", maxWidth: 560, position: "relative" }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${T.gold}, ${T.goldDeep})` }} />
            <div style={{ padding: "32px 36px" }}>
              <button onClick={() => setShowApplyModal(null)} style={{ position: "absolute", top: 20, right: 24, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#aaa" }}>✕</button>
              <div style={{ fontSize: 12, color: T.light, marginBottom: 6 }}>{showApplyModal.company} · {showApplyModal.name} {showApplyModal.title}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", fontFamily: T.serif }}>커피챗 신청</h3>
              <div style={{ fontSize: 13, color: T.light, marginBottom: 24, padding: "10px 14px", background: "rgba(201,168,76,0.06)", border: `1px solid rgba(201,168,76,0.15)` }}>
                신청 내용은 CEO에게만 공개됩니다. HR 팀 경유 없이 직접 전달됩니다.
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, color: T.light, fontWeight: 600, display: "block", marginBottom: 8 }}>지원 동기 (선택)</label>
                <textarea value={applyMsg} onChange={e => setApplyMsg(e.target.value)} rows={5} placeholder={`${showApplyModal.name} CEO가 찾는 분과 내가 어떻게 연결되는지 간략히 써주세요.`} style={{ width: "100%", padding: "12px 14px", border: `1px solid rgba(0,0,0,0.12)`, fontSize: 14, resize: "none", outline: "none", lineHeight: 1.75, boxSizing: "border-box", fontFamily: T.sans, borderRadius: 4 }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowApplyModal(null)} style={{ flex: 1, padding: "13px", border: `1px solid rgba(0,0,0,0.12)`, background: "none", fontSize: 14, cursor: "pointer", borderRadius: 4, fontFamily: T.sans }}>취소</button>
                <button onClick={() => { setAppliedSessions(p => [...p, showApplyModal.id]); setShowApplyModal(null); setApplyMsg(""); }} style={{ flex: 2, padding: "13px", background: T.dark, color: T.bg, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 4, fontFamily: T.sans }}>
                  비공개로 신청하기 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CEOSessionCard({ session, isOpen, onToggle, isApplied, onApply }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ background: T.white, border: `1px solid ${hovered && !isOpen ? "rgba(0,0,0,0.12)" : T.border}`, boxShadow: isOpen ? "0 4px 24px rgba(0,0,0,0.07)" : "none", transition: "all 0.18s" }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div onClick={onToggle} style={{ padding: "24px 28px", cursor: "pointer", display: "flex", gap: 20, alignItems: "flex-start" }}>
        {/* Avatar */}
        <div style={{ width: 52, height: 52, background: T.dark, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ color: T.gold, fontSize: 18, fontWeight: 800, fontFamily: T.serif }}>{session.avatar}</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: T.dark, fontFamily: T.serif }}>{session.name}</span>
            <span style={{ fontSize: 13.5, color: T.body }}>{session.title}</span>
            <span style={{ fontSize: 12, color: T.light }}>·</span>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: T.dark }}>{session.company}</span>
            <span style={{ fontSize: 12, color: T.light }}>— {session.companyDesc}</span>
          </div>
          <div style={{ fontSize: 13, color: "#e85555", fontWeight: 600, marginBottom: 10 }}>⏰ {session.deadline} · 남은 자리 {session.slots}석</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {session.tags.map(tag => <span key={tag} style={{ fontSize: 11.5, padding: "2px 9px", background: T.bg, border: `1px solid rgba(0,0,0,0.08)`, color: "#777", borderRadius: 100 }}>{tag}</span>)}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {isApplied ? (
            <div style={{ padding: "8px 16px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#16a34a", fontSize: 13, fontWeight: 700, borderRadius: 4 }}>✓ 신청 완료</div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); onApply(); }} style={{ padding: "10px 20px", background: T.dark, color: T.bg, border: "none", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: T.sans, borderRadius: 4 }}>신청하기 →</button>
          )}
          <span style={{ fontSize: 12, color: T.light }}>{session.applicants}명 신청중</span>
        </div>
      </div>

      {/* Expanded */}
      {isOpen && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "24px 28px", background: "#fdfcf9" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
            <div>
              <div style={{ fontSize: 10, color: T.gold, letterSpacing: "0.15em", fontWeight: 700, marginBottom: 12 }}>CEO의 메시지</div>
              <p style={{ fontSize: 14, color: T.body, lineHeight: 1.85, margin: 0, fontStyle: "italic", fontFamily: T.serif }}>"{session.lookingFor}"</p>
            </div>
            <div>
              <div style={{ fontSize: 10, color: T.light, letterSpacing: "0.15em", fontWeight: 700, marginBottom: 12 }}>핵심 시그널</div>
              <div style={{ padding: "14px 18px", background: T.white, borderLeft: `3px solid ${T.gold}`, border: `1px solid rgba(0,0,0,0.07)` }}>
                <span style={{ fontSize: 13.5, color: T.dark }}>{session.signal}</span>
              </div>
              {!isApplied && (
                <button onClick={onApply} style={{ marginTop: 16, width: "100%", padding: "12px", background: T.dark, color: T.bg, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: T.sans, borderRadius: 4 }}>
                  비공개로 신청하기 →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PEER COFFEE CHAT PAGE (ENHANCED) ────────────────────────────────────────
const PEER_SESSIONS = [
  { id: 1, author: "익명 멤버 · Core", authorBadge: "Core", role: "CPO, Series C 스타트업", want: "딥테크 스타트업 BD 경험자", topic: "0→1 프로덕트 조직 구성 경험에 대한 이야기를 나누고 싶습니다. 특히 기술 조직과의 협업 구조를 어떻게 설계했는지 궁금합니다.", tags: ["Product", "Org Design", "0-to-1"], applicants: 4, posted: "1일 전" },
  { id: 2, author: "익명 멤버 · Core", authorBadge: "Core", role: "Partner, VC", want: "Series A-B 경험한 창업자/C-레벨", topic: "B2B SaaS 초기 GTM 전략에 대해 이야기 나눌 분을 찾습니다. 투자자 입장에서 무엇을 보는지, 창업자 관점에서 어떻게 대화하면 좋은지 양방향 인사이트가 목적입니다.", tags: ["VC", "GTM", "B2B SaaS"], applicants: 7, posted: "3일 전" },
  { id: 3, author: "익명 멤버 · Endorsed", authorBadge: "Endorsed", role: "Head of Engineering, 상장사", want: "ML/AI 인프라 경험자", topic: "레거시 시스템을 AI 기반으로 전환하는 과정에서 조직 저항을 어떻게 극복했는지, 비슷한 경험이 있는 EM이나 아키텍트와 이야기 나누고 싶습니다.", tags: ["Engineering", "AI Infra", "Change Mgmt"], applicants: 3, posted: "5일 전" },
];

function PeerCoffeeChatPage() {
  const [showWrite, setShowWrite] = useState(false);
  const [applied, setApplied] = useState([]);
  const [sessions, setSessions] = useState(PEER_SESSIONS);
  const [newSession, setNewSession] = useState({ want: "", topic: "", tags: "" });

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.sans }}>
      {/* HERO */}
      <div style={{ background: T.dark, padding: "64px 0 72px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 50%, rgba(201,168,76,0.05) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 28, height: 1, background: T.gold }} />
            <span style={{ color: T.gold, fontSize: 11, letterSpacing: "0.2em", fontWeight: 600 }}>PEER COFFEE CHAT · MEMBER-TO-MEMBER</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: T.bg, lineHeight: 1.25, margin: "0 0 20px", letterSpacing: "-1px", fontFamily: T.serif }}>
            같은 고도에서<br />나누는 대화
          </h1>
          <p style={{ fontSize: 15.5, color: "#b0a898", lineHeight: 1.9, maxWidth: 480 }}>
            멤버가 사연을 올리고 신청자를 직접 선택합니다.<br />
            채용으로 이어지면 VCX 소개 수수료가 적용됩니다.
          </p>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 48px 80px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
          <button onClick={() => setShowWrite(true)} style={{ padding: "11px 24px", background: T.dark, color: T.bg, border: "none", fontSize: 13.5, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontFamily: T.sans, borderRadius: 4 }}>
            ☕ 커피챗 사연 올리기
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {sessions.map(s => (
            <PeerSessionCard key={s.id} session={s} isApplied={applied.includes(s.id)} onApply={() => setApplied(p => [...p, s.id])} />
          ))}
        </div>
      </div>

      {/* Write Modal */}
      {showWrite && (
        <div onClick={() => setShowWrite(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: T.white, width: "100%", maxWidth: 560, position: "relative" }}>
            <div style={{ height: 3, background: `linear-gradient(90deg, ${T.gold}, ${T.goldDeep})` }} />
            <div style={{ padding: "32px 36px" }}>
              <button onClick={() => setShowWrite(false)} style={{ position: "absolute", top: 20, right: 24, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#aaa" }}>✕</button>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 24px", fontFamily: T.serif }}>커피챗 사연 올리기</h3>
              <div style={{ fontSize: 13, color: T.light, marginBottom: 20, padding: "12px 16px", background: T.bg, borderRadius: 4 }}>
                💡 사연을 올리면 멤버들이 신청을 보내옵니다. 당신이 직접 신청자를 선택합니다.
              </div>
              {[{ label: "어떤 분을 찾으시나요?", key: "want", ph: "예: 헬스케어 도메인 경험의 PM" }, { label: "이야기 나누고 싶은 주제", key: "topic", ph: "어떤 인사이트를 나누고 싶으신지 자유롭게..." }].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, color: T.light, fontWeight: 600, display: "block", marginBottom: 7 }}>{f.label}</label>
                  {f.key === "topic"
                    ? <textarea value={newSession[f.key]} onChange={e => setNewSession(p => ({ ...p, [f.key]: e.target.value }))} rows={4} placeholder={f.ph} style={{ width: "100%", padding: "11px 14px", border: `1px solid rgba(0,0,0,0.12)`, fontSize: 14, resize: "none", outline: "none", lineHeight: 1.75, boxSizing: "border-box", fontFamily: T.sans, borderRadius: 4 }} />
                    : <input value={newSession[f.key]} onChange={e => setNewSession(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} style={{ width: "100%", padding: "11px 14px", border: `1px solid rgba(0,0,0,0.12)`, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: T.sans, borderRadius: 4 }} />
                  }
                </div>
              ))}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setShowWrite(false)} style={{ flex: 1, padding: "13px", border: `1px solid rgba(0,0,0,0.12)`, background: "none", fontSize: 14, cursor: "pointer", borderRadius: 4, fontFamily: T.sans }}>취소</button>
                <button onClick={() => {
                  if (!newSession.want || !newSession.topic) return;
                  setSessions(p => [{ id: Date.now(), author: "나 (익명 Core)", authorBadge: "Core", role: "멤버", want: newSession.want, topic: newSession.topic, tags: newSession.tags.split(",").map(t => t.trim()).filter(Boolean), applicants: 0, posted: "방금" }, ...p]);
                  setShowWrite(false);
                  setNewSession({ want: "", topic: "", tags: "" });
                }} style={{ flex: 2, padding: "13px", background: T.dark, color: T.bg, border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", borderRadius: 4, fontFamily: T.sans }}>
                  사연 올리기 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PeerSessionCard({ session, isApplied, onApply }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ background: T.white, border: `1px solid ${hovered ? "rgba(0,0,0,0.12)" : T.border}`, padding: "24px 28px", transition: "all 0.18s", boxShadow: hovered ? "0 4px 20px rgba(0,0,0,0.05)" : "none" }}>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, padding: "2px 8px", background: session.authorBadge === "Core" ? T.dark : T.bg, color: session.authorBadge === "Core" ? T.gold : "#777", fontWeight: 700, letterSpacing: "0.05em", borderRadius: 2 }}>{session.authorBadge}</span>
            <span style={{ fontSize: 13, color: T.body, fontWeight: 600 }}>{session.role}</span>
            <span style={{ fontSize: 12, color: T.light }}>{session.posted}</span>
          </div>

          <div style={{ fontSize: 12, color: T.light, marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: T.dark }}>찾는 분:</span> {session.want}
          </div>
          <p style={{ fontSize: 14, color: T.body, lineHeight: 1.8, margin: "0 0 16px", fontStyle: "italic", fontFamily: T.serif }}>"{session.topic}"</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {session.tags.map(tag => <span key={tag} style={{ fontSize: 11.5, padding: "2px 9px", background: T.bg, border: `1px solid rgba(0,0,0,0.08)`, color: "#777", borderRadius: 100 }}>{tag}</span>)}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          {isApplied ? (
            <div style={{ padding: "8px 16px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#16a34a", fontSize: 13, fontWeight: 700, borderRadius: 4 }}>✓ 신청 완료</div>
          ) : (
            <button onClick={onApply} style={{ padding: "10px 20px", background: T.dark, color: T.bg, border: "none", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: T.sans, borderRadius: 4 }}>신청하기 →</button>
          )}
          <span style={{ fontSize: 12, color: T.light }}>{session.applicants}명 신청중</span>
        </div>
      </div>
    </div>
  );
}

// ─── SERVICE / MEMBERS / BENEFIT PAGES (condensed) ────────────────────────────
function ServicePage({ setActivePage }) {
  const blocks = [
    { num: "01", label: "CURATION FEED", title: "채용시장 큐레이션 피드", desc: "관심 분야를 등록하면 해당 시장의 핵심 포지션이 매주 자동으로 도착합니다. 딥테크, 핀테크, AI — 노이즈 없이 당신의 시장만.", insight: "Cold Start Hook: 네트워크가 작아도 개인적 가치가 즉시 발생하는 서비스를 먼저 만든다. 인재를 끌어오는 첫 번째 이유는 커뮤니티가 아니라, 그들이 혼자서도 가치를 느끼는 정보다.", icon: "◈", page: "feed" },
    { num: "02", label: "COMMUNITY LOUNGE", title: "커뮤니티 라운지", desc: "초대 전용 익명 커뮤니티. 익명이 솔직함을 만들고, 솔직함이 신뢰를 만든다. 이직 이야기, 리더십 고민, 연봉 협상 — 실명으로는 꺼내기 어려운 것들.", insight: "커뮤니티 없이는 최고 수준의 인재가 머물지 않는다. VCX의 커뮤니티는 채용의 수단이 아닌 목적 그 자체다.", icon: "◐", page: "lounge" },
    { num: "03", label: "CEO COFFEE CHAT", title: "의사결정자와의 직접 채널", desc: "CEO가 먼저 손을 내밉니다. 채용 공고가 담지 못하는 것 — 조직의 언어, 리더십의 결, 암묵적 기대치. 역방향 채용 구조.", insight: "정보 비대칭은 채용 시장의 근본 문제다. CEO 커피챗은 이 비대칭을 가장 효율적으로 해소하는 구조다.", icon: "◎", page: "ceo" },
    { num: "04", label: "PEER COFFEE CHAT", title: "같은 고도의 대화", desc: "멤버가 사연을 올리고 신청자를 직접 선택하는 P2P 네트워킹. 채용으로 이어지면 VCX 소개 수수료가 적용됩니다.", insight: "Granovetter의 약한 연결 이론 — 정보 격차를 좁히는 것은 '아는 사람'이 아닌 '잘 모르지만 연결된 사람'에서 온다.", icon: "◉", page: "coffeechat" },
    { num: "05", label: "POSITION BOARD", title: "큐레이션 채용 포지션", desc: "ValueConnect가 기업과 직접 계약한 포지션만 게시됩니다. 공개 채용 공고가 아닌, 당신에게만 먼저 보여주는 포지션.", insight: "정보 과부하의 시대에 진짜 희소 자원은 '좋은 필터'다. 스펙이 아닌 결(texture)로 선별되는 포지션은 의사결정의 질을 바꾼다.", icon: "◫", page: "positions" },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.sans }}>
      {/* HERO */}
      <div style={{ background: T.dark, padding: "80px 0 88px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 70% 50%, rgba(201,168,76,0.05) 0%, transparent 100%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 28, height: 1, background: T.gold }} />
            <span style={{ color: T.gold, fontSize: 11, letterSpacing: "0.2em", fontWeight: 600 }}>VALUECONNECT X · PRIVATE NETWORK</span>
          </div>
          <h1 style={{ fontSize: "clamp(36px,5vw,60px)", fontWeight: 800, color: T.bg, lineHeight: 1.2, margin: "0 0 28px", letterSpacing: "-1.5px", fontFamily: T.serif }}>
            시대의 인재를 모읍니다
          </h1>
          <div style={{ borderLeft: `2px solid ${T.goldDeep}`, paddingLeft: 24, maxWidth: 640 }}>
            <p style={{ fontSize: 16, lineHeight: 1.9, color: "#b0a898", margin: 0 }}>
              회사에 한 명 있을까 말까 한 사람들이 모이는 곳.<br />
              채용정보 큐레이션으로 유입하고, 커뮤니티 라운지로 머물게 하고,<br />
              CEO Coffee Chat으로 연결한다.
            </p>
          </div>

          <div style={{ marginTop: 40, display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[{ v: "초대 전용", l: "Invite-Only Network" }, { v: "25%", l: "성사 수수료 구조" }, { v: "CEO Direct", l: "HR 경유 없는 채용" }].map(m => (
              <div key={m.l} style={{ borderLeft: `1px solid rgba(201,168,76,0.3)`, paddingLeft: 16 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: T.gold, fontFamily: T.serif, lineHeight: 1 }}>{m.v}</div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SERVICE BLOCKS */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 48px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "#aaa" }}>FIVE PILLARS</span>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {blocks.map((b, i) => <ServiceBlock key={b.num} b={b} i={i} setActivePage={setActivePage} />)}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 80, padding: "48px", background: T.dark, position: "relative", overflow: "hidden", borderRadius: 4 }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: "100%", background: "linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.05) 100%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 20, height: 1, background: T.gold }} />
            <span style={{ fontSize: 10, color: T.gold, letterSpacing: "0.18em" }}>OUR THESIS</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: T.bg, lineHeight: 1.6, maxWidth: 680, letterSpacing: "-0.3px", margin: "0 0 28px", fontFamily: T.serif }}>
            "지금 가장 중요한 것은 30명을 모으는 것이 아니라,<br />30명이 머무는 이유를 설계하는 것이다."
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setActivePage("feed")} style={{ padding: "13px 28px", background: T.gold, color: T.dark, border: "none", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: T.sans, borderRadius: 4 }}>큐레이션 피드 보기 →</button>
            <button onClick={() => setActivePage("members")} style={{ padding: "13px 28px", background: "transparent", color: T.gold, border: `1px solid rgba(201,168,76,0.4)`, fontSize: 13.5, cursor: "pointer", fontFamily: T.sans, borderRadius: 4 }}>멤버 소개 보기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceBlock({ b, i, setActivePage }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={() => setActivePage(b.page)}
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: `1px solid rgba(0,0,0,0.07)`, background: hovered ? T.bgAlt : "transparent", transition: "background 0.2s", cursor: "pointer" }}>
      <div style={{ padding: "48px 48px 48px 0", borderRight: `1px solid rgba(0,0,0,0.07)` }}>
        <div style={{ fontSize: 10, color: T.gold, letterSpacing: "0.15em", marginBottom: 8, fontWeight: 600 }}>{b.num} · {b.label}</div>
        <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.3, margin: "0 0 16px", fontFamily: T.serif }}>{b.title}</h3>
        <p style={{ fontSize: 14.5, color: T.body, lineHeight: 1.85, margin: "0 0 20px" }}>{b.desc}</p>
        <span style={{ fontSize: 13, color: T.gold, fontWeight: 600 }}>자세히 보기 →</span>
      </div>
      <div style={{ padding: "48px 0 48px 48px", display: "flex", alignItems: "center" }}>
        <div style={{ borderLeft: `2px solid rgba(201,168,76,0.3)`, paddingLeft: 24 }}>
          <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.18em", marginBottom: 10, fontWeight: 600 }}>INSIGHT</div>
          <p style={{ fontSize: 13.5, color: "#777", lineHeight: 1.85, fontStyle: "italic", margin: 0, fontFamily: T.serif }}>{b.insight}</p>
          <div style={{ marginTop: 16 }}>
            <span style={{ fontSize: 22, color: hovered ? T.gold : "#ccc", transition: "color 0.2s" }}>{b.icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MembersPage() {
  const members = [
    { id: 1, name: "김준혁", role: "Partner, Sequoia Korea", field: "Venture Capital · Growth Strategy", avatar: "김", joined: "2024.11", intro: "20년간 B2B SaaS와 딥테크 분야에서 투자와 운영을 병행해왔습니다. 스타트업이 시장을 재설계하는 순간을 함께하는 것이 제 일의 본질입니다.", tags: ["B2B SaaS", "DeepTech", "Series A-C"], badge: "Core" },
    { id: 2, name: "이서연", role: "CPO, Toss", field: "Product · FinTech · UX Strategy", avatar: "이", joined: "2024.12", intro: "사용자 행동에서 시스템의 결함을 읽어내는 것이 제 강점입니다. 좋은 제품은 결국 사람에 대한 깊은 이해에서 시작된다고 믿습니다.", tags: ["Product Strategy", "FinTech", "0-to-1"], badge: "Core" },
    { id: 3, name: "박민준", role: "General Counsel, Kakao", field: "Tech Law · Regulatory · M&A", avatar: "박", joined: "2025.01", intro: "규제 환경이 빠르게 변화하는 시대, 법과 기술의 교차점에서 기업의 성장 경로를 설계합니다.", tags: ["AI Regulation", "M&A", "Data Governance"], badge: "Core" },
    { id: 4, name: "정유진", role: "VP of Engineering, Krafton", field: "Engineering · Game · Scale", avatar: "정", joined: "2025.02", intro: "수백 명의 엔지니어링 조직을 이끌면서 깨달은 것은, 기술보다 사람을 이해하는 것이 리더의 핵심 역량이라는 점입니다.", tags: ["Engineering Leadership", "Game", "Platform"], badge: "Endorsed" },
  ];
  const [search, setSearch] = useState("");
  const filtered = members.filter(m => m.name.includes(search) || m.role.includes(search) || m.tags.join().includes(search));

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.sans }}>
      <div style={{ background: T.dark, padding: "64px 0 72px", position: "relative" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 28, height: 1, background: T.gold }} />
            <span style={{ color: T.gold, fontSize: 11, letterSpacing: "0.2em", fontWeight: 600 }}>MEMBERS · CORE NETWORK</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: T.bg, lineHeight: 1.25, margin: "0 0 20px", letterSpacing: "-1px", fontFamily: T.serif }}>멤버 소개</h1>
          <p style={{ fontSize: 15.5, color: "#b0a898", lineHeight: 1.9, maxWidth: 540 }}>
            모든 시대에는 자신이 속한 <em>장(場, field)</em>을 먼저 읽어내는 사람들이 있다.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 48px 80px" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 직군, 키워드로 검색..." style={{ width: "100%", padding: "13px 18px", background: T.white, border: `1px solid rgba(0,0,0,0.1)`, fontSize: 14, outline: "none", marginBottom: 28, boxSizing: "border-box", fontFamily: T.sans, borderRadius: 4 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filtered.map(m => (
            <div key={m.id} style={{ background: T.white, border: `1px solid ${T.border}`, padding: "24px 28px", display: "flex", gap: 20 }}>
              <div style={{ width: 52, height: 52, background: T.dark, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ color: T.gold, fontSize: 18, fontWeight: 800, fontFamily: T.serif }}>{m.avatar}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: T.dark, fontFamily: T.serif }}>{m.name}</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: m.badge === "Core" ? T.dark : T.bg, color: m.badge === "Core" ? T.gold : "#777", fontWeight: 700, letterSpacing: "0.05em", borderRadius: 2 }}>{m.badge}</span>
                  <span style={{ fontSize: 12, color: T.light, marginLeft: "auto" }}>가입 {m.joined}</span>
                </div>
                <div style={{ fontSize: 13.5, color: T.body, marginBottom: 10 }}>{m.role} · {m.field}</div>
                <p style={{ fontSize: 14, color: T.body, lineHeight: 1.8, margin: "0 0 12px", fontStyle: "italic", fontFamily: T.serif }}>"{m.intro}"</p>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {m.tags.map(tag => <span key={tag} style={{ fontSize: 11.5, padding: "2px 9px", background: T.bg, border: `1px solid rgba(0,0,0,0.08)`, color: "#777", borderRadius: 100 }}>{tag}</span>)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BenefitPage() {
  const tiers = [
    {
      name: "Core", color: T.dark, textColor: T.gold, desc: "최상위 검증 멤버. ValueConnect가 직접 인증한 핵심인재.",
      benefits: ["채용정보 큐레이션 피드 (주 1회)", "커뮤니티 라운지 전체 접근", "CEO Coffee Chat 신청 권한", "Peer Coffee Chat 생성 & 신청", "멤버 디렉터리 전체 열람", "AI Match Engine 우선 매칭", "성사 시 Self Referral 보상"],
    },
    {
      name: "Endorsed", color: "#f7f5f0", textColor: T.dark, desc: "Core 멤버가 보증한 준회원. 단계적으로 Core로 전환됩니다.",
      benefits: ["채용정보 큐레이션 피드 (주 1회)", "커뮤니티 라운지 읽기 + 댓글", "CEO Coffee Chat 읽기", "Peer Coffee Chat 신청", "멤버 디렉터리 부분 열람", "Core 추천 시 등급 전환 검토"],
    },
  ];

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: T.sans }}>
      <div style={{ background: T.dark, padding: "64px 0 72px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 28, height: 1, background: T.gold }} />
            <span style={{ color: T.gold, fontSize: 11, letterSpacing: "0.2em", fontWeight: 600 }}>MEMBERSHIP · BENEFIT</span>
          </div>
          <h1 style={{ fontSize: "clamp(28px,4vw,46px)", fontWeight: 800, color: T.bg, lineHeight: 1.25, margin: "0 0 20px", letterSpacing: "-1px", fontFamily: T.serif }}>멤버십 혜택</h1>
          <p style={{ fontSize: 15.5, color: "#b0a898", lineHeight: 1.9, maxWidth: 500 }}>
            네트워크의 질은 구성원의 질을 초과할 수 없다.<br />두 개의 등급, 하나의 기준 — 탁월함.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "48px 48px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {tiers.map(tier => (
            <div key={tier.name} style={{ background: tier.color, padding: "36px", border: `1px solid ${tier.name === "Core" ? T.dark : T.border}`, borderRadius: 4 }}>
              <div style={{ fontSize: 12, letterSpacing: "0.2em", color: tier.name === "Core" ? T.gold : T.light, fontWeight: 700, marginBottom: 8 }}>{tier.name.toUpperCase()} MEMBER</div>
              <p style={{ fontSize: 13.5, color: tier.name === "Core" ? "#b0a898" : T.body, lineHeight: 1.7, margin: "0 0 28px" }}>{tier.desc}</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {tier.benefits.map((b, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 16, height: 16, background: tier.textColor, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 }}>
                      <span style={{ fontSize: 9, color: tier.name === "Core" ? T.dark : T.white, fontWeight: 800 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 13.5, color: tier.name === "Core" ? "#ddd" : T.body, lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Reward structure */}
        <div style={{ marginTop: 40, padding: "36px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 4 }}>
          <div style={{ fontSize: 11, color: T.light, letterSpacing: "0.15em", fontWeight: 600, marginBottom: 20 }}>REWARD STRUCTURE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { type: "성사 수수료", who: "기업 → VCX", val: "연봉의 25%", desc: "채용 성사 시 기업이 지불" },
              { type: "Self Referral", who: "VCX → 멤버", val: "고정 보상", desc: "본인 직접 추천 성사 시" },
              { type: "Peer Referral", who: "VCX → 추천 멤버", val: "높은 보상", desc: "동료 추천 성사 시 (소싱·보증 노력 반영)" },
            ].map(r => (
              <div key={r.type} style={{ padding: "20px", background: T.bg, borderRadius: 4 }}>
                <div style={{ fontSize: 11, color: T.light, fontWeight: 600, marginBottom: 6 }}>{r.type}</div>
                <div style={{ fontSize: 11, color: T.light, marginBottom: 8 }}>{r.who}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: T.gold, fontFamily: T.serif, marginBottom: 6 }}>{r.val}</div>
                <div style={{ fontSize: 12, color: T.light, lineHeight: 1.5 }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function VCXApp() {
  const [activePage, setActivePage] = useState("service");

  const renderPage = () => {
    switch (activePage) {
      case "service": return <ServicePage setActivePage={setActivePage} />;
      case "members": return <MembersPage />;
      case "benefit": return <BenefitPage />;
      case "feed": return <CurationFeedPage />;
      case "lounge": return <CommunityLoungePage />;
      case "positions": return <PositionsPage />;
      case "ceo": return <CEOCoffeeChatPage />;
      case "coffeechat": return <PeerCoffeeChatPage />;
      default: return <ServicePage setActivePage={setActivePage} />;
    }
  };

  return (
    <div style={{ fontFamily: T.sans }}>
      <GNB activePage={activePage} setActivePage={setActivePage} />
      {renderPage()}
    </div>
  );
}