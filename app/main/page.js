"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import CreditsDisplay from "@/components/CreditsDisplay";

export default function Main() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Please enter a valid YouTube channel URL or @handle.");
      return;
    }

    setError("");
    setLoading(true);
    router.push(`/channel?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="flex-grow flex flex-col">
      {/* Mini Header */}
      <div className="w-full px-6 py-4 flex items-center justify-between border-b border-gray-200/10 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Currents</span>
        </Link>
        <div className="flex items-center gap-3">
          <CreditsDisplay />
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-xs font-semibold text-gray-500 hover:text-red-400 transition-colors"
            >
              Sign Out
            </button>
          ) : (
            <Link href="/auth/signin" className="text-xs font-semibold text-gray-500 hover:text-blue-500 transition-colors">
              Sign In
            </Link>
          )}
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-6 mt-6 sm:mt-12">
      <div className="max-w-2xl w-full">
        {/* Glassmorphic Card */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          
          {/* Subtle Glow inside the card */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analyze any YouTube Channel</h2>
              <p className="text-gray-500 dark:text-gray-400">Enter a handle or URL to instantly fetch their latest videos and analyze performance.</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch gap-4">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="e.g. @MrBeast or https://youtube.com/@..."
                  value={value}
                  onChange={(e) => {
                    setValue(e.target.value);
                    if (error) setError("");
                  }}
                  className="w-full pl-11 pr-4 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all text-gray-900 dark:text-white placeholder-gray-400 font-medium"
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-2xl shadow-lg hover:shadow-blue-500/30 transition-all duration-300 flex items-center justify-center whitespace-nowrap"
              >
                {loading ? (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : 'Get Data'}
              </button>
            </form>
            
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center animate-in slide-in-from-top-2">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                {error}
              </div>
            )}
            
            <div className="mt-8 flex justify-center gap-2">
              <span className="text-xs text-gray-400">Try these tags:</span>
              <button onClick={() => setValue("@MrBeast")} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md transition-colors">@MrBeast</button>
              <button onClick={() => setValue("@mkbhd")} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md transition-colors">@mkbhd</button>
              <button onClick={() => setValue("@veritasium")} className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md transition-colors">@veritasium</button>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

