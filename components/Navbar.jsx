"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  return (
    <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3 group cursor-pointer">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span className="text-2xl font-black tracking-tight text-white group-hover:text-indigo-100 transition-colors">
          Currents
        </span>
      </Link>

      {session ? (
        /* Logged-in nav */
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/70">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/history" className="hover:text-white transition-colors">History</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        </nav>
      ) : (
        /* Public nav */
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/70">
          <a href="/#demo" className="hover:text-white transition-colors">Demo</a>
          <a href="/#features" className="hover:text-white transition-colors">Features</a>
          <a href="/#stats" className="hover:text-white transition-colors">Customers</a>
          <a href="/#faq" className="hover:text-white transition-colors">FAQ</a>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
        </nav>
      )}

      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="w-20 h-9 rounded-full bg-white/5 animate-pulse" />
        ) : session ? (
          <div className="flex items-center gap-3">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full border-2 border-white/20"
              />
            )}
            <span className="hidden sm:block text-sm font-semibold text-white/80 max-w-[100px] truncate">
              {session.user?.name?.split(" ")[0]}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-white/70 text-sm font-semibold hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300 transition-all duration-300"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <>
            <Link
              href="/auth/signin"
              className="hidden sm:inline-block text-sm font-semibold text-white/70 hover:text-white transition-colors"
            >
              Log In
            </Link>
            <Link href="/auth/signin">
              <button className="px-6 py-2.5 rounded-full border border-white/10 bg-white/10 backdrop-blur-md text-white text-sm font-bold shadow-sm hover:bg-white hover:text-black transition-all hover:scale-105 duration-300">
                Start for Free
              </button>
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
