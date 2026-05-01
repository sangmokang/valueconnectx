import Link from "next/link";
import { headers } from "next/headers";
import { getVcxUser, isAdmin } from "@/lib/auth/get-vcx-user";
import { UserMenu } from "@/components/auth/user-menu";
import { DesktopNav, MobileMenu } from "./gnb-dropdown";

export default async function GNB() {
  const user = await getVcxUser();
  const admin = user ? isAdmin(user) : false;

  const headersList = await headers();
  const currentPath = headersList.get("x-pathname") ?? "/";

  return (
    <nav className="sticky top-0 z-[200] h-[64px] bg-[#050507]/95 border-b border-[#3d3a39] flex items-center justify-between px-4 backdrop-blur md:px-12">
      {/* Logo */}
      <Link
        href="/"
        className="no-underline font-vcx-sans font-extrabold text-[15px] tracking-normal text-[#f2f2f2] sm:text-base"
      >
        ValueConnect <span className="text-[#00d992] drop-shadow-[0_0_6px_rgba(0,217,146,0.45)]">X</span>
      </Link>

      {/* Desktop Center Nav */}
      <DesktopNav currentPath={currentPath} />

      {/* Desktop Right */}
      <div className="hidden md:flex items-center gap-4">
        {user ? (
          <UserMenu userName={user.name} isAdmin={admin} />
        ) : (
          <>
            <Link
              href="/login"
              className="text-[14px] font-medium text-[#b8b3b0] no-underline transition-colors hover:text-[#2fd6a1]"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="inline-block border border-[#3d3a39] bg-[#101010] px-[18px] py-[10px] text-[14px] font-semibold text-[#2fd6a1] no-underline transition-colors hover:border-[#00d992]"
            >
              회원가입
            </Link>
          </>
        )}
      </div>

      {/* Mobile Hamburger */}
      <div className="md:hidden">
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
