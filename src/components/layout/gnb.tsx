"use client";

import { useState } from "react";
import Link from "next/link";

const menuItems = [
  {
    label: "서비스 소개",
    href: "/",
    dropdown: ["서비스 소개", "Member Directory", "Benefit"],
  },
  { label: "Coffee Chat", href: "/coffeechat" },
  { label: "CEO Coffee Chat", href: "/ceo-coffee-chat" },
  { label: "Community Board", href: "/community" },
  { label: "Position Board", href: "/positions" },
];

export default function GNB({ activeMenu }: { activeMenu?: string }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: "60px",
        background: "#f0ebe2",
        borderBottom: "1px solid rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        style={{
          textDecoration: "none",
          display: "flex",
          alignItems: "baseline",
          gap: "2px",
        }}
      >
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "17px",
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.3px",
          }}
        >
          ValueConnect
        </span>
        <span
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "17px",
            fontWeight: 700,
            color: "#c9a84c",
          }}
        >
          {" "}X
        </span>
      </Link>

      {/* Center Menu */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "32px",
          fontSize: "13.5px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {menuItems.map((item) => {
          const isActive = activeMenu === item.label;
          if (item.dropdown) {
            return (
              <div
                key={item.label}
                style={{ position: "relative" }}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <button
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "13.5px",
                    fontFamily: "system-ui, sans-serif",
                    color: isActive ? "#1a1a1a" : "#555",
                    fontWeight: isActive ? 600 : 400,
                    padding: 0,
                    borderBottom: isActive
                      ? "1.5px solid #c9a84c"
                      : "1.5px solid transparent",
                    paddingBottom: "2px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {item.label}
                  <span style={{ fontSize: "11px", color: "#888" }}>▾</span>
                </button>
                {dropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      marginTop: "8px",
                      background: "#f0ebe2",
                      border: "1px solid rgba(0,0,0,0.08)",
                      minWidth: "160px",
                      zIndex: 200,
                    }}
                  >
                    {item.dropdown.map((sub) => (
                      <Link
                        key={sub}
                        href="#"
                        style={{
                          display: "block",
                          padding: "10px 16px",
                          fontSize: "13px",
                          color: "#333",
                          textDecoration: "none",
                          fontFamily: "system-ui, sans-serif",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                      >
                        {sub}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              style={{
                textDecoration: "none",
                color: isActive ? "#1a1a1a" : "#555",
                fontWeight: isActive ? 600 : 400,
                borderBottom: isActive
                  ? "1.5px solid #c9a84c"
                  : "1.5px solid transparent",
                paddingBottom: "2px",
              }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <Link
          href="/login"
          style={{
            fontSize: "13.5px",
            fontFamily: "system-ui, sans-serif",
            color: "#1a1a1a",
            textDecoration: "none",
          }}
        >
          로그인
        </Link>
        <Link
          href="/invite"
          style={{
            fontSize: "13.5px",
            fontFamily: "system-ui, sans-serif",
            background: "#1a1a1a",
            color: "#f0ebe2",
            padding: "9px 18px",
            textDecoration: "none",
            borderRadius: 0,
            display: "inline-block",
          }}
        >
          초대 확인하기 →
        </Link>
      </div>
    </nav>
  );
}
