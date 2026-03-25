import Link from "next/link";
import { mainNavItems } from "@/constants/navigation";
import { getVcxUser, isAdmin } from "@/lib/auth/get-vcx-user";
import { UserMenu } from "@/components/auth/user-menu";
import { GNBDropdown, MobileMenu } from "./gnb-dropdown";

function LockIcon() {
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
      className="ml-1"
    >
      <rect width="18" height="11" x="3" y="11" rx="0" ry="0" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default async function GNB() {
  const user = await getVcxUser();
  const admin = user ? isAdmin(user) : false;

  return (
    <nav className="sticky top-0 z-[100] h-[60px] bg-[#f0ebe2] border-b border-black/[0.08] flex items-center justify-between px-4 md:px-10">
      {/* Logo */}
      <Link href="/" className="no-underline flex items-baseline gap-[2px]">
        <span className="font-serif text-[17px] font-bold text-[#1a1a1a] tracking-[-0.3px]">
          ValueConnect
        </span>
        <span className="font-serif text-[17px] font-bold text-[#c9a84c]"> X</span>
      </Link>

      {/* Desktop Center Menu */}
      <div className="hidden md:flex items-center gap-8 text-[13.5px] font-[system-ui,sans-serif]">
        {mainNavItems.map((item) => {
          if (item.children) {
            return (
              <GNBDropdown
                key={item.label}
                label={item.label}
                items={item.children}
                requiresAuth={item.requiresAuth}
                isAuthenticated={!!user}
              />
            );
          }
          return (
            <Link
              key={item.label}
              href={item.href}
              className="no-underline text-[#555] font-normal border-b-[1.5px] border-transparent pb-[2px] flex items-center hover:text-[#1a1a1a] transition-colors"
            >
              {item.label}
              {item.requiresAuth && !user && <LockIcon />}
            </Link>
          );
        })}
      </div>

      {/* Desktop Right */}
      <div className="hidden md:flex items-center gap-5">
        {user ? (
          <UserMenu userName={user.name} isAdmin={admin} />
        ) : (
          <>
            <Link
              href="/login"
              className="text-[13.5px] font-[system-ui,sans-serif] text-[#1a1a1a] no-underline"
            >
              로그인
            </Link>
            <Link
              href="/invite/accept"
              className="text-[13.5px] font-[system-ui,sans-serif] bg-[#1a1a1a] text-[#f0ebe2] px-[18px] py-[9px] no-underline inline-block"
            >
              초대 확인하기 →
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
        />
      </div>
    </nav>
  );
}
