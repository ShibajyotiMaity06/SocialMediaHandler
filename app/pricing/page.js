"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

const TEST_TIER_ALLOWED_EMAILS = new Set([
  "shibajyoti.maity06@gmail.com",
  "debajyoti.maity29@gmail.com",
  "dipak903@gmail.com",
]);

const addOnPacks = [
  {
    key: "add10",
    title: "+10 Image Credits",
    credits: 10,
    priceUSD: "$5",
    priceINR: "₹500",
    blurb: "Best for Growth users who run out occasionally.",
  },
  {
    key: "add20",
    title: "+20 Image Credits",
    credits: 20,
    priceUSD: "$8",
    priceINR: "₹800",
    blurb: "Value pack for regular image-heavy workflows.",
  },
  {
    key: "add50",
    title: "+50 Image Credits",
    credits: 50,
    priceUSD: "$15",
    priceINR: "₹1,500",
    blurb: "Agency-sized burst capacity when needed.",
  },
];

const plans = [
  {
    name: "TEST",
    tier: "test",
    priceUSD: "$0.01",
    priceINR: "₹1",
    period: "one-time",
    positioning: "Payment integration test",
    color: "from-amber-400 to-yellow-500",
    badgeColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    description: "Temporary ₹1 checkout for Razorpay testing.",
    features: [
      "Creates a real Razorpay order",
      "Verifies webhook/signature flow",
      "Does not change live subscription tier",
    ],
    ctaText: "Pay ₹1 Test",
    ctaStyle:
      "bg-amber-500 hover:bg-amber-400 text-black font-black shadow-[0_0_20px_rgba(245,158,11,0.4)]",
  },
  {
    name: "FREE",
    tier: "free",
    priceUSD: "$0",
    priceINR: "₹0",
    period: "forever",
    positioning: "Try before you buy",
    color: "from-emerald-400 to-emerald-600",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    description: "Best for exploring the product before committing.",
    features: [
      "2 videos/month",
      "All 5 platforms per video",
      "Full PPS scores + reasons",
      "Unlimited hooks",
      "Content history (30 days)",
      "No images (0 credits)",
      "No scheduling",
      "No auto-posting",
      "No trend insights",
      "No analytics",
      "Watermark on exports",
    ],
    ctaText: "Start Free",
    ctaStyle:
      "bg-white/10 hover:bg-white/20 text-white border border-white/10",
  },
  {
    name: "GROWTH",
    tier: "growth",
    priceUSD: "$19",
    priceINR: "₹1,900",
    period: "per month",
    positioning: "For consistent creators",
    color: "from-blue-400 to-blue-600",
    badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    description: "The right balance for regular publishing every week.",
    features: [
      "12 videos/month",
      "All 5 platforms",
      "Full PPS + detailed insights",
      "Unlimited hooks & variations",
      "5 AI images/month",
      "Content history (forever)",
      "Scheduling calendar",
      "Export (PDF, CSV, copy all)",
      "Email support",
      "More exciting features coming soon",
      "No auto-posting",
      "No trend insights",
      "No analytics tracking",
      "No batch processing",
      "Add-on: +10 image credits for $5",
    ],
    ctaText: "Choose Growth",
    ctaStyle:
      "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]",
  },
  {
    name: "CREATOR",
    tier: "creator",
    priceUSD: "$49",
    priceINR: "₹4,900",
    period: "per month",
    positioning: "For serious creators & teams",
    color: "from-purple-400 to-fuchsia-600",
    badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    popular: true,
    description: "High-throughput content engine with automation and analytics.",
    features: [
      "50 videos/month",
      "Everything in Growth",
      "25 AI images/month",
      "Trend insights & inspiration engine",
      "Auto-posting to X",
      "Performance analytics",
      "Batch processing",
      "More exciting features coming soon",
      "Priority support (24h)",
      "No team seats",
      "No white label",
      "Add-on: +20 image credits for $8",
    ],
    ctaText: "Get Creator",
    ctaStyle:
      "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] transform hover:-translate-y-1 transition-all",
  },
  {
    name: "AGENCY",
    tier: "agency",
    priceUSD: "$99",
    priceINR: "₹9,900",
    period: "per month",
    positioning: "For agencies & large teams",
    color: "from-rose-400 to-red-600",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    locked: true,
    description: "Coming soon. Built for teams managing multiple clients.",
    features: [
      "Unlimited videos",
      "All Creator features",
      "100 AI images/month",
      "5 team seats",
      "Client workspaces",
      "White label exports",
      "API access",
      "Webhook integrations",
      "Dedicated support",
      "Custom onboarding call",
      "Add-on: +50 image credits for $15",
    ],
    ctaText: "Coming Soon",
    ctaStyle:
      "bg-white/10 text-white/70 border border-white/10",
  },
];

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-sdk")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-sdk";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(null); // tracks which tier is loading
  const [error, setError] = useState("");
  const [recommendedCurrency, setRecommendedCurrency] = useState("USD");
  const [manualCurrency, setManualCurrency] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [loadingPaymentContext, setLoadingPaymentContext] = useState(true);
  const normalizedUserEmail = session?.user?.email?.toLowerCase();
  const canSeeTestTier = Boolean(
    normalizedUserEmail && TEST_TIER_ALLOWED_EMAILS.has(normalizedUserEmail)
  );
  const visiblePlans = canSeeTestTier
    ? plans
    : plans.filter((plan) => plan.tier !== "test");
  const activeCurrency = manualCurrency || recommendedCurrency;
  const activeProvider = activeCurrency === "INR" ? "razorpay" : "dodo";

  useEffect(() => {
    let cancelled = false;

    async function loadPaymentContext() {
      try {
        const res = await fetch("/api/payment/context");
        if (!res.ok) {
          throw new Error("Could not resolve payment region.");
        }

        const data = await res.json();
        if (!cancelled) {
          setRecommendedCurrency(
            data.recommended_currency === "INR" ? "INR" : "USD"
          );
          setCountryCode(data.country_code || "");
        }
      } catch {
        if (!cancelled) {
          setRecommendedCurrency("USD");
        }
      } finally {
        if (!cancelled) {
          setLoadingPaymentContext(false);
        }
      }
    }

    loadPaymentContext();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleCheckout = async ({ kind, tier, addonKey, lockMessage }) => {
    if (lockMessage) {
      setError(lockMessage);
      return;
    }

    if (kind === "subscription" && tier === "agency") {
      setError("Agency tier is coming soon and currently locked.");
      return;
    }

    // Free tier — no payment needed
    if (kind === "subscription" && tier === "free") {
      router.push("/main");
      return;
    }

    // Must be logged in
    if (status !== "authenticated") {
      router.push("/auth/signin?callbackUrl=/pricing");
      return;
    }

    const loadingKey = kind === "addon" ? `addon_${addonKey}` : tier;
    setLoading(loadingKey);
    setError("");

    try {
      // Step 1: Create order on backend
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          tier,
          addonKey,
          currencyPreference: activeCurrency,
        }),
      });

      if (!orderRes.ok) {
        const data = await orderRes.json();
        throw new Error(data.error || "Failed to create order");
      }

      const orderData = await orderRes.json();

      if (orderData.provider === "dodo") {
        if (!orderData.checkout_url) {
          throw new Error("Dodo checkout URL is missing.");
        }

        window.location.href = orderData.checkout_url;
        return;
      }

      // Step 3: Load Razorpay script and open checkout
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load Razorpay. Check your internet connection.");
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "VyralPro",
        description:
          kind === "addon"
            ? `${orderData.plan_name} Add-on`
            : `${orderData.plan_name} Plan — Monthly`,
        order_id: orderData.order_id,
        handler: async function (response) {
          // Step 4 & 5: Send to backend for verification
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                kind,
                tier,
                addonKey,
              }),
            });

            if (!verifyRes.ok) {
              const data = await verifyRes.json();
              throw new Error(data.error || "Verification failed");
            }

            if (kind === "addon") {
              router.push("/dashboard?payment=addon_success&provider=razorpay");
            } else if (tier === "test") {
              router.push("/pricing?payment=test_success");
            } else {
              // Subscription payment verified
              router.push("/dashboard?payment=success&provider=razorpay");
            }
          } catch (err) {
            setError(err.message);
          } finally {
            setLoading(null);
          }
        },
        prefill: {
          email: session?.user?.email || "",
          name: session?.user?.name || "",
        },
        theme: {
          color: "#6366f1",
          backdrop_color: "rgba(0,0,0,0.8)",
        },
        modal: {
          ondismiss: function () {
            setLoading(null);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setError(
          response.error?.description || "Payment failed. Please try again."
        );
        setLoading(null);
      });
      rzp.open();
    } catch (err) {
      setError(err.message);
      setLoading(null);
    }
  };

  const handlePayment = async (plan) => {
    await handleCheckout({ kind: "subscription", tier: plan.tier });
  };

  const handleAddonPurchase = async (pack) => {
    const userTier = session?.user?.tier || "free";
    if (userTier === "free") {
      setError("Image add-ons are available on Growth and above.");
      return;
    }

    await handleCheckout({ kind: "addon", addonKey: pack.key });
  };

  return (
    <div
      className={`${outfit.className} min-h-screen bg-[#070709] text-white selection:bg-indigo-500 selection:text-white pb-32`}
    >
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full"></div>
      </div>

      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group cursor-pointer"
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white/10 ring-1 ring-white/20 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <Image
              src="/logo.png"
              alt="VyralPro logo"
              fill
              sizes="36px"
              className="object-contain p-1"
              priority
            />
          </div>
          <span className="text-2xl font-black tracking-tight text-white group-hover:text-indigo-100 transition-colors">
            VyralPro
          </span>
        </Link>
        <Link href="/">
          <span className="text-sm font-semibold text-white/70 hover:text-white transition-colors cursor-pointer flex items-center gap-2">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to Home
          </span>
        </Link>
      </header>

      <main className="relative z-10 container mx-auto px-6 pt-16 mt-10">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6">
            Simple, transparent{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              pricing
            </span>
          </h1>
          <p className="text-xl text-slate-400">
            No hidden fees. No surprise charges. Choose the plan that best fits
            your content engine needs.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3">
            <div className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setManualCurrency("INR")}
                disabled={loadingPaymentContext}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeCurrency === "INR"
                    ? "bg-cyan-500 text-black"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                } ${loadingPaymentContext ? "opacity-60 cursor-wait" : ""}`}
              >
                INR
              </button>
              <button
                type="button"
                onClick={() => setManualCurrency("USD")}
                disabled={loadingPaymentContext}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                  activeCurrency === "USD"
                    ? "bg-cyan-500 text-black"
                    : "text-slate-300 hover:text-white hover:bg-white/10"
                } ${loadingPaymentContext ? "opacity-60 cursor-wait" : ""}`}
              >
                USD
              </button>
            </div>
            <div className="text-xs text-slate-500">
              {loadingPaymentContext
                ? "Detecting your region for payment recommendations..."
                : `Detected country: ${countryCode || "Unknown"}. Default gateway: ${
                    recommendedCurrency === "INR" ? "Razorpay" : "Dodo Payments"
                  }.`}
            </div>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center font-medium animate-fade-in-up">
            ⚠️ {error}
            <button
              onClick={() => setError("")}
              className="ml-3 text-red-300 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 xl:gap-6 max-w-[1600px] mx-auto animate-fade-in-up"
          style={{ animationDelay: "100ms" }}
        >
          {visiblePlans.map((plan, idx) => {
            const isLoading = loading === plan.tier;
            const isPaid = plan.tier !== "free";
            const isLocked = Boolean(plan.locked);

            return (
              <div
                key={idx}
                className={`relative flex flex-col p-8 rounded-[2rem] bg-[#101014] border min-h-[500px] transition-all duration-500 hover:-translate-y-2 group ${
                  plan.popular
                    ? "border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.15)] scale-105 z-10"
                    : "border-white/5 shadow-2xl hover:border-white/20"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-500/25">
                    <span className="animate-pulse">⭐</span> Most Popular
                  </div>
                )}

                <div className="mb-8 flex-grow-0">
                  <div className="flex justify-between items-start mb-6">
                    <div
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border ${plan.badgeColor}`}
                    >
                      {plan.name}
                    </div>
                    <div
                      className={`w-8 h-8 rounded-full bg-gradient-to-br ${plan.color} opacity-20 blur-md group-hover:opacity-40 transition-opacity`}
                    ></div>
                  </div>

                  {/* Dual currency pricing */}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-black tracking-tight">
                        {activeCurrency === "INR" ? plan.priceINR : plan.priceUSD}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {plan.period === "one-time" ? "one-time" : "/mo"}
                      </span>
                    </div>
                    {isPaid && (
                      <div className="mt-1 text-sm text-slate-500 font-medium">
                        {activeCurrency === "INR"
                          ? `≈ ${plan.priceUSD} USD`
                          : `≈ ${plan.priceINR} INR`}
                      </div>
                    )}
                  </div>

                  <div className="text-sm font-bold text-white mb-3 tracking-wide">
                    {plan.positioning}
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                <div className="flex-grow">
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, fIdx) => (
                      <li
                        key={fIdx}
                        className="flex items-start gap-3 text-sm font-medium text-slate-300"
                      >
                        <svg
                          className={`w-5 h-5 flex-shrink-0 mt-0.5 text-transparent bg-clip-text bg-gradient-to-br ${plan.color}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePayment(plan)}
                  disabled={isLocked || isLoading || loading !== null}
                  className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm ${
                    plan.ctaStyle
                  } ${
                    isLocked
                      ? "opacity-60 cursor-not-allowed"
                      : isLoading
                      ? "opacity-70 cursor-wait"
                      : loading !== null
                      ? "opacity-50 cursor-not-allowed"
                      : "cursor-pointer"
                  } transition-all duration-200`}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    plan.ctaText
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <section className="mt-16 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">Image Credit Add-ons</h2>
            <p className="text-slate-400 text-sm md:text-base">
              Need more image generations this month? Purchase add-on packs anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {addOnPacks.map((pack) => {
              const isLoadingPack = loading === `addon_${pack.key}`;
              return (
                <div
                  key={pack.key}
                  className="rounded-2xl border border-white/10 bg-[#101014] p-5 shadow-xl"
                >
                  <div className="inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border bg-cyan-500/10 text-cyan-300 border-cyan-400/30 mb-3">
                    Add-on
                  </div>
                  <h3 className="text-xl font-bold text-white">{pack.title}</h3>
                  <p className="text-slate-400 text-sm mt-1 min-h-[40px]">{pack.blurb}</p>
                  <div className="mt-4 mb-5">
                    <div className="text-3xl font-black text-white">
                      {activeCurrency === "INR" ? pack.priceINR : pack.priceUSD}
                    </div>
                    <div className="text-xs text-slate-500">
                      {activeCurrency === "INR"
                        ? `≈ ${pack.priceUSD} USD`
                        : `≈ ${pack.priceINR} INR`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddonPurchase(pack)}
                    disabled={isLoadingPack || loading !== null}
                    className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all ${
                      isLoadingPack
                        ? "opacity-70 cursor-wait bg-cyan-600 text-white"
                        : loading !== null
                          ? "opacity-50 cursor-not-allowed bg-cyan-600 text-white"
                          : "bg-cyan-600 hover:bg-cyan-500 text-white"
                    }`}
                  >
                    {isLoadingPack ? "Processing..." : "Buy Add-on"}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Payment security trust indicators */}
        <div className="mt-16 text-center animate-fade-in-up" style={{ animationDelay: "200ms" }}>
          <div className="flex items-center justify-center gap-6 text-slate-500 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {activeProvider === "razorpay"
                ? "Secured by Razorpay"
                : "Secured by Dodo Payments"}
            </span>
            <span>•</span>
            <span>256-bit SSL Encryption</span>
            <span>•</span>
            <span>Cancel anytime</span>
          </div>
        </div>
      </main>
    </div>
  );
}
