import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../lib/mongodb";
import Usage from "../../lib/models/Usage";
import User from "../../lib/models/User";
import { getCurrentMonth , TIER_LIMITS } from "../../lib/helpers";

// POST: Check if user can analyze another video
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

    const allowed = usage.videos_used < usage.videos_limit;

    return NextResponse.json({
      allowed,
      videos_used: usage.videos_used,
      videos_limit: usage.videos_limit,
      tier: user.tier,
    });
  } catch (error) {
    console.error("[USAGE CHECK ERROR]", error);
    return NextResponse.json(
      { error: "Failed to check usage" },
      { status: 500 }
    );
  }
}
