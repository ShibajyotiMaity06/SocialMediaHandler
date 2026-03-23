import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { callGemini } from "../../lib/ai-client";
import { getBestTimePrompt } from "../../lib/prompts";

const ALLOWED_PLATFORMS = new Set([
  "tiktok",
  "twitter",
  "linkedin",
  "instagram",
  "youtube",
  "youtube_shorts",
]);

const DAY_MAP = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

function parseModelJson(raw, label) {
  if (raw && typeof raw === "object") return raw;

  const text = String(raw ?? "").trim();
  if (!text) {
    throw new Error(`${label} returned empty response`);
  }

  const candidates = [text];

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) candidates.push(objectMatch[0].trim());

  const tried = new Set();
  for (const candidate of candidates) {
    if (!candidate || tried.has(candidate)) continue;
    tried.add(candidate);

    try {
      return JSON.parse(candidate);
    } catch {
      // Try next candidate
    }
  }

  throw new Error(`${label} returned invalid JSON`);
}

function normalizePlatforms(platforms) {
  if (!Array.isArray(platforms)) return [];

  return platforms
    .map((platform) => String(platform || "").toLowerCase())
    .filter((platform) => ALLOWED_PLATFORMS.has(platform));
}

function parseTimeSlotStart(timeSlot) {
  const match = String(timeSlot || "").match(/(\d{1,2}):(\d{2})/);
  if (!match) return "09:00";

  const h = Number(match[1]);
  const m = Number(match[2]);

  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return "09:00";
  }

  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function nextDateForDay(dayName) {
  const key = String(dayName || "").trim().toLowerCase();
  if (!(key in DAY_MAP)) {
    return null;
  }

  const targetDay = DAY_MAP[key];
  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentDay = base.getDay();

  let delta = (targetDay - currentDay + 7) % 7;
  if (delta === 0) {
    delta = 7;
  }

  base.setDate(base.getDate() + delta);
  return base;
}

function toDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const niche = String(body?.niche || "").trim();
    const targetAudience = String(body?.targetAudience || "").trim();
    const timezone = String(body?.timezone || "UTC").trim() || "UTC";
    const platforms = normalizePlatforms(body?.platforms);

    if (!niche || !targetAudience || platforms.length === 0) {
      return NextResponse.json(
        { error: "niche, targetAudience and at least one platform are required" },
        { status: 400 }
      );
    }

    const prompt = getBestTimePrompt({
      niche,
      targetAudience,
      platforms,
      timezone,
    });

    const raw = await callGemini(prompt.user, prompt.system, {
      temperature: 0.35,
      maxTokens: 1200,
    });

    const parsed = parseModelJson(raw, "Best time recommendation");
    const bestOverall = parsed?.best_overall || {};

    let scheduledDate = null;
    let scheduledTime = parseTimeSlotStart(bestOverall.time_slot);

    const isoCandidate = String(bestOverall.next_best_datetime_iso || "").trim();
    if (isoCandidate) {
      const dt = new Date(isoCandidate);
      if (!Number.isNaN(dt.getTime())) {
        scheduledDate = toDateKey(dt);
        scheduledTime = `${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
      }
    }

    if (!scheduledDate) {
      const fallbackDayDate = nextDateForDay(bestOverall.day_of_week);
      scheduledDate = toDateKey(fallbackDayDate || new Date(Date.now() + 24 * 60 * 60 * 1000));
    }

    return NextResponse.json({
      recommendation: parsed,
      schedule: {
        date: scheduledDate,
        time: scheduledTime,
      },
    });
  } catch (error) {
    console.error("[BEST TIME ERROR]", error);

    if (String(error?.message || "").includes("RATE_LIMIT")) {
      return NextResponse.json(
        { error: "Model is currently rate limited. Please try again shortly." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate best posting time" },
      { status: 500 }
    );
  }
}
