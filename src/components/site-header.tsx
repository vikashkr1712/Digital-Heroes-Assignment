import Link from "next/link";

import { getCurrentUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-[#0f2a2a]/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 text-white sm:px-6">
        <Link href="/" className="font-serif text-lg tracking-wide sm:text-xl">
          Digital Heroes Impact Draw
        </Link>

        <nav className="flex items-center gap-3 text-sm sm:gap-4">
          <Link href="/charities" className="rounded-full px-3 py-1.5 hover:bg-white/10">
            Charities
          </Link>

          {user ? (
            <>
              {user.role === "ADMIN" ? (
                <Link href="/admin" className="rounded-full px-3 py-1.5 hover:bg-white/10">
                  Admin
                </Link>
              ) : (
                <Link href="/dashboard" className="rounded-full px-3 py-1.5 hover:bg-white/10">
                  Dashboard
                </Link>
              )}
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full px-3 py-1.5 hover:bg-white/10">
                Login
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-[#d9b160] px-4 py-1.5 font-semibold text-[#102727] transition hover:bg-[#e2c178]"
              >
                Join now
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
