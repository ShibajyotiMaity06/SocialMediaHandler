"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const PLATFORM_OPTIONS = [
  { value: "tiktok", label: "TikTok", icon: "📱" },
  { value: "twitter", label: "Twitter/X", icon: "🐦" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "youtube", label: "YouTube", icon: "▶" },
  { value: "youtube_shorts", label: "YouTube Shorts", icon: "🎬" },
];

const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toFriendlyDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00`);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toFriendlyDateTime(post) {
  const date = new Date(`${post.date}T${post.time || "09:00"}`);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getMonthGrid(monthDate) {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (first.getDay() + 6) % 7;

  const cells = [];

  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    cells.push({
      day,
      dateKey: toDateKey(date),
      isToday: toDateKey(date) === toDateKey(new Date()),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
}

function getPlatformMeta(value) {
  return (
    PLATFORM_OPTIONS.find((p) => p.value === value) || {
      icon: "📝",
      label: value,
    }
  );
}

function isPastDateKey(dateKey) {
  const today = new Date();
  const todayAtMidnight = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const target = new Date(`${dateKey}T00:00:00`);
  return target < todayAtMidnight;
}

export default function ScheduledPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [posts, setPosts] = useState([]);
  const [usage, setUsage] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalState, setModalState] = useState({
    open: false,
    mode: "add",
    postId: null,
  });
  const [form, setForm] = useState({
    title: "",
    platform: "twitter",
    date: toDateKey(new Date()),
    time: "09:00",
    notes: "",
    content: "",
  });

  const prefillDoneRef = useRef(false);

  const isLockedTier = usage && usage.tier === "free";

  const loadPosts = useCallback(async () => {
    const postsRes = await fetch("/api/posts");
    const postsData = await postsRes.json();

    if (!postsRes.ok) {
      throw new Error(postsData.error || "Failed to fetch posts");
    }

    setPosts(postsData.posts || []);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const usageRes = await fetch("/api/usage");
      const usageData = await usageRes.json();

      if (!usageRes.ok) {
        throw new Error(usageData.error || "Failed to load usage");
      }

      setUsage(usageData);
      await loadPosts();
    } catch (error) {
      setFeedback(error.message || "Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  }, [loadPosts]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/scheduled");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      loadData();
    }
  }, [status, loadData]);

  useEffect(() => {
    if (status !== "authenticated" || loading || prefillDoneRef.current) {
      return;
    }

    const prefillTitle = searchParams.get("title");
    if (!prefillTitle) {
      prefillDoneRef.current = true;
      return;
    }

    const prefillPlatform = searchParams.get("platform") || "twitter";
    const prefillContent = searchParams.get("content") || "";
    const todayKey = toDateKey(new Date());

    setForm({
      title: prefillTitle,
      platform: prefillPlatform,
      date: todayKey,
      time: "09:00",
      notes: "",
      content: prefillContent,
    });
    setModalState({ open: true, mode: "add", postId: null });
    prefillDoneRef.current = true;
  }, [status, loading, searchParams]);

  const monthGrid = useMemo(() => getMonthGrid(monthCursor), [monthCursor]);

  const monthPosts = useMemo(() => {
    const cursorYear = monthCursor.getFullYear();
    const cursorMonth = monthCursor.getMonth();

    return posts.filter((post) => {
      const d = new Date(`${post.date}T00:00:00`);
      return d.getFullYear() === cursorYear && d.getMonth() === cursorMonth;
    });
  }, [posts, monthCursor]);

  const postMap = useMemo(() => {
    const map = new Map();

    for (const post of monthPosts) {
      const list = map.get(post.date) || [];
      list.push(post);
      map.set(post.date, list);
    }

    for (const [key, list] of map.entries()) {
      list.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
      map.set(key, list);
    }

    return map;
  }, [monthPosts]);

  const upcomingPosts = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    return posts
      .filter((post) => {
        const date = new Date(`${post.date}T${post.time || "09:00"}`);
        return date >= start && date <= end;
      })
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  }, [posts]);

  function openAddModal(dateKey) {
    if (isLockedTier) {
      setFeedback("Scheduling is available on Growth and above.");
      return;
    }

    if (isPastDateKey(dateKey)) {
      setFeedback("Date is over. You can only add posts for today or future dates.");
      return;
    }

    setForm({
      title: "",
      platform: "twitter",
      date: dateKey,
      time: "09:00",
      notes: "",
      content: "",
    });
    setModalState({ open: true, mode: "add", postId: null });
  }

  function openEditModal(post) {
    if (isLockedTier) {
      setFeedback("Scheduling is available on Growth and above.");
      return;
    }

    setForm({
      title: post.title,
      platform: post.platform,
      date: post.date,
      time: post.time,
      notes: post.notes || "",
      content: post.content || "",
    });
    setModalState({ open: true, mode: "edit", postId: post.id });
  }

  function closeModal() {
    setModalState({ open: false, mode: "add", postId: null });
  }

  async function savePost(event) {
    event.preventDefault();
    if (!form.title.trim()) return;

    try {
      setSaving(true);
      const endpoint =
        modalState.mode === "add"
          ? "/api/posts"
          : `/api/posts/${modalState.postId}`;
      const method = modalState.mode === "add" ? "POST" : "PATCH";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          platform: form.platform,
          date: form.date,
          time: form.time,
          notes: form.notes,
          content: form.content,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to save post");
      }

      await loadPosts();
      setFeedback(modalState.mode === "add" ? "Post scheduled." : "Post updated.");
      closeModal();
    } catch (error) {
      setFeedback(error.message || "Failed to save post.");
    } finally {
      setSaving(false);
    }
  }

  async function removePost() {
    if (modalState.mode !== "edit") return;

    try {
      setSaving(true);
      const response = await fetch(`/api/posts/${modalState.postId}`, {
        method: "DELETE",
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Failed to delete post");
      }

      await loadPosts();
      closeModal();
      setFeedback("Post deleted.");
    } catch (error) {
      setFeedback(error.message || "Failed to delete post.");
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status !== "authenticated") return null;

  return (
    <div className="min-h-screen bg-[#070709] text-slate-200">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-6 sm:py-8">
        <section className="bg-[#111116] border border-white/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Content Calendar</h1>
              <p className="text-sm text-slate-400">
                Plan your upcoming posts, edit quickly, and keep your next 7 days visible.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFeedback("Find Best Time is coming soon.")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-[#081418] font-bold text-sm hover:brightness-110 transition-all"
            >
              Find Best Time
            </button>
          </div>
        </section>

        {isLockedTier && (
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Scheduling is locked on Free. Upgrade to Growth to create and manage scheduled posts. {" "}
            <Link href="/pricing" className="font-bold underline hover:text-amber-100">
              Upgrade now
            </Link>
            .
          </div>
        )}

        {feedback && (
          <div className="mb-4 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-200">
            {feedback}
          </div>
        )}

        <section className="bg-[#111116] border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setMonthCursor(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                  )
                }
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() =>
                  setMonthCursor(
                    (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                  )
                }
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"
              >
                Next
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setMonthCursor(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10"
              >
                Today
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white">
              {monthCursor.toLocaleString(undefined, {
                month: "long",
                year: "numeric",
              })}
            </h2>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEK_DAYS.map((day) => (
              <div
                key={day}
                className="text-xs font-semibold text-slate-400 uppercase tracking-wide p-2 text-center"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {monthGrid.map((cell, index) => {
              if (!cell) {
                return (
                  <div
                    key={`blank-${index}`}
                    className="h-28 sm:h-32 rounded-xl border border-white/5 bg-white/[0.02]"
                  />
                );
              }

              const dayPosts = postMap.get(cell.dateKey) || [];
              const showHoverAdd = hoveredDate === cell.dateKey;
              const isPastDate = isPastDateKey(cell.dateKey);

              return (
                <div
                  key={cell.dateKey}
                  onClick={(event) => {
                    if (event.target === event.currentTarget) {
                      if (isPastDate) {
                        setFeedback("Date is over. You can only add posts for today or future dates.");
                        return;
                      }
                      openAddModal(cell.dateKey);
                    }
                  }}
                  onMouseEnter={() => setHoveredDate(cell.dateKey)}
                  onMouseLeave={() => setHoveredDate((prev) => (prev === cell.dateKey ? null : prev))}
                  className="h-28 sm:h-32 rounded-xl border border-white/10 bg-white/[0.03] p-2 flex flex-col gap-1 relative"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        cell.isToday
                          ? "text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 px-2 py-0.5 rounded-full"
                          : "text-slate-300"
                      }`}
                    >
                      {cell.day}
                    </span>

                    {showHoverAdd &&
                      (isPastDate ? (
                        <span className="text-[11px] px-2 py-1 rounded-md bg-amber-500/15 border border-amber-300/30 text-amber-200">
                          Date is over
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openAddModal(cell.dateKey)}
                          className="text-[11px] px-2 py-1 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30"
                        >
                          + Add Post
                        </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-hidden space-y-1">
                    {dayPosts.slice(0, 2).map((post) => {
                      const platform = getPlatformMeta(post.platform);
                      return (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => openEditModal(post)}
                          className="w-full text-left px-2 py-1 rounded-md bg-white/10 border border-white/10 hover:bg-white/15"
                        >
                          <div className="text-[11px] text-slate-200 truncate">
                            {platform.icon} {post.title}
                          </div>
                        </button>
                      );
                    })}

                    {dayPosts.length > 2 && (
                      <div className="text-[11px] text-slate-400 px-1">
                        +{dayPosts.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6 bg-[#111116] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-3">Upcoming Posts (next 7 days)</h3>

          {upcomingPosts.length === 0 ? (
            <div className="text-sm text-slate-400 border border-white/10 rounded-xl bg-white/[0.02] p-4">
              No upcoming posts yet. Hover a date in the calendar and click + Add Post.
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingPosts.map((post) => {
                const platform = getPlatformMeta(post.platform);
                return (
                  <button
                    type="button"
                    key={post.id}
                    onClick={() => openEditModal(post)}
                    className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.08]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm text-white font-semibold truncate">
                        {post.title}
                      </span>
                      <span className="text-xs text-slate-400">{toFriendlyDateTime(post)}</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      {platform.icon} {platform.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {modalState.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#12141a] p-5">
            <h4 className="text-lg font-bold text-white mb-1">
              {modalState.mode === "add" ? "Add Scheduled Post" : "Edit Scheduled Post"}
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              {modalState.mode === "add"
                ? `Create a post for ${toFriendlyDate(form.date)}.`
                : "Update details or delete this scheduled item."}
            </p>

            <form onSubmit={savePost} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Post title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Write a short post title"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs text-slate-400 block mb-1">Platform</label>
                  <select
                    value={form.platform}
                    onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                  >
                    {PLATFORM_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value} className="bg-[#12141a]">
                        {option.icon} {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs text-slate-400 block mb-1">Date</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    required
                  />
                </div>

                <div className="sm:col-span-1">
                  <label className="text-xs text-slate-400 block mb-1">Time</label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm((prev) => ({ ...prev, time: e.target.value }))}
                    className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notes (optional)</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any reminder for this post"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Post text (optional)</label>
                <textarea
                  rows={4}
                  value={form.content}
                  onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="Paste generated post content here"
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50 resize-none"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div>
                  {modalState.mode === "edit" && (
                    <button
                      type="button"
                      onClick={removePost}
                      disabled={saving}
                      className="px-3 py-2 rounded-lg border border-red-400/30 bg-red-500/10 text-red-300 text-sm hover:bg-red-500/20 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={saving}
                    className="px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-slate-300 text-sm hover:bg-white/10 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-[#061220] font-bold text-sm hover:brightness-110 disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : modalState.mode === "add"
                        ? "Save Post"
                        : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
