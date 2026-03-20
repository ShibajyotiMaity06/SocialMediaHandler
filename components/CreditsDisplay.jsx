"use client";

import { useSession } from "next-auth/react";

export default function CreditsDisplay() {
  const { data: session, status } = useSession();

  const credits = session?.user?.credits ?? 3;
  const isLoading = status === "loading";

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/15 to-amber-500/15 border border-yellow-500/25 backdrop-blur-md select-none">
      {/* Coin Icon */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <circle cx="12" cy="12" r="10" fill="url(#coinGrad)" stroke="#b8860b" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="7.5" fill="none" stroke="#b8860b" strokeWidth="0.7" opacity="0.5" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fontSize="10"
          fontWeight="bold"
          fill="#7c5e00"
          fontFamily="sans-serif"
        >
          $
        </text>
        <defs>
          <linearGradient id="coinGrad" x1="4" y1="4" x2="20" y2="20">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="50%" stopColor="#ffec80" />
            <stop offset="100%" stopColor="#f0b800" />
          </linearGradient>
        </defs>
      </svg>

      {/* Credit Count */}
      <span className="text-sm font-bold text-yellow-300 tabular-nums min-w-[1ch]">
        {isLoading ? "—" : credits}
      </span>
    </div>
  );
}
