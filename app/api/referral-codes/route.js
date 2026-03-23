import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../lib/mongodb";
import ReferralCode from "../lib/models/ReferralCode";
import {
  normalizeReferralCode,
  isValidReferralCodeFormat,
  REFERRAL_DISCOUNT_PERCENT,
} from "../lib/referrals";

const DEFAULT_ADMIN_EMAILS = [
  "shibajyoti.maity06@gmail.com",
  "dipakmaity903@gmail.com",
];

function resolveAdminEmails() {
  const envEmails = String(process.env.REFERRAL_ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return new Set([...DEFAULT_ADMIN_EMAILS, ...envEmails]);
}

function generateReferralCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

async function requireAdmin() {
  const session = await getServerSession();
  const email = session?.user?.email?.toLowerCase();

  if (!email) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const allowed = resolveAdminEmails();
  if (!allowed.has(email)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { email };
}

async function createUniqueCode(preferredCode) {
  if (preferredCode) {
    const normalized = normalizeReferralCode(preferredCode);
    if (!isValidReferralCodeFormat(normalized)) {
      throw new Error("Referral code must be exactly 5 uppercase letters.");
    }

    const existing = await ReferralCode.findOne({ code: normalized });
    if (existing) {
      throw new Error("Referral code already exists.");
    }

    return normalized;
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    const generated = generateReferralCode();
    const exists = await ReferralCode.findOne({ code: generated });
    if (!exists) return generated;
  }

  throw new Error("Could not generate a unique referral code. Please retry.");
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    await dbConnect();

    const codes = await ReferralCode.find({})
      .sort({ createdAt: -1 })
      .select("code owner_label discount_percent is_active total_redemptions created_by_email createdAt updatedAt")
      .lean();

    return NextResponse.json({
      count: codes.length,
      codes,
    });
  } catch (error) {
    console.error("[REFERRAL CODES GET ERROR]", error);
    return NextResponse.json(
      { error: "Failed to fetch referral codes." },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    await dbConnect();

    const body = await request.json();
    const code = await createUniqueCode(body?.code || "");
    const ownerLabel = String(body?.ownerLabel || "").trim();
    const discountPercent = Number(body?.discountPercent || REFERRAL_DISCOUNT_PERCENT);

    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      return NextResponse.json(
        { error: "discountPercent must be between 1 and 100." },
        { status: 400 }
      );
    }

    const created = await ReferralCode.create({
      code,
      owner_label: ownerLabel,
      discount_percent: discountPercent,
      is_active: true,
      created_by_email: auth.email,
    });

    return NextResponse.json(
      {
        success: true,
        code: created.code,
        owner_label: created.owner_label,
        discount_percent: created.discount_percent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[REFERRAL CODES POST ERROR]", error);
    const message = error?.message || "Failed to create referral code.";
    const status = message.includes("already exists") || message.includes("uppercase letters") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) return auth.error;

    await dbConnect();

    const body = await request.json();
    const code = normalizeReferralCode(body?.code);

    if (!isValidReferralCodeFormat(code)) {
      return NextResponse.json(
        { error: "Referral code must be exactly 5 uppercase letters." },
        { status: 400 }
      );
    }

    const update = {};

    if (body?.ownerLabel !== undefined) {
      update.owner_label = String(body.ownerLabel || "").trim();
    }

    if (body?.isActive !== undefined) {
      update.is_active = Boolean(body.isActive);
    }

    if (body?.discountPercent !== undefined) {
      const parsedDiscount = Number(body.discountPercent);
      if (!Number.isFinite(parsedDiscount) || parsedDiscount <= 0 || parsedDiscount > 100) {
        return NextResponse.json(
          { error: "discountPercent must be between 1 and 100." },
          { status: 400 }
        );
      }
      update.discount_percent = parsedDiscount;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "No update fields provided." },
        { status: 400 }
      );
    }

    const updated = await ReferralCode.findOneAndUpdate(
      { code },
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Referral code not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      code: updated.code,
      owner_label: updated.owner_label,
      discount_percent: updated.discount_percent,
      is_active: updated.is_active,
      total_redemptions: updated.total_redemptions,
    });
  } catch (error) {
    console.error("[REFERRAL CODES PATCH ERROR]", error);
    return NextResponse.json(
      { error: "Failed to update referral code." },
      { status: 500 }
    );
  }
}
