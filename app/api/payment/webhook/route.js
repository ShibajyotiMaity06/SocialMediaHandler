import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "../../lib/mongodb";
import User from "../../lib/models/User";
import Subscription from "../../lib/models/Subscription";

// POST: Razorpay webhook endpoint (unauthenticated — verified via webhook signature)
export async function POST(request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("[WEBHOOK] Invalid signature — rejecting");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    await dbConnect();

    // Handle payment.captured — final confirmation that payment went through
    if (eventType === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const paymentId = payment.id;
      const userEmail = payment.notes?.user_email;
      const tier = payment.notes?.tier;

      if (orderId && userEmail && tier) {
        // Ensure subscription is marked active
        const user = await User.findOne({ email: userEmail.toLowerCase() });
        if (user) {
          await Subscription.findOneAndUpdate(
            { user_id: user._id, razorpay_order_id: orderId },
            {
              status: "active",
              razorpay_payment_id: paymentId,
            }
          );

          // Ensure user tier is updated
          if (user.tier !== tier) {
            user.tier = tier;
            await user.save();
          }
        }
      }

      console.log(`[WEBHOOK] payment.captured: ${paymentId} for ${userEmail}`);
    }

    // Handle payment.failed
    if (eventType === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.order_id;
      const userEmail = payment.notes?.user_email;

      if (orderId && userEmail) {
        const user = await User.findOne({ email: userEmail.toLowerCase() });
        if (user) {
          await Subscription.findOneAndUpdate(
            { user_id: user._id, razorpay_order_id: orderId },
            { status: "past_due" }
          );
        }
      }

      console.log(
        `[WEBHOOK] payment.failed: ${payment.id} for ${userEmail}`
      );
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[WEBHOOK ERROR]", error);
    // Still return 200 to prevent Razorpay from retrying
    return NextResponse.json({ status: "ok" });
  }
}
