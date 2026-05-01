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
        className="flex items-center gap-1 bg-transparent border-0 cursor-pointer text-[14px] pb-[3px] select-none transition-colors hover:text-[#2fd6a1]"
        style={{
          color: isServiceActive ? "#2fd6a1" : "#b8b3b0",
          fontWeight: isServiceActive ? 600 : 400,
          borderBottom: isServiceActive
            ? "1.5px solid #00d992"
            : "1.5px solid transparent",
        }}
        aria-expanded={open}
      >
        서비스 소개
        <span
          className="inline-block text-[12px] transition-transform duration-200"
          style={{
            color: isServiceActive ? "#00d992" : "#8b949e",
            transform: open ? "rotate(180deg)" : "none",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-[#101010] border border-[#3d3a39] shadow-[0_20px_60px_rgba(0,0,0,0.7)] min-w-[180px] z-[300] overflow-hidden">
          <div className="h-0.5 bg-[#00d992]" />
          {items.map((sub, i) => {
            const isActive = sub.href === currentPath;
            return (
              <Link
                key={sub.label}
                href={sub.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-3.5 px-5 text-[14px] no-underline transition-colors"
                style={{
                  color: isActive ? "#2fd6a1" : "#b8b3b0",
                  fontWeight: isActive ? 700 : 400,
                  background: isActive ? "#171717" : "#101010",
                  borderBottom:
                    i < items.length - 1
                      ? "1px solid #3d3a39"
                      : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#171717")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = isActive
                    ? "#171717"
                    : "#101010")
                }
              >
                {isActive && (
                  <div className="w-[3px] h-[14px] bg-[#00d992] shrink-0" />
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
    <div className="hidden md:flex items-center gap-7 text-[14px]">
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
              color: isActive ? "#2fd6a1" : "#b8b3b0",
              fontWeight: isActive ? 600 : 400,
              borderBottom: isActive
                ? "1.5px solid #00d992"
                : "1.5px solid transparent",
            }}
          >
            {item.label}
            {item.badge && (
              <span className="text-[12px] font-extrabold tracking-[0.05em] px-1.5 py-0.5 bg-[#00d992] text-[#050507]">
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
        className="flex items-center justify-center w-11 h-11 bg-transparent border border-[#3d3a39] cursor-pointer text-[#f2f2f2]"
        aria-label="메뉴 열기"
      >
        <Menu size={22} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[500] bg-[#050507] flex flex-col overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="모바일 네비게이션"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-[64px] border-b border-[#3d3a39] shrink-0">
            <Link
              href="/"
              onClick={closeMenu}
              className="no-underline font-vcx-sans font-extrabold text-base tracking-normal text-[#f2f2f2]"
            >
              ValueConnect <span className="text-[#00d992]">X</span>
            </Link>
            <button
              onClick={closeMenu}
              className="flex items-center justify-center w-11 h-11 bg-transparent border border-[#3d3a39] cursor-pointer text-[#f2f2f2]"
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
                    className="border-b border-[#3d3a39]"
                  >
                    <button
                      onClick={() => toggleItem(item.label)}
                      className="w-full flex items-center justify-between px-4 min-h-[52px] bg-transparent border-0 cursor-pointer text-left"
                      aria-expanded={expanded}
                    >
                      <span
                        className="text-[16px] font-medium"
                        style={{ color: isActive ? "#2fd6a1" : "#f2f2f2" }}
                      >
                        {item.label}
                      </span>
                      <span
                        className="inline-block text-[12px] text-[#8b949e] transition-transform duration-200"
                        style={{
                          transform: expanded ? "rotate(180deg)" : "none",
                        }}
                      >
                        ▾
                      </span>
                    </button>
                    {expanded && (
                      <div className="bg-[#101010]">
                        {item.children.map((sub) => {
                          const isSubActive = sub.href === currentPath;
                          return (
                            <Link
                              key={sub.label}
                              href={sub.href}
                              onClick={closeMenu}
                              className="flex items-center gap-2 px-8 min-h-[52px] text-[15px] no-underline border-t border-[#3d3a39]"
                              style={{
                                color: isSubActive ? "#2fd6a1" : "#b8b3b0",
                                fontWeight: isSubActive ? 600 : 400,
                                background: isSubActive
                                  ? "#171717"
                                  : "transparent",
                              }}
                            >
                              {isSubActive && (
                                <div className="w-[3px] h-[14px] bg-[#00d992] shrink-0" />
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
                  className="flex items-center gap-2 px-4 min-h-[56px] text-[16px] no-underline border-b border-[#3d3a39]"
                  style={{
                    color: isActive ? "#2fd6a1" : "#f2f2f2",
                    fontWeight: isActive ? 700 : 500,
                  }}
                >
                  {item.label}
                  {item.badge && (
                    <span className="text-[12px] font-extrabold tracking-[0.05em] px-1.5 py-0.5 bg-[#00d992] text-[#050507]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom CTA */}
          <div className="shrink-0 px-4 py-6 border-t border-[#3d3a39] flex flex-col gap-3">
            {isAuthenticated ? (
              <div className="flex items-center justify-between">
                <div className="text-[14px] text-[#b8b3b0]">
                  {userName && (
                    <span className="font-medium text-[#f2f2f2]">
                      {userName}
                    </span>
                  )}
                  {isAdmin && (
                    <span className="ml-2 text-[13px] text-[#00d992] font-medium">
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
                  className="flex items-center justify-center min-h-[50px] text-[15px] text-[#f2f2f2] no-underline border border-[#3d3a39]"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  onClick={closeMenu}
                  className="flex items-center justify-center min-h-[50px] text-[15px] font-semibold bg-[#101010] border border-[#3d3a39] text-[#2fd6a1] no-underline"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
