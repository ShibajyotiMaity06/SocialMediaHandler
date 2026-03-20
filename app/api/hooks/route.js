// app/api/hooks/route.js

import { NextResponse } from 'next/server';
import { callGemini } from '../lib/ai-client';
import { getHookVariationsPrompt } from '../lib/prompts';

export async function POST(req) {
  try {
    const { baseHook, platform, extractedContent } = await req.json();

    const prompt = getHookVariationsPrompt(baseHook, platform, extractedContent);

    const resultRaw = await callGemini(
      prompt.user,
      prompt.system,
      { temperature: 0.9 }
    );

    const result = JSON.parse(resultRaw);

    return NextResponse.json({
      success: true,
      data: result.variations,
    });

  } catch (error) {
    console.error('[HOOKS ERROR]', error);

    if (error.message.includes('RATE_LIMIT')) {
      const waitSeconds = error.message.split(':')[1];
      return NextResponse.json(
        { 
          error: `Rate limited. Wait ${waitSeconds}s.`,
          retryAfter: parseInt(waitSeconds),
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate hooks' },
      { status: 500 }
    );
  }
}