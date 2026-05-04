import Link from "next/link";
import { headers } from "next/headers";
import { getVcxUser, isAdmin } from "@/lib/auth/get-vcx-user";
import { UserMenu } from "@/components/auth/user-menu";
import { NotificationBell } from "@/components/layout/notification-bell";
import { DesktopNav, MobileMenu } from "./gnb-dropdown";

export default async function GNB() {
  const user = await getVcxUser();
  const admin = user ? isAdmin(user) : false;

  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") ?? "/";

  return (
    <nav className="sticky top-0 z-[200] h-[60px] bg-[#f5f0e8] border-b border-black/[0.08] flex items-center justify-between px-4 md:px-12">
      {/* Logo */}
      <Link
        href="/"
        className="flex min-h-11 items-center no-underline font-[Georgia,serif] font-extrabold text-base tracking-tight text-[#1a1a1a]"
      >
        ValueConnect <span className="text-[#c9a84c]">X</span>
      </Link>

      {/* Desktop Center Nav */}
      <DesktopNav currentPath={currentPath} />

      {/* Desktop Right */}
      <div className="hidden lg:flex items-center gap-4">
        {user ? (
          <>
            <NotificationBell />
            <UserMenu userName={user.name} isAdmin={admin} />
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex min-h-9 items-center text-[13.5px] text-[#666] no-underline"
            >
              로그인
            </Link>
            <Link
              href="/invite/accept"
              className="inline-flex min-h-9 items-center bg-[#1a1a1a] px-[18px] text-[13px] text-[#f5f0e8] no-underline"
            >
              초대 확인하기 →
            </Link>
          </>
        )}
      </div>

      {/* Mobile Hamburger */}
      <div className="lg:hidden">
        <MobileMenu
          isAuthenticated={!!user}
          userName={user?.name}
          isAdmin={admin}
          currentPath={currentPath}
        />
      </div>
    </nav>
  );
}
