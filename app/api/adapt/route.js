// app/api/adapt/route.js

import { NextResponse } from 'next/server';
import { callGemini, callGroq } from '../lib/ai-client';
import { getAdaptationPrompt, getPPSPrompt } from '../lib/prompts';
import { getCached, setCached, CACHE_KEYS } from '../lib/cache';

function normalizeHookText(hook) {
  if (typeof hook === 'string') return hook.trim();
  if (!hook || typeof hook !== 'object') return '';

  const candidate =
    hook.text ||
    hook.hook ||
    hook.value ||
    hook.title ||
    '';

  return String(candidate).trim();
}

function normalizeAdaptationShape(adaptation) {
  if (!adaptation || typeof adaptation !== 'object') return adaptation;

  const hooks = Array.isArray(adaptation.hooks)
    ? adaptation.hooks.map(normalizeHookText).filter(Boolean)
    : [];

  const selectedHookText = normalizeHookText(adaptation.selectedHook);

  return {
    ...adaptation,
    hooks,
    selectedHook: selectedHookText || hooks[0] || String(adaptation.mainPost || '').trim(),
  };
}

function parseModelJson(raw, label) {
  if (raw && typeof raw === 'object') return raw;

  const text = String(raw ?? '').trim();
  if (!text) {
    throw new Error(`${label} returned empty response`);
  }

  const candidates = [];
  candidates.push(text);

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch?.[0]) candidates.push(objectMatch[0].trim());

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch?.[0]) candidates.push(arrayMatch[0].trim());

  const tried = new Set();
  for (const candidate of candidates) {
    if (!candidate || tried.has(candidate)) continue;
    tried.add(candidate);
    try {
      return JSON.parse(candidate);
    } catch {
      // try next candidate
    }
  }

  throw new Error(`${label} returned invalid JSON`);
}

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
      const normalizedCached = Array.isArray(cached)
        ? cached.map(normalizeAdaptationShape)
        : [];

      return NextResponse.json({
        success: true,
        data: normalizedCached,
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

        const adaptation = parseModelJson(adaptationRaw, `${platform} adaptation`);

        // Calculate PPS
        const ppsPrompt = getPPSPrompt(platform, adaptation, extractedContent);
        
        const ppsRaw = await callGroq([
          { role: 'system', content: ppsPrompt.system },
          { role: 'user', content: ppsPrompt.user },
        ], { temperature: 0.1 });

        const pps = parseModelJson(ppsRaw, `${platform} PPS`);

        adaptations.push(normalizeAdaptationShape({
          platform,
          ...adaptation,
          pps,
        }));

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