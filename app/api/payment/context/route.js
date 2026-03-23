import { NextResponse } from "next/server";
import { resolvePaymentContext } from "../../lib/payment-context";

export async function GET(request) {
  try {
    const context = resolvePaymentContext(request);
    return NextResponse.json({
      country_code: context.countryCode || "",
      recommended_currency: context.recommendedCurrency,
      recommended_provider: context.recommendedProvider,
      has_ip: Boolean(context.clientIp),
    });
  } catch (error) {
    console.error("[PAYMENT CONTEXT ERROR]", error);
    return NextResponse.json(
      {
        country_code: "",
        recommended_currency: "USD",
        recommended_provider: "dodo",
        has_ip: false,
      },
      { status: 200 }
    );
  }
}
