import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../lib/mongodb";
import Usage from "../lib/models/Usage";
import User from "../lib/models/User";
import { getCurrentMonth, TIER_LIMITS } from "../lib/helpers";

// GET: Return current month's usage for the authenticated user
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

    const month = getCurrentMonth();
    const limits = TIER_LIMITS[user.tier] || TIER_LIMITS.free;

    // Find or create usage record for current month
    let usage = await Usage.findOne({ user_id: user._id, month });

    if (!usage) {
      usage = await Usage.create({
        user_id: user._id,
        month,
        videos_used: 0,
        videos_limit: limits.videos,
        images_used: 0,
        images_limit: limits.images,
      });
    }

    return NextResponse.json({
      tier: user.tier,
      month: usage.month,
      videos_used: usage.videos_used,
      videos_limit: usage.videos_limit,
      images_used: usage.images_used,
      images_limit: usage.images_limit,
    });
  } catch (error) {
    console.error("[USAGE ERROR]", error);
    return NextResponse.json(
      { error: "Failed to get usage" },
      { status: 500 }
    );
  }
}
