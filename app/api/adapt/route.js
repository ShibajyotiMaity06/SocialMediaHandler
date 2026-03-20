// app/api/adapt/route.js

import { NextResponse } from 'next/server';
import { callGemini, callGroq } from '../lib/ai-client';
import { getAdaptationPrompt, getPPSPrompt } from '../lib/prompts';
import { getCached, setCached, CACHE_KEYS } from '../lib/cache';

export async function POST(req) {
  try {
    const { platforms, extractedContent, videoId } = await req.json();

    if (!platforms || !Array.isArray(platforms)) {
      return NextResponse.json(
        { error: 'Platforms array required' },
        { status: 400 }
      );
    }

    // CHECK CACHE
    const cacheKey = CACHE_KEYS.adaptation(videoId, platforms);
    const cached = getCached(cacheKey);
    
    if (cached) {
      console.log('[RETURNING CACHED ADAPTATIONS]');
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    const adaptations = [];

    // Adapt for each platform sequentially
    for (const platform of platforms) {
      try {
        // Generate adaptation
        const adaptPrompt = getAdaptationPrompt(platform, extractedContent);
        
        const adaptationRaw = await callGemini(
          adaptPrompt.user,
          adaptPrompt.system,
          { temperature: 0.7 }
        );

        const adaptation = JSON.parse(adaptationRaw);

        // Calculate PPS
        const ppsPrompt = getPPSPrompt(platform, adaptation, extractedContent);
        
        const ppsRaw = await callGroq([
          { role: 'system', content: ppsPrompt.system },
          { role: 'user', content: ppsPrompt.user },
        ], { temperature: 0.1 });

        const pps = JSON.parse(ppsRaw);

        adaptations.push({
          platform,
          ...adaptation,
          pps,
          selectedHook: adaptation.hooks[0],
        });

        // Delay between platforms to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));

      } catch (error) {
        console.error(`[ERROR] Adapting for ${platform}:`, error);
        
        adaptations.push({
          platform,
          error: error.message.includes('RATE_LIMIT')
            ? 'Rate limited - try again in a moment'
            : 'Failed to generate',
        });
      }
    }

    // CACHE THE RESULTS
    setCached(cacheKey, adaptations);

    return NextResponse.json({
      success: true,
      data: adaptations,
      cached: false,
    });

  } catch (error) {
    console.error('[ADAPT ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to adapt content' },
      { status: 500 }
    );
  }
}