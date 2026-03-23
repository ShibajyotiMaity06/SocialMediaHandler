// app/api/lib/ai-client.js

import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Rate limiter (in-memory, per-process)
class RateLimiter {
  constructor() {
    this.requests = new Map();
  }

  canMakeRequest(key, limit) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key);
    const recentRequests = timestamps.filter(t => now - t < windowMs);
    
    this.requests.set(key, recentRequests);
    
    return recentRequests.length < limit;
  }

  addRequest(key) {
    const timestamps = this.requests.get(key) || [];
    timestamps.push(Date.now());
    this.requests.set(key, timestamps);
  }

  waitTime(key, limit) {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const timestamps = this.requests.get(key) || [];
    const recentRequests = timestamps.filter(t => now - t < windowMs);
    
    if (recentRequests.length < limit) return 0;
    
    const oldestRequest = recentRequests[0];
    return Math.max(0, windowMs - (now - oldestRequest));
  }
}

const rateLimiter = new RateLimiter();

// Groq Client
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function callGroq(messages, options = {}) {
  const limit = 25; // Conservative limit for free tier

  if (!rateLimiter.canMakeRequest('groq', limit)) {
    const waitMs = rateLimiter.waitTime('groq', limit);
    throw new Error(`RATE_LIMIT_GROQ:${Math.ceil(waitMs / 1000)}`);
  }

  rateLimiter.addRequest('groq');

  try {
    const response = await groqClient.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2000,
      response_format: { type: 'json_object' },
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('[GROQ ERROR]', error.message);
    throw error;
  }
}

// Gemini Client
const geminiApiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY2,
  process.env.GEMINI_API_KEY3,
].filter(Boolean);

const geminiClients = geminiApiKeys.map((key) => new GoogleGenerativeAI(key));
let geminiKeyCursor = 0;

function isGeminiRateLimitError(error) {
  const message = String(error?.message || "").toLowerCase();
  const status = Number(error?.status || error?.code || 0);

  return (
    status === 429 ||
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit")
  );
}

export async function callGemini(prompt, systemInstruction, options = {}) {
  const limit = 12; // Conservative for free tier

  if (geminiClients.length === 0) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  let lastRateLimitError = null;
  let bestWaitMs = 0;

  for (let offset = 0; offset < geminiClients.length; offset += 1) {
    const index = (geminiKeyCursor + offset) % geminiClients.length;
    const limiterKey = `gemini_${index}`;

    if (!rateLimiter.canMakeRequest(limiterKey, limit)) {
      bestWaitMs = Math.max(bestWaitMs, rateLimiter.waitTime(limiterKey, limit));
      continue;
    }

    rateLimiter.addRequest(limiterKey);

    try {
      const model = geminiClients[index].getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        systemInstruction: { text: systemInstruction },
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxTokens ?? 2000,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      geminiKeyCursor = (index + 1) % geminiClients.length;
      return result.response.text();
    } catch (error) {
      if (isGeminiRateLimitError(error)) {
        lastRateLimitError = error;
        continue;
      }

      console.error('[GEMINI ERROR]', error.message);
      throw error;
    }
  }

  if (bestWaitMs > 0) {
    throw new Error(`RATE_LIMIT_GEMINI:${Math.ceil(bestWaitMs / 1000)}`);
  }

  if (lastRateLimitError) {
    throw new Error('RATE_LIMIT_GEMINI_KEYS_EXHAUSTED');
  }

  throw new Error('GEMINI_REQUEST_FAILED');
}

// OpenRouter fallback (not using for now to save quota)
export async function callOpenRouter(messages, model = 'meta-llama/llama-3.1-8b-instruct:free') {
  const limit = 18;

  if (!rateLimiter.canMakeRequest('openrouter', limit)) {
    const waitMs = rateLimiter.waitTime('openrouter', limit);
    throw new Error(`RATE_LIMIT_OPENROUTER:${Math.ceil(waitMs / 1000)}`);
  }

  rateLimiter.addRequest('openrouter');

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: 'json_object' },
    }),
  });

  const data = await response.json();
  return data.choices[0].message.content;
}