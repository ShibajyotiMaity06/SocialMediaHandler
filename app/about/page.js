import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#070709] text-white px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-6">About VyralPro</h1>
        <p className="text-white/85 text-lg leading-relaxed mb-6">
          VyralPro helps creators repurpose content faster with AI-powered adaptation,
          hooks, and performance insights.
        </p>
        <p className="text-white/70 leading-relaxed mb-10">
          We focus on giving creators a practical workflow for taking one idea and
          publishing it across platforms with less manual effort.
        </p>
        <Link href="/" className="inline-flex px-5 py-2.5 rounded-full bg-white text-black font-semibold hover:opacity-90 transition-opacity">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
