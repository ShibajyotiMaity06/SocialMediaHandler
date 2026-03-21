import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import Trend from "../../lib/models/Trend";

const ALLOWED_ADMIN_EMAILS = new Set([
  "shibajyoti.maity06@gmail.com",
  "dipakmaity903@gmail.com",
  "debajyoti.maity29@gmail.com",
]);

function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim().toLowerCase()).filter(Boolean);
  }

  return String(tags || "")
    .split(/[|,]/)
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
}

function normalizeExamples(examples) {
  if (Array.isArray(examples)) {
    return examples.map((entry) => String(entry).trim()).filter(Boolean);
  }

  return String(examples || "")
    .split(/\r?\n|\|\|/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(cell.trim());
      cell = "";
      continue;
    }

    cell += char;
  }

  cells.push(cell.trim());
  return cells;
}

function parseCsvRows(csvText) {
  const lines = String(csvText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || "";
    });
    row._extraColumns = values.slice(headers.length);
    return row;
  });
}

function getFirstValue(raw, keys) {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return "";
}

function extractTrendScore(raw) {
  const scoreCandidates = [];
  const primaryScore = Number(
    getFirstValue(raw, ["trend_score", "trendscore", "score", "trend score"])
  );

  if (Number.isFinite(primaryScore)) {
    scoreCandidates.push(primaryScore);
  }

  const extra = Array.isArray(raw._extraColumns) ? raw._extraColumns : [];
  for (const value of extra) {
    const num = Number(value);
    if (Number.isFinite(num)) {
      scoreCandidates.push(num);
    }
  }

  if (scoreCandidates.length === 0) {
    return 0;
  }

  return Math.max(0, Math.round(scoreCandidates.reduce((a, b) => a + b, 0) / scoreCandidates.length));
}

function toTrendDocument(raw) {
  const niche = String(getFirstValue(raw, ["niche", "category"]) || "").trim().toLowerCase();
  const topic = String(getFirstValue(raw, ["topic", "topics", "title"]) || "").trim();

  if (!niche || !topic) {
    return null;
  }

  const typeRaw = String(getFirstValue(raw, ["type"]) || "manual").trim().toLowerCase();
  const type = typeRaw === "youtube" ? "youtube" : "manual";

  const trendScore = extractTrendScore(raw);

  const publishedAtRaw = String(getFirstValue(raw, ["published_at", "publishedat", "published"]) || "").trim();
  const publishedAt = publishedAtRaw ? new Date(publishedAtRaw) : null;

  return {
    niche,
    platform: String(getFirstValue(raw, ["platform"]) || "multi").trim().toLowerCase(),
    topic,
    tags: normalizeTags(getFirstValue(raw, ["tags", "hashtags"])),
    type,
    source_video_id: String(getFirstValue(raw, ["source_video_id", "video_id", "videoid"]) || "").trim(),
    source_url: String(getFirstValue(raw, ["source_url", "url", "link"]) || "").trim(),
    trend_score: trendScore,
    examples: normalizeExamples(getFirstValue(raw, ["examples", "notes"])) ,
    detected_at: new Date(),
    published_at: publishedAt instanceof Date && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
  };
}

async function requireAdminUser() {
  const session = await getServerSession();

  if (!session?.user?.email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const email = session.user.email.toLowerCase();
  if (!ALLOWED_ADMIN_EMAILS.has(email)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  await dbConnect();

  const user = await User.findOne({ email });
  if (!user) {
    return { error: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }

  return { user };
}

export async function GET() {
  const auth = await requireAdminUser();
  if (auth.error) return auth.error;

  return NextResponse.json({ isAdmin: true });
}

export async function POST(request) {
  try {
    const auth = await requireAdminUser();
    if (auth.error) return auth.error;

    const body = await request.json();
    const mode = String(body?.mode || "manual").toLowerCase();

    if (mode === "manual") {
      const doc = toTrendDocument(body?.entry || {});
      if (!doc) {
        return NextResponse.json(
          { error: "Manual form requires at least niche and topic." },
          { status: 400 }
        );
      }

      const created = await Trend.create(doc);
      return NextResponse.json({
        success: true,
        mode,
        inserted: 1,
        trendId: created._id.toString(),
      });
    }

    if (mode === "csv") {
      const rows = parseCsvRows(body?.csvText || "");
      if (rows.length === 0) {
        return NextResponse.json(
          { error: "CSV is empty or invalid." },
          { status: 400 }
        );
      }

      const docs = rows.map(toTrendDocument).filter(Boolean);
      if (docs.length === 0) {
        return NextResponse.json(
          { error: "No valid trend rows were found in CSV." },
          { status: 400 }
        );
      }

      const operations = docs.map((doc) => ({
        updateOne: {
          filter: doc.source_video_id
            ? { source_video_id: doc.source_video_id }
            : {
                niche: doc.niche,
                topic: doc.topic,
                platform: doc.platform,
                type: doc.type,
              },
          update: { $set: doc },
          upsert: true,
        },
      }));

      const result = await Trend.bulkWrite(operations, { ordered: false });
      const inserted = (result.upsertedCount || 0) + (result.modifiedCount || 0);

      return NextResponse.json({
        success: true,
        mode,
        rows: rows.length,
        processed: docs.length,
        insertedOrUpdated: inserted,
      });
    }

    return NextResponse.json(
      { error: "Invalid mode. Use manual or csv." },
      { status: 400 }
    );
  } catch (error) {
    console.error("[TRENDS ADMIN ERROR]", error);
    return NextResponse.json({ error: "Failed to ingest trends" }, { status: 500 });
  }
}
