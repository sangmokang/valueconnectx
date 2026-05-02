"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function GNBActiveNav({
  href,
  badge,
  children,
}: {
  href: string;
  badge?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        "no-underline flex items-center gap-[6px] pb-[2px] border-b-[1.5px] transition-colors",
        isActive
          ? "text-vcx-dark font-semibold border-vcx-gold"
          : "text-vcx-sub-3 font-normal border-transparent hover:text-vcx-dark",
      ].join(" ")}
    >
      {children}
      {badge && (
        <span className="text-[9px] bg-vcx-gold text-vcx-dark px-[5px] py-[2px] font-extrabold tracking-[0.05em]">
          {badge}
        </span>
      )}
    </Link>
  );
}
