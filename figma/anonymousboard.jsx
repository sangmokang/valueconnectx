import { useState } from "react";

const CATEGORIES = ["전체", "커리어 고민", "연봉·협상", "조직 갈등", "이직 고민", "번아웃", "관계·리더십"];

const POSTS = [
  {
    id: 1,
    category: "연봉·협상",
    title: "Series B 스타트업 CTO 오퍼 받았는데, 연봉 협상 어떻게 해야 할까요",
    body: "현재 대기업 시니어 개발자로 재직 중이고, 스타트업 CTO 포지션 오퍼를 받았습니다. 기본급은 현재보다 낮지만 스톡옵션 패키지가 있어요. 협상 레버리지를 어떻게 써야 할지, 또 스톡옵션 조건에서 특히 봐야 할 부분이 무엇인지 경험 있으신 분의 조언이 필요합니다.",
    time: "3시간 전",
    views: 184,
    reactions: [{ emoji: "🤝", count: 23 }, { emoji: "💡", count: 14 }, { emoji: "🔥", count: 8 }],
    comments: [
      { id: 1, anonName: "익명 멤버 A", text: "스톡옵션은 행사가격, 클리프, 베스팅 기간 세 가지가 핵심입니다. 클리프 1년이 지나기 전 회사가 흔들리면 아무것도 못 가져가요. 4년 베스팅 기준 이미 상장한 곳이 아니면 유동성 이벤트 타임라인도 꼭 물어보세요.", time: "2시간 전", reactions: [{ emoji: "💡", count: 11 }] },
      { id: 2, anonName: "익명 멤버 B", text: "기본급 협상은 '현재 받는 총보상(TC) 대비'로 프레이밍 하세요. RSU, 성과급, 복리후생까지 포함해서 비교표 만들고 제시하면 훨씬 설득력 있습니다.", time: "1시간 전", reactions: [{ emoji: "🤝", count: 7 }] },
    ],
  },
  {
    id: 2,
    category: "조직 갈등",
    title: "팀장인데 위에서 내려오는 방향이 팀원들에게 납득이 안 됩니다",
    body: "경영진의 전략 방향이 현장과 너무 동떨어져 있는데, 팀장으로서 이걸 어떻게 소화해야 할지 모르겠습니다. 위로는 설득하기 어렵고, 아래로는 모티베이션을 유지해야 하는 샌드위치 상황입니다. 이 상황에서 팀장이 할 수 있는 것과 없는 것의 경계를 어떻게 설정해야 할까요.",
    time: "1일 전",
    views: 312,
    reactions: [{ emoji: "🤝", count: 41 }, { emoji: "🧠", count: 19 }, { emoji: "✨", count: 6 }],
    comments: [
      { id: 1, anonName: "익명 멤버 C", text: "'나는 이 방향에 동의하지 않지만, 결정된 이상 우리가 가장 잘 실행할 방법을 찾자'고 팀에 솔직하게 말하는 게 오히려 신뢰를 만들어요. 위에 맹목적으로 동조하는 척보다 훨씬 낫습니다.", time: "20시간 전", reactions: [{ emoji: "🤝", count: 28 }] },
    ],
  },
  {
    id: 3,
    category: "번아웃",
    title: "5년 만에 처음으로 일이 아무 의미없게 느껴집니다",
    body: "잘 나가던 커리어, 성과도 좋았고 인정도 받았는데 갑자기 아무것도 하고 싶지 않습니다. 번아웃인지, 방향을 잃은 건지, 아니면 그냥 지친 건지 구분이 안 됩니다. 비슷한 경험 하신 분들은 어떻게 이 국면을 통과했는지 궁금합니다.",
    time: "2일 전",
    views: 527,
    reactions: [{ emoji: "🤝", count: 67 }, { emoji: "🌱", count: 33 }, { emoji: "💎", count: 12 }],
    comments: [
      { id: 1, anonName: "익명 멤버 D", text: "저도 비슷한 시기가 있었어요. 저는 그때 '아웃풋'이 아닌 '인풋'에만 집중하는 시간을 3개월 가졌습니다. 결과 없이 읽고, 듣고, 걷는 것만 했어요. 그 후에 하고 싶은 게 다시 생겼습니다.", time: "1일 전", reactions: [{ emoji: "🌱", count: 19 }, { emoji: "🤝", count: 14 }] },
      { id: 2, anonName: "익명 멤버 E", text: "번아웃과 방향 상실은 증상이 비슷하지만 처방이 다릅니다. 쉬면 나아지면 번아웃, 쉬어도 공허하면 방향의 문제일 가능성이 높아요. 지금 쉴 수 있는 환경인가요?", time: "18시간 전", reactions: [{ emoji: "💡", count: 22 }] },
    ],
  },
  {
    id: 4,
    category: "이직 고민",
    title: "외국계 임원 제안 — 한국 스타트업 파운더 경험 vs 안정적 커리어트랙",
    body: "현재 외국계 기업 디렉터로 재직 중이고, 한국 스타트업에서 C-레벨 제안이 왔습니다. 재정적으로는 외국계가 훨씬 안정적이지만, 파운더에 가까운 경험을 쌓을 수 있는 기회이기도 합니다. 40대 초반, 가정도 있어서 리스크 감수가 쉽지 않지만 이 기회가 마지막 창문일 수도 있다는 생각도 듭니다.",
    time: "3일 전",
    views: 441,
    reactions: [{ emoji: "🎯", count: 38 }, { emoji: "🤝", count: 29 }, { emoji: "🔥", count: 17 }],
    comments: [],
  },
];

const EMOJI_OPTIONS = ["🤝", "💡", "🔥", "✨", "🧠", "🌱", "🎯", "💎", "⚖️", "🚀"];

export default function AnonymousBoard() {
  const [posts, setPosts] = useState(POSTS);
  const [activeCategory, setActiveCategory] = useState("전체");
  const [activePost, setActivePost] = useState(null);
  const [commentInputs, setCommentInputs] = useState({});
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // "post-{id}" or "comment-{postId}-{commentId}"
  const [newPost, setNewPost] = useState({ category: "커리어 고민", title: "", body: "" });

  const filtered = posts.filter(p => activeCategory === "전체" || p.category === activeCategory);

  const reactToPost = (postId, emoji) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const ex = p.reactions.find(r => r.emoji === emoji);
      return {
        ...p,
        reactions: ex
          ? p.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
          : [...p.reactions, { emoji, count: 1 }]
      };
    }));
    setShowEmojiPicker(null);
  };

  const reactToComment = (postId, commentId, emoji) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: p.comments.map(c => {
          if (c.id !== commentId) return c;
          const ex = c.reactions.find(r => r.emoji === emoji);
          return {
            ...c,
            reactions: ex
              ? c.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
              : [...c.reactions, { emoji, count: 1 }]
          };
        })
      };
    }));
    setShowEmojiPicker(null);
  };

  const submitComment = (postId) => {
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    const anonNames = ["익명 멤버 F", "익명 멤버 G", "익명 멤버 H", "익명 멤버 I"];
    // eslint-disable-next-line react-hooks/purity
    const randomName = anonNames[Math.floor(Math.random() * anonNames.length)];
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: [...p.comments, { id: Date.now(), anonName: randomName, text, time: "방금", reactions: [] }]
      };
    }));
    setCommentInputs(prev => ({ ...prev, [postId]: "" }));
  };

  const submitPost = () => {
    if (!newPost.title.trim() || !newPost.body.trim()) return;
    setPosts(prev => [{
      id: Date.now(),
      ...newPost,
      time: "방금",
      views: 1,
      reactions: [],
      comments: [],
    }, ...prev]);
    setShowWriteModal(false);
    setNewPost({ category: "커리어 고민", title: "", body: "" });
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
            <span key={item} style={{ cursor: "pointer", color: i === 3 ? "#1a1a1a" : "#666", fontWeight: i === 3 ? 600 : 400, borderBottom: i === 3 ? "1.5px solid #b8902a" : "none", paddingBottom: 2 }}>{item}</span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ fontSize: 14, color: "#555", cursor: "pointer" }}>로그인</span>
          <button style={{ background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 4, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>회원가입 →</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ background: "#1a1a1a", padding: "72px 0 80px", position: "relative", overflow: "hidden" }}>
        {/* decorative */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundImage: "radial-gradient(circle at 80% 50%, rgba(184,144,42,0.04) 0%, transparent 60%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent, rgba(184,144,42,0.2), transparent)" }} />

        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
            <div style={{ width: 28, height: 1, background: "#b8902a" }} />
            <span style={{ color: "#b8902a", fontSize: 11, letterSpacing: "0.18em", fontWeight: 600, fontFamily: "sans-serif" }}>ANONYMOUS · TRUST-BASED SPACE</span>
          </div>

          <div style={{ display: "flex", gap: 80, alignItems: "flex-end" }}>
            <div style={{ flex: 1, maxWidth: 680 }}>
              <h1 style={{ fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 800, color: "#f5f0e8", lineHeight: 1.2, marginBottom: 32, letterSpacing: "-1px" }}>
                익명 게시판
              </h1>
              <div style={{ borderLeft: "2px solid #b8902a", paddingLeft: 24 }}>
                <p style={{ fontSize: 15, lineHeight: 1.9, color: "#c8bfaf" }}>
                  익명성에 기반하지만 신뢰를 기반으로 — <span style={{ color: "#e8d5a3", fontStyle: "italic" }}>나의 취약함도 편히 드러낼 수 있는 구조적 안전망.</span>
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.9, color: "#c8bfaf", marginTop: 12 }}>
                  커리어의 고민, 연봉 협상의 불안, 조직 내 갈등 — 우리는 이 공간에서 <span style={{ color: "#e8d5a3" }}>평가 없이 말하고, 집단 지성으로 응답한다.</span>
                </p>
              </div>
            </div>

            {/* RULES */}
            <div style={{ minWidth: 220 }}>
              {[
                { icon: "◎", text: "발신자는 익명, 신뢰는 실명" },
                { icon: "◎", text: "평가 없는 응답만 허용됩니다" },
                { icon: "◎", text: "멤버만 읽고 쓸 수 있습니다" },
              ].map(r => (
                <div key={r.text} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
                  <span style={{ color: "#b8902a", fontSize: 12, marginTop: 1, flexShrink: 0 }}>{r.icon}</span>
                  <span style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 48px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "6px 16px", borderRadius: 100, fontSize: 12, border: `1px solid ${activeCategory === cat ? "#1a1a1a" : "#ddd"}`, background: activeCategory === cat ? "#1a1a1a" : "transparent", color: activeCategory === cat ? "#f5f0e8" : "#777", cursor: "pointer", fontWeight: activeCategory === cat ? 600 : 400, transition: "all 0.15s" }}>
                {cat}
              </button>
            ))}
          </div>
          <button onClick={() => setShowWriteModal(true)} style={{ background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, padding: "10px 22px", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            + 익명으로 쓰기
          </button>
        </div>
        <div style={{ marginTop: 20, fontSize: 13, color: "#888" }}>
          <strong style={{ color: "#1a1a1a" }}>{filtered.length}</strong>개의 글 · 모든 답글은 익명으로 처리됩니다
        </div>
      </div>

      {/* POSTS */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 48px 96px", display: "flex", flexDirection: "column", gap: 16 }}>
        {filtered.map(post => (
          <PostCard
            key={post.id}
            post={post}
            isOpen={activePost === post.id}
            onToggle={() => setActivePost(activePost === post.id ? null : post.id)}
            commentInput={commentInputs[post.id] || ""}
            onCommentChange={val => setCommentInputs(p => ({ ...p, [post.id]: val }))}
            onComment={() => submitComment(post.id)}
            onReactPost={(emoji) => reactToPost(post.id, emoji)}
            onReactComment={(commentId, emoji) => reactToComment(post.id, commentId, emoji)}
            showEmojiPicker={showEmojiPicker}
            onToggleEmojiPicker={setShowEmojiPicker}
            emojiOptions={EMOJI_OPTIONS}
          />
        ))}
      </div>

      {/* WRITE MODAL */}
      {showWriteModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ background: "#f5f0e8", borderRadius: 14, padding: 44, width: "100%", maxWidth: 600, position: "relative" }}>
            <button onClick={() => setShowWriteModal(false)} style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div style={{ width: 20, height: 1, background: "#b8902a" }} />
              <span style={{ fontSize: 11, color: "#b8902a", letterSpacing: "0.15em", fontWeight: 600 }}>ANONYMOUS POST</span>
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, letterSpacing: "-0.5px" }}>익명으로 글 남기기</h3>
            <p style={{ fontSize: 13, color: "#aaa", marginBottom: 28, lineHeight: 1.6 }}>
              작성자 정보는 어디에도 표시되지 않습니다. ValueConnect X 멤버만 볼 수 있습니다.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>카테고리</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CATEGORIES.slice(1).map(cat => (
                  <button key={cat} onClick={() => setNewPost(p => ({ ...p, category: cat }))} style={{ padding: "6px 14px", borderRadius: 100, fontSize: 12, border: `1px solid ${newPost.category === cat ? "#1a1a1a" : "#ddd"}`, background: newPost.category === cat ? "#1a1a1a" : "#fff", color: newPost.category === cat ? "#f5f0e8" : "#777", cursor: "pointer" }}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>제목</label>
              <input value={newPost.title} onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))} placeholder="어떤 고민인지 한 줄로 적어주세요" style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, background: "#fff", boxSizing: "border-box", outline: "none" }} />
            </div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 6, fontWeight: 600, letterSpacing: "0.06em" }}>내용</label>
              <textarea value={newPost.body} onChange={e => setNewPost(p => ({ ...p, body: e.target.value }))} placeholder="상황을 구체적으로 적을수록 더 의미 있는 응답을 받을 수 있습니다. 회사명, 이름 등 특정 가능한 정보는 제외해주세요." rows={6} style={{ width: "100%", padding: "11px 14px", border: "1px solid #ddd", borderRadius: 6, fontSize: 14, background: "#fff", resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.75 }} />
            </div>

            <div style={{ padding: "12px 16px", background: "#fff8ed", border: "1px solid #e8d5a3", borderRadius: 8, marginBottom: 24, display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>🔒</span>
              <p style={{ fontSize: 12, color: "#8a6a1a", lineHeight: 1.6 }}>
                이 글은 완전히 익명으로 게시됩니다. 운영팀도 작성자를 특정하지 않습니다. 단, 커뮤니티 가이드라인 위반 시 삭제될 수 있습니다.
              </p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowWriteModal(false)} style={{ flex: 1, padding: "12px", border: "1px solid #ddd", background: "none", borderRadius: 6, fontSize: 14, cursor: "pointer", color: "#666" }}>취소</button>
              <button onClick={submitPost} style={{ flex: 2, padding: "12px", background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                익명으로 게시하기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostCard({ post, isOpen, onToggle, commentInput, onCommentChange, onComment, onReactPost, onReactComment, showEmojiPicker, onToggleEmojiPicker, emojiOptions }) {
  const postPickerKey = `post-${post.id}`;

  return (
    <div style={{ background: "#fff", border: "1px solid #e8e2d8", borderRadius: 12, overflow: "visible", boxShadow: isOpen ? "0 10px 40px rgba(0,0,0,0.07)" : "0 2px 8px rgba(0,0,0,0.04)", transition: "box-shadow 0.2s", position: "relative" }}>

      {/* HEADER */}
      <div style={{ padding: "28px 32px", cursor: "pointer" }} onClick={onToggle}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 11, padding: "3px 10px", background: categoryColor(post.category).bg, border: `1px solid ${categoryColor(post.category).border}`, borderRadius: 100, color: categoryColor(post.category).text, fontWeight: 600 }}>
                {post.category}
              </span>
              <span style={{ fontSize: 11, color: "#ccc" }}>·</span>
              <span style={{ fontSize: 11, color: "#bbb" }}>{post.time}</span>
              <span style={{ fontSize: 11, color: "#ccc" }}>·</span>
              <span style={{ fontSize: 11, color: "#bbb" }}>조회 {post.views}</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.45, letterSpacing: "-0.2px", color: "#1a1a1a", marginBottom: 0 }}>
              {post.title}
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {post.reactions.slice(0, 3).map(r => (
                <span key={r.emoji} style={{ fontSize: 12, background: "#f5f0e8", padding: "2px 8px", borderRadius: 100, color: "#666" }}>
                  {r.emoji} {r.count}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: "#bbb" }}>💬 {post.comments.length}</span>
              <span style={{ fontSize: 13, color: "#ccc", transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", display: "inline-block" }}>▾</span>
            </div>
          </div>
        </div>

        {!isOpen && (
          <p style={{ marginTop: 12, fontSize: 14, color: "#777", lineHeight: 1.7, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {post.body}
          </p>
        )}
      </div>

      {/* EXPANDED */}
      {isOpen && (
        <div style={{ borderTop: "1px solid #f0ece4" }}>

          {/* BODY */}
          <div style={{ padding: "24px 32px" }}>
            <p style={{ fontSize: 15, color: "#3a3a3a", lineHeight: 1.9 }}>{post.body}</p>
          </div>

          {/* REACTIONS on post */}
          <div style={{ padding: "14px 32px", background: "#faf8f4", borderTop: "1px solid #f0ece4", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", position: "relative" }}>
            <span style={{ fontSize: 11, color: "#bbb", marginRight: 4, letterSpacing: "0.05em" }}>공감</span>
            {post.reactions.map(r => (
              <button key={r.emoji} onClick={() => onReactPost(r.emoji)} style={{ fontSize: 13, background: "#fff", border: "1px solid #e0d9ce", padding: "5px 12px", borderRadius: 100, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                {r.emoji} <span style={{ fontSize: 12, color: "#666" }}>{r.count}</span>
              </button>
            ))}
            <button onClick={(e) => { e.stopPropagation(); onToggleEmojiPicker(showEmojiPicker === postPickerKey ? null : postPickerKey); }} style={{ background: "#fff", border: "1px solid #ddd", borderRadius: 100, padding: "5px 12px", fontSize: 12, cursor: "pointer", color: "#888" }}>
              + 이모지
            </button>
            {showEmojiPicker === postPickerKey && (
              <div style={{ position: "absolute", top: 48, left: 32, background: "#fff", border: "1px solid #e0d9ce", borderRadius: 10, padding: 12, display: "flex", gap: 8, flexWrap: "wrap", maxWidth: 260, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50 }}>
                {emojiOptions.map(e => (
                  <button key={e} onClick={() => onReactPost(e)} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", padding: "4px 6px", borderRadius: 6 }}>{e}</button>
                ))}
              </div>
            )}
          </div>

          {/* COMMENTS */}
          <div style={{ padding: "24px 32px", borderTop: "1px solid #f0ece4" }}>
            {post.comments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 20 }}>
                {post.comments.map((c, idx) => {
                  const commentPickerKey = `comment-${post.id}-${c.id}`;
                  return (
                    <div key={c.id} style={{ paddingTop: idx === 0 ? 0 : 18, paddingBottom: 18, borderBottom: idx < post.comments.length - 1 ? "1px solid #f5f0e8" : "none" }}>
                      {/* ANON IDENTITY */}
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0ece4", border: "1px solid #e0d9ce", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 14 }}>◎</span>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>{c.anonName}</span>
                            <span style={{ fontSize: 11, color: "#ccc" }}>{c.time}</span>
                          </div>
                          <p style={{ fontSize: 14, color: "#444", lineHeight: 1.75, marginBottom: 10 }}>{c.text}</p>
                          {/* comment reactions */}
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", position: "relative" }}>
                            {c.reactions.map(r => (
                              <button key={r.emoji} onClick={() => onReactComment(c.id, r.emoji)} style={{ fontSize: 12, background: "#f5f0e8", border: "1px solid #e8e2d8", padding: "3px 10px", borderRadius: 100, cursor: "pointer", color: "#666", display: "flex", alignItems: "center", gap: 3 }}>
                                {r.emoji} <span style={{ fontSize: 11 }}>{r.count}</span>
                              </button>
                            ))}
                            <button onClick={(e) => { e.stopPropagation(); onToggleEmojiPicker(showEmojiPicker === commentPickerKey ? null : commentPickerKey); }} style={{ fontSize: 12, background: "none", border: "1px dashed #ddd", borderRadius: 100, padding: "3px 10px", cursor: "pointer", color: "#aaa" }}>
                              + 공감
                            </button>
                            {showEmojiPicker === commentPickerKey && (
                              <div style={{ position: "absolute", top: 30, left: 0, background: "#fff", border: "1px solid #e0d9ce", borderRadius: 10, padding: 10, display: "flex", gap: 6, flexWrap: "wrap", maxWidth: 240, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", zIndex: 50 }}>
                                {emojiOptions.map(e => (
                                  <button key={e} onClick={() => onReactComment(c.id, e)} style={{ fontSize: 18, background: "none", border: "none", cursor: "pointer", padding: "3px 5px", borderRadius: 4 }}>{e}</button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {post.comments.length === 0 && (
              <div style={{ textAlign: "center", padding: "20px 0 24px", color: "#ccc", fontSize: 14 }}>
                첫 번째 응답을 남겨보세요
              </div>
            )}

            {/* COMMENT INPUT */}
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#f0ece4", border: "1px solid #e0d9ce", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <span style={{ fontSize: 14 }}>◎</span>
              </div>
              <div style={{ flex: 1 }}>
                <textarea
                  value={commentInput}
                  onChange={e => onCommentChange(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onComment(); } }}
                  placeholder="익명으로 응답하기 — 평가 없이, 경험으로 답해주세요"
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", border: "1px solid #e0d9ce", borderRadius: 8, fontSize: 13, background: "#faf8f4", resize: "none", boxSizing: "border-box", outline: "none", lineHeight: 1.7, color: "#1a1a1a" }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: "#ccc" }}>⇧ + Enter로 줄바꿈, Enter로 전송</span>
                  <button onClick={onComment} style={{ padding: "8px 20px", background: "#1a1a1a", color: "#f5f0e8", border: "none", borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    익명 답글
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function categoryColor(cat) {
  const map = {
    "커리어 고민": { bg: "#f0f7ff", border: "#c8dff5", text: "#3a7bbf" },
    "연봉·협상": { bg: "#fff8ed", border: "#e8d5a3", text: "#a07820" },
    "조직 갈등": { bg: "#fff0f0", border: "#f5c8c8", text: "#b84040" },
    "이직 고민": { bg: "#f0fff4", border: "#b8e8c8", text: "#2a8050" },
    "번아웃": { bg: "#f5f0ff", border: "#d8c8f5", text: "#6040a0" },
    "관계·리더십": { bg: "#f5f0e8", border: "#e0d9ce", text: "#7a6545" },
  };
  return map[cat] || { bg: "#f5f0e8", border: "#e0d9ce", text: "#666" };
}