import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../lib/mongodb";
import User from "../lib/models/User";
import Trend from "../lib/models/Trend";
import { callGroq } from "../lib/ai-client";
import { searchTrendingVideosByNiche } from "../lib/yt";

const CREATOR_TIERS = new Set(["creator", "pro", "agency"]);

function isCreatorTier(tier) {
  return CREATOR_TIERS.has(String(tier || "").toLowerCase());
}

function sanitizeNiche(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildFuzzyQuery(niche) {
  const normalized = sanitizeNiche(niche);
  const tokens = normalized
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length >= 3)
    .slice(0, 6);

  const exactRegex = new RegExp(escapeRegex(normalized), "i");
  const tokenRegexes = tokens.map((token) => new RegExp(escapeRegex(token), "i"));

  const orClauses = [
    { niche: exactRegex },
    { topic: exactRegex },
    { tags: { $in: [exactRegex] } },
  ];

  for (const tokenRegex of tokenRegexes) {
    orClauses.push({ niche: tokenRegex });
    orClauses.push({ topic: tokenRegex });
    orClauses.push({ tags: { $in: [tokenRegex] } });
  }

  return { $or: orClauses };
}

function fallbackIdeasFromSource(sourceItems, niche) {
  return sourceItems.slice(0, 3).map((item, idx) => {
    const baseTitle = item.topic || item.title || `Trending idea ${idx + 1}`;
    const shortContent = (item.description || "").slice(0, 220);

    return {
      title: `${baseTitle}`,
      platform: "twitter",
      content: `${baseTitle}\n\n${shortContent}\n\nWhat is your take on this in ${niche}?`,
      hashtags: [
        `#${niche.replace(/\s+/g, "")}`,
        "#contentcreation",
        "#creator",
      ],
      scheduledDate: new Date(Date.now() + (idx + 1) * 86400000).toISOString().slice(0, 10),
      scheduledTime: "09:00",
      whyNow: "Aligned with currently high-view momentum.",
    };
  });
}

function normalizeAiIdeas(parsed, fallback) {
  if (!parsed || !Array.isArray(parsed.ideas) || parsed.ideas.length === 0) {
    return fallback;
  }

  return parsed.ideas.slice(0, 3).map((idea, idx) => ({
    title: String(idea.title || `Trend idea ${idx + 1}`).trim(),
    platform: String(idea.platform || "twitter").toLowerCase(),
    content: String(idea.content || "").trim(),
    hashtags: Array.isArray(idea.hashtags)
      ? idea.hashtags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    scheduledDate: String(idea.scheduledDate || "").slice(0, 10) || new Date().toISOString().slice(0, 10),
    scheduledTime: String(idea.scheduledTime || "09:00").slice(0, 5),
    whyNow: String(idea.whyNow || "").trim(),
  }));
}

async function buildIdeasWithAI({ niche, sourceType, sourceItems }) {
  const fallback = fallbackIdeasFromSource(sourceItems, niche);

  const compactSource = sourceItems.slice(0, 12).map((item) => ({
    topic: item.topic || item.title,
    trend_score: item.trend_score || item.viewCount || 0,
    platform: item.platform || "multi",
    tags: item.tags || [],
    description: (item.description || "").slice(0, 280),
    publishedAt: item.published_at || item.publishedAt || null,
  }));

  const system =
    "You are a viral social content strategist. Return strict JSON with an ideas array only.";

  const user = JSON.stringify({
    task: "Create post/blog-ready trend ideas that can be scheduled on a content calendar.",
    niche,
    sourceType,
    outputSchema: {
      ideas: [
        {
          title: "string",
          platform: "twitter|linkedin|tiktok|instagram|youtube|blog",
          content: "string",
          hashtags: ["string"],
          scheduledDate: "YYYY-MM-DD",
          scheduledTime: "HH:MM",
          whyNow: "string",
        },
      ],
    },
    constraints: [
      "Keep each content piece practical and post-ready.",
      "Prefer clear hooks and audience value.",
      "Generate exactly 3 ideas.",
    ],
    source: compactSource,
  });

  try {
    const raw = await callGroq([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    const parsed = JSON.parse(raw);
    return normalizeAiIdeas(parsed, fallback);
  } catch (error) {
    console.error("[TRENDS AI FALLBACK]", error.message);
    return fallback;
  }
}

function toClientTrend(trendDoc) {
  return {
    id: trendDoc._id?.toString?.() || trendDoc.id,
    niche: trendDoc.niche || "",
    topic: trendDoc.topic || "",
    platform: trendDoc.platform || "multi",
    tags: trendDoc.tags || [],
    trendScore: trendDoc.trend_score || 0,
    type: trendDoc.type || "manual",
    detectedAt: trendDoc.detected_at || trendDoc.createdAt,
    sourceUrl: trendDoc.source_url || "",
  };
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!isCreatorTier(user.tier)) {
      return NextResponse.json(
        { error: "Trend insights are available on Creator tier and above." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const niche = sanitizeNiche(body?.niche);

    if (!niche || niche.length < 2) {
      return NextResponse.json({ error: "Please enter a niche." }, { status: 400 });
    }

    const dbTrends = await Trend.find(buildFuzzyQuery(niche))
      .sort({ trend_score: -1, detected_at: -1 })
      .limit(25)
      .lean();

    if (dbTrends.length > 0) {
      const ideas = await buildIdeasWithAI({
        niche,
        sourceType: "database",
        sourceItems: dbTrends,
      });

      return NextResponse.json({
        source: "database",
        niche,
        trends: dbTrends.map(toClientTrend),
        ideas,
      });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "No trend data found and YouTube API key is not configured." },
        { status: 503 }
      );
    }

    const youtubeTrends = await searchTrendingVideosByNiche(niche, apiKey, 5, 25);

    if (youtubeTrends.length === 0) {
      return NextResponse.json({
        source: "youtube",
        niche,
        trends: [],
        ideas: [],
      });
    }

    const normalizedNiche = niche.toLowerCase();
    const tokenTags = normalizedNiche.split(/\s+/).filter(Boolean).slice(0, 5);

    const bulkOps = youtubeTrends.map((item) => ({
      updateOne: {
        filter: { source_video_id: item.videoId },
        update: {
          $set: {
            niche: normalizedNiche,
            platform: "youtube",
            topic: item.title,
            tags: tokenTags,
            type: "youtube",
            source_video_id: item.videoId,
            source_url: item.url,
            trend_score: item.viewCount,
            examples: [
              {
                title: item.title,
                channel: item.channelTitle,
                url: item.url,
                thumbnail: item.thumbnail,
                viewCount: item.viewCount,
              },
            ],
            detected_at: new Date(),
            published_at: item.publishedAt ? new Date(item.publishedAt) : null,
          },
        },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      try {
        await Trend.bulkWrite(bulkOps, { ordered: false });
      } catch (error) {
        console.error("[TRENDS BULK UPSERT ERROR]", error.message);
      }
    }

    const ideas = await buildIdeasWithAI({
      niche,
      sourceType: "youtube",
      sourceItems: youtubeTrends,
    });

    return NextResponse.json({
      source: "youtube",
      niche,
      trends: youtubeTrends.map((item) => ({
        id: item.videoId,
        niche: normalizedNiche,
        topic: item.title,
        platform: "youtube",
        tags: tokenTags,
        trendScore: item.viewCount,
        type: "youtube",
        detectedAt: new Date().toISOString(),
        sourceUrl: item.url,
      })),
      ideas,
    });
  } catch (error) {
    console.error("[TRENDS SEARCH ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch trend insights" }, { status: 500 });
  }
}
