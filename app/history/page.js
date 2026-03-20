"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [adaptations, setAdaptations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/adaptations")
        .then((r) => r.json())
        .then((data) => {
          setAdaptations(data.adaptations || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-[#070709] text-slate-200">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Past Adaptations</h1>
          <Link
            href="/dashboard"
            className="text-sm text-indigo-400 font-semibold hover:text-indigo-300 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {adaptations.length === 0 ? (
          <div className="bg-[#111116] border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-slate-400 font-medium">
              No adaptations yet
            </p>
            <Link
              href="/dashboard"
              className="inline-block mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors"
            >
              Analyze Your First Video →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {adaptations.map((adaptation) => (
              <div
                key={adaptation._id}
                className="flex items-center justify-between p-5 bg-[#111116] border border-white/10 rounded-xl hover:bg-[#16161b] transition-colors"
              >
                <div className="flex-grow min-w-0">
                  <h3 className="text-white font-semibold truncate">
                    {adaptation.video_title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-xs text-slate-500">
                      {new Date(adaptation.created_at).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )}
                    </span>
                    {adaptation.platforms?.length > 0 && (
                      <span className="text-xs text-slate-500">
                        • {adaptation.platforms.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/adapt/${adaptation.video_id}`}
                  className="px-4 py-2 text-sm font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition-colors ml-4"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
