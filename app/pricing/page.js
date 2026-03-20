import React from 'react';
import Link from 'next/link';
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export default function PricingPage() {
  const plans = [
    {
      name: "FREE",
      price: "$0",
      period: "forever",
      positioning: "Try the magic",
      color: "from-emerald-400 to-emerald-600",
      badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      description: "Perfect for testing the waters and seeing the AI in action.",
      features: [
        "3 credits / month",
        "1 video analysis",
        "1 output per platform",
        "Watermarked content",
        "No variations"
      ],
      ctaText: "Start Free",
      ctaStyle: "bg-white/10 hover:bg-white/20 text-white border border-white/10"
    },
    {
      name: "GROWTH",
      price: "$29",
      period: "per month",
      positioning: "Beginners getting serious",
      color: "from-blue-400 to-blue-600",
      badgeColor: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      description: "Everything you need to start growing a steady audience.",
      features: [
        "150 credits / month",
        "20 video analyses",
        "Twitter (X) + LinkedIn + Reels",
        "3 variations / content",
        "Basic hook generator"
      ],
      ctaText: "Choose Growth",
      ctaStyle: "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]"
    },
    {
      name: "CREATOR",
      price: "$79",
      period: "per month",
      positioning: "Content machine mode",
      color: "from-purple-400 to-fuchsia-600",
      badgeColor: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      popular: true,
      description: "Scale your content production across all platforms effortlessly.",
      features: [
        "600 credits / month",
        "Unlimited video analyses",
        "All platforms supported",
        "10 variations / content",
        "Advanced hook generator",
        "Virality insights (basic scoring)"
      ],
      ctaText: "Get Creator",
      ctaStyle: "bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.5)] transform hover:-translate-y-1 transition-all"
    },
    {
      name: "PRO",
      price: "$119",
      period: "per month",
      positioning: "Agencies / power creators",
      color: "from-rose-400 to-red-600",
      badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
      description: "Automate your entire digital footprint and outsmart competitors.",
      features: [
        "1500 credits / month",
        "Everything in Creator",
        "Competitor analysis",
        "Remix engine (multi-video → new)",
        "Priority processing",
        "Early feature access"
      ],
      ctaText: "Go Pro",
      ctaStyle: "bg-white text-black hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
    }
  ];

  return (
    <div className={`${outfit.className} min-h-screen bg-[#070709] text-white selection:bg-indigo-500 selection:text-white pb-32`}>
      
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full"></div>
      </div>

      <header className="relative z-20 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-2xl font-black tracking-tight text-white group-hover:text-indigo-100 transition-colors">
            Currents
          </span>
        </Link>
        <Link href="/">
          <span className="text-sm font-semibold text-white/70 hover:text-white transition-colors cursor-pointer flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Home
          </span>
        </Link>
      </header>

      <main className="relative z-10 container mx-auto px-6 pt-16 mt-10">
        <div className="text-center max-w-3xl mx-auto mb-20 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6">
            Simple, transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">pricing</span>
          </h1>
          <p className="text-xl text-slate-400">
            No hidden fees. No surprise charges. Choose the plan that best fits your content engine needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 max-w-[1400px] mx-auto animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`relative flex flex-col p-8 rounded-[2rem] bg-[#101014] border min-h-[500px] transition-all duration-500 hover:-translate-y-2 group ${plan.popular ? 'border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.15)] scale-105 z-10' : 'border-white/5 shadow-2xl hover:border-white/20'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg shadow-purple-500/25">
                  <span className="animate-pulse">⭐</span> Most Popular
                </div>
              )}
              
              <div className="mb-8 flex-grow-0">
                <div className="flex justify-between items-start mb-6">
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border ${plan.badgeColor}`}>
                    {plan.name}
                  </div>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${plan.color} opacity-20 blur-md group-hover:opacity-40 transition-opacity`}></div>
                </div>
                
                <div className="mb-2 flex items-baseline gap-2">
                  <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                  <span className="text-slate-500 font-medium">/{plan.period === 'forever' ? 'mo' : 'mo'}</span>
                </div>
                
                <div className="text-sm font-bold text-white mb-3 tracking-wide">{plan.positioning}</div>
                <p className="text-slate-400 text-sm leading-relaxed min-h-[40px]">{plan.description}</p>
              </div>

              <div className="flex-grow">
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-3 text-sm font-medium text-slate-300">
                      <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 text-transparent bg-clip-text bg-gradient-to-br ${plan.color}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button className={`w-full py-4 rounded-xl font-bold uppercase tracking-wider text-sm ${plan.ctaStyle}`}>
                {plan.ctaText}
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
