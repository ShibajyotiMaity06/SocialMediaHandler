import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import Post from "../../lib/models/Post";

function parseScheduledAt(date, time) {
  if (!date || !time) return null;
  const dt = new Date(`${date}T${time}:00`);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

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

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;
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

    const post = await Post.findOneAndUpdate(
      { _id: postId, user_id: user._id },
      {
        title: title.trim(),
        platform,
        notes: typeof notes === "string" ? notes.trim() : "",
        content: typeof content === "string" ? content.trim() : "",
        scheduled_at: scheduledAt,
        status: "scheduled",
      },
      { returnDocument: "after" }
    );

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post: toClientPost(post) });
  } catch (error) {
    console.error("[POSTS UPDATE ERROR]", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { postId } = await params;

    await dbConnect();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const deleted = await Post.findOneAndDelete({ _id: postId, user_id: user._id });
    if (!deleted) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POSTS DELETE ERROR]", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
