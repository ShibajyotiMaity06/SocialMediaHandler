import Groq from "groq-sdk";
import { YoutubeTranscript } from "youtube-transcript";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function AnalyzePage({ params }) {
  const { videoId } = await params;

  let videoDetails = null;
  let ppsAnalysis = "";
  let hookSuggestions = "";
  let error = null;

  try {
    // ==========================================
    // 1. FETCH VIDEO METADATA
    // ==========================================
    const videoRes = await fetch(
      `https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
    );

    if (!videoRes.ok) {
      throw new Error(`YouTube API error: ${videoRes.status}`);
    }

    const videoData = await videoRes.json();
    const video = videoData?.items?.[0];

    if (!video) {
      throw new Error("Video not found");
    }

    const { title, description } = video.snippet;
    const { viewCount: views, likeCount: likes } = video.statistics;
    const { duration } = video.contentDetails;

    videoDetails = { title, description, views, likes, duration };

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const rawTranscript = transcript.map((t) => t.text).join(" ");

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const groqCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert content strategist specializing in cross-platform video repurposing.

You analyze videos and predict performance across social platforms based on:
- Platform algorithms and user behavior patterns
- Content structure, pacing, and emotional triggers
- Hook effectiveness and value density
- Format compatibility and audience expectations

Be decisive and specific. Provide actionable insights, not generic advice.`,
        },
        {
          role: "user",
          content: `Analyze this YouTube video for cross-platform repurposing potential.

**VIDEO DATA:**
Title: ${title}
Description: ${description.slice(0, 400)}
Duration: ${duration}
Views: ${views}
Likes: ${likes}

**TRANSCRIPT:**
${rawTranscript.slice(0, 70000)}

---

**YOUR TASKS:**

1. **SUMMARIZE** the video content in 300-350 words
   - Capture key topics, main arguments, examples, and tone
   - Identify the core value proposition
   - Note the content structure (tutorial/story/opinion/review)

2. **IDENTIFY NICHE** in 2-4 words
   - Examples: "tech tutorials", "personal finance", "fitness motivation", "coding education"

3. **DETECT CONTENT CHARACTERISTICS:**
   - Content Type: (tutorial/storytelling/opinion/review/entertainment)
   - Hook Type: (curiosity/shock/value/money/fear/emotion)
   - Pacing: (fast/moderate/slow)
   - Target Audience: (beginner/intermediate/advanced/general)

4. **SCORE EACH PLATFORM** (0-100):
   - TikTok
   - Instagram Reels
   - X (Twitter)
   - LinkedIn
   - YouTube Shorts

For each platform provide:
- **Score** with **Category** (Strong: 80-100 / Moderate: 60-79 / Weak: 0-59)
- **2 specific platform-relevant reasons** (reference algorithms, user behavior, format requirements)
- **1 concrete improvement** (specific editing/formatting/hook change)

5. **FINAL RECOMMENDATION:**
   - Primary Platform (best fit + why in one sentence)
   - Secondary Platform (good fit + why in one sentence)
   - Platform to Avoid (worst fit + why in one sentence)

---

**OUTPUT FORMAT:**

## VIDEO PROFILE
- **Niche:** [2-4 words]
- **Content Type:** [type]
- **Hook Style:** [hook type]
- **Audience Level:** [level]

## PLATFORM ANALYSIS

### TikTok: XX/100 (Strong/Moderate/Weak)
**Why it works/doesn't:**
- [Platform-specific reason 1 - mention algorithm behavior]
- [Platform-specific reason 2 - mention user expectations]

**Improvement:**
[Specific actionable change with example]

### Instagram Reels: XX/100 (Strong/Moderate/Weak)
**Why it works/doesn't:**
- [Platform-specific reason 1]
- [Platform-specific reason 2]

**Improvement:**
[Specific actionable change]

### X (Twitter): XX/100 (Strong/Moderate/Weak)
**Why it works/doesn't:**
- [Platform-specific reason 1]
- [Platform-specific reason 2]

**Improvement:**
[Specific actionable change]

### LinkedIn: XX/100 (Strong/Moderate/Weak)
**Why it works/doesn't:**
- [Platform-specific reason 1]
- [Platform-specific reason 2]

**Improvement:**
[Specific actionable change]

### YouTube Shorts: XX/100 (Strong/Moderate/Weak)
**Why it works/doesn't:**
- [Platform-specific reason 1]
- [Platform-specific reason 2]

**Improvement:**
[Specific actionable change]

## RECOMMENDATION
**Primary:** [Platform] - [One sentence explaining why this is the best fit]
**Secondary:** [Platform] - [One sentence explaining why this is also viable]
**Avoid:** [Platform] - [One sentence explaining why this won't work]

---

Be sharp and opinionated. No hedging. Base decisions on real platform mechanics.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_tokens: 4000,
    });

    ppsAnalysis = groqCompletion.choices[0].message.content;

    // ==========================================
    // 4. GEMINI: HOOK GENERATION (SEPARATE CALL)
    // ==========================================
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite" 
    });

    // Extract summary and niche from Groq output for context
    const summaryMatch = ppsAnalysis.match(/## SUMMARY\s*([\s\S]*?)(?=##|$)/);
    const nicheMatch = ppsAnalysis.match(/\*\*Niche:\*\*\s*(.+)/);
    const contentTypeMatch = ppsAnalysis.match(/\*\*Content Type:\*\*\s*(.+)/);
    
    const summary = summaryMatch ? summaryMatch[1].trim().slice(0, 500) : title;
    const niche = nicheMatch ? nicheMatch[1].trim() : "general";
    const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : "general";

    const geminiResult = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate viral hooks for this video content to maximize engagement across platforms.

**VIDEO CONTEXT:**
Title: ${title}
Niche: ${niche}
Content Type: ${contentType}
Summary: ${summary}

**TARGET PLATFORMS:**
- TikTok / Instagram Reels (short-form vertical)
- YouTube Shorts
- X (Twitter)
- LinkedIn

---

**YOUR TASK:**

Generate **5 different hooks** using different psychological triggers:

1. **Curiosity Hook** - Create information gap, make viewers need to know more
2. **Controversy/Hot Take Hook** - Bold statement that challenges common belief
3. **Value/Money Hook** - Direct benefit, outcome, or transformation promise
4. **Fear/Loss Hook** - What viewers might miss or do wrong
5. **Story/Relatability Hook** - Personal angle or scenario viewers identify with

**REQUIREMENTS:**
- Each hook must be **10-15 words max**
- Must work in first 3 seconds of video
- Platform-specific optimization (note which platforms each works best for)
- Sound natural and human (not AI-generated corporate speak)
- No fluff words or unnecessary adjectives

---

**OUTPUT FORMAT:**

## VIRAL HOOKS

### 1. Curiosity Hook
**Hook:** [10-15 words]
**Best for:** [Platform(s)]
**Why it works:** [One sentence]

### 2. Controversy Hook
**Hook:** [10-15 words]
**Best for:** [Platform(s)]
**Why it works:** [One sentence]

### 3. Value/Money Hook
**Hook:** [10-15 words]
**Best for:** [Platform(s)]
**Why it works:** [One sentence]

### 4. Fear/Loss Hook
**Hook:** [10-15 words]
**Best for:** [Platform(s)]
**Why it works:** [One sentence]

### 5. Story/Relatability Hook
**Hook:** [10-15 words]
**Best for:** [Platform(s)]
**Why it works:** [One sentence]

## BONUS: Platform-Specific Variations

**For TikTok/IG Reels:**
[2 aggressive, high-energy hook variations]

**For LinkedIn:**
[1 professional but engaging hook variation]

---

Make hooks that feel like they would actually go viral. Be punchy and direct.`,
            },
          ],
        },
      ],
      systemInstruction: {
        parts: [
          {
            text: "You are a viral content expert who understands human psychology and platform algorithms. Create hooks that stop scrolls and maximize click-through rates. Be creative and bold.",
          },
        ],
      },
      generationConfig: {
        temperature: 0.7, // Higher for creativity
        maxOutputTokens: 2000,
      },
    });

    hookSuggestions = geminiResult.response.text();

  } catch (err) {
    console.error("Error:", err);
    error = err.message;
  }

  // ==========================================
  // 5. RENDER UI
  // ==========================================
  return (
    <div className="flex-grow w-full py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="space-y-8">
        
        {/* Header styling */}
        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 dark:border-slate-800/50 p-6 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="text-blue-600 dark:text-blue-400">📊</span>
            Video Analysis Dashboard
          </h1>
          
          {videoDetails && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-6">
              <div className="md:col-span-6 lg:col-span-8 bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl p-5 border border-gray-100 dark:border-slate-700/50">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Title</p>
                <p className="font-bold text-lg text-gray-900 dark:text-white line-clamp-2">{videoDetails.title}</p>
              </div>
              <div className="md:col-span-6 lg:col-span-4 grid grid-cols-3 gap-4">
                <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Duration</p>
                  <p className="font-bold text-gray-900 dark:text-white">{videoDetails.duration.replace('PT','').replace('M','m ').replace('S','s').toLowerCase()}</p>
                </div>
                <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Views</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', { notation: "compact" }).format(videoDetails.views)}
                  </p>
                </div>
                <div className="bg-gray-50/50 dark:bg-slate-800/50 rounded-2xl p-4 border border-gray-100 dark:border-slate-700/50 flex flex-col items-center justify-center text-center">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Likes</p>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', { notation: "compact" }).format(videoDetails.likes)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-6 rounded-2xl shadow-sm">
            <h2 className="text-xl font-bold text-red-800 dark:text-red-400 mb-2 flex items-center gap-2">⚠️ Error</h2>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* PPS Analysis */}
          {ppsAnalysis && (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 dark:border-slate-800/50 p-6 sm:p-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
                <span className="text-purple-500">🎯</span> Platform Performance
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <div
                  className="analysis-content"
                  style={{ whiteSpace: "pre-wrap" }}
                  dangerouslySetInnerHTML={{
                    __html: ppsAnalysis
                      .replace(/## /g, '<h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">')
                      .replace(/### /g, '<h3 class="text-xl font-bold text-indigo-600 dark:text-indigo-400 mt-6 mb-3">')
                      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
                      .replace(/^- (.+)$/gm, '<li class="ml-6 text-gray-700 dark:text-gray-300">$1</li>'),
                  }}
                />
              </div>
            </div>
          )}

          {/* Hook Suggestions */}
          {hookSuggestions && (
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 dark:border-slate-800/50 p-6 sm:p-10">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3 border-b border-gray-100 dark:border-slate-800 pb-4">
                <span className="text-orange-500">🔥</span> Viral Hooks
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <div
                  className="hooks-content"
                  style={{ whiteSpace: "pre-wrap" }}
                  dangerouslySetInnerHTML={{
                    __html: hookSuggestions
                      .replace(/## /g, '<h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">')
                      .replace(/### /g, '<h3 class="text-xl font-bold text-orange-600 dark:text-orange-400 mt-6 mb-3">')
                      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900 dark:text-white">$1</strong>')
                      .replace(/^- (.+)$/gm, '<li class="ml-6 text-gray-700 dark:text-gray-300">$1</li>'),
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {!ppsAnalysis && !hookSuggestions && !error && (
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 dark:border-slate-800/50 p-16 text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-r-4 border-purple-500 animate-spin animation-delay-150"></div>
              <div className="absolute inset-4 rounded-full border-b-4 border-pink-500 animate-spin animation-delay-300"></div>
            </div>
            <p className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 animate-pulse">
              AI is analyzing video content...
            </p>
          </div>
        )}

      </div>
    </div>
  );
}