"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState("loading");
  const [message, setMessage] = useState("Connecting your X account...");

  useEffect(() => {
    let active = true;

    async function completeOauth() {
      const code = searchParams.get("code");
      const oauthState = searchParams.get("state");
      const err = searchParams.get("error");

      if (err) {
        if (!active) return;
        setState("error");
        setMessage(`Authorization failed: ${err}`);
        return;
      }

      if (!code || !oauthState) {
        if (!active) return;
        setState("error");
        setMessage("Missing code/state in callback URL.");
        return;
      }

      try {
        const response = await fetch("/api/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, state: oauthState }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error || "OAuth callback failed");
        }

        if (!active) return;
        setState("success");
        setMessage("X account connected successfully. Redirecting to dashboard...");

        setTimeout(() => {
          router.replace("/dashboard");
        }, 1200);
      } catch (error) {
        if (!active) return;
        setState("error");
        setMessage(error.message || "Failed to connect X account");
      }
    }

    completeOauth();

    return () => {
      active = false;
    };
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#070709] text-slate-200 flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <h1 className="text-xl font-bold text-white mb-2">X OAuth Callback</h1>
        <p
          className={`text-sm ${
            state === "error"
              ? "text-rose-300"
              : state === "success"
                ? "text-emerald-300"
                : "text-slate-300"
          }`}
        >
          {message}
        </p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070709] text-slate-200 flex items-center justify-center">
          Connecting your X account...
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}