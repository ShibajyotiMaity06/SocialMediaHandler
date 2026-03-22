"use client";

import { useEffect, useState } from "react";

export default function ConnectXButton() {
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadStatus() {
      try {
        setLoading(true);
        const response = await fetch("/api/auth/x/status");
        const payload = await response.json();
        if (!active) return;
        setConnected(Boolean(payload?.connected));
      } catch (_err) {
        if (!active) return;
        setError("Could not load X connection status");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadStatus();

    return () => {
      active = false;
    };
  }, []);

  async function handleConnect() {
    try {
      setConnecting(true);
      setError("");

      const response = await fetch("/api/auth/init");
      const payload = await response.json();

      if (!response.ok || !payload?.authorize_url) {
        throw new Error(payload?.error || "Failed to start X OAuth");
      }

      window.location.assign(payload.authorize_url);
    } catch (err) {
      setError(err.message || "Failed to start X OAuth");
      setConnecting(false);
    }
  }

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-sm"
      >
        Checking X...
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {connected ? (
        <div className="px-4 py-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 text-sm font-semibold">
          Connected to X ✅
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-400 text-[#05232d] text-sm font-bold hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {connecting ? "Connecting..." : "Connect X"}
        </button>
      )}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}