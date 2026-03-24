export default function CoffeeChatPage() {
  return (
    <main
      style={{
        background: "#f0ebe2",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            marginBottom: "24px",
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
            COFFEE CHAT
          </span>
          <div
            style={{ width: "32px", height: "1.5px", background: "#c9a84c" }}
          />
        </div>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 800,
            color: "#1a1a1a",
            letterSpacing: "-1px",
            margin: "0 0 16px 0",
          }}
        >
          Coffee Chat
        </h1>
        <p
          style={{
            fontSize: "15px",
            color: "#888",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Coming Soon
        </p>
      </div>
    </main>
  );
}
