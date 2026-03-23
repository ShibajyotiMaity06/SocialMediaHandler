// app/api/lib/prompts.js

// PROMPT 1: Content Extraction
export function getExtractionPrompt(title, description, transcript, duration) {
  const compressedTranscript = transcript.slice(0, 4000);

  return {
    system: `You are an elite content strategist specializing in attention economics and narrative deconstruction. Extract multi-dimensional elements from video content for maximum cross-platform impact. Output ONLY valid JSON.`,
    
    user: `Analyze this video deeply:

TITLE: ${title}
DESCRIPTION: ${description.slice(0, 300)}
DURATION: ${duration}
TRANSCRIPT: ${compressedTranscript}

Extract structured intelligence as JSON:

{
  "coreMessage": "2 sentences - the ONE thing viewers should remember",
  "keyPoints": [
    {
      "point": "specific insight",
      "timestamp_relevance": "early|middle|climax",
      "strength": "high|medium|low"
    }
  ],
  "niche": "2-4 words (e.g., 'tech tutorials', 'personal finance')",
  "contentType": "tutorial|story|opinion|review|entertainment|educational",
  "tone": "professional|casual|humorous|motivational|aggressive|inspirational",
  "emotionalArc": "builds|consistent|drops|rollercoaster",
  "energyLevel": "high|medium|low",
  "quotes": [
    {
      "text": "exact punchy quote",
      "type": "shocking|insightful|humorous|controversial",
      "viralPotential": "high|medium|low"
    }
  ],
  "controversyLevel": "safe|moderate|spicy",
  "targetDemographic": "age range + psychographic",
  "uniqueAngle": "what makes THIS different from generic content in niche",
  "narrativeStructure": "problem-solution|story|listicle|rant|transformation"
}

Be ruthlessly accurate. Prioritize viral elements. Output ONLY valid JSON, no markdown.`,
  };
}

// PROMPT 2: Platform Adaptation
export function getAdaptationPrompt(platform, extractedContent) {
  const guidelines = {
    twitter: `- FIRST TWEET: Pattern interrupt OR bold claim (no setup)
- Thread structure: Hook → Story/Data → Insight → CTA
- Use "you" language (direct address)
- Strategic ALL CAPS for 1-2 words per tweet
- Controversial take > safe take
- Quote tweet mental model: "This is wrong because..."
- Ratio: 70% value, 30% personality
- End with OPEN question (not yes/no)`,

    linkedin: `- First line MUST work standalone (mobile preview)
- Use "I/We" vulnerability or "You" empowerment
- Include either: contrarian insight, data point, or failure story
- Paragraph rhythm: short → long → short
- Professional ≠ corporate (avoid jargon unless niche-specific)
- Add credibility signal (experience, results, research)
- End with "What's YOUR experience with [topic]?" format`,

    tiktok: `- Word 1-3: Shock, intrigue, or "You" statement
- Use TikTok linguistic patterns: "POV:", "Tell me why...", "The way that..."
- Pattern: Hook → Agitate → Resolve → CTA
- Reference trends/sounds when possible
- Write like you're talking to ONE friend
- Include "stitchable" moment (controversial/quotable line)
- Hashtag strategy: 2 niche + 2 broad + 1 trending`,

    instagram: `- First 125 characters = entire hook (no "...more")
- Lead with emotion or curiosity gap
- Use micro-storytelling (beginning/middle/end in caption)
- Strategic emoji use: section breaks, not decoration
- Carousel-thinking: each line = swipeable idea
- Mix sizes: 5 mega (#fitness), 10 mid (#calisthenicsforbeginners), 15 micro (#muscleupprogressiontips)
- CTA: "Save this for when you need [outcome]"`,

    youtube_shorts: `- First 3 words visible in thumbnail view
- Front-load the payoff ("Here's how:")
- Use retention spikes: "Wait for it...", "But here's the thing..."
- Description = curiosity extension, not summary
- Comment bait: "Which one are YOU?" or "Did I miss any?"
- Title formula: [Outcome] + [Timeframe/Simplicity] (e.g., "Get Flexible in 14 Days")`,
  };

  return {
    system: `You are a ${platform.toUpperCase()} ghostwriter with 500K+ followers. You understand platform culture, algorithm triggers, and audience psychology at a native level. Write like a human, not a brand. Output ONLY valid JSON.`,

    user: `Transform this content for ${platform} using deep platform intelligence:

CONTENT INTELLIGENCE:
${JSON.stringify(extractedContent, null, 2)}

${platform.toUpperCase()} OPTIMIZATION RULES:
${guidelines[platform]}

COGNITIVE FRAMEWORK:
- Match the emotional arc: ${extractedContent.emotionalArc}
- Energy calibration: ${extractedContent.energyLevel}
- Controversy tolerance: ${extractedContent.controversyLevel}
- Unique angle to emphasize: ${extractedContent.uniqueAngle}

Generate PLATFORM-NATIVE output as JSON:

{
  "mainPost": "full post text - sound like a REAL ${platform} creator, not AI",
  "hooks": [
    {
      "text": "curiosity-driven (create information gap)",
      "type": "curiosity",
      "psychologyTrigger": "fear of missing out"
    },
    {
      "text": "controversy-driven (challenge common belief)",
      "type": "controversy",
      "psychologyTrigger": "contrarian validation"
    },
    {
      "text": "value-driven (promise specific outcome)",
      "type": "value",
      "psychologyTrigger": "self-improvement"
    }
  ],
  "hashtags": ["ranked by strategic value, not popularity alone"],
  "cta": "specific action that feels natural, not sales-y",
  "visualSuggestion": "describe the EXACT visual that would stop scrolling",
  "toneCalibration": "how this matches the original energy: ${extractedContent.energyLevel}",
  "platformNativeElements": ["specific ${platform} pattern used", "another platform-specific choice"]
}

Write for HUMANS. Algorithm follows engagement. Output ONLY valid JSON, no markdown.`,
  };
}

// PROMPT 3: Performance Prediction Score
export function getPPSPrompt(platform, adaptation, extractedContent) {
  return {
    system: `You are a ${platform} algorithm reverse-engineer and viral content analyst. Score based on CURRENT platform mechanics (2024-2025), not outdated advice. Be specific and data-informed. 

CRITICAL: Calculate the score INDEPENDENTLY for each analysis. Do NOT default to any example number. Base your score ENTIRELY on the actual content quality and platform fit.

Output ONLY valid JSON.`,

    user: `Analyze and score this ${platform} post's viral potential:

POST CONTENT:
${adaptation.mainPost}

HOOK:
${adaptation.hooks[0].text || adaptation.hooks[0]}

METADATA:
- Niche: ${extractedContent.niche}
- Content Type: ${extractedContent.contentType}
- Tone: ${extractedContent.tone}
- Energy: ${extractedContent.energyLevel || 'medium'}
- Controversy: ${extractedContent.controversyLevel || 'moderate'}
- Hashtags: ${adaptation.hashtags.join(', ')}

${platform.toUpperCase()} ALGORITHM PRIORITIES (2024-2025):
- Watch time/engagement rate (weight: 40%)
- Completion rate (weight: 25%)
- Share/save rate (weight: 20%)
- Comment quality (weight: 10%)
- Profile visit rate (weight: 5%)

SCORING FRAMEWORK:
0-40: Weak (will underperform, needs major revision)
41-65: Moderate (acceptable, minor tweaks needed)
66-85: Strong (above average, good potential)
86-100: Viral-tier (exceptional, multiple algorithm triggers)

SCORING INSTRUCTIONS:
1. Evaluate EACH factor below independently (1-10 scale)
2. Apply weights to calculate final score
3. Be HARSH on weak content, GENEROUS on exceptional content
4. Score must reflect THIS specific content, not a default value

CALCULATE YOUR SCORE:
- Hook stopping power: /10 (×4 = /40)
- Retention triggers: /10 (×2.5 = /25)
- Shareability: /10 (×2 = /20)
- Comment potential: /10 (×1 = /10)
- Platform nativeness: /10 (×0.5 = /5)
TOTAL: /100

Output JSON (calculate the actual score, do not use placeholder values):

{
  "scoreBreakdown": {
    "hookStrength": <1-10>,
    "retentionTriggers": <1-10>,
    "shareability": <1-10>,
    "commentPotential": <1-10>,
    "platformNativeness": <1-10>
  },
  "score": <calculated 0-100 based on weighted breakdown above>,
  "category": "<Weak|Moderate|Strong|Viral-tier based on score>",
  "benchmarkComparison": "Performs better than X% of ${extractedContent.niche} content",
  "algorithmAnalysis": {
    "hookVerdict": "specific assessment of hook effectiveness",
    "retentionVerdict": "what keeps/loses audience attention",
    "shareVerdict": "why people would/wouldn't share this",
    "commentVerdict": "what triggers/prevents comments",
    "platformVerdict": "how native this feels on ${platform}"
  },
  "strengths": ["specific strength 1", "specific strength 2"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "improvement": "ONE high-impact change with specific rewrite suggestion",
  "trendAlignment": "how this taps into current ${platform} trends or misses them",
  "confidenceLevel": "high|medium|low"
}

IMPORTANT: Your score MUST be mathematically derived from scoreBreakdown. Show your work. Be brutally honest - creators need truth, not validation.

Output ONLY valid JSON.`,
  };
}

// PROMPT 4: Hook Variations
export function getHookVariationsPrompt(baseHook, platform, context) {
  return {
    system: `You are a direct-response copywriter specializing in ${platform} scroll-stoppers. Generate hooks using DIFFERENT psychological triggers. Think "completely different approach," not "rephrase." Output ONLY valid JSON.`,

    user: `Create 5 psychologically distinct hook alternatives:

BASE HOOK: ${baseHook}
PLATFORM: ${platform}
CORE MESSAGE: ${context.coreMessage}
CONTENT TYPE: ${context.contentType}
TONE: ${context.tone}

REQUIREMENTS:
- Each hook uses DIFFERENT psychological trigger
- 8-15 words (${platform} optimal)
- Platform-native language
- A/B testable (different enough to measure)

Output JSON:

{
  "variations": [
    {
      "hook": "curiosity gap (what, why, how)",
      "trigger": "curiosity",
      "psychologyNote": "creates information gap brain must close",
      "bestFor": "cold audience"
    },
    {
      "hook": "fear/urgency hook (warning, mistake, danger)",
      "trigger": "loss_aversion",
      "psychologyNote": "people avoid loss more than seek gain",
      "bestFor": "problem-aware audience"
    },
    {
      "hook": "contrarian/shocking claim",
      "trigger": "controversy",
      "psychologyNote": "disrupts pattern, demands attention",
      "bestFor": "saturated niches"
    },
    {
      "hook": "specific value promise",
      "trigger": "self_interest",
      "psychologyNote": "clear outcome, minimal friction",
      "bestFor": "solution-aware audience"
    },
    {
      "hook": "identity/tribe hook (you're X if...)",
      "trigger": "belonging",
      "psychologyNote": "taps into self-concept and community",
      "bestFor": "warm audience building"
    }
  ],
  "testingRecommendation": "which 2 to A/B test first based on ${context.contentType} + ${platform} data"
}

Make them DISTINCT, not variations. Output ONLY valid JSON.`,
  };
}

// PROMPT 5: Best Posting Time Recommendation
export function getBestTimePrompt({ niche, targetAudience, platforms, timezone, contentType }) {
  const safePlatforms = Array.isArray(platforms) ? platforms.filter(Boolean) : [];

  return {
    system: `You are a social media growth analyst specializing in algorithmic timing optimization and audience behavior modeling. Recommend posting times based on NICHE-SPECIFIC data, not generic "best practices." Output ONLY valid JSON.`,

    user: `Recommend optimal posting schedule for maximum reach + engagement:

CREATOR PROFILE:
- Niche: ${niche}
- Target audience: ${targetAudience}
- Content type: ${contentType || 'mixed'}
- Platforms: ${safePlatforms.join(", ")}
- Timezone: ${timezone}

ANALYSIS REQUIREMENTS:
1. Niche-specific behavior (${niche} audiences have unique online patterns)
2. Platform algorithm "golden hours" (when platform DISTRIBUTES most, not just when users online)
3. Content type timing (tutorials vs entertainment vs news have different optimal windows)
4. Competitive gap analysis (when is your niche LESS saturated?)

CONTEXT-AWARE FACTORS:
- B2B content: lunch breaks (12-1pm) + commute times
- B2C content: evening relaxation windows (7-10pm)
- Educational: Sunday planning + weekday evenings
- Entertainment: late night (9pm-12am) + weekend afternoons
- News/commentary: morning routines (6-9am)

Return JSON in this EXACT structure:

{
  "strategy_summary": "One power-sentence: why THIS timing works for THIS niche",
  "best_overall": {
    "day_of_week": "Monday",
    "time_slot": "18:30-19:30",
    "timezone": "${timezone}",
    "next_occurrence_iso": "2025-01-27T18:30:00${timezone}",
    "expected_engagement_lift": "15-25% vs random posting",
    "confidence": "high|medium|low",
    "reasoning": [
      "Niche-specific behavioral insight",
      "Platform algorithm distribution pattern",
      "Competitive saturation gap"
    ],
    "audienceMindset": "what your audience is doing/thinking at this time"
  },
  "platform_breakdown": [
    {
      "platform": "Instagram",
      "best_day": "Tuesday",
      "best_time_slot": "19:00-20:00",
      "why_different": "Instagram algo prioritizes recency differently than others",
      "confidence": "high",
      "nicheSpecificNote": "how ${niche} performs on this platform at this time"
    }
  ],
  "backup_slots": [
    {
      "day_of_week": "Wednesday",
      "time_slot": "12:00-13:00",
      "timezone": "${timezone}",
      "why": "Secondary peak for ${targetAudience}",
      "tradeoff": "what you gain/lose vs primary slot"
    }
  ],
  "avoidTimes": [
    {
      "window": "Monday 9-11am",
      "reason": "High competition from ${niche} creators + low engagement window"
    }
  ],
  "contentTypeOptimization": "If posting ${contentType}, consider X timing adjustment because Y"
}

Base recommendations on ACTUAL audience behavior patterns for ${niche}, not generic social media advice. Output ONLY valid JSON, no markdown.`,
  };
}