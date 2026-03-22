import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../lib/mongodb";
import User from "../lib/models/User";
import Post from "../lib/models/Post";
import { enqueueXPost } from "../lib/queue";
import { isXConnected } from "../lib/x-client";

function toClientPost(postDoc) {
  const scheduled = postDoc.scheduled_at ? new Date(postDoc.scheduled_at) : new Date();
  const date = `${scheduled.getFullYear()}-${String(scheduled.getMonth() + 1).padStart(2, "0")}-${String(
    scheduled.getDate()
  ).padStart(2, "0")}`;
  const time = `${String(scheduled.getHours()).padStart(2, "0")}:${String(scheduled.getMinutes()).padStart(2, "0")}`;

  return {
    id: postDoc._id.toString(),
    title: postDoc.title || "Untitled post",
    platform: postDoc.platform,
    date,
    time,
    notes: postDoc.notes || "",
    content: postDoc.content || "",
    status: postDoc.status,
  };
}

function parseScheduledAt(date, time) {
  if (!date || !time) return null;
  const dt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function isXPlatform(platform) {
  const normalized = String(platform || "").toLowerCase();
  return normalized === "twitter" || normalized === "x";
}

export async function GET() {
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

    const posts = await Post.find({
      user_id: user._id,
      status: { $in: ["scheduled", "draft"] },
      scheduled_at: { $ne: null },
    })
      .sort({ scheduled_at: 1 })
      .lean();

    return NextResponse.json({ posts: posts.map(toClientPost) });
  } catch (error) {
    console.error("[POSTS LIST ERROR]", error);
    return NextResponse.json({ error: "Failed to list posts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, platform, date, time, notes, content } = await request.json();

    if (!title?.trim() || !platform || !date || !time) {
      return NextResponse.json(
        { error: "title, platform, date and time are required" },
        { status: 400 }
      );
    }

    const scheduledAt = parseScheduledAt(date, time);
    if (!scheduledAt) {
      return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const xPost = isXPlatform(platform);
    if (xPost && !content?.trim()) {
      return NextResponse.json(
        { error: "Post text is required for X/Twitter posts" },
        { status: 400 }
      );
    }

    if (xPost) {
      const connected = await isXConnected(user._id);
      if (!connected) {
        return NextResponse.json(
          { error: "Connect X account before scheduling X posts" },
          { status: 400 }
        );
      }
    }

    const post = await Post.create({
      user_id: user._id,
      title: title.trim(),
      platform,
      content: typeof content === "string" ? content.trim() : "",
      notes: typeof notes === "string" ? notes.trim() : "",
      scheduled_at: scheduledAt,
      status: "scheduled",
    });

    if (xPost) {
      const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
      const job = await enqueueXPost(
        {
          userId: user._id.toString(),
          postId: post._id.toString(),
          platform: "x",
          content: content.trim(),
          scheduledAt: scheduledAt.toISOString(),
        },
        delayMs
      );

      post.queue_job_id = String(job.id || "");
      await post.save();
    }

    return NextResponse.json({ post: toClientPost(post) }, { status: 201 });
  } catch (error) {
    console.error("[POSTS CREATE ERROR]", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
