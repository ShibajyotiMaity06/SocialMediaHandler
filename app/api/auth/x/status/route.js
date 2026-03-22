import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../../lib/mongodb";
import User from "../../../lib/models/User";
import SocialAccount from "../../../lib/models/SocialAccount";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ connected: false }, { status: 404 });
    }

    const account = await SocialAccount.findOne({ user_id: user._id, platform: "x" });

    return NextResponse.json({
      connected: Boolean(account),
      expires_at: account?.expires_at || null,
      username: account?.username || "",
    });
  } catch (error) {
    console.error("[X AUTH STATUS ERROR]", error);
    return NextResponse.json(
      { error: "Failed to load X connection status" },
      { status: 500 }
    );
  }
}