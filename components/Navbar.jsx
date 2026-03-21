"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { data: session, status } = useSession();
  const isLoading = status === "loading";
  const mobileLinks = session
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/trends", label: "Trends" },
        { href: "/scheduled", label: "Scheduled" },
        { href: "/history", label: "History" },
        { href: "/pricing", label: "Pricing" },
      ]
    : [
        { href: "/#demo", label: "Demo" },
        { href: "/#features", label: "Features" },
        { href: "/#stats", label: "Customers" },
        { href: "/#faq", label: "FAQ" },
        { href: "/pricing", label: "Pricing" },
      ];

  return (
    <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
        <div className="relative w-12 h-12 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105">
          <Image
            src="/logo.png"
            alt="VyralPro logo"
            fill
            sizes="48px"
            className="object-contain"
            priority
          />
        </div>
        <span className="text-2xl font-black tracking-tight text-white group-hover:text-indigo-100 transition-colors">
          VyralPro
        </span>
      </Link>

      {session ? (
        /* Logged-in nav */
        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-white/70">
          <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          <Link href="/trends" className="hover:text-white transition-colors">Trends</Link>
          <Link href="/scheduled" className="hover:text-white transition-colors">Scheduled</Link>
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

      <div className="hidden md:flex items-center gap-3">
        {isLoading ? (
          <div className="w-20 h-9 rounded-full bg-white/5 animate-pulse" />
        ) : session ? (
          <div className="flex items-center gap-3">
            
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

      <button
        type="button"
        onClick={() => setIsMobileOpen((prev) => !prev)}
        className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-full border border-white/20 bg-white/10 text-white"
        aria-label="Toggle menu"
        aria-expanded={isMobileOpen}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isMobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      </div>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="md:hidden overflow-hidden mt-4 rounded-2xl border border-white/10 bg-black/45 backdrop-blur-xl"
          >
            <div className="px-4 py-3 flex flex-col gap-2">
              {mobileLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="px-3 py-2 rounded-lg text-white/85 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              {session ? (
                <button
                  onClick={() => {
                    setIsMobileOpen(false);
                    signOut({ callbackUrl: "/" });
                  }}
                  className="mt-2 px-3 py-2 rounded-lg text-left text-red-300 hover:text-red-200 hover:bg-red-500/15 transition-colors"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setIsMobileOpen(false)}
                  className="mt-2 px-3 py-2 rounded-lg bg-white text-black font-semibold text-center"
                >
                  Start for Free
                </Link>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
