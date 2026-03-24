"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const CREATOR_TIERS = new Set(["creator", "pro", "agency"]);
const ADMIN_EMAILS = new Set([
  "shibajyoti.maity06@gmail.com",
  "dipakmaity903@gmail.com",
  "debajyoti.maity29@gmail.com",
]);

const PLATFORM_OPTIONS = ["twitter", "linkedin", "instagram", "tiktok", "youtube", "blog"];

function toScheduleHref(idea) {
  const params = new URLSearchParams({
    title: idea.title || "Trend post",
    platform: idea.platform || "twitter",
    content: idea.content || "",
  });
  return `/scheduled?${params.toString()}`;
}

export default function TrendsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [result, setResult] = useState(null);

  const [manualForm, setManualForm] = useState({
    niche: "",
    topic: "",
    tags: "",
    platform: "multi",
    type: "manual",
    trend_score: "",
    examples: "",
    source_url: "",
    published_at: "",
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [adminFeedback, setAdminFeedback] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/trends");
    }
  }, [status, router]);

  const userTier = String(session?.user?.tier || "free").toLowerCase();
  const email = String(session?.user?.email || "").toLowerCase();
  const isCreatorOrAbove = CREATOR_TIERS.has(userTier);
  const isAdmin = ADMIN_EMAILS.has(email);

  const trends = useMemo(() => result?.trends || [], [result]);
  const ideas = useMemo(() => result?.ideas || [], [result]);

  async function handleDiscover(event) {
    event.preventDefault();
    if (!niche.trim()) {
      setFeedback("Enter your niche first.");
      return;
    }

    setFeedback("");
    setLoading(true);

    try {
      const response = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load trends");
      }

      setResult(data);
      setFeedback("Trend insights generated successfully.");
    } catch (error) {
      setResult(null);
      setFeedback(error.message || "Failed to fetch trends.");
    } finally {
      setLoading(false);
    }
  }

  async function submitManualTrend(event) {
    event.preventDefault();
    setAdminFeedback("");
    setAdminLoading(true);

    try {
      const response = await fetch("/api/trends/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          entry: {
            ...manualForm,
            tags: manualForm.tags,
            examples: manualForm.examples,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save manual trend");
      }

      setAdminFeedback("Manual trend saved.");
      setManualForm({
        niche: "",
        topic: "",
        tags: "",
        platform: "multi",
        type: "manual",
        trend_score: "",
        examples: "",
        source_url: "",
        published_at: "",
      });
    } catch (error) {
      setAdminFeedback(error.message || "Failed to save trend.");
    } finally {
      setAdminLoading(false);
    }
  }

  async function submitCsv(event) {
    event.preventDefault();
    setAdminFeedback("");
    setAdminLoading(true);

    try {
      const response = await fetch("/api/trends/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "csv", csvText }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "CSV import failed");
      }

      setAdminFeedback(
        `CSV processed: ${data.processed}/${data.rows} rows (inserted/updated: ${data.insertedOrUpdated}).`
      );
      setCsvText("");
    } catch (error) {
      setAdminFeedback(error.message || "CSV import failed.");
    } finally {
      setAdminLoading(false);
    }
  }

  async function onCsvFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setCsvText(text);
  }

  async function copyIdeaContent(idea) {
    try {
      await navigator.clipboard.writeText(idea.content || "");
      setFeedback("Idea copied to clipboard.");
    } catch {
      setFeedback("Could not copy. Please copy manually.");
    }
  }

  if (status === "loading") {
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

      <main className="max-w-6xl mx-auto px-6 py-8">
        <section className="bg-[#111116] border border-white/10 rounded-2xl p-6 mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Trend Insights</h1>
          <p className="text-sm text-slate-400 mb-6">
            Enter a niche, get trend-backed post ideas, then send them directly into your calendar.
          </p>

          {!isCreatorOrAbove ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-sm text-slate-300 mb-3">
                This feature is available on Creator tier ($24) and above.
              </p>
              <Link
                href="/pricing"
                className="inline-flex px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold"
              >
                Upgrade to Creator
              </Link>
            </div>
          ) : (
            <form onSubmit={handleDiscover} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder="e.g. productivity, fitness coaching, ai tools"
                className="flex-grow px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold disabled:opacity-50"
              >
                {loading ? "Finding trends..." : "Find Trends"}
              </button>
            </form>
          )}

          {feedback && <p className="mt-3 text-sm text-indigo-300">{feedback}</p>}
        </section>

        {isCreatorOrAbove && result && (
          <>
            <section className="bg-[#111116] border border-white/10 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-bold text-white">Trend Signals</h2>
              </div>

              {trends.length === 0 ? (
                <p className="text-sm text-slate-400">No trend signals found for this niche yet.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-3">
                  {trends.slice(0, 8).map((trend) => (
                    <article key={trend.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <p className="text-white font-semibold text-sm mb-1">{trend.topic}</p>
                      <p className="text-xs text-slate-400 mb-2">
                        {trend.platform} • score {trend.trendScore}
                      </p>
                      <p className="text-xs text-indigo-300">
                        {(trend.tags || []).slice(0, 5).join(" • ") || "No tags"}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-[#111116] border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-lg font-bold text-white mb-4">AI-Generated Trend Content</h2>

              {ideas.length === 0 ? (
                <p className="text-sm text-slate-400">No ideas generated yet for this niche.</p>
              ) : (
                <div className="space-y-4">
                  {ideas.map((idea, idx) => (
                    <article key={`${idea.title}-${idx}`} className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-white font-semibold">{idea.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-400/20 text-indigo-300 uppercase">
                          {idea.platform}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 whitespace-pre-wrap mb-3">{idea.content}</p>

                      {idea.hashtags?.length > 0 && (
                        <p className="text-xs text-cyan-300 mb-3">{idea.hashtags.join(" ")}</p>
                      )}

                      {idea.whyNow && <p className="text-xs text-slate-400 mb-3">Why now: {idea.whyNow}</p>}

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => copyIdeaContent(idea)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-white/10 border border-white/10 text-white hover:bg-white/15"
                        >
                          Copy Content
                        </button>
                        <Link
                          href={toScheduleHref(idea)}
                          className="px-3 py-1.5 rounded-lg text-xs bg-emerald-500/15 border border-emerald-400/20 text-emerald-300 hover:bg-emerald-500/20"
                        >
                          Send to Calendar
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {isAdmin && (
          <section className="bg-[#111116] border border-amber-500/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-1">Admin Trend Ingestion</h2>
            <p className="text-sm text-slate-400 mb-6">
              Visible only to allowlisted accounts. Use manual entry or bulk CSV import.
            </p>

            <div className="grid lg:grid-cols-2 gap-6">
              <form onSubmit={submitManualTrend} className="space-y-3">
                <h3 className="text-sm font-semibold text-amber-300">Manual Entry</h3>

                <input
                  type="text"
                  placeholder="Niche"
                  value={manualForm.niche}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, niche: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                />
                <input
                  type="text"
                  placeholder="Topic"
                  value={manualForm.topic}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, topic: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                />
                <input
                  type="text"
                  placeholder="Tags (comma or | separated)"
                  value={manualForm.tags}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={manualForm.type}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, type: e.target.value }))}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                  >
                    <option value="manual">manual</option>
                    <option value="youtube">youtube</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Platform (multi/youtube/etc)"
                    value={manualForm.platform}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, platform: e.target.value }))}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Trend Score"
                    value={manualForm.trend_score}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, trend_score: e.target.value }))}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                  />
                  <input
                    type="date"
                    value={manualForm.published_at}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, published_at: e.target.value }))}
                    className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Source URL (optional)"
                  value={manualForm.source_url}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, source_url: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                />

                <textarea
                  rows={4}
                  placeholder="Examples (new line or || separated)"
                  value={manualForm.examples}
                  onChange={(e) => setManualForm((prev) => ({ ...prev, examples: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm"
                />

                <button
                  type="submit"
                  disabled={adminLoading}
                  className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-200 text-sm font-semibold disabled:opacity-50"
                >
                  {adminLoading ? "Saving..." : "Save Manual Trend"}
                </button>
              </form>

              <form onSubmit={submitCsv} className="space-y-3">
                <h3 className="text-sm font-semibold text-amber-300">CSV Bulk Import</h3>

                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onCsvFileChange}
                  className="w-full text-xs text-slate-300"
                />

                <textarea
                  rows={12}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  placeholder={"niche,topic,tags,platform,type,trend_score,examples,source_url,published_at"}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-mono"
                />

                <button
                  type="submit"
                  disabled={adminLoading || !csvText.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-sm font-semibold disabled:opacity-50"
                >
                  {adminLoading ? "Importing..." : "Import CSV"}
                </button>
              </form>
            </div>

            {adminFeedback && <p className="mt-4 text-sm text-amber-200">{adminFeedback}</p>}
          </section>
        )}
      </main>
    </div>
  );
}
