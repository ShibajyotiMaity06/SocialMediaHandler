// lib/constants.js

export const PLATFORM_CONFIG = {
  twitter: {
    name: 'Twitter/X',
    icon: '𝕏',
    color: 'bg-black text-white',
    charLimit: 280,
    hashtagCount: 3,
    optimal: 'Threads with bold takes, conversational tone',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'in',
    color: 'bg-blue-600 text-white',
    charLimit: 3000,
    hashtagCount: 5,
    optimal: 'Professional storytelling, insights, discussion starters',
  },
  tiktok: {
    name: 'TikTok',
    icon: '📱',
    color: 'bg-black text-white',
    charLimit: 150,
    hashtagCount: 5,
    optimal: 'Hook in first 3s, fast-paced, trending sounds',
  },
  instagram: {
    name: 'Instagram',
    icon: '📷',
    color: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white',
    charLimit: 2200,
    hashtagCount: 30,
    optimal: 'Visual-first, first line critical, story-driven',
  },
  youtube_shorts: {
    name: 'YouTube Shorts',
    icon: '▶️',
    color: 'bg-red-600 text-white',
    charLimit: 100,
    hashtagCount: 3,
    optimal: 'Hook in 1s, retention-focused, clear payoff',
  },
};