import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../lib/mongodb";
import Adaptation from "../lib/models/Adaptation";
import User from "../lib/models/User";

// GET: List all adaptations for the authenticated user
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

    const adaptations = await Adaptation.find({ user_id: user._id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ adaptations });
  } catch (error) {
    console.error("[ADAPTATIONS LIST ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get adaptations" },
      { status: 500 }
    );
  }
}

// POST: Save a new adaptation record
export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { video_id, video_title, extracted_content, platforms } = await req.json();

    if (!video_id || !video_title) {
      return NextResponse.json(
        { error: "video_id and video_title are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const adaptation = await Adaptation.create({
      user_id: user._id,
      video_id,
      video_title,
      extracted_content: extracted_content || {},
      platforms: platforms || [],
    });

    return NextResponse.json(
      { adaptation, message: "Adaptation saved" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ADAPTATIONS SAVE ERROR]", error);
    return NextResponse.json(
      { error: "Failed to save adaptation" },
      { status: 500 }
    );
  }
}
