import { useState, useRef, useEffect } from "react";

// ─── SHARED GNB ──────────────────────────────────────────────────────────────
function GNB({ activePage, setActivePage }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef(null);

  const submenus = [
    { key: "service", label: "서비스 소개" },
    { key: "members", label: "멤버 소개" },
    { key: "benefit", label: "Benefit" },
  ];

  const topMenus = [
    { key: "service-group", label: "서비스 소개", hasDropdown: true },
    { key: "coffeechat", label: "커피챗 신청" },
    { key: "ceo", label: "CEO Coffeechat" },
    { key: "board", label: "익명 게시판" },
    { key: "positions", label: "채용 포지션" },
  ];

  const isServiceActive = ["service", "members", "benefit"].includes(activePage);

  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <nav style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 48px", height: 60, background: "#f0ebe2",
      borderBottom: "1px solid rgba(0,0,0,0.08)", position: "sticky", top: 0, zIndex: 200,
    }}>
      <div
        onClick={() => setActivePage("service")}
        style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.5px", cursor: "pointer", userSelect: "none" }}
      >
        ValueConnect <span style={{ color: "#c9a84c" }}>X</span>
      </div>

      <div style={{ display: "flex", gap: 32, fontSize: 13.5, alignItems: "center" }}>
        {/* 서비스 소개 드롭다운 */}
        <div ref={dropRef} style={{ position: "relative" }}>
          <span
            onClick={() => setDropdownOpen(v => !v)}
            style={{
              cursor: "pointer",
              color: isServiceActive ? "#1a1a1a" : "#555",
              fontWeight: isServiceActive ? 600 : 400,
              borderBottom: isServiceActive ? "1.5px solid #c9a84c" : "none",
              paddingBottom: 2,
              display: "flex", alignItems: "center", gap: 5, userSelect: "none",
            }}
          >
            서비스 소개
            <span style={{
              fontSize: 9, color: isServiceActive ? "#c9a84c" : "#aaa",
              transform: dropdownOpen ? "rotate(180deg)" : "none",
              transition: "transform 0.2s", display: "inline-block",
            }}>▾</span>
          </span>

          {dropdownOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 12px)", left: "50%",
              transform: "translateX(-50%)",
              background: "#fff", border: "1px solid rgba(0,0,0,0.1)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.12)", minWidth: 160, zIndex: 300,
              overflow: "hidden",
            }}>
              {/* top accent line */}
              <div style={{ height: 2, background: "#c9a84c" }} />
              {submenus.map((s, i) => (
                <div
                  key={s.key}
                  onClick={() => { setActivePage(s.key); setDropdownOpen(false); }}
                  style={{
                    padding: "13px 20px", fontSize: 13, cursor: "pointer",
                    color: activePage === s.key ? "#1a1a1a" : "#666",
                    fontWeight: activePage === s.key ? 700 : 400,
                    background: activePage === s.key ? "#faf8f4" : "#fff",
                    borderBottom: i < submenus.length - 1 ? "1px solid rgba(0,0,0,0.06)" : "none",
                    transition: "background 0.12s",
                    display: "flex", alignItems: "center", gap: 8,
                    fontFamily: "'Georgia', serif",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#faf8f4"}
                  onMouseLeave={e => e.currentTarget.style.background = activePage === s.key ? "#faf8f4" : "#fff"}
                >
                  {activePage === s.key && <div style={{ width: 3, height: 14, background: "#c9a84c", flexShrink: 0 }} />}
                  {s.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {["커피챗 신청", "CEO Coffeechat", "익명 게시판", "채용 포지션"].map((label) => (
          <span key={label} style={{ cursor: "pointer", color: "#555" }}>{label}</span>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <span style={{ fontSize: 13.5, color: "#666", cursor: "pointer" }}>로그인</span>
        <button style={{ background: "#1a1a1a", color: "#f0ebe2", border: "none", padding: "8px 18px", fontSize: 13, cursor: "pointer", letterSpacing: "0.02em" }}>
          회원가입 →
        </button>
      </div>
    </nav>
  );
}

// ─── PAGE 1: 서비스 소개 ──────────────────────────────────────────────────────
function ServicePage({ setActivePage }) {
  const services = [
    {
      num: "01",
      label: "CORE DIRECTORY",
      title: "폐쇄형 핵심인재 네트워크",
      desc: "사회적 자본(social capital)은 누구에게나 균등하게 분배되지 않는다. ValueConnect X는 검증된 핵심인재들만 입장할 수 있는 폐쇄형 구조를 통해, 네트워크 자체가 신호(signal)로 기능하는 공간을 만든다.",
      insight: "Granovetter의 약한 연결 이론은, 정보 격차를 좁히는 것이 '아는 사람'이 아닌 '잘 모르지만 연결된 사람'에서 온다는 것을 증명한다. VCX는 그 약한 연결을 밀도 있게 설계한다.",
      icon: "◈",
    },
    {
      num: "02",
      label: "AI MATCH ENGINE",
      title: "LLM 기반 포지션 큐레이션",
      desc: "월 최대 2건, AI 매치 스코어 80점 이상의 포지션만 발송된다. 노이즈 없는 채용 경험 — 당신이 원하는 포지션 3문장으로 설명하면, AI가 조직 문화, 레벨, 역할 적합성까지 분석한다.",
      insight: "정보 과부하(information overload)의 시대에 진짜 희소 자원은 '좋은 필터'다. 스펙이 아닌 결(texture)로 선별되는 포지션은 의사결정의 질을 근본적으로 바꾼다.",
      icon: "◉",
    },
    {
      num: "03",
      label: "CEO COFFEE CHAT",
      title: "의사결정자와의 직접 채널",
      desc: "채용 공고가 담지 못하는 것들 — 조직의 언어, 리더십의 결, 암묵적 기대치. CEO가 직접 만나고 싶은 사람의 프로필을 공개하고, 멤버가 비공개로 신청하는 역방향 채용 구조.",
      insight: "정보 비대칭(information asymmetry)은 채용 시장의 근본 문제다. 양측 모두 서로에 대해 불완전한 정보를 가진 채 결정을 내린다. CEO 커피챗은 이 비대칭을 가장 효율적으로 해소하는 구조다.",
      icon: "◎",
    },
    {
      num: "04",
      label: "ANONYMOUS BOARD",
      title: "익명 기반 신뢰 커뮤니티",
      desc: "커리어의 고민, 연봉 협상의 불안, 조직 내 갈등 — 실명으로는 말할 수 없는 것들이 있다. 익명이지만 멤버 인증된 공간에서, 평가 없이 집단 지성이 작동한다.",
      insight: "Goffman의 인상 관리(impression management) 이론은 왜 사람들이 자신의 취약함을 숨기는지 설명한다. 구조적 익명성은 그 방어막을 낮춰 진짜 대화를 가능하게 하는 유일한 장치다.",
      icon: "◐",
    },
    {
      num: "05",
      label: "PEER COFFEECHAT",
      title: "동질적 역량, 이질적 시각",
      desc: "같은 수준의 역량을 가진 사람들 사이에서, 서로 다른 산업과 함수의 경험이 교차하는 공간. 사연을 올리면 비밀 댓글로 신청받고, 작성자가 직접 선택하는 P2P 연결.",
      insight: "동질적 집단(homophily)은 편안하지만 새로운 정보를 차단한다. VCX의 커피챗은 역량의 동질성과 관점의 이질성을 동시에 확보하는 드문 설계다.",
      icon: "◑",
    },
  ];

  return (
    <div style={{ background: "#f0ebe2", minHeight: "100vh" }}>
      {/* HERO */}
      <div style={{ background: "#1a1a1a", padding: "80px 0 88px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 70% 50%, rgba(201,168,76,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 32, height: 1.5, background: "#c9a84c" }} />
            <span style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.22em", fontFamily: "sans-serif", fontWeight: 600 }}>SERVICE OVERVIEW · SOCIOLOGY OF NETWORKS</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 80, alignItems: "end" }}>
            <div>
              <h1 style={{ fontSize: "clamp(38px, 5vw, 58px)", fontWeight: 800, color: "#f0ebe2", lineHeight: 1.15, letterSpacing: "-2px", margin: "0 0 32px" }}>
                장(場)을 이해하는<br />
                <span style={{ color: "#c9a84c", fontStyle: "italic" }}>사람들의 플랫폼</span>
              </h1>
              <div style={{ borderLeft: "2px solid #c9a84c", paddingLeft: 24 }}>
                <p style={{ fontSize: 15, lineHeight: 1.9, color: "#b0a898", margin: "0 0 14px" }}>
                  Pierre Bourdieu는 사회적 삶을 <span style={{ color: "#e8d5a3", fontStyle: "italic" }}>장(field)</span>으로 설명했다. 각 장에는 고유한 규칙이 있고, 그 규칙을 내면화한 사람만이 진정한 플레이어가 된다.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.9, color: "#b0a898", margin: 0 }}>
                  커리어라는 장 역시 마찬가지다. 스펙은 입장권이지만, <span style={{ color: "#e8d5a3" }}>자본(capital)을 가진 사람들과의 연결</span>이 실제 게임을 결정한다.
                </p>
              </div>
            </div>

            <div style={{ paddingBottom: 8 }}>
              <div style={{ fontSize: 11, color: "#666", letterSpacing: "0.15em", fontFamily: "sans-serif", marginBottom: 20 }}>WHY THIS EXISTS</div>
              {[
                { label: "한국 시니어 인재의 커리어 토론 부재", stat: "91%" },
                { label: "헤드헌팅 접촉에서 비관련 연락 비율", stat: "78%" },
                { label: "CEO-후보자 첫 만남 전 정보 비대칭", stat: "높음" },
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 13, color: "#888" }}>{item.label}</span>
                  <span style={{ fontSize: 20, fontWeight: 800, color: "#c9a84c", letterSpacing: "-0.5px" }}>{item.stat}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SERVICES */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 48px 100px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 56 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
          <span style={{ fontSize: 10, letterSpacing: "0.2em", color: "#aaa", fontFamily: "sans-serif" }}>FIVE PILLARS</span>
          <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {services.map((svc, i) => (
            <ServiceBlock key={svc.num} svc={svc} idx={i} />
          ))}
        </div>

        {/* CLOSING */}
        <div style={{ marginTop: 80, padding: "48px", background: "#1a1a1a", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 300, height: "100%", background: "linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.05) 100%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 20, height: 1, background: "#c9a84c" }} />
            <span style={{ fontSize: 10, color: "#c9a84c", letterSpacing: "0.18em", fontFamily: "sans-serif" }}>OUR THESIS</span>
          </div>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#f0ebe2", lineHeight: 1.6, maxWidth: 680, letterSpacing: "-0.3px", margin: "0 0 24px" }}>
            "네트워크의 질은 구성원의 질을 초과할 수 없다. 하지만 올바른 구조가 주어진다면, 개인의 자본이 집단의 자본으로 전환된다."
          </p>
          <div style={{ display: "flex", gap: 16 }}>
            <button
              onClick={() => setActivePage("members")}
              style={{ padding: "12px 28px", background: "#c9a84c", color: "#1a1a1a", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", fontFamily: "inherit" }}
            >멤버 소개 보기 →</button>
            <button
              onClick={() => setActivePage("benefit")}
              style={{ padding: "12px 28px", background: "transparent", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.4)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >멤버 혜택 확인하기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceBlock({ svc, idx }) {
  const [hovered, setHovered] = useState(false);
  const isEven = idx % 2 === 0;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "grid", gridTemplateColumns: isEven ? "1fr 1fr" : "1fr 1fr",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        background: hovered ? "#ebe5da" : "transparent",
        transition: "background 0.2s",
      }}
    >
      {/* LEFT */}
      <div style={{ padding: "48px 48px 48px 0", borderRight: "1px solid rgba(0,0,0,0.07)" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div>
            <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: "0.15em", fontFamily: "sans-serif", marginBottom: 6 }}>{svc.num} · {svc.label}</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.3, margin: "0 0 16px" }}>{svc.title}</h3>
            <p style={{ fontSize: 14.5, color: "#555", lineHeight: 1.85, margin: 0 }}>{svc.desc}</p>
          </div>
        </div>
      </div>

      {/* RIGHT — sociological insight */}
      <div style={{ padding: "48px 0 48px 48px", display: "flex", alignItems: "center" }}>
        <div style={{ borderLeft: "2px solid rgba(201,168,76,0.3)", paddingLeft: 24 }}>
          <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.18em", fontFamily: "sans-serif", marginBottom: 10 }}>SOCIOLOGICAL LENS</div>
          <p style={{ fontSize: 13.5, color: "#777", lineHeight: 1.85, fontStyle: "italic", margin: 0 }}>{svc.insight}</p>
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 22, color: hovered ? "#c9a84c" : "#ccc", transition: "color 0.2s" }}>{svc.icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PAGE 2: 멤버 소개 (imported from existing) ───────────────────────────────
const MEMBERS = [
  { id: 1, name: "김준혁", role: "Partner, Sequoia Korea", field: "Venture Capital · Growth Strategy", avatar: "김", joined: "2024.11", intro: "20년간 B2B SaaS와 딥테크 분야에서 투자와 운영을 병행해왔습니다. 스타트업이 시장을 재설계하는 순간을 함께하는 것이 제 일의 본질입니다. 같은 언어로 대화할 수 있는 분들과 연결되고 싶습니다.", tags: ["B2B SaaS", "DeepTech", "Series A-C"], reactions: [{ emoji: "🤝", count: 12 }, { emoji: "🔥", count: 8 }, { emoji: "💡", count: 15 }], comments: [{ author: "이서연", avatar: "이", text: "투자 철학이 인상적입니다. 언제 커피 한 잔 어떨까요?", time: "2일 전" }] },
  { id: 2, name: "이서연", role: "CPO, Toss", field: "Product · FinTech · UX Strategy", avatar: "이", joined: "2024.12", intro: "사용자 행동에서 시스템의 결함을 읽어내는 것이 제 강점입니다. 좋은 제품은 결국 사람에 대한 깊은 이해에서 시작된다고 믿습니다.", tags: ["Product Strategy", "FinTech", "0-to-1"], reactions: [{ emoji: "🤝", count: 24 }, { emoji: "✨", count: 19 }, { emoji: "💡", count: 11 }], comments: [] },
  { id: 3, name: "박민준", role: "General Counsel, Kakao", field: "Tech Law · Regulatory · M&A", avatar: "박", joined: "2025.01", intro: "규제 환경이 빠르게 변화하는 시대, 법과 기술의 교차점에서 기업의 성장 경로를 설계합니다. AI, 데이터 거버넌스, 플랫폼 규제를 주로 다루고 있습니다.", tags: ["AI Regulation", "M&A", "Data Governance"], reactions: [{ emoji: "🤝", count: 9 }, { emoji: "🧠", count: 14 }], comments: [] },
];

const EMOJI_OPTIONS = ["🤝", "🔥", "💡", "✨", "🧠", "⚖️", "🌱", "🎯", "💎", "🚀"];

function MembersPage() {
  const [search, setSearch] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [members, setMembers] = useState(MEMBERS);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [newIntro, setNewIntro] = useState({ name: "", role: "", field: "", intro: "", tags: "" });

  const filtered = members.filter(m =>
    m.name.includes(search) || m.role.includes(search) || m.tags.join().includes(search)
  );

  const addReaction = (memberId, emoji) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      if (existing) return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
      return { ...m, reactions: [...m.reactions, { emoji, count: 1 }] };
    }));
    setShowEmojiPicker(null);
  };

  const addComment = (memberId) => {
    const text = commentInput[memberId];
    if (!text?.trim()) return;
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      return { ...m, comments: [...m.comments, { author: "나", avatar: "나", text, time: "방금" }] };
    }));
    setCommentInput(prev => ({ ...prev, [memberId]: "" }));
  };

  return (
    <div style={{ background: "#f5f0e8", minHeight: "100vh", fontFamily: "'Georgia', serif" }}>
      {/* HERO */}
      <div style={{ background: "#1a1a1a", padding: "72px 0 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 500, height: "100%", background: "linear-gradient(135deg, transparent 60%, rgba(184,144,42,0.07) 100%)", pointerEvents: "none" }} />
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 28, height: 1, background: "#b8902a" }} />
            <span style={{ color: "#b8902a", fontSize: 11, letterSpacing: "0.18em", fontWeight: 600, fontFamily: "sans-serif" }}>MEMBERS · CORE NETWORK</span>
          </div>
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: "#f5f0e8", lineHeight: 1.2, marginBottom: 32, letterSpacing: "-1px" }}>멤버 소개</h1>
          <div style={{ borderLeft: "2px solid #b8902a", paddingLeft: 24, maxWidth: 720 }}>
            <p style={{ fontSize: 15, lineHeight: 1.9, color: "#c8bfaf" }}>
              모든 시대에는 자신이 속한 <span style={{ color: "#e8d5a3", fontStyle: "italic" }}>장(場, field)</span>을 먼저 읽어내는 사람들이 있다. ValueConnect X는 그런 사람들의 <span style={{ color: "#e8d5a3" }}>사회적 자본이 실질적인 기회로 전환되는 공간</span>이다.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH + LIST */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 48px 80px" }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="이름, 직군, 키워드로 검색..." style={{ width: "100%", padding: "12px 48px 12px 16px", background: "#fff", border: "1px solid #e0d9ce", borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#aaa" }}>🔍</span>
          </div>
          <button onClick={() => setShowWriteModal(true)} style={{ background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>+ 내 소개 작성</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {filtered.map(member => (
            <MemberCard
              key={member.id}
              member={member}
              isOpen={activeCard === member.id}
              onToggle={() => setActiveCard(activeCard === member.id ? null : member.id)}
              onReact={(emoji) => addReaction(member.id, emoji)}
              onComment={() => addComment(member.id)}
              commentInput={commentInput[member.id] || ""}
              onCommentChange={(val) => setCommentInput(prev => ({ ...prev, [member.id]: val }))}
              showEmojiPicker={showEmojiPicker === member.id}
              onToggleEmoji={() => setShowEmojiPicker(showEmojiPicker === member.id ? null : member.id)}
              emojiOptions={EMOJI_OPTIONS}
            />
          ))}
        </div>
      </div>

      {showWriteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#f5f0e8", borderRadius: 12, padding: 40, width: "100%", maxWidth: 580, position: "relative" }}>
            <button onClick={() => setShowWriteModal(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24 }}>내 소개 남기기</h3>
            {[{ label: "이름", key: "name", placeholder: "실명" }, { label: "직함 / 소속", key: "role", placeholder: "CPO, Kakao" }, { label: "전문 분야", key: "field", placeholder: "Product · FinTech" }, { label: "태그", key: "tags", placeholder: "B2B SaaS, Series A" }].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 600 }}>{f.label}</label>
                <input value={newIntro[f.key]} onChange={e => setNewIntro(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, boxSizing: "border-box", outline: "none" }} />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 5, fontWeight: 600 }}>자기소개</label>
              <textarea value={newIntro.intro} onChange={e => setNewIntro(p => ({ ...p, intro: e.target.value }))} rows={4} placeholder="나를 소개해주세요..." style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.7 }} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowWriteModal(false)} style={{ flex: 1, padding: "12px", border: "1px solid #ddd", background: "none", borderRadius: 6, fontSize: 14, cursor: "pointer" }}>취소</button>
              <button onClick={() => { if (!newIntro.name || !newIntro.intro) return; setMembers(p => [...p, { id: Date.now(), ...newIntro, avatar: newIntro.name[0], joined: "2025.03", tags: newIntro.tags.split(",").map(t => t.trim()).filter(Boolean), reactions: [], comments: [] }]); setShowWriteModal(false); setNewIntro({ name: "", role: "", field: "", intro: "", tags: "" }); }} style={{ flex: 2, padding: "12px", background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>소개 게시하기 →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, isOpen, onToggle, onReact, onComment, commentInput, onCommentChange, showEmojiPicker, onToggleEmoji, emojiOptions }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e2d8", borderRadius: 10, overflow: "hidden", boxShadow: isOpen ? "0 8px 32px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)" }}>
      <div style={{ padding: "28px 32px", cursor: "pointer" }} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #2a2a2a, #1a1a1a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8d5a3", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>{member.avatar}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 17 }}>{member.name}</span>
              <span style={{ fontSize: 11, color: "#b8902a", fontWeight: 600, letterSpacing: "0.08em", fontFamily: "sans-serif" }}>MEMBER</span>
            </div>
            <div style={{ fontSize: 14, color: "#555", marginBottom: 8 }}>{member.role}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {member.tags.map(tag => <span key={tag} style={{ fontSize: 11, padding: "3px 10px", background: "#f5f0e8", border: "1px solid #e0d9ce", borderRadius: 100, color: "#666" }}>{tag}</span>)}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>joined {member.joined}</span>
            <div style={{ display: "flex", gap: 4 }}>
              {member.reactions.slice(0, 3).map(r => <span key={r.emoji} style={{ fontSize: 12, background: "#f5f0e8", padding: "2px 8px", borderRadius: 100 }}>{r.emoji} <span style={{ fontSize: 11 }}>{r.count}</span></span>)}
            </div>
            <span style={{ fontSize: 13, color: "#aaa", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
          </div>
        </div>
        {!isOpen && <p style={{ marginTop: 14, paddingLeft: 72, fontSize: 14, color: "#666", lineHeight: 1.7, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{member.intro}</p>}
      </div>

      {isOpen && (
        <div style={{ borderTop: "1px solid #f0ece4" }}>
          <div style={{ padding: "24px 32px", paddingLeft: 104 }}>
            <p style={{ fontSize: 15, color: "#444", lineHeight: 1.85 }}>{member.intro}</p>
            <div style={{ marginTop: 14, padding: "14px 18px", background: "#f5f0e8", borderRadius: 6, borderLeft: "2px solid #b8902a" }}>
              <div style={{ fontSize: 11, color: "#999", letterSpacing: "0.08em", fontWeight: 600 }}>EXPERTISE</div>
              <p style={{ fontSize: 13, color: "#555", marginTop: 4 }}>{member.field}</p>
            </div>
          </div>
          <div style={{ padding: "14px 32px 14px 104px", background: "#faf8f4", borderTop: "1px solid #f0ece4", display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", position: "relative" }}>
            <span style={{ fontSize: 11, color: "#bbb" }}>리액션</span>
            {member.reactions.map(r => <button key={r.emoji} onClick={() => onReact(r.emoji)} style={{ fontSize: 13, background: "#fff", border: "1px solid #e0d9ce", padding: "4px 10px", borderRadius: 100, cursor: "pointer" }}>{r.emoji} <span style={{ fontSize: 11 }}>{r.count}</span></button>)}
            <button onClick={onToggleEmoji} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 100, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#888" }}>+ 이모지</button>
            {showEmojiPicker && (
              <div style={{ position: "absolute", top: 46, left: 0, background: "#fff", border: "1px solid #e0d9ce", borderRadius: 10, padding: 10, display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 250, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 10 }}>
                {emojiOptions.map(e => <button key={e} onClick={() => onReact(e)} style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", padding: "3px 5px" }}>{e}</button>)}
              </div>
            )}
          </div>
          <div style={{ padding: "20px 32px 24px 104px", borderTop: "1px solid #f0ece4" }}>
            {member.comments.map((c, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e8e2d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700 }}>{c.avatar}</div>
                <div><div style={{ display: "flex", gap: 6, alignItems: "baseline" }}><span style={{ fontWeight: 700, fontSize: 12 }}>{c.author}</span><span style={{ fontSize: 11, color: "#bbb" }}>{c.time}</span></div><p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginTop: 2 }}>{c.text}</p></div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#e8d5a3" }}>나</div>
              <input value={commentInput} onChange={e => onCommentChange(e.target.value)} onKeyDown={e => e.key === "Enter" && onComment()} placeholder="인사를 남겨보세요..." style={{ flex: 1, padding: "8px 12px", border: "1px solid #e0d9ce", borderRadius: 6, fontSize: 13, background: "#faf8f4", outline: "none" }} />
              <button onClick={onComment} style={{ padding: "8px 16px", background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>전송</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PAGE 3: BENEFIT ─────────────────────────────────────────────────────────
function BenefitPage() {
  const [activeTab, setActiveTab] = useState(0);

  const tiers = [
    {
      label: "CORE",
      sublabel: "핵심인재",
      benefits: [
        {
          icon: "₩",
          title: "셀프 소개 보상",
          amount: "500만원",
          desc: "본인이 직접 밸류커넥트 X에 소개를 남기고 헤드헌팅이 성사될 경우, 채용 보상금 500만원을 직접 수령합니다.",
          detail: "성사 확인 후 14일 이내 지급. 별도 계약 없이 멤버 자격 기반으로 자동 적용됩니다.",
          highlight: true,
        },
        {
          icon: "%",
          title: "지인 추천 수수료",
          amount: "수수료의 20%",
          desc: "핵심인재를 직접 추천하여 헤드헌팅이 성사될 경우, 당사 수수료의 20%를 리워드로 지급합니다.",
          detail: "평균 채용 수수료 기준, 건당 약 600~1,200만원 상당의 리워드입니다.",
          highlight: true,
        },
        {
          icon: "◈",
          title: "독점 시장 분석 데이터",
          amount: "월간 브리핑",
          desc: "밸류커넥트가 헤드헌팅을 통해 축적한 독점 채용 데이터 — 직군별 연봉 밴드, 이직률, 오퍼 수락 조건 — 를 월간 리포트로 제공합니다.",
          detail: "외부 공개 불가 데이터. Core 멤버에게만 제공되는 인텔리전스 레포트입니다.",
          highlight: false,
        },
        {
          icon: "◎",
          title: "핵심인재 커피챗 네트워크",
          amount: "무제한 접근",
          desc: "커피챗 게시판에 사연을 올리고, 동등 수준의 핵심인재로부터 비밀 신청을 받을 수 있습니다. P2P 연결의 완전한 권한.",
          detail: "사연 작성 + 신청 모두 가능. INTRO 멤버는 신청만 가능합니다.",
          highlight: false,
        },
        {
          icon: "◐",
          title: "CEO 단독 커피챗",
          amount: "우선 배정",
          desc: "CEO가 직접 공개한 커피챗 세션에 신청할 수 있습니다. 채용·네트워크 목적 모두 가능하며, CEO가 Core 멤버를 우선 검토합니다.",
          detail: "현재 월 평균 3~5개의 CEO 세션이 개설되며, 마감 전 Core 멤버 우선 알림이 발송됩니다.",
          highlight: false,
        },
        {
          icon: "◉",
          title: "AI 매치 포지션 발송",
          amount: "80점 이상 · 월 2건",
          desc: "AI가 프로필을 분석하여 매치 스코어 80점 이상의 포지션만 발송합니다. 노이즈 없는 채용 경험. EXCLUSIVE 48시간 우선 접근 포함.",
          detail: "포지션 발송 = 헤드헌터의 관심 표명. 관심 표명 후 48시간 이내 담당 헤드헌터가 연락합니다.",
          highlight: false,
        },
      ],
    },
    {
      label: "INTRO",
      sublabel: "소개인재",
      benefits: [
        {
          icon: "%",
          title: "지인 추천 수수료",
          amount: "수수료의 20%",
          desc: "핵심인재를 직접 추천하여 헤드헌팅이 성사될 경우, 당사 수수료의 20%를 리워드로 지급합니다.",
          detail: "Core 멤버가 직접 소개한 INTRO 멤버도 동일한 추천 수수료 혜택을 받습니다.",
          highlight: true,
        },
        {
          icon: "◎",
          title: "커피챗 신청 권한",
          amount: "열람 + 신청",
          desc: "Core 멤버가 올린 커피챗 사연을 열람하고 비밀 댓글로 신청할 수 있습니다. 직접 사연 작성은 Core 전환 후 가능합니다.",
          detail: "3~5년 내 활동 기반 Core 전환 평가가 이루어집니다.",
          highlight: false,
        },
        {
          icon: "◉",
          title: "포지션 열람",
          amount: "80점 이상",
          desc: "AI 매치 스코어 80점 이상의 포지션을 열람하고 관심 표명할 수 있습니다. EXCLUSIVE 48시간 접근은 Core 멤버 이후 제공됩니다.",
          detail: "관심 표명 후 헤드헌터 검토를 거쳐 연락이 옵니다.",
          highlight: false,
        },
        {
          icon: "◈",
          title: "Core 멤버 소개 권한",
          amount: "Core 성장 패스",
          desc: "적합한 핵심인재를 Core 멤버에게 직접 소개하여 네트워크를 확장하고, 소개 성사 이력을 바탕으로 Core 전환 심사를 받을 수 있습니다.",
          detail: "소개 품질이 Core 전환의 핵심 평가 지표입니다.",
          highlight: false,
        },
      ],
    },
  ];

  const currentTier = tiers[activeTab];

  return (
    <div style={{ background: "#f0ebe2", minHeight: "100vh", fontFamily: "'Georgia', serif" }}>
      {/* HERO */}
      <div style={{ background: "#1a1a1a", padding: "80px 0 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(ellipse at 30% 60%, rgba(201,168,76,0.05) 0%, transparent 55%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div style={{ width: 32, height: 1.5, background: "#c9a84c" }} />
            <span style={{ color: "#c9a84c", fontSize: 10, letterSpacing: "0.22em", fontFamily: "sans-serif", fontWeight: 600 }}>MEMBER BENEFIT · EXCLUSIVE PRIVILEGES</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "end", paddingBottom: 60 }}>
            <div>
              <h1 style={{ fontSize: "clamp(38px, 5vw, 56px)", fontWeight: 800, color: "#f0ebe2", lineHeight: 1.15, letterSpacing: "-2px", margin: "0 0 28px" }}>
                네트워크에<br />속한다는 것의<br />
                <span style={{ color: "#c9a84c", fontStyle: "italic" }}>실질적 가치</span>
              </h1>
              <p style={{ fontSize: 15, lineHeight: 1.9, color: "#b0a898", margin: 0, maxWidth: 440 }}>
                폐쇄형 네트워크의 가치는 소속 자체에서 온다. 그러나 ValueConnect X는 한 발 더 나아가 — 소속이 <span style={{ color: "#e8d5a3" }}>직접적인 경제적 보상과 정보 우위</span>로 전환되는 구조를 설계한다.
              </p>
            </div>

            {/* reward highlight */}
            <div style={{ display: "flex", gap: 1, alignSelf: "end" }}>
              {[
                { label: "셀프 소개 보상", value: "500만원" },
                { label: "추천 성사 리워드", value: "수수료 20%" },
                { label: "독점 데이터", value: "월간 제공" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, background: i === 0 ? "#c9a84c" : "rgba(255,255,255,0.04)", padding: "28px 24px", borderTop: `2px solid ${i === 0 ? "#c9a84c" : "rgba(255,255,255,0.08)"}` }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: i === 0 ? "#1a1a1a" : "#f0ebe2", letterSpacing: "-0.5px", marginBottom: 6 }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: i === 0 ? "#5a3e00" : "#888", fontFamily: "sans-serif", letterSpacing: "0.08em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* TAB */}
          <div style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {tiers.map((tier, i) => (
              <button
                key={tier.label}
                onClick={() => setActiveTab(i)}
                style={{
                  padding: "18px 40px", fontSize: 13, cursor: "pointer",
                  background: activeTab === i ? "#f0ebe2" : "transparent",
                  color: activeTab === i ? "#1a1a1a" : "#666",
                  border: "none", fontFamily: "inherit", fontWeight: activeTab === i ? 700 : 400,
                  letterSpacing: "0.05em", transition: "all 0.2s",
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <span style={{
                  fontSize: 9, padding: "2px 7px", letterSpacing: "0.1em",
                  background: activeTab === i ? "#1a1a1a" : "rgba(255,255,255,0.08)",
                  color: activeTab === i ? "#c9a84c" : "#888",
                  fontFamily: "sans-serif", fontWeight: 700,
                }}>{tier.label}</span>
                {tier.sublabel}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* BENEFITS GRID */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "60px 48px 100px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {currentTier.benefits.map((b, i) => (
            <BenefitCard key={i} benefit={b} idx={i} isHighlight={b.highlight} />
          ))}
        </div>

        {/* BOTTOM CTA */}
        <div style={{ marginTop: 64, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
          <div style={{ background: "#1a1a1a", padding: "48px", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: "100%", background: "linear-gradient(135deg, transparent 40%, rgba(201,168,76,0.06) 100%)", pointerEvents: "none" }} />
            <div style={{ fontSize: 10, color: "#c9a84c", letterSpacing: "0.18em", fontFamily: "sans-serif", marginBottom: 16 }}>CORE MEMBER</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: "#f0ebe2", letterSpacing: "-0.5px", lineHeight: 1.3, margin: "0 0 16px" }}>
              핵심인재라면<br />직접 소개하세요
            </h3>
            <p style={{ fontSize: 14, color: "#888", lineHeight: 1.75, margin: "0 0 28px" }}>
              셀프 소개 → 헤드헌팅 성사 → 500만원 수령.<br />스스로를 시장에 내놓는 가장 직접적인 방식.
            </p>
            <button style={{ padding: "13px 28px", background: "#c9a84c", color: "#1a1a1a", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", fontFamily: "inherit" }}>
              멤버십 신청하기 →
            </button>
          </div>
          <div style={{ background: "#f7f3ed", padding: "48px", borderTop: "2px solid #e0d9ce" }}>
            <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.18em", fontFamily: "sans-serif", marginBottom: 16 }}>INTRO MEMBER</div>
            <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.3, margin: "0 0 16px" }}>
              좋은 사람을 알고<br />있다면 추천하세요
            </h3>
            <p style={{ fontSize: 14, color: "#777", lineHeight: 1.75, margin: "0 0 28px" }}>
              지인 추천 → 헤드헌팅 성사 → 수수료 20% 수령.<br />관계가 자산이 되는 구조.
            </p>
            <button style={{ padding: "13px 28px", background: "#1a1a1a", color: "#f0ebe2", border: "none", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              추천하기 →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function BenefitCard({ benefit, idx, isHighlight }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isHighlight ? (hovered ? "#1a1a1a" : "#131313") : (hovered ? "#ebe5da" : "#f7f3ed"),
        padding: "36px", position: "relative", overflow: "hidden",
        transition: "all 0.2s", cursor: "default",
        borderTop: isHighlight ? "2px solid #c9a84c" : "2px solid transparent",
      }}
    >
      {isHighlight && (
        <div style={{ position: "absolute", top: 0, right: 0, width: 120, height: 120, background: "radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, border: `1px solid ${isHighlight ? "rgba(201,168,76,0.3)" : "rgba(0,0,0,0.1)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 16, fontWeight: 800,
          color: isHighlight ? "#c9a84c" : "#888",
        }}>{benefit.icon}</div>
        <span style={{
          fontSize: 15, fontWeight: 800, letterSpacing: "-0.3px",
          color: isHighlight ? "#c9a84c" : "#c9a84c",
          fontFamily: "sans-serif",
        }}>{benefit.amount}</span>
      </div>

      <h4 style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.3px", margin: "0 0 10px", color: isHighlight ? "#f0ebe2" : "#1a1a1a" }}>
        {benefit.title}
      </h4>
      <p style={{ fontSize: 13.5, color: isHighlight ? "#999" : "#666", lineHeight: 1.8, margin: "0 0 16px" }}>
        {benefit.desc}
      </p>
      <div style={{ borderTop: `1px solid ${isHighlight ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)"}`, paddingTop: 14 }}>
        <p style={{ fontSize: 12, color: isHighlight ? "#666" : "#aaa", lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>
          {benefit.detail}
        </p>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activePage, setActivePage] = useState("service");

  const renderPage = () => {
    switch (activePage) {
      case "service": return <ServicePage setActivePage={setActivePage} />;
      case "members": return <MembersPage />;
      case "benefit": return <BenefitPage />;
      default: return <ServicePage setActivePage={setActivePage} />;
    }
  };

  return (
    <div style={{ fontFamily: "'Georgia', 'Nanum Myeongjo', serif", color: "#1a1a1a" }}>
      <GNB activePage={activePage} setActivePage={setActivePage} />
      {renderPage()}
    </div>
  );
}