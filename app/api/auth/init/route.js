import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import OAuthState from "../../lib/models/OAuthState";
import {
  buildXAuthorizeUrl,
  generatePkcePair,
  generateState,
  getStateExpiryDate,
} from "../../lib/x-auth";

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

    const { codeVerifier, codeChallenge } = generatePkcePair();
    const state = generateState();
    const expiresAt = getStateExpiryDate();

    await OAuthState.create({
      user_id: user._id,
      platform: "x",
      state,
      code_verifier: codeVerifier,
      expires_at: expiresAt,
    });

    const authorizeUrl = buildXAuthorizeUrl({ state, codeChallenge });

    const response = NextResponse.json({ authorize_url: authorizeUrl });
    response.cookies.set({
      name: "x_oauth_state",
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[X AUTH INIT ERROR]", error);
    return NextResponse.json(
      { error: "Failed to initialize X OAuth" },
      { status: 500 }
    );
  }
}