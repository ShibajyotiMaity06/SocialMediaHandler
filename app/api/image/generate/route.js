import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { InferenceClient } from "@huggingface/inference";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import Usage from "../../lib/models/Usage";
import { getCurrentMonth, TIER_LIMITS } from "../../lib/helpers";

const MODEL_ID = "ByteDance/SDXL-Lightning:fastest";
const FALLBACK_MODEL_ID = "ByteDance/SDXL-Lightning";

async function textToImageViaClassicInference(hfToken, inputText) {
  const response = await fetch(
    `https://router.huggingface.co/hf-inference/models/${encodeURIComponent(
      FALLBACK_MODEL_ID
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${hfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: inputText,
        parameters: { num_inference_steps: 5 },
      }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Classic inference fallback failed (${response.status}): ${details}`
    );
  }

  return await response.blob();
}

export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hfToken = process.env.HF_TOKEN?.trim();

    if (!hfToken) {
      return NextResponse.json(
        { error: "HF_TOKEN is missing in environment variables" },
        { status: 500 }
      );
    }

    const { prompt, postText } = await request.json();
    const inputText = (typeof prompt === "string" && prompt.trim()) ||
      (typeof postText === "string" && postText.trim()) ||
      "";

    if (!inputText) {
      return NextResponse.json(
        { error: "Prompt is required for image generation" },
        { status: 400 }
      );
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

    if (usage.images_limit <= 0) {
      return NextResponse.json(
        { error: "Image generation is available on Growth and above" },
        { status: 403 }
      );
    }

    if (usage.images_used >= usage.images_limit) {
      return NextResponse.json(
        {
          error: `No image credits left (${usage.images_used}/${usage.images_limit})`,
          images_used: usage.images_used,
          images_limit: usage.images_limit,
        },
        { status: 403 }
      );
    }

    const client = new InferenceClient(hfToken);

    let imageBlob;
    try {
      imageBlob = await client.textToImage({
        provider: "auto",
        model: MODEL_ID,
        inputs: inputText,
        parameters: { num_inference_steps: 5 },
      });
    } catch (primaryError) {
      try {
        // Fallback avoids provider mapping issues for some tokens/accounts.
        imageBlob = await client.textToImage({
          model: FALLBACK_MODEL_ID,
          inputs: inputText,
          parameters: { num_inference_steps: 5 },
        });
      } catch (secondaryError) {
        // Final fallback for tokens without Inference Provider delegation permission.
        imageBlob = await textToImageViaClassicInference(hfToken, inputText);
      }
    }

    const buffer = Buffer.from(await imageBlob.arrayBuffer());
    const contentType = imageBlob.type || "image/png";
    const imageDataUrl = `data:${contentType};base64,${buffer.toString("base64")}`;

    const updatedUsage = await Usage.findOneAndUpdate(
      { _id: usage._id, images_used: { $lt: usage.images_limit } },
      { $inc: { images_used: 1 } },
      { returnDocument: "after" }
    );

    if (!updatedUsage) {
      return NextResponse.json(
        { error: "Image credits just exhausted. Please try again." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      image_data_url: imageDataUrl,
      images_used: updatedUsage.images_used,
      images_limit: updatedUsage.images_limit,
      images_remaining: Math.max(0, updatedUsage.images_limit - updatedUsage.images_used),
    });
  } catch (error) {
    console.error("[IMAGE GENERATE ERROR]", error);
    const message = String(error?.message || "");

    if (message.toLowerCase().includes("invalid username or password")) {
      return NextResponse.json(
        {
          error:
            "Hugging Face authentication failed. Please update HF_TOKEN with a valid token and restart the dev server.",
        },
        { status: 401 }
      );
    }

    if (
      message.toLowerCase().includes("insufficient permissions") ||
      message.toLowerCase().includes("inference providers on behalf of user")
    ) {
      return NextResponse.json(
        {
          error:
            "HF token lacks Inference Provider permissions. Either enable that permission in Hugging Face token settings or use a token that supports image inference.",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: error?.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
