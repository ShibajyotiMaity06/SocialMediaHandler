import Link from "next/link";
import { Outfit } from "next/font/google";
import Navbar from "@/components/Navbar";

const outfit = Outfit({ subsets: ["latin"], display: "swap" });

export default function Home() {
  return (
    <div className={`${outfit.className} min-h-screen bg-[#070709] text-slate-200 selection:bg-indigo-500 selection:text-white pb-20 overflow-x-hidden`}>
      
      {/* Background Image Wrapper for Hero */}
      <div className="relative w-full bg-[url('/bg.png')] bg-cover bg-center bg-no-repeat lg:bg-[length:100%_auto] min-h-[85vh]">
        {/* Dark overlay to make text readable based on bg.png brightness */}
        <div className="absolute inset-0 bg-black/60 bg-gradient-to-b from-transparent via-[#070709]/80 to-[#070709] z-0"></div>

        {/* Navbar inside Hero */}
        <Navbar />

        {/* Hero Section */}
        <main className="relative z-10 container mx-auto px-6 pt-20 pb-32 text-center max-w-5xl">
          {/* Animated Badge */}
          <div className="inline-flex items-center justify-center px-4 py-1.5 mb-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium text-xs md:text-sm tracking-wide shadow-sm backdrop-blur-md animate-fade-in-up">
            <span className="flex w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
            Your Ultimate Content Engine
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-[76px] font-black tracking-[-0.03em] leading-[1.1] text-white mb-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Think It. Type It. <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Launch It.</span>
          </h1>

          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 font-normal leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Currents offers everything you need to manage your videos, adapt to platforms, capture leads, and grow your audience magically with AI.
          </p>

          {/* Supported Platforms Mini Icons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            {[
              { color: 'bg-pink-600', text: 'ig' }, { color: 'bg-red-600', text: 'yt' },
              { color: 'bg-blue-600', text: 'fb' }, { color: 'bg-blue-500', text: 'in' },
              { color: 'bg-white text-black', text: 'x' }, { color: 'bg-[#00f2fe] text-black', text: 'tt' },
              { color: 'bg-orange-500', text: 'rd' }, { color: 'bg-[#5865F2]', text: 'dc' }
            ].map((p, i) => (
              <div key={i} className={`w-8 h-8 rounded-lg ${p.color} flex items-center justify-center text-[11px] font-black uppercase shadow-lg transform hover:scale-110 hover:-translate-y-1 transition-all duration-300 cursor-pointer`}>
                {p.text}
              </div>
            ))}
          </div>

          {/* Prompt / Input Box - Subtle & Compact */}
          <div className="max-w-xl mx-auto relative group animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-[#1a1a24]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl flex flex-col min-h-[110px] transition-all hover:border-white/20">
              <textarea 
                placeholder="Paste your YouTube handle or video link here..." 
                className="flex-grow w-full bg-transparent text-white text-base lg:text-lg font-medium outline-none px-4 pt-3 pb-2 resize-none placeholder:text-gray-500"
                rows="2"
              />
              <div className="flex items-center justify-between px-2 pb-1">
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white text-sm font-medium transition-colors">
                  <span className="text-lg leading-none">+</span> Add Media
                </button>
                <Link href="/main">
                  <button className="w-10 h-10 rounded-full bg-white hover:bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-md transition-transform hover:scale-105">
                    <svg className="w-5 h-5 -rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Demo Video Section */}
      <section id="demo" className="relative z-20 container mx-auto px-6 -mt-16 mb-32">
        <div className="max-w-5xl mx-auto aspect-video bg-[#0f0f13] rounded-[2rem] border border-white/5 shadow-2xl overflow-hidden relative group flex items-center justify-center cursor-pointer hover:border-white/20 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-transparent opacity-80 z-10 pointer-events-none"></div>
          {/* Subtle grid in video placeholder */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20 group-hover:opacity-30 transition-opacity"></div>
          
          <div className="absolute w-40 h-40 bg-indigo-500/30 blur-[60px] rounded-full z-0 group-hover:bg-purple-500/30 transition-colors duration-700"></div>
          
          <div className="relative z-20 w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.1)] group-hover:scale-110 group-hover:bg-white transition-all duration-500">
            <svg className="w-8 h-8 text-white group-hover:text-indigo-600 ml-1 transition-colors" fill="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
            </svg>
          </div>
          <div className="absolute bottom-6 left-8 z-20">
            <div className="px-4 py-2 bg-black/40 backdrop-blur-md border border-white/10 text-white text-xs font-bold rounded-lg uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              See how adapting works
            </div>
          </div>
        </div>
      </section>

      {/* Vibrant Stats / Testimonials Grid */}
      <section id="stats" className="container mx-auto px-4 py-20 overflow-hidden">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-4">Trusted by creators worldwide</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">Join the top tier of content creators who have multiplied their reach.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-[1200px] mx-auto">
          {/* Card 1 */}
          <div className="group relative rounded-[2rem] bg-[#101014] p-8 min-h-[200px] shadow-2xl overflow-hidden hover:-translate-y-2 transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-2xl rounded-full transform translate-x-10 -translate-y-10 group-hover:bg-indigo-500/30 transition-colors"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200 mb-2 tracking-tight">+50%</div>
                <div className="text-slate-300 font-medium">Increase in followers</div>
              </div>
              <div className="mt-8 flex items-center gap-3 text-slate-400 text-sm font-semibold">
                <span className="w-5 h-5 rounded bg-blue-600 flex items-center justify-center text-[9px] text-white">in</span> Paula Wright
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="group relative rounded-[2rem] bg-[#101014] p-8 min-h-[200px] shadow-2xl overflow-hidden hover:-translate-y-2 transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-2xl rounded-full transform translate-x-10 -translate-y-10 group-hover:bg-purple-500/30 transition-colors"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-300 mb-2 tracking-tight">+3k</div>
                <div className="text-slate-300 font-medium">Saved per month</div>
              </div>
              <div className="mt-8 flex items-center gap-3 text-slate-400 text-sm font-semibold">
                <span className="w-5 h-5 rounded bg-gradient-to-tr from-pink-500 to-orange-400 flex items-center justify-center text-[9px] text-white">ig</span> Gilbert Ward
              </div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="group relative rounded-[2rem] bg-[#101014] p-8 min-h-[200px] shadow-2xl overflow-hidden hover:-translate-y-2 transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-2xl rounded-full transform translate-x-10 -translate-y-10 group-hover:bg-rose-500/30 transition-colors"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-pink-300 mb-2 tracking-tight">+20%</div>
                <div className="text-slate-300 font-medium">Followers</div>
              </div>
              <div className="mt-8 flex items-center gap-3 text-slate-400 text-sm font-semibold">
                <span className="w-5 h-5 rounded bg-red-600 flex items-center justify-center text-[9px] text-white">yt</span> Sherry Porter
              </div>
            </div>
          </div>
          {/* Card 4 */}
          <div className="group relative rounded-[2rem] bg-[#101014] p-8 min-h-[200px] shadow-2xl overflow-hidden hover:-translate-y-2 transition-transform duration-500">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-2xl rounded-full transform translate-x-10 -translate-y-10 group-hover:bg-cyan-500/30 transition-colors"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-300 mb-2 tracking-tight">x2</div>
                <div className="text-slate-300 font-medium">Engagement rate</div>
              </div>
              <div className="mt-8 flex items-center gap-3 text-slate-400 text-sm font-semibold">
                <span className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center text-[9px] text-white">rd</span> Lisa Anders
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-24">
        <div className="text-center mb-16 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">Everything you need to scale</h2>
          <p className="text-slate-400 text-lg">Stop juggling 10 different tools. We consolidated the entire lifecycle into one powerful workflow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative group">
          {/* Subtle connecting lines backgdrop effect */}
          <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-y-1/2 hidden md:block z-0 pointer-events-none"></div>
          
          {/* Feature 1 */}
          <div className="relative z-10 bg-[#121216] border border-white/5 rounded-3xl p-8 hover:bg-[#15151b] hover:border-white/10 transition-all duration-300 hover:-translate-y-1 group/card">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-8 border border-indigo-500/20 group-hover/card:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Instant Adaptation</h3>
            <p className="text-slate-400 leading-relaxed font-medium">Give us one YouTube link. We instantly cut, frame, and rewrite posts suitable for Twitter threads, TikTok hooks, and LinkedIn carousels.</p>
          </div>
          {/* Feature 2 */}
          <div className="relative z-10 bg-[#121216] border border-white/5 rounded-3xl p-8 hover:bg-[#15151b] hover:border-white/10 transition-all duration-300 hover:-translate-y-1 group/card">
            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-400 mb-8 border border-pink-500/20 group-hover/card:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">AI Hook Generator</h3>
            <p className="text-slate-400 leading-relaxed font-medium">First 3 seconds dictate your virality. Our AI understands your video context and writes 10 variant hooks to test.</p>
          </div>
          {/* Feature 3 */}
          <div className="relative z-10 bg-[#121216] border border-white/5 rounded-3xl p-8 hover:bg-[#15151b] hover:border-white/10 transition-all duration-300 hover:-translate-y-1 group/card">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-8 border border-cyan-500/20 group-hover/card:scale-110 transition-transform duration-300">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Virality Scoring</h3>
            <p className="text-slate-400 leading-relaxed font-medium">Before you hit publish, our engine scores your post against 10M+ analyzed viral posts to predict engagement likelihood.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="container mx-auto px-6 py-24 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-6">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            { q: "What social platforms do you support?", a: "We support YouTube, Twitter (X), LinkedIn, TikTok, Instagram Reels, Facebook, Pinterest, and even automated blogging platforms like Medium and WordPress." },
            { q: "How does the AI Adaptation work?", a: "Our AI processes the video transcript, identifies peak viral moments, trims the video, and generates platform-native caption styles (e.g., long-form threads for X, professional insights for LinkedIn)." },
            { q: "Do I need technical skills?", a: "None at all! If you can paste a YouTube link or type a topic, Currents handles all the heavy lifting." },
            { q: "Is there a free trial?", a: "Yes, you can try adapting 1 video for free to see the magic before ever paying." }
          ].map((faq, i) => (
            <details key={i} className="group bg-[#121216] border border-white/5 rounded-2xl open:bg-[#16161b] hover:border-white/10 transition-colors duration-300">
              <summary className="cursor-pointer list-none font-bold text-lg text-white p-6 flex justify-between items-center outline-none">
                {faq.q}
                <span className="transition-transform duration-300 group-open:rotate-180 text-indigo-400">
                  <svg fill="none" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" /></svg>
                </span>
              </summary>
              <div className="text-slate-400 p-6 pt-0 leading-relaxed font-medium animate-fade-in-up">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Modern Footer Area */}
      <footer className="mt-20 border-t border-white/10 pt-16 pb-8">
        <div className="container mx-auto px-6 max-w-7xl flex flex-col md:flex-row justify-between items-center md:items-start gap-8">
          <div className="flex flex-col items-center md:items-start max-w-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="font-bold text-white text-sm">C</span>
              </div>
              <span className="text-xl font-bold tracking-tight text-white">Currents</span>
            </div>
            <p className="text-slate-500 text-sm text-center md:text-left font-medium">
              Build an audience, capture leads, and grow your business faster with AI.
            </p>
          </div>
          
          <div className="flex gap-16 text-sm font-medium">
            <div className="flex flex-col gap-4">
              <span className="font-bold text-white mb-2 uppercase tracking-wider text-xs">Product</span>
              <a href="#features" className="text-slate-400 hover:text-white transition-colors">Features</a>
              <Link href="/pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</Link>
              <a href="#demo" className="text-slate-400 hover:text-white transition-colors">Watch Demo</a>
            </div>
            <div className="flex flex-col gap-4">
              <span className="font-bold text-white mb-2 uppercase tracking-wider text-xs">Company</span>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">About</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-6 max-w-7xl mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 font-medium gap-4">
          <p>© {new Date().getFullYear()} Currents. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Twitter (X)</a>
            <a href="#" className="hover:text-white transition-colors">Discord Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

