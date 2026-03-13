import { useState } from "react";

const MEMBERS = [
  {
    id: 1,
    name: "김준혁",
    role: "Partner, Sequoia Korea",
    field: "Venture Capital · Growth Strategy",
    avatar: "김",
    joined: "2024.11",
    intro: "20년간 B2B SaaS와 딥테크 분야에서 투자와 운영을 병행해왔습니다. 스타트업이 시장을 재설계하는 순간을 함께하는 것이 제 일의 본질입니다. 같은 언어로 대화할 수 있는 분들과 연결되고 싶습니다.",
    tags: ["B2B SaaS", "DeepTech", "Series A-C"],
    reactions: [{ emoji: "🤝", count: 12 }, { emoji: "🔥", count: 8 }, { emoji: "💡", count: 15 }],
    comments: [
      { author: "이서연", avatar: "이", text: "투자 철학이 인상적입니다. 언제 커피 한 잔 어떨까요?", time: "2일 전" },
      { author: "박민준", avatar: "박", text: "딥테크 쪽에서 많이 배우고 싶습니다!", time: "1일 전" },
    ],
  },
  {
    id: 2,
    name: "이서연",
    role: "CPO, Toss",
    field: "Product · FinTech · UX Strategy",
    avatar: "이",
    joined: "2024.12",
    intro: "사용자 행동에서 시스템의 결함을 읽어내는 것이 제 강점입니다. 좋은 제품은 결국 사람에 대한 깊은 이해에서 시작된다고 믿습니다. 프로덕트, 조직 설계, 커리어 전환에 관심 있는 분들과 이야기 나누고 싶습니다.",
    tags: ["Product Strategy", "FinTech", "0-to-1"],
    reactions: [{ emoji: "🤝", count: 24 }, { emoji: "✨", count: 19 }, { emoji: "💡", count: 11 }],
    comments: [
      { author: "김준혁", avatar: "김", text: "핀테크 프로덕트 관점 정말 반갑습니다.", time: "3일 전" },
    ],
  },
  {
    id: 3,
    name: "박민준",
    role: "General Counsel, Kakao",
    field: "Tech Law · Regulatory · M&A",
    avatar: "박",
    joined: "2025.01",
    intro: "규제 환경이 빠르게 변화하는 시대, 법과 기술의 교차점에서 기업의 성장 경로를 설계합니다. AI, 데이터 거버넌스, 플랫폼 규제를 주로 다루고 있으며 같은 언어를 쓰는 분들과의 깊은 대화를 환영합니다.",
    tags: ["AI Regulation", "M&A", "Data Governance"],
    reactions: [{ emoji: "🤝", count: 9 }, { emoji: "🧠", count: 14 }, { emoji: "⚖️", count: 7 }],
    comments: [],
  },
];

const EMOJI_OPTIONS = ["🤝", "🔥", "💡", "✨", "🧠", "⚖️", "🌱", "🎯", "💎", "🚀"];

const isAdmin = true; // 실제 구현 시 auth context에서 가져옴

export default function MemberIntroPage() {
  const [search, setSearch] = useState("");
  const [activeCard, setActiveCard] = useState(null);
  const [commentInput, setCommentInput] = useState({});
  const [members, setMembers] = useState(MEMBERS);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [newIntro, setNewIntro] = useState({ name: "", role: "", field: "", intro: "", tags: "" });

  const filtered = members.filter(m =>
    isAdmin
      ? m.name.includes(search) || m.role.includes(search) || m.field.includes(search) || m.tags.join().includes(search)
      : true
  );

  const addReaction = (memberId, emoji) => {
    setMembers(prev => prev.map(m => {
      if (m.id !== memberId) return m;
      const existing = m.reactions.find(r => r.emoji === emoji);
      if (existing) {
        return { ...m, reactions: m.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r) };
      }
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
    <div style={{ fontFamily: "'Pretendard', 'Noto Serif KR', Georgia, serif", background: "#f5f0e8", minHeight: "100vh", color: "#1a1a1a" }}>
      {/* NAV */}
      <nav style={{ background: "#f5f0e8", borderBottom: "1px solid #e0d9ce", padding: "0 48px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60, position: "sticky", top: 0, zIndex: 100 }}>
        <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "-0.5px" }}>
          ValueConnect <span style={{ color: "#b8902a" }}>X</span>
        </span>
        <div style={{ display: "flex", gap: 32, fontSize: 14, color: "#555" }}>
          {["멤버 소개", "커피챗 신청", "CEO Coffeechat", "익명 게시판", "채용 포지션"].map((item, i) => (
            <span key={item} style={{ cursor: "pointer", color: i === 0 ? "#1a1a1a" : "#666", fontWeight: i === 0 ? 600 : 400, borderBottom: i === 0 ? "1.5px solid #b8902a" : "none", paddingBottom: 2 }}>{item}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#555", cursor: "pointer" }}>로그인</span>
          <button style={{ background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 4, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>회원가입 →</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: "#1a1a1a", padding: "72px 0 80px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 500, height: "100%", background: "linear-gradient(135deg, transparent 60%, rgba(184,144,42,0.07) 100%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: "30%", width: 300, height: 300, borderRadius: "50%", background: "rgba(184,144,42,0.04)", filter: "blur(60px)", pointerEvents: "none" }} />
        
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 28, height: 1, background: "#b8902a" }} />
            <span style={{ color: "#b8902a", fontSize: 11, letterSpacing: "0.18em", fontWeight: 600, fontFamily: "sans-serif" }}>MEMBERS · CORE NETWORK</span>
          </div>

          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 800, color: "#f5f0e8", lineHeight: 1.2, marginBottom: 32, letterSpacing: "-1px" }}>
            멤버 소개
          </h1>

          <div style={{ borderLeft: "2px solid #b8902a", paddingLeft: 24, maxWidth: 720 }}>
            <p style={{ fontSize: 15, lineHeight: 1.9, color: "#c8bfaf", fontWeight: 400 }}>
              모든 시대에는 자신이 속한 <span style={{ color: "#e8d5a3", fontStyle: "italic" }}>장(場, field)</span>을 먼저 읽어내는 사람들이 있다. 지식과 경험을 내면화하여 자신만의 <span style={{ color: "#e8d5a3", fontStyle: "italic" }}>아비투스(habitus)</span>를 구축한 이들 — 이들은 주어진 구조에 반응하는 것이 아니라, 구조 자체를 재설계한다.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.9, color: "#c8bfaf", marginTop: 16 }}>
              ValueConnect X는 그런 사람들의 <span style={{ color: "#e8d5a3" }}>사회적 자본이 실질적인 기회로 전환되는 공간</span>이다.
            </p>
          </div>
        </div>
      </div>

      {/* SEARCH + WRITE (admin only) */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 48px 0" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1, position: "relative" }}>
            {isAdmin ? (
              <>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="이름, 직군, 키워드로 검색..."
                  style={{ width: "100%", padding: "12px 48px 12px 16px", background: "#fff", border: "1px solid #e0d9ce", borderRadius: 6, fontSize: 14, color: "#1a1a1a", outline: "none", boxSizing: "border-box" }}
                />
                <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#aaa" }}>🔍</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#b8902a" }} />
                  <span style={{ fontSize: 11, color: "#999", letterSpacing: "0.05em" }}>나와 ValueConnect X만 검색할 수 있습니다</span>
                </div>
              </>
            ) : (
              <div style={{ padding: "12px 16px", background: "#f0ece4", border: "1px solid #e0d9ce", borderRadius: 6, fontSize: 14, color: "#999" }}>검색 기능은 관리자 전용입니다</div>
            )}
          </div>
          <button
            onClick={() => setShowWriteModal(true)}
            style={{ background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", height: 46 }}
          >
            + 내 소개 작성
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32, marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: "#888" }}>총 <strong style={{ color: "#1a1a1a" }}>{filtered.length}</strong>명의 멤버</span>
          <div style={{ display: "flex", gap: 8 }}>
            {["전체", "VC · Investment", "Product", "Tech", "Legal"].map((tag, i) => (
              <span key={tag} style={{ padding: "5px 14px", borderRadius: 100, fontSize: 12, border: `1px solid ${i === 0 ? "#1a1a1a" : "#ddd"}`, background: i === 0 ? "#1a1a1a" : "transparent", color: i === 0 ? "#f5f0e8" : "#777", cursor: "pointer", fontWeight: i === 0 ? 600 : 400 }}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      {/* MEMBER CARDS */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 48px 80px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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

      {/* WRITE MODAL */}
      {showWriteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#f5f0e8", borderRadius: 12, padding: 40, width: "100%", maxWidth: 580, position: "relative" }}>
            <button onClick={() => setShowWriteModal(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 20, height: 1, background: "#b8902a" }} />
              <span style={{ fontSize: 11, color: "#b8902a", letterSpacing: "0.15em", fontWeight: 600 }}>MEMBER INTRODUCTION</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 28, letterSpacing: "-0.5px" }}>내 소개 남기기</h3>
            {[
              { label: "이름", key: "name", placeholder: "실명을 입력해주세요" },
              { label: "직함 / 소속", key: "role", placeholder: "예: CPO, Kakao" },
              { label: "전문 분야", key: "field", placeholder: "예: Product · FinTech · UX Strategy" },
              { label: "태그 (쉼표로 구분)", key: "tags", placeholder: "예: B2B SaaS, Series A, DeepTech" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em" }}>{f.label}</label>
                <input
                  value={newIntro[f.key]}
                  onChange={e => setNewIntro(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, background: "#fff", boxSizing: "border-box", outline: "none" }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 12, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.05em" }}>자기소개</label>
              <textarea
                value={newIntro.intro}
                onChange={e => setNewIntro(prev => ({ ...prev, intro: e.target.value }))}
                placeholder="나를 다른 멤버들에게 소개해주세요. 어떤 분들과 연결되고 싶은지 함께 남겨주시면 좋습니다."
                rows={5}
                style={{ width: "100%", padding: "10px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, background: "#fff", resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.7 }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowWriteModal(false)} style={{ flex: 1, padding: "12px", border: "1px solid #ddd", background: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", color: "#666" }}>취소</button>
              <button
                onClick={() => {
                  if (!newIntro.name || !newIntro.intro) return;
                  setMembers(prev => [...prev, {
                    id: Date.now(), ...newIntro,
                    avatar: newIntro.name[0],
                    joined: new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit" }).replace(". ", ".").replace(".", ""),
                    tags: newIntro.tags.split(",").map(t => t.trim()).filter(Boolean),
                    reactions: [], comments: [],
                  }]);
                  setShowWriteModal(false);
                  setNewIntro({ name: "", role: "", field: "", intro: "", tags: "" });
                }}
                style={{ flex: 2, padding: "12px", background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer" }}
              >
                소개 게시하기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MemberCard({ member, isOpen, onToggle, onReact, onComment, commentInput, onCommentChange, showEmojiPicker, onToggleEmoji, emojiOptions }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e8e2d8", borderRadius: 10, overflow: "hidden", transition: "box-shadow 0.2s", boxShadow: isOpen ? "0 8px 32px rgba(0,0,0,0.08)" : "0 2px 8px rgba(0,0,0,0.04)" }}>
      {/* CARD HEADER */}
      <div style={{ padding: "28px 32px", cursor: "pointer" }} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
          {/* AVATAR */}
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #2a2a2a, #1a1a1a)", display: "flex", alignItems: "center", justifyContent: "center", color: "#e8d5a3", fontSize: 18, fontWeight: 800, flexShrink: 0 }}>
            {member.avatar}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px" }}>{member.name}</span>
              <span style={{ fontSize: 11, color: "#b8902a", fontWeight: 600, letterSpacing: "0.08em", fontFamily: "sans-serif" }}>MEMBER</span>
            </div>
            <div style={{ fontSize: 14, color: "#555", marginBottom: 8 }}>{member.role}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {member.tags.map(tag => (
                <span key={tag} style={{ fontSize: 11, padding: "3px 10px", background: "#f5f0e8", border: "1px solid #e0d9ce", borderRadius: 100, color: "#666" }}>{tag}</span>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#aaa" }}>joined {member.joined}</span>
            <div style={{ display: "flex", gap: 6 }}>
              {member.reactions.slice(0, 3).map(r => (
                <span key={r.emoji} style={{ fontSize: 13, background: "#f5f0e8", padding: "3px 8px", borderRadius: 100, color: "#555" }}>
                  {r.emoji} <span style={{ fontSize: 11 }}>{r.count}</span>
                </span>
              ))}
            </div>
            <span style={{ fontSize: 13, color: "#aaa", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
          </div>
        </div>

        {/* INTRO PREVIEW */}
        {!isOpen && (
          <p style={{ marginTop: 16, paddingLeft: 72, fontSize: 14, color: "#666", lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {member.intro}
          </p>
        )}
      </div>

      {/* EXPANDED */}
      {isOpen && (
        <div style={{ borderTop: "1px solid #f0ece4" }}>
          {/* FULL INTRO */}
          <div style={{ padding: "24px 32px 24px 32px" }}>
            <div style={{ paddingLeft: 72 }}>
              <p style={{ fontSize: 15, color: "#444", lineHeight: 1.85 }}>{member.intro}</p>
              <div style={{ marginTop: 16, padding: "14px 18px", background: "#f5f0e8", borderRadius: 6, borderLeft: "2px solid #b8902a" }}>
                <span style={{ fontSize: 12, color: "#999", letterSpacing: "0.08em", fontWeight: 600 }}>EXPERTISE</span>
                <p style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{member.field}</p>
              </div>
            </div>
          </div>

          {/* REACTIONS */}
          <div style={{ padding: "16px 32px 16px 104px", background: "#faf8f4", borderTop: "1px solid #f0ece4", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", position: "relative" }}>
            <span style={{ fontSize: 12, color: "#aaa", marginRight: 4 }}>리액션</span>
            {member.reactions.map(r => (
              <button key={r.emoji} onClick={() => onReact(r.emoji)} style={{ fontSize: 13, background: "#fff", border: "1px solid #e0d9ce", padding: "5px 12px", borderRadius: 100, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {r.emoji} <span style={{ fontSize: 12, color: "#666" }}>{r.count}</span>
              </button>
            ))}
            <button onClick={onToggleEmoji} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 100, padding: "5px 12px", fontSize: 13, cursor: "pointer", color: "#888" }}>
              + 이모지
            </button>
            {showEmojiPicker && (
              <div style={{ position: "absolute", top: 48, left: 0, background: "#fff", border: "1px solid #e0d9ce", borderRadius: 10, padding: 12, display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 260, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 10 }}>
                {emojiOptions.map(e => (
                  <button key={e} onClick={() => onReact(e)} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6, transition: "background 0.1s" }}>
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* COMMENTS */}
          <div style={{ padding: "20px 32px 24px 104px", borderTop: "1px solid #f0ece4" }}>
            {member.comments.length > 0 && (
              <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                {member.comments.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#e8e2d8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#555", flexShrink: 0 }}>
                      {c.avatar}
                    </div>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>{c.author}</span>
                        <span style={{ fontSize: 11, color: "#bbb" }}>{c.time}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginTop: 3 }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COMMENT INPUT */}
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#e8d5a3", flexShrink: 0 }}>나</div>
              <div style={{ flex: 1, display: "flex", gap: 8 }}>
                <input
                  value={commentInput}
                  onChange={e => onCommentChange(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && onComment()}
                  placeholder="인사를 남겨보세요..."
                  style={{ flex: 1, padding: "9px 14px", border: "1px solid #e0d9ce", borderRadius: 6, fontSize: 13, background: "#faf8f4", outline: "none" }}
                />
                <button onClick={onComment} style={{ padding: "9px 18px", background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                  전송
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}