"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { mainNavItems } from "@/constants/navigation";
import { NotificationBell } from "./notification-bell";
import type { NavItem } from "@/types";

// ─── Desktop Dropdown ─────────────────────────────────────────────────────────

function ServiceDropdown({
  items,
  currentPath,
}: {
  items: NavItem[];
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isServiceActive = items.some((item) => item.href === currentPath);

  return (
    <div ref={dropRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 bg-transparent border-0 cursor-pointer text-[13.5px] pb-[2px] select-none"
        style={{
          color: isServiceActive ? "#1a1a1a" : "#666",
          fontWeight: isServiceActive ? 600 : 400,
          borderBottom: isServiceActive
            ? "1.5px solid #c9a84c"
            : "1.5px solid transparent",
        }}
        aria-expanded={open}
      >
        서비스 소개
        <span
          className="inline-block text-[9px] transition-transform duration-200"
          style={{
            color: isServiceActive ? "#c9a84c" : "#bbb",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-white border border-black/[0.08] shadow-[0_12px_40px_rgba(0,0,0,0.12)] min-w-[160px] z-[300] overflow-hidden">
          <div className="h-0.5 bg-[#c9a84c]" />
          {items.map((sub, i) => {
            const isActive = sub.href === currentPath;
            return (
              <Link
                key={sub.label}
                href={sub.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-3 px-5 text-[13px] no-underline transition-colors"
                style={{
                  color: isActive ? "#1a1a1a" : "#666",
                  fontWeight: isActive ? 700 : 400,
                  background: isActive ? "#faf8f4" : "white",
                  borderBottom:
                    i < items.length - 1
                      ? "1px solid rgba(0,0,0,0.06)"
                      : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#faf8f4")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = isActive
                    ? "#faf8f4"
                    : "white")
                }
              >
                {isActive && (
                  <div className="w-[3px] h-[14px] bg-[#c9a84c] shrink-0" />
                )}
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Desktop Nav (데스크탑 중앙) ──────────────────────────────────────────────

export function DesktopNav({ currentPath }: { currentPath: string }) {
  return (
    <div className="hidden md:flex items-center gap-7 text-[13.5px]">
      {mainNavItems.map((item) => {
        if (item.children) {
          return (
            <ServiceDropdown
              key={item.label}
              items={item.children}
              currentPath={currentPath}
            />
          );
        }

        const isActive = item.href === currentPath;
        return (
          <Link
            key={item.label}
            href={item.href}
            className="flex items-center gap-1.5 no-underline pb-[2px]"
            style={{
              color: isActive ? "#1a1a1a" : "#666",
              fontWeight: isActive ? 600 : 400,
              borderBottom: isActive
                ? "1.5px solid #c9a84c"
                : "1.5px solid transparent",
            }}
          >
            {item.label}
            {item.badge && (
              <span className="text-[9px] font-extrabold tracking-[0.05em] px-1.5 py-0.5 bg-[#c9a84c] text-[#1a1a1a]">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

// Re-export GNBDropdown alias for backward compatibility
export { ServiceDropdown as GNBDropdown };

// ─── Mobile Menu ──────────────────────────────────────────────────────────────

export function MobileMenu({
  isAuthenticated,
  userName,
  isAdmin,
  currentPath,
}: {
  isAuthenticated: boolean;
  userName?: string;
  isAdmin?: boolean;
  currentPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function toggleItem(label: string) {
    setExpandedItems((prev) => ({ ...prev, [label]: !prev[label] }));
  }

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-11 h-11 bg-transparent border-0 cursor-pointer text-[#1a1a1a]"
        aria-label="메뉴 열기"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[500] bg-[#f5f0e8] flex flex-col overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="모바일 네비게이션"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-[60px] border-b border-black/[0.08] shrink-0">
            <Link
              href="/"
              onClick={closeMenu}
              className="no-underline font-[Georgia,serif] font-extrabold text-base tracking-tight text-[#1a1a1a]"
            >
              ValueConnect <span className="text-[#c9a84c]">X</span>
            </Link>
            <button
              onClick={closeMenu}
              className="flex items-center justify-center w-11 h-11 bg-transparent border-0 cursor-pointer text-[#1a1a1a]"
              aria-label="메뉴 닫기"
            >
              <X size={22} />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 py-4">
            {mainNavItems.map((item) => {
              if (item.children) {
                const expanded = !!expandedItems[item.label];
                const isActive = item.children.some(
                  (child) => child.href === currentPath
                );
                return (
                  <div
                    key={item.label}
                    className="border-b border-black/[0.06]"
                  >
                    <button
                      onClick={() => toggleItem(item.label)}
                      className="w-full flex items-center justify-between px-4 min-h-[52px] bg-transparent border-0 cursor-pointer text-left"
                      aria-expanded={expanded}
                    >
                      <span
                        className="text-[15px] font-medium"
                        style={{ color: isActive ? "#c9a84c" : "#1a1a1a" }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="inline-block text-[9px] text-[#bbb] transition-transform duration-200"
                        style={{
                          transform: expanded ? "rotate(180deg)" : "none",
                        }}
                      >
                        ▾
                      </span>
                    </button>
                    {expanded && (
                      <div className="bg-black/[0.03]">
                        {item.children.map((sub) => {
                          const isSubActive = sub.href === currentPath;
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={closeMenu}
                              className="flex items-center gap-2 px-8 min-h-[48px] text-[14px] no-underline border-t border-black/[0.05]"
                              style={{
                                color: isSubActive ? "#1a1a1a" : "#666",
                                fontWeight: isSubActive ? 600 : 400,
                                background: isSubActive
                                  ? "#faf8f4"
                                  : "transparent",
                              }}
                            >
                              {isSubActive && (
                                <div className="w-[3px] h-[14px] bg-[#c9a84c] shrink-0" />
                              )}
                              {sub.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = item.href === currentPath;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeMenu}
                  className="flex items-center gap-2 px-4 min-h-[52px] text-[15px] no-underline border-b border-black/[0.06]"
                  style={{
                    color: "#1a1a1a",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {item.label}
                  {item.badge && (
                    <span className="text-[9px] font-extrabold tracking-[0.05em] px-1.5 py-0.5 bg-[#c9a84c] text-[#1a1a1a]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom CTA */}
          <div className="shrink-0 px-4 py-6 border-t border-black/[0.08] flex flex-col gap-3">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <div className="text-[13.5px] text-[#555]">
                  {userName && (
                    <span className="font-medium text-[#1a1a1a]">
                      {userName}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="ml-2 text-[12px] text-[#c9a84c] font-medium">
                      관리자
                    </span>
                  )}
                </div>
                <NotificationBell />
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center min-h-[48px] text-[14px] text-[#1a1a1a] no-underline border border-[#1a1a1a]"
                >
                  로그인
                </Link>
                <Link
                  href="/invite/accept"
                  onClick={closeMenu}
                  className="flex items-center justify-center min-h-[48px] text-[14px] bg-[#1a1a1a] text-[#f5f0e8] no-underline"
                >
                  초대 확인하기 →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
