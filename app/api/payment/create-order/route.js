import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import getRazorpay from "../../lib/razorpay";
import getDodo from "../../lib/dodo";
import { resolvePaymentContext } from "../../lib/payment-context";
import { ADDON_PACKS, PLAN_PRICES } from "../../lib/helpers";

// POST: Create a Razorpay order for the selected tier
export async function POST(request) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      tier,
      kind = "subscription",
      addonKey,
      currencyPreference,
    } = await request.json();

    const paymentContext = resolvePaymentContext(request);
    const preferredCurrency =
      currencyPreference === "INR" || currencyPreference === "USD"
        ? currencyPreference
        : paymentContext.recommendedCurrency;
    const provider = preferredCurrency === "INR" ? "razorpay" : "dodo";

    if (kind === "subscription") {
      if (!tier || !PLAN_PRICES[tier]) {
        return NextResponse.json(
          { error: "Invalid plan selected" },
          { status: 400 }
        );
      }

      if (tier === "agency") {
        return NextResponse.json(
          { error: "Agency tier is coming soon and currently locked." },
          { status: 400 }
        );
      }
    } else if (kind === "addon") {
      if (!addonKey || !ADDON_PACKS[addonKey]) {
        return NextResponse.json(
          { error: "Invalid add-on selected" },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json({ error: "Invalid purchase kind" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findOne({
      email: session.user.email.toLowerCase(),
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const item = kind === "addon" ? ADDON_PACKS[addonKey] : PLAN_PRICES[tier];

    if (provider === "dodo") {
      const dodoProductId = process.env[item.dodoProductEnvKey || ""];
      if (!dodoProductId) {
        return NextResponse.json(
          {
            error: `Missing ${item.dodoProductEnvKey}. Set product IDs in environment for Dodo checkout.`,
          },
          { status: 500 }
        );
      }

      const proto = request.headers.get("x-forwarded-proto") || "https";
      const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
      const baseUrl = host ? `${proto}://${host}` : "https://www.vyralpro.xyz";
      const successType = kind === "addon" ? "addon_success" : "success";
      const returnUrl = `${baseUrl}/dashboard?payment=${successType}&provider=dodo`;

      const checkoutSession = await getDodo().checkoutSessions.create({
        product_cart: [{ product_id: dodoProductId, quantity: 1 }],
        customer: {
          email: user.email,
          name: user.name || user.email,
        },
        billing_currency: "USD",
        return_url: returnUrl,
        metadata: {
          user_id: user._id.toString(),
          user_email: user.email,
          kind,
          tier: tier || "",
          addon_key: addonKey || "",
          addon_credits: String(item.credits || ""),
        },
      });

      return NextResponse.json({
        provider: "dodo",
        currency: "USD",
        amount: item.amountInCents,
        session_id: checkoutSession.session_id,
        checkout_url: checkoutSession.checkout_url,
        kind,
        tier: tier || null,
        addon_key: addonKey || null,
        addon_credits: item.credits || null,
        plan_name: item.label,
      });
    }

    // Razorpay receipt has a 40-char max length.
    const receipt = `rcpt_${String(user._id).slice(-8)}_${Date.now()
      .toString()
      .slice(-10)}`;

    // Create Razorpay order
    const order = await getRazorpay().orders.create({
      amount: item.amountInPaise,
      currency: "INR",
      receipt,
      notes: {
        user_id: user._id.toString(),
        user_email: user.email,
        kind,
        tier: tier || "",
        addon_key: addonKey || "",
        addon_credits: String(item.credits || ""),
      },
    });

    return NextResponse.json({
      provider: "razorpay",
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      kind,
      tier: tier || null,
      addon_key: addonKey || null,
      addon_credits: item.credits || null,
      plan_name: item.label,
    });
  } catch (error) {
    console.error("[CREATE ORDER ERROR]", error);
    const message =
      error?.error?.description || error?.message || "Failed to create order";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
