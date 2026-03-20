// app/api/lib/prompts.js

// PROMPT 1: Content Extraction
export function getExtractionPrompt(title, description, transcript, duration) {
  const compressedTranscript = transcript.slice(0, 4000);

  return {
    system: `You are a content analysis expert. Extract structured elements from videos for cross-platform repurposing. Output ONLY valid JSON.`,
    
    user: `Analyze this video:

TITLE: ${title}
DESCRIPTION: ${description.slice(0, 300)}
DURATION: ${duration}
TRANSCRIPT: ${compressedTranscript}

Extract and output as JSON:

{
  "coreMessage": "2 sentences capturing the main point",
  "keyPoints": ["point 1", "point 2", "point 3"],
  "niche": "2-4 words like 'tech tutorials' or 'personal finance'",
  "contentType": "tutorial|story|opinion|review|entertainment",
  "tone": "professional|casual|humorous|motivational|aggressive",
  "quotes": ["punchy one-liner 1", "punchy one-liner 2", "punchy one-liner 3"]
}

Be concise and accurate. Output ONLY valid JSON, no markdown.`,
  };
}

// PROMPT 2: Platform Adaptation
export function getAdaptationPrompt(platform, extractedContent) {
  const guidelines = {
    twitter: `- Thread format (tweet per key point)
- Conversational, bold takes
- Pattern interrupt opening
- Line breaks for readability
- 3 hashtags max
- End with engagement question`,

    linkedin: `- Start with relatable hook/story
- Professional but personal
- Include insights or lessons
- 1,300-1,500 characters
- 5 hashtags max
- End with discussion question`,

    tiktok: `- First 3 seconds CRITICAL
- Fast-paced, high-energy language
- Clear value promise upfront
- Use trending language patterns
- 5 hashtags (include trending)
- CTA to comment/share`,

    instagram: `- First sentence must hook (before "more")
- Visual thinking (describe what image shows)
- Story-driven or value-driven
- Line breaks and strategic emojis
- 20-30 hashtags (mix sizes)
- CTA to save/share`,

    youtube_shorts: `- Hook in first 1 second
- Fast-paced, curiosity-driven
- Clear payoff/value
- Description under 100 chars
- 3 hashtags
- CTA to subscribe`,
  };

  return {
    system: `You are a ${platform.toUpperCase()} content expert. Create platform-native posts that match ${platform}'s culture and algorithm. Sound human, not corporate. Output ONLY valid JSON.`,

    user: `Transform this content for ${platform}:

CONTENT:
${JSON.stringify(extractedContent, null, 2)}

PLATFORM GUIDELINES:
${guidelines[platform]}

Generate and output as JSON:

{
  "mainPost": "the full post text optimized for ${platform}",
  "hooks": [
    "curiosity hook (10-15 words)",
    "controversy hook (10-15 words)",
    "value hook (10-15 words)"
  ],
  "hashtags": ["tag1", "tag2", "tag3"],
  "cta": "call to action",
  "visualSuggestion": "what image/graphic would amplify this (1 sentence)"
}

Make it platform-native and engaging. Output ONLY valid JSON, no markdown.`,
  };
}

// PROMPT 3: Performance Prediction Score
export function getPPSPrompt(platform, adaptation, extractedContent) {
  return {
    system: `You are a ${platform} algorithm expert. Score content performance potential (0-100) based on platform mechanics. Output ONLY valid JSON.`,

    user: `Score this ${platform} post:

POST: ${adaptation.mainPost}
HOOK: ${adaptation.hooks[0]}
NICHE: ${extractedContent.niche}
CONTENT TYPE: ${extractedContent.contentType}
HASHTAGS: ${adaptation.hashtags.join(', ')}

Scoring factors for ${platform}:
- Hook effectiveness (stops scrolling)
- Format alignment with ${platform} best practices
- Topic relevance to ${platform} audience
- Engagement triggers (saves/shares/comments)
- Algorithmic favorability

Output JSON:

{
  "score": 75,
  "category": "Strong|Moderate|Weak",
  "reasons": [
    "specific reason 1 (mention algorithm)",
    "specific reason 2 (mention user behavior)"
  ],
  "improvement": "one specific actionable change"
}

Be decisive. Output ONLY valid JSON.`,
  };
}

// PROMPT 4: Hook Variations
export function getHookVariationsPrompt(baseHook, platform, context) {
  return {
    system: `Generate viral hook variations for ${platform}. Make them DIFFERENT, not rephrased. Output ONLY valid JSON.`,

    user: `Create 4 alternative hooks for A/B testing:

BASE HOOK: ${baseHook}
PLATFORM: ${platform}
CONTEXT: ${context.coreMessage}

Each hook:
- Use DIFFERENT psychological trigger
- 10-15 words max
- Platform-optimized

Output JSON:

{
  "variations": [
    {
      "hook": "curiosity-driven hook",
      "trigger": "curiosity",
      "prediction": "why this might outperform"
    },
    {
      "hook": "fear-driven hook",
      "trigger": "fear",
      "prediction": "why this might work"
    },
    {
      "hook": "value-driven hook",
      "trigger": "value",
      "prediction": "why this might work"
    },
    {
      "hook": "controversy hook",
      "trigger": "controversy",
      "prediction": "why this might work"
    }
  ]
}

Be creative. Output ONLY valid JSON.`,
  };
}