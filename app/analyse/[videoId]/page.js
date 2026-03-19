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
${rawTranscript.slice(0, 15000)}

---

**YOUR TASKS:**

1. **SUMMARIZE** the video content in 200-250 words
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

## SUMMARY
[200-250 word detailed summary]

## VIDEO PROFILE
- **Niche:** [2-4 words]
- **Content Type:** [type]
- **Hook Style:** [hook type]
- **Pacing:** [fast/moderate/slow]
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            📊 Video Analysis Dashboard
          </h1>
          
          {videoDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">Title</p>
                <p className="font-semibold text-gray-800">{videoDetails.title}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-800">{videoDetails.duration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Views</p>
                  <p className="font-semibold text-gray-800">
                    {parseInt(videoDetails.views).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Likes</p>
                  <p className="font-semibold text-gray-800">
                    {parseInt(videoDetails.likes).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-6">
            <h2 className="text-xl font-bold text-red-800 mb-2">⚠️ Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* PPS Analysis */}
        {ppsAnalysis && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              🎯 Platform Performance Analysis
            </h2>
            <div className="prose max-w-none">
              <div
                className="analysis-content"
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.8",
                }}
                dangerouslySetInnerHTML={{
                  __html: ppsAnalysis
                    .replace(/## /g, '<h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">')
                    .replace(/### /g, '<h3 class="text-xl font-semibold text-gray-700 mt-6 mb-3">')
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-800">$1</strong>')
                    .replace(/^- (.+)$/gm, '<li class="ml-6 text-gray-700">$1</li>'),
                }}
              />
            </div>
          </div>
        )}

        {/* Hook Suggestions */}
        {hookSuggestions && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              🔥 Viral Hook Suggestions
            </h2>
            <div className="prose max-w-none">
              <div
                className="hooks-content"
                style={{
                  whiteSpace: "pre-wrap",
                  lineHeight: "1.8",
                }}
                dangerouslySetInnerHTML={{
                  __html: hookSuggestions
                    .replace(/## /g, '<h2 class="text-2xl font-bold text-gray-800 mt-8 mb-4">')
                    .replace(/### /g, '<h3 class="text-xl font-semibold text-purple-700 mt-6 mb-3">')
                    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-gray-800">$1</strong>')
                    .replace(/^- (.+)$/gm, '<li class="ml-6 text-gray-700">$1</li>'),
                }}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {!ppsAnalysis && !hookSuggestions && !error && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Analyzing video content...</p>
          </div>
        )}

      </div>
    </div>
  );
}