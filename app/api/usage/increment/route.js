import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../lib/mongodb";
import Usage from "../../lib/models/Usage";
import User from "../../lib/models/User";
import { getCurrentMonth, TIER_LIMITS } from "../../lib/helpers";

// POST: Increment videos_used by 1
export async function POST() {
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

    const month = getCurrentMonth();
    const limits = TIER_LIMITS[user.tier] || TIER_LIMITS.free;

    let usage = await Usage.findOneAndUpdate(
      { user_id: user._id, month },
      {
        $inc: { videos_used: 1 },
        $setOnInsert: {
          videos_limit: limits.videos,
          images_used: 0,
          images_limit: limits.images,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({
      videos_used: usage.videos_used,
      videos_limit: usage.videos_limit,
    });
  } catch (error) {
    console.error("[USAGE INCREMENT ERROR]", error);
    return NextResponse.json(
      { error: "Failed to increment usage" },
      { status: 500 }
    );
  }
}
