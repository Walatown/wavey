// src/lib/openai.ts
// OpenAI client — instantiated once and reused across requests.
// The API key is read from the environment server-side only —
// it is never exposed to the browser.

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default openai;