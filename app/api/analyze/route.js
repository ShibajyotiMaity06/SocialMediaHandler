// app/api/analyze/route.js

import { NextResponse } from 'next/server';
import { callGroq } from '../lib/ai-client';
import { getExtractionPrompt } from '../lib/prompts';
import { getVideoData, getVideoTranscript } from '../lib/yt';
import { getCached, setCached, CACHE_KEYS } from '../lib/cache';

export async function POST(req) {
  try {
    const { videoId } = await req.json();

    // CHECK CACHE FIRST - This prevents re-calling AI on reload!
    const cacheKey = CACHE_KEYS.extraction(videoId);
    const cached = getCached(cacheKey);
    
    if (cached) {
      console.log('[RETURNING CACHED EXTRACTION]');
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    // Fetch video data
    const videoData = await getVideoData(videoId, process.env.YOUTUBE_API_KEY);

    // Get transcript (with caching)
    const transcriptCacheKey = CACHE_KEYS.transcript(videoId);
    let transcript = getCached(transcriptCacheKey);
    
    if (!transcript) {
      transcript = await getVideoTranscript(videoId);
      if (transcript) {
        setCached(transcriptCacheKey, transcript);
      }
    }

    if (!transcript) {
      // Fallback to description if no transcript
      transcript = videoData.description;
    }

    // Extract content using Groq
    const prompt = getExtractionPrompt(
      videoData.title,
      videoData.description,
      transcript,
      videoData.duration
    );

    const resultRaw = await callGroq([
      { role: 'system', content: prompt.system },
      { role: 'user', content: prompt.user },
    ]);

    const extractedContent = JSON.parse(resultRaw);

    // CACHE THE RESULT
    setCached(cacheKey, extractedContent);

    return NextResponse.json({
      success: true,
      data: extractedContent,
      cached: false,
    });

  } catch (error) {
    console.error('[ANALYZE ERROR]', error);

    if (error.message.includes('RATE_LIMIT')) {
      const [_, service, waitSeconds] = error.message.match(/RATE_LIMIT_(.+):(\d+)/) || [];
      
      return NextResponse.json(
        { 
          error: `Rate limited on ${service}. Please wait ${waitSeconds} seconds.`,
          retryAfter: parseInt(waitSeconds),
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    );
  }
}