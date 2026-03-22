import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import OAuthState from "../../lib/models/OAuthState";
import { exchangeCodeForXTokens } from "../../lib/x-auth";
import { saveXTokens } from "../../lib/x-client";

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, state } = await request.json();
    if (!code || !state) {
      return NextResponse.json(
        { error: "code and state are required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: session.user.email.toLowerCase() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cookieState = request.cookies.get("x_oauth_state")?.value;
    if (cookieState && cookieState !== state) {
      return NextResponse.json(
        { error: "Invalid OAuth state" },
        { status: 400 }
      );
    }

    const stateDoc = await OAuthState.findOne({
      user_id: user._id,
      platform: "x",
      state,
    });

    if (!stateDoc) {
      return NextResponse.json(
        { error: "Invalid or already used state" },
        { status: 400 }
      );
    }

    if (new Date(stateDoc.expires_at).getTime() <= Date.now()) {
      await OAuthState.deleteOne({ _id: stateDoc._id });
      return NextResponse.json({ error: "State expired" }, { status: 400 });
    }

    const tokenPayload = await exchangeCodeForXTokens({
      code,
      codeVerifier: stateDoc.code_verifier,
    });

    await saveXTokens({ userId: user._id, tokenPayload });
    await OAuthState.deleteOne({ _id: stateDoc._id });

    const response = NextResponse.json({ success: true, platform: "x" });
    response.cookies.set({
      name: "x_oauth_state",
      value: "",
      expires: new Date(0),
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[X AUTH CALLBACK ERROR]", error);
    return NextResponse.json(
      { error: "Failed to complete X OAuth" },
      { status: 500 }
    );
  }
}