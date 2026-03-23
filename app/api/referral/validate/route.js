import { NextResponse } from "next/server";
import dbConnect from "../../lib/mongodb";
import {
  findActiveReferralCode,
  normalizeReferralCode,
  isValidReferralCodeFormat,
} from "../../lib/referrals";

export async function POST(request) {
  try {
    const { code } = await request.json();
    const normalizedCode = normalizeReferralCode(code);

    if (!isValidReferralCodeFormat(normalizedCode)) {
      return NextResponse.json(
        {
          valid: false,
          error: "Referral code must be exactly 5 uppercase letters.",
        },
        { status: 400 }
      );
    }

    await dbConnect();

    const referral = await findActiveReferralCode(normalizedCode);
    if (!referral) {
      return NextResponse.json(
        {
          valid: false,
          error: "Referral code is not present.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: referral.code,
      discount_percent: referral.discount_percent,
      owner_label: referral.owner_label || "",
    });
  } catch (error) {
    console.error("[REFERRAL VALIDATE ERROR]", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate referral code." },
      { status: 500 }
    );
  }
}
