import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import Post from "../../lib/models/Post";
import { enqueueXPost } from "../../lib/queue";
import { isXConnected } from "../../lib/x-client";

function parseScheduleTime(input) {
  if (!input) return null;
  const dt = new Date(input);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, scheduled_at } = await request.json();
    if (!content || typeof content !== "string" || !content.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const scheduledAt = parseScheduleTime(scheduled_at);
    if (scheduled_at && !scheduledAt) {
      return NextResponse.json(
        { error: "scheduled_at must be a valid ISO date" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.tier === "free") {
      return NextResponse.json(
        { error: "Upgrade required to post on connected social accounts" },
        { status: 403 }
      );
    }

    const connected = await isXConnected(user._id);
    if (!connected) {
      return NextResponse.json(
        { error: "X account not connected" },
        { status: 400 }
      );
    }

    const post = await Post.create({
      user_id: user._id,
      title: content.trim().slice(0, 80),
      platform: "twitter",
      content: content.trim(),
      notes: "",
      scheduled_at: scheduledAt,
      status: "scheduled",
    });

    const scheduledMs = scheduledAt ? scheduledAt.getTime() : Date.now();
    const delayMs = Math.max(0, scheduledMs - Date.now());

    const job = await enqueueXPost({
      userId: user._id.toString(),
      postId: post._id.toString(),
      platform: "x",
      content: content.trim(),
      scheduledAt: scheduledAt ? scheduledAt.toISOString() : null,
    }, delayMs);

    post.queue_job_id = String(job.id || "");
    await post.save();

    return NextResponse.json(
      {
        success: true,
        post_id: post._id.toString(),
        queue_job_id: String(job.id || ""),
        scheduled_at: scheduledAt ? scheduledAt.toISOString() : null,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POST X ERROR]", error);
    return NextResponse.json(
      { error: "Failed to enqueue X post" },
      { status: 500 }
    );
  }
}