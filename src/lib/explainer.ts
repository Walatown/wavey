// src/lib/explainer.ts
// Generates a beginner-friendly surf explanation using OpenAI.
// Takes the raw conditions and score for one spot and returns
// a short plain-English summary a beginner can actually understand.

import pool from '@/lib/db';
import openai from '@/lib/openai';

export type SpotConditions = {
  name:         string;
  waveHeight:   number;
  windSpeed:    number;
  windDirection: string;
  period:       number;
  score:        number;
  rating:       string;
  bottomType:   string;
};

type PromptRow = {
  content: string;
};

const EXPLANATION_PROMPT_KEY = 'surf_explanation';
const EXPLANATION_FALLBACK = 'Explanation could not be loaded at this time.';

function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}

function getOpenAIMaxTokens(): number {
  const value = Number(process.env.OPENAI_MAX_TOKENS);
  return Number.isFinite(value) && value > 0 ? value : 120;
}

// The prompt lives in Postgres so its wording can be updated by the team
// without changing application code or redeploying the app.
let cachedPrompt: string | null = null;

async function getPromptTemplate(): Promise<string> {
  if (cachedPrompt) return cachedPrompt;
  const { rows } = await pool.query<PromptRow>(
    'SELECT content FROM prompts WHERE key = $1 LIMIT 1',
    [EXPLANATION_PROMPT_KEY]
  );
  const template = rows[0]?.content?.trim();
  if (!template) throw new Error(`Prompt "${EXPLANATION_PROMPT_KEY}" not found.`);
  cachedPrompt = template;
  return cachedPrompt;
}

function fillPromptTemplate(template: string, spot: SpotConditions): string {
  const replacements: Record<string, string> = {
    name: spot.name,
    waveHeight: spot.waveHeight.toFixed(1),
    windSpeed: String(Math.round(spot.windSpeed)),
    windDirection: spot.windDirection,
    period: String(Math.round(spot.period)),
    bottomType: spot.bottomType,
    score: spot.score.toFixed(1),
    rating: spot.rating,
  };

  return template.replace(
    /{{\s*(name|waveHeight|windSpeed|windDirection|period|bottomType|score|rating)\s*}}/g,
    (_, key: string) => replacements[key] ?? ''
  );
}

export async function generateExplanation(spot: SpotConditions): Promise<string> {
  try {
    const promptTemplate = await getPromptTemplate();
    const prompt = fillPromptTemplate(promptTemplate, spot);
    const response = await openai.chat.completions.create({
      model: getOpenAIModel(),
      max_tokens: getOpenAIMaxTokens(),
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0]?.message?.content?.trim() ?? EXPLANATION_FALLBACK;
  } catch (err) {
    console.error('OpenAI explainer failed:', err);
    return EXPLANATION_FALLBACK;
  }
}
