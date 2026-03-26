import { useState } from "react";

const CEO_POSTS = [
  {
    id: 1,
    name: "장도현",
    company: "Lumir",
    role: "CEO",
    avatar: "장",
    sector: "Space Tech · 위성 데이터",
    headcount: "Series C · 280명",
    posted: "2일 전",
    slots: 3,
    remaining: 1,
    format: "오프라인",
    location: "강남 패스트파이브",
    duration: "40분",
    period: "2025년 2월 중",
    message: "위성 데이터 산업은 지금 변곡점에 있습니다. 저희가 어떤 사람들과 함께 이 시대를 만들어가고 싶은지, 그리고 조직이 실제로 어떻게 굴러가는지 — JD 어디에도 없는 이야기를 직접 나누고 싶습니다. 우주라는 맥락에서 진지하게 일하고 싶은 분을 기다립니다.",
    looking: ["GTM 리드", "데이터 엔지니어링", "전략기획"],
    applicants: [
      { id: 1, author: "이서연", avatar: "이", text: "CPO로서 딥테크 사업화 경험이 있습니다. 위성 데이터의 B2B 활용 관련해 나누고 싶은 이야기가 많습니다.", time: "1일 전", status: "검토중" },
      { id: 2, author: "김준혁", avatar: "김", text: "Series C 시점의 조직 확장 관련해 VC 관점에서 도움이 될 수 있을 것 같습니다.", time: "6시간 전", status: "수락됨" },
    ],
  },
  {
    id: 2,
    name: "최유진",
    company: "Heuron",
    role: "Co-founder & CEO",
    avatar: "최",
    sector: "Medical AI · 뇌질환 진단",
    headcount: "Series B · 95명",
    posted: "4일 전",
    slots: 2,
    remaining: 2,
    format: "온라인",
    location: "Zoom",
    duration: "30분",
    period: "2025년 1월 말",
    message: "의료 AI는 규제와 임상, 두 개의 언어를 동시에 구사해야 합니다. 저희 팀은 지금 그 경계를 확장하는 중이고, 같은 긴장감 속에서 일해본 분들과 솔직한 대화를 원합니다. 직무와 무관하게 메디컬 AI의 미래에 진지한 분이라면 환영합니다.",
    looking: ["임상 전략", "규제 사이언스", "Product"],
    applicants: [],
  },
  {
    id: 3,
    name: "박준서",
    company: "Monit",
    role: "CEO",
    avatar: "박",
    sector: "B2B SaaS · 경영관리",
    headcount: "Series A · 42명",
    posted: "6일 전",
    slots: 4,
    remaining: 3,
    format: "오프라인",
    location: "성수 본사",
    duration: "45분",
    period: "협의 후 결정",
    message: "작은 팀이 빠르게 성장하는 국면입니다. 지금 우리에게 필요한 건 화려한 스펙보다 '이 조직이 왜 이길 수 있는가'라는 질문에 같이 답할 수 있는 사람입니다. 실제로 어떻게 일하는지, 무엇을 포기하고 무엇을 지키는지 — 날것의 대화를 환영합니다.",
    looking: ["Sales Lead", "CX", "Finance"],
    applicants: [
      { id: 1, author: "박민준", avatar: "박", text: "법무·전략 측면에서 Series A 스케일업 과정에 기여할 수 있습니다. 경영관리 SaaS의 계약/컴플라이언스 구조에 관심이 많습니다.", time: "5일 전", status: "수락됨" },
    ],
  },
];

const isAdmin = true;
const currentUser = { name: "나", avatar: "나" };

export default function CEOCoffeechat() {
  const [posts, setPosts] = useState(CEO_POSTS);
  const [activePost, setActivePost] = useState(null);
  const [applyInput, setApplyInput] = useState({});
  const [showCEOModal, setShowCEOModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("전체");
  const [newPost, setNewPost] = useState({
    name: "", company: "", role: "CEO", sector: "", message: "",
    looking: "", slots: 2, format: "오프라인", location: "", duration: "30분", period: ""
  });

  const filters = ["전체", "오프라인", "온라인", "Space Tech", "Medical AI", "B2B SaaS"];

  const filtered = posts.filter(p =>
    activeFilter === "전체" || p.format === activeFilter || p.sector.includes(activeFilter)
  );

  const submitApply = (postId) => {
    const text = applyInput[postId];
    if (!text?.trim()) return;
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        applicants: [...p.applicants, {
          id: Date.now(),
          author: currentUser.name,
          avatar: currentUser.avatar,
          text,
          time: "방금",
          status: "대기중"
        }]
      };
    }));
    setApplyInput(prev => ({ ...prev, [postId]: "" }));
  };

  const submitCEOPost = () => {
    if (!newPost.name || !newPost.company || !newPost.message) return;
    setPosts(prev => [...prev, {
      id: Date.now(),
      ...newPost,
      avatar: newPost.name[0],
      headcount: "",
      posted: "방금",
      remaining: newPost.slots,
      looking: newPost.looking.split(",").map(s => s.trim()).filter(Boolean),
      applicants: [],
    }]);
    setShowCEOModal(false);
    setNewPost({ name: "", company: "", role: "CEO", sector: "", message: "", looking: "", slots: 2, format: "오프라인", location: "", duration: "30분", period: "" });
  };

  return (
    <div style={{ fontFamily: "'Pretendard', 'Noto Serif KR', Georgia, serif", background: "#f5f0e8", minHeight: "100vh", color: "#1a1a1a" }}>

      {/* NAV */}
      <nav style={{ background: "#f5f0e8", borderBottom: "1px solid #e0d9ce", padding: "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>
          ValueConnect <span style={{ color: "#b8902a" }}>X</span>
        </span>
        <div style={{ display: "flex", gap: 32, fontSize: 14 }}>
          {["멤버 소개", "커피챗 신청", "CEO Coffeechat", "익명 게시판", "채용 포지션"].map((item, i) => (
            <span key={item} style={{ cursor: "pointer", color: i === 2 ? "#1a1a1a" : "#666", fontWeight: i === 2 ? 600 : 400, borderBottom: i === 2 ? "1.5px solid #b8902a" : "none", paddingBottom: 2 }}>{item}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#555", cursor: "pointer" }}>로그인</span>
          <button style={{ background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 4, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>회원가입 →</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: "#1a1a1a", padding: "72px 0 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 400, height: 400, borderRadius: "50%", border: "1px solid rgba(184,144,42,0.1)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: -20, right: -20, width: 240, height: 240, borderRadius: "50%", border: "1px solid rgba(184,144,42,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: "20%", width: 320, height: 320, borderRadius: "50%", background: "rgba(184,144,42,0.03)", filter: "blur(80px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 28, height: 1, background: "#b8902a" }} />
            <span style={{ color: "#b8902a", fontSize: 11, letterSpacing: "0.18em", fontWeight: 600, fontFamily: "sans-serif" }}>CEO DIRECT LINE · PRIVATE CHANNEL</span>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 48 }}>
            <div style={{ flex: 1, maxWidth: 640 }}>
              <h1 style={{ fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 800, color: "#f5f0e8", lineHeight: 1.2, marginBottom: 32, letterSpacing: "-1px" }}>
                CEO Coffeechat
              </h1>
              <div style={{ borderLeft: "2px solid #b8902a", paddingLeft: 24 }}>
                <p style={{ fontSize: 15, lineHeight: 1.9, color: "#c8bfaf" }}>
                  의사결정자와의 만남은 본래 <span style={{ color: "#e8d5a3", fontStyle: "italic" }}>정보 비대칭을 해소하는 행위</span>다. 채용 공고 이면에 있는 조직의 문화, 리더십의 언어, 암묵적 기대 — 이것들은 JD 어디에도 적혀 있지 않다.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.9, color: "#c8bfaf", marginTop: 12 }}>
                  온오프라인으로 직접 만나 맥락을 공유함으로써, 당신은 더 빠르고 더 정확한 <span style={{ color: "#e8d5a3" }}>판단</span>을 내릴 수 있게 된다.
                </p>
              </div>
            </div>

            {/* STATS */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 200 }}>
              {[
                { label: "ACTIVE SESSIONS", value: `${posts.length}` },
                { label: "TOTAL SLOTS", value: `${posts.reduce((a, p) => a + p.slots, 0)}` },
                { label: "REMAINING", value: `${posts.reduce((a, p) => a + p.remaining, 0)}` },
              ].map(s => (
                <div key={s.label} style={{ borderLeft: "1px solid rgba(184,144,42,0.3)", paddingLeft: 16 }}>
                  <div style={{ fontSize: 10, color: "#888", letterSpacing: "0.15em", fontFamily: "sans-serif" }}>{s.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "#f5f0e8", letterSpacing: "-1px", lineHeight: 1.2 }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ background: "#1e1e1e", borderBottom: "1px solid #2a2a2a" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 48px", display: "flex", gap: 0, alignItems: "stretch" }}>
          {[
            { step: "01", title: "CEO가 직접 게시", desc: "조직의 맥락과 만나고 싶은 사람을 직접 씁니다" },
            { step: "02", title: "멤버 비공개 신청", desc: "ValueConnect X 멤버만 볼 수 있는 비밀 댓글로 지원합니다" },
            { step: "03", title: "CEO 직접 선택", desc: "CEO가 신청자를 검토하고 직접 수락합니다" },
            { step: "04", title: "맥락 있는 만남", desc: "JD가 아닌 사람 대 사람으로 연결됩니다" },
          ].map((s, i) => (
            <div key={s.step} style={{ flex: 1, padding: "20px 24px", borderRight: i < 3 ? "1px solid #2a2a2a" : "none", position: "relative" }}>
              <div style={{ fontSize: 10, color: "#b8902a", letterSpacing: "0.2em", marginBottom: 8, fontFamily: "sans-serif" }}>{s.step}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#e8e0d0", marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {filters.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)} style={{ padding: "6px 16px", borderRadius: 100, fontSize: 12, border: `1px solid ${activeFilter === f ? "#1a1a1a" : "#ddd"}`, background: activeFilter === f ? "#1a1a1a" : "transparent", color: activeFilter === f ? "#f5f0e8" : "#777", cursor: "pointer", fontWeight: activeFilter === f ? 600 : 400 }}>{f}</button>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => setShowCEOModal(true)} style={{ background: "#b8902a", color: "#fff", border: "none", borderRadius: 6, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em" }}>
              + CEO 커피챗 등록
            </button>
          )}
        </div>
        <div style={{ marginTop: 20, marginBottom: 0, fontSize: 13, color: "#888" }}>
          <strong style={{ color: "#1a1a1a" }}>{filtered.length}</strong>개의 커피챗 세션 · 멤버만 신청 가능합니다
        </div>
      </div>

      {/* POSTS */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 48px 96px", display: "flex", flexDirection: "column", gap: 20 }}>
        {filtered.map(post => (
          <CEOCard
            key={post.id}
            post={post}
            isOpen={activePost === post.id}
            onToggle={() => setActivePost(activePost === post.id ? null : post.id)}
            applyInput={applyInput[post.id] || ""}
            onApplyChange={val => setApplyInput(prev => ({ ...prev, [post.id]: val }))}
            onApply={() => submitApply(post.id)}
            isAdmin={isAdmin}
          />
        ))}
      </div>

      {/* CEO REGISTER MODAL */}
      {showCEOModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#f5f0e8", borderRadius: 12, padding: 44, width: "100%", maxWidth: 600, position: "relative", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setShowCEOModal(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 20, height: 1, background: "#b8902a" }} />
              <span style={{ fontSize: 11, color: "#b8902a", letterSpacing: "0.15em", fontWeight: 600 }}>CEO DIRECT LINE</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 28, letterSpacing: "-0.5px" }}>커피챗 세션 등록</h3>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 20px" }}>
              {[
                { label: "이름", key: "name", placeholder: "홍길동" },
                { label: "회사명", key: "company", placeholder: "예: Toss, Kakao" },
                { label: "직함", key: "role", placeholder: "예: CEO, Co-founder" },
                { label: "섹터 · 산업", key: "sector", placeholder: "예: FinTech · 결제 인프라" },
                { label: "장소", key: "location", placeholder: "예: 강남 패스트파이브 / Zoom" },
                { label: "일정", key: "period", placeholder: "예: 2025년 2월 중" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>{f.label}</label>
                  <input value={newPost[f.key]} onChange={e => setNewPost(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, background: "#fff", boxSizing: "border-box", outline: "none" }} />
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 16px", marginBottom: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>모집 인원</label>
                <select value={newPost.slots} onChange={e => setNewPost(p => ({ ...p, slots: Number(e.target.value) }))} style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, background: "#fff", outline: "none" }}>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}명</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>형식</label>
                <select value={newPost.format} onChange={e => setNewPost(p => ({ ...p, format: e.target.value }))} style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, background: "#fff", outline: "none" }}>
                  <option>오프라인</option>
                  <option>온라인</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>소요 시간</label>
                <select value={newPost.duration} onChange={e => setNewPost(p => ({ ...p, duration: e.target.value }))} style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, background: "#fff", outline: "none" }}>
                  {["30분", "45분", "60분"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>만나고 싶은 포지션 (쉼표 구분)</label>
              <input value={newPost.looking} onChange={e => setNewPost(p => ({ ...p, looking: e.target.value }))} placeholder="예: Product Lead, 데이터 엔지니어, 전략기획" style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, background: "#fff", boxSizing: "border-box", outline: "none" }} />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>CEO 메시지</label>
              <textarea value={newPost.message} onChange={e => setNewPost(p => ({ ...p, message: e.target.value }))} placeholder="어떤 분과 어떤 대화를 나누고 싶은지 직접 써주세요. JD가 담지 못하는 조직의 언어와 문화, 지금 찾는 사람에 대해 솔직하게 적어주시면 좋습니다." rows={5} style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13, background: "#fff", resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.7 }} />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowCEOModal(false)} style={{ flex: 1, padding: "12px", border: "1px solid #ddd", background: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", color: "#666" }}>취소</button>
              <button onClick={submitCEOPost} style={{ flex: 2, padding: "12px", background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>세션 게시하기 →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CEOCard({ post, isOpen, onToggle, applyInput, onApplyChange, onApply, isAdmin }) {
  const pct = Math.round((1 - post.remaining / post.slots) * 100);
  const isFull = post.remaining === 0;

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e2d8", borderRadius: 12, overflow: "hidden", boxShadow: isOpen ? "0 12px 40px rgba(0,0,0,0.09)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s" }}>

      {/* CARD HEADER */}
      <div style={{ padding: "32px 36px", cursor: "pointer", position: "relative" }} onClick={onToggle}>

        {/* TOP ROW */}
        <div style={{ display: "flex", gap: 22, alignItems: "flex-start" }}>

          {/* AVATAR */}
          <div style={{ flexShrink: 0 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #2a2a2a, #111)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8d5a3", fontSize: 20, fontWeight: 800 }}>
              {post.avatar}
            </div>
          </div>

          {/* META */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px" }}>{post.name}</span>
              <span style={{ fontSize: 11, color: "#b8902a", fontWeight: 700, letterSpacing: "0.1em" }}>CEO</span>
              <span style={{ fontSize: 12, color: "#aaa" }}>·</span>
              <span style={{ fontSize: 13, color: "#555" }}>{post.company}</span>
            </div>
            <div style={{ fontSize: 13, color: "#888", marginBottom: 10 }}>{post.sector} · {post.headcount}</div>

            {/* TAGS */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, padding: "3px 10px", background: post.format === "오프라인" ? "#1a1a1a" : "#f0f7ff", border: `1px solid ${post.format === "오프라인" ? "#1a1a1a" : "#c8dff5"}`, borderRadius: 100, color: post.format === "오프라인" ? "#f5f0e8" : "#4a7fb0" }}>
                {post.format === "오프라인" ? "📍" : "💻"} {post.format}
              </span>
              <span style={{ fontSize: 11, padding: "3px 10px", background: "#f5f0e8", border: "1px solid #e0d9ce", borderRadius: 100, color: "#666" }}>⏱ {post.duration}</span>
              <span style={{ fontSize: 11, padding: "3px 10px", background: "#f5f0e8", border: "1px solid #e0d9ce", borderRadius: 100, color: "#666" }}>📅 {post.period}</span>
            </div>
          </div>

          {/* SLOTS + ARROW */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, minWidth: 120 }}>
            <span style={{ fontSize: 11, color: "#aaa" }}>{post.posted}</span>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: isFull ? "#c0392b" : "#888", marginBottom: 5 }}>
                {isFull ? "마감" : `${post.remaining}/${post.slots}석 남음`}
              </div>
              <div style={{ width: 90, height: 4, background: "#f0ece4", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: isFull ? "#c0392b" : "#b8902a", borderRadius: 2, transition: "width 0.3s" }} />
              </div>
            </div>
            <span style={{ fontSize: 13, color: "#bbb", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
          </div>
        </div>

        {/* PREVIEW */}
        {!isOpen && (
          <p style={{ marginTop: 18, paddingLeft: 78, fontSize: 14, color: "#666", lineHeight: 1.75, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {post.message}
          </p>
        )}
      </div>

      {/* EXPANDED */}
      {isOpen && (
        <div style={{ borderTop: "1px solid #f0ece4" }}>

          {/* CEO MESSAGE */}
          <div style={{ padding: "28px 36px 24px 36px" }}>
            <div style={{ paddingLeft: 78 }}>
              <div style={{ fontSize: 11, color: "#b8902a", letterSpacing: "0.12em", fontWeight: 700, marginBottom: 12 }}>CEO DIRECT MESSAGE</div>
              <p style={{ fontSize: 15, color: "#3a3a3a", lineHeight: 1.9, fontStyle: "italic" }}>&ldquo;{post.message}&rdquo;</p>

              {/* LOOKING FOR */}
              <div style={{ marginTop: 20, display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ padding: "14px 18px", background: "#f5f0e8", borderRadius: 8, borderLeft: "2px solid #b8902a", flex: 1 }}>
                  <div style={{ fontSize: 11, color: "#999", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 8 }}>LOOKING FOR</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {post.looking.map(l => (
                      <span key={l} style={{ fontSize: 12, padding: "4px 12px", background: "#fff", border: "1px solid #e0d9ce", borderRadius: 100, color: "#555", fontWeight: 500 }}>{l}</span>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "14px 18px", background: "#faf8f4", borderRadius: 8, border: "1px solid #e8e2d8", minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: "#999", letterSpacing: "0.1em", fontWeight: 700, marginBottom: 6 }}>LOCATION</div>
                  <div style={{ fontSize: 13, color: "#555" }}>{post.location}</div>
                </div>
              </div>
            </div>
          </div>

          {/* SECRET APPLICANTS — admin only */}
          {isAdmin && post.applicants.length > 0 && (
            <div style={{ padding: "20px 36px 20px 36px", background: "#1a1a1a", borderTop: "1px solid #2a2a2a" }}>
              <div style={{ paddingLeft: 78 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 16, height: 1, background: "#b8902a" }} />
                  <span style={{ fontSize: 10, color: "#b8902a", letterSpacing: "0.15em", fontWeight: 700 }}>PRIVATE · 신청자 목록 (운영자 전용)</span>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(184,144,42,0.15)", borderRadius: 100, color: "#b8902a" }}>{post.applicants.length}명</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {post.applicants.map(a => (
                    <div key={a.id} style={{ background: "#242424", borderRadius: 8, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start", border: "1px solid #2e2e2e" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#e8d5a3", flexShrink: 0 }}>
                        {a.avatar}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#e8e0d0" }}>{a.author}</span>
                          <span style={{ fontSize: 11, color: "#555" }}>{a.time}</span>
                          <StatusBadge status={a.status} />
                        </div>
                        <p style={{ fontSize: 13, color: "#999", lineHeight: 1.65 }}>{a.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* APPLY SECTION */}
          <div style={{ padding: "22px 36px 28px 36px", background: "#faf8f4", borderTop: "1px solid #f0ece4" }}>
            <div style={{ paddingLeft: 78 }}>
              {isFull ? (
                <div style={{ padding: "14px 20px", background: "#f9f0f0", border: "1px solid #f0d9d9", borderRadius: 8, fontSize: 13, color: "#c0392b", fontWeight: 600 }}>
                  마감된 세션입니다. 다음 기회를 기다려주세요.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <div style={{ width: 16, height: 1, background: "#b8902a" }} />
                    <span style={{ fontSize: 11, color: "#b8902a", letterSpacing: "0.12em", fontWeight: 700 }}>PRIVATE APPLICATION · 멤버 전용</span>
                  </div>
                  <p style={{ fontSize: 12, color: "#aaa", marginBottom: 14, lineHeight: 1.6 }}>
                    신청 내용은 CEO와 ValueConnect X 운영팀에게만 공개됩니다. 다른 멤버에게는 보이지 않습니다.
                  </p>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#e8d5a3", flexShrink: 0, marginTop: 2 }}>나</div>
                    <div style={{ flex: 1 }}>
                      <textarea
                        value={applyInput}
                        onChange={e => onApplyChange(e.target.value)}
                        placeholder={`${post.name} 대표님께 — 어떤 분인지, 왜 이 자리에 관심을 가졌는지 간략히 소개해주세요.`}
                        rows={4}
                        style={{ width: "100%", padding: "12px 16px", border: "1px solid #e0d9ce", borderRadius: 8, fontSize: 13, background: "#fff", resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.7, color: "#1a1a1a" }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                        <button
                          onClick={onApply}
                          style={{ padding: "10px 24px", background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em" }}
                        >
                          비공개 신청하기 →
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    "대기중": { bg: "rgba(255,255,255,0.06)", color: "#666", label: "대기중" },
    "검토중": { bg: "rgba(184,144,42,0.12)", color: "#b8902a", label: "검토중" },
    "수락됨": { bg: "rgba(52,168,83,0.12)", color: "#34a853", label: "수락됨" },
    "미선발": { bg: "rgba(192,57,43,0.1)", color: "#c0392b", label: "미선발" },
  };
  const s = map[status] || map["대기중"];
  return (
    <span style={{ fontSize: 10, padding: "2px 8px", background: s.bg, color: s.color, borderRadius: 100, fontWeight: 700, letterSpacing: "0.05em" }}>
      {s.label}
    </span>
  );
}