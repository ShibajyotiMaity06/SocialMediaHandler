import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#070709] text-white px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black mb-6">Terms of Use</h1>
        <p className="text-white/85 text-lg leading-relaxed mb-6">
          By using VyralPro, you agree to use the platform responsibly and in
          compliance with applicable laws and third-party platform policies.
        </p>
        <p className="text-white/70 leading-relaxed mb-10">
          This page is a placeholder for your full legal terms and can be expanded
          any time.
        </p>
        <Link href="/" className="inline-flex px-5 py-2.5 rounded-full bg-white text-black font-semibold hover:opacity-90 transition-opacity">
          Back to Home
        </Link>
      </div>
    </main>
  );
}
