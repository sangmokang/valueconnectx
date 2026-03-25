"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import type { NavItem } from "@/types";
import { mainNavItems } from "@/constants/navigation";

// ─── Desktop Dropdown (hover) + Mobile Accordion (click) ─────────────────────

export function GNBDropdown({
  label,
  items,
  requiresAuth,
  isAuthenticated,
}: {
  label: string;
  items: NavItem[];
  requiresAuth?: boolean;
  isAuthenticated: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-1 bg-transparent border-0 cursor-pointer text-[13.5px] font-normal text-[#555] pb-[2px] border-b-[1.5px] border-transparent font-[system-ui,sans-serif]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          size={12}
          className={`text-[#888] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
        {requiresAuth && !isAuthenticated && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c9a84c"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-[2px]"
          >
            <rect width="18" height="11" x="3" y="11" rx="0" ry="0" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 pt-2 bg-transparent min-w-[160px] z-[200]">
          <div className="bg-[#f0ebe2] border border-black/[0.08]">
            {items.map((sub) => (
              <Link
                key={sub.label}
                href={sub.href}
                className="block px-4 py-[10px] text-[13px] text-[#333] no-underline font-[system-ui,sans-serif] border-b border-black/[0.05] last:border-b-0 hover:bg-black/[0.03] transition-colors"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mobile Menu ──────────────────────────────────────────────────────────────

function LockIconSmall() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#c9a84c"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="ml-1 shrink-0"
    >
      <rect width="18" height="11" x="3" y="11" rx="0" ry="0" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function MobileMenu({
  isAuthenticated,
  userName,
  isAdmin,
}: {
  isAuthenticated: boolean;
  userName?: string;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // body scroll lock
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
      {/* Hamburger button — visible only on mobile (md:hidden handled in gnb.tsx) */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center w-11 h-11 bg-transparent border-0 cursor-pointer text-[#1a1a1a]"
        aria-label="메뉴 열기"
      >
        <Menu size={22} />
      </button>

      {/* Full-screen overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[500] bg-[#f0ebe2] flex flex-col overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="모바일 네비게이션"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-[60px] border-b border-black/[0.08] shrink-0">
            <Link
              href="/"
              onClick={closeMenu}
              className="no-underline flex items-baseline gap-[2px]"
            >
              <span className="font-serif text-[17px] font-bold text-[#1a1a1a] tracking-[-0.3px]">
                ValueConnect
              </span>
              <span className="font-serif text-[17px] font-bold text-[#c9a84c]"> X</span>
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
                return (
                  <div key={item.label} className="border-b border-black/[0.06]">
                    <button
                      onClick={() => toggleItem(item.label)}
                      className="w-full flex items-center justify-between px-4 min-h-[52px] bg-transparent border-0 cursor-pointer text-left"
                      aria-expanded={expanded}
                    >
                      <span className="flex items-center gap-1 text-[15px] font-[system-ui,sans-serif] font-medium text-[#1a1a1a]">
                        {item.label}
                        {item.requiresAuth && !isAuthenticated && <LockIconSmall />}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-[#888] transition-transform duration-150 shrink-0 ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    {expanded && (
                      <div className="bg-black/[0.03]">
                        {item.children.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            onClick={closeMenu}
                            className="flex items-center px-8 min-h-[48px] text-[14px] font-[system-ui,sans-serif] text-[#444] no-underline border-t border-black/[0.05]"
                          >
                            {sub.label}
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
                  onClick={closeMenu}
                  className="flex items-center gap-1 px-4 min-h-[52px] text-[15px] font-[system-ui,sans-serif] font-medium text-[#1a1a1a] no-underline border-b border-black/[0.06]"
                >
                  {item.label}
                  {item.requiresAuth && !isAuthenticated && <LockIconSmall />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom CTA */}
          <div className="shrink-0 px-4 py-6 border-t border-black/[0.08] flex flex-col gap-3">
            {isAuthenticated ? (
              <div className="text-[13.5px] font-[system-ui,sans-serif] text-[#555]">
                {userName && (
                  <span className="font-medium text-[#1a1a1a]">{userName}</span>
                )}
                {isAdmin && (
                  <span className="ml-2 text-[12px] text-[#c9a84c] font-medium">관리자</span>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="flex items-center justify-center min-h-[48px] text-[14px] font-[system-ui,sans-serif] text-[#1a1a1a] no-underline border border-[#1a1a1a]"
                >
                  로그인
                </Link>
                <Link
                  href="/invite/accept"
                  onClick={closeMenu}
                  className="flex items-center justify-center min-h-[48px] text-[14px] font-[system-ui,sans-serif] bg-[#1a1a1a] text-[#f0ebe2] no-underline"
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
