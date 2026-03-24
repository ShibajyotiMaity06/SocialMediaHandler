"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingChannelInput() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = value.trim();

    if (!trimmed) {
      setError("Please enter a YouTube channel URL or @handle.");
      return;
    }

    setError("");
    setLoading(true);
    router.push(`/channel?url=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto relative group animate-fade-in-up"
      style={{ animationDelay: "400ms" }}
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
      <div className="relative bg-[#1a1a24]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col min-h-[110px] transition-all hover:border-white/20">
        <textarea
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) {
              setError("");
            }
          }}
          placeholder="Paste any YouTube handle or channel link here..."
          className="flex-grow w-full bg-transparent text-white text-base lg:text-lg font-medium outline-none px-4 pt-3 pb-2 resize-none placeholder:text-gray-500"
          rows="2"
          aria-label="YouTube channel URL or handle"
        />

        {error && (
          <p className="px-4 pb-1 text-sm text-red-300" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between px-2 pb-1">
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium transition-colors"
            onClick={() => setValue("@MrBeast")}
          >
            <span className="text-lg leading-none">+</span> Try @MrBeast
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-10 h-10 rounded-full bg-white hover:bg-indigo-50 disabled:bg-slate-300 flex items-center justify-center text-indigo-600 shadow-md transition-transform hover:scale-105 disabled:hover:scale-100"
            aria-label="Analyze channel"
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg className="w-5 h-5 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
