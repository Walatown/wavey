// src/lib/openai.ts
// OpenAI client — instantiated once and reused across requests.
// The API key is read from the environment server-side only —
// it is never exposed to the browser.

import OpenAI from 'openai';

let openai: OpenAI | null = null;

// Lazily creates the shared OpenAI client the first time it is needed.
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing credentials. Please pass an `apiKey`, or set the `OPENAI_API_KEY` environment variable.'
    );
  }

  if (!openai) {
    openai = new OpenAI({ apiKey });
  }

  return openai;
}
