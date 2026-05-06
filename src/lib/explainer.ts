// src/lib/explainer.ts
// Generates a beginner-friendly surf explanation using OpenAI.
// Takes the raw conditions and score for one spot and returns
// a short plain-English summary a beginner can actually understand.

import pool from '@/lib/db';
import { getOpenAIClient } from '@/lib/openai';

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

type PromptValueKey =
  | 'name'
  | 'waveHeight'
  | 'windSpeed'
  | 'windDirection'
  | 'period'
  | 'bottomType'
  | 'score'
  | 'rating';

const EXPLANATION_PROMPT_KEY = 'surf_explanation';
const EXPLANATION_FALLBACK = 'Explanation could not be loaded at this time.';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const parsedMaxTokens = Number(process.env.OPENAI_MAX_TOKENS);
const OPENAI_MAX_TOKENS =
  Number.isFinite(parsedMaxTokens) && parsedMaxTokens > 0 ? parsedMaxTokens : 120;
const EXPLANATION_SYSTEM_MESSAGE = `
You explain surf conditions for beginners.
Always describe the wave height accurately before discussing the score.
Do not assume a low score means the waves are small.

Use these beginner-facing wave labels:
- under 0.3m: very small / nearly flat
- 0.3m to 0.8m: small and beginner-friendly
- above 0.8m to 1.2m: moderate / manageable
- above 1.2m to 2.0m: large for beginners
- above 2.0m: very large / powerful / unsafe for beginners

If wave height is above 2.0m, never call the waves small.
If the score is poor, explain the real reason from the data, such as waves being too big, strong wind, or an unsafe reef.
Keep the explanation short, plain-English, and factually consistent with the numbers provided.
`.trim();

// The prompt lives in Postgres so its wording can be updated by the team
// without changing application code or redeploying the app.
let cachedPrompt: string | null = null;

// Loads and caches the prompt template used to ask OpenAI for an explanation.
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

// Replaces prompt placeholders with the selected spot's live values.
function fillPromptTemplate(template: string, spot: SpotConditions): string {
  const values: Record<PromptValueKey, string> = {
    name: spot.name,
    waveHeight: spot.waveHeight.toFixed(1),
    windSpeed: String(Math.round(spot.windSpeed)),
    windDirection: spot.windDirection,
    period: String(Math.round(spot.period)),
    bottomType: spot.bottomType,
    score: spot.score.toFixed(1),
    rating: spot.rating,
  } satisfies Record<string, string>;

  return template.replace(
    /{{\s*(name|waveHeight|windSpeed|windDirection|period|bottomType|score|rating)\s*}}/g,
    (_, key: PromptValueKey) => values[key] ?? ''
  );
}

function describeWaveHeightForBeginners(waveHeight: number): string {
  if (waveHeight < 0.3) return 'very small and nearly flat';
  if (waveHeight <= 0.8) return 'small and beginner-friendly';
  if (waveHeight <= 1.2) return 'moderate and still manageable';
  if (waveHeight <= 2.0) return 'large for beginners';
  return 'very large and powerful for beginners';
}

function buildConditionFacts(spot: SpotConditions): string {
  const waveHeightCategory = describeWaveHeightForBeginners(spot.waveHeight);

  return [
    'Fact check for this response:',
    `- Wave height is ${spot.waveHeight.toFixed(1)}m, which is ${waveHeightCategory}.`,
    `- Wind speed is ${Math.round(spot.windSpeed)} km/h from ${spot.windDirection}.`,
    `- Period is ${Math.round(spot.period)} seconds.`,
    `- Rating is ${spot.rating} with a score of ${spot.score.toFixed(1)}/10.`,
    `- Bottom type is ${spot.bottomType}.`,
    '- Make sure the explanation matches these facts exactly.',
  ].join('\n');
}

// Generates a short beginner-friendly explanation for one surf spot.
export async function generateExplanation(spot: SpotConditions): Promise<string> {
  try {
    const promptTemplate = await getPromptTemplate();
    const prompt = fillPromptTemplate(promptTemplate, spot);
    const conditionFacts = buildConditionFacts(spot);
    const response = await getOpenAIClient().chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: OPENAI_MAX_TOKENS,
      messages: [
        { role: 'system', content: EXPLANATION_SYSTEM_MESSAGE },
        { role: 'user', content: conditionFacts },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0]?.message?.content?.trim() ?? EXPLANATION_FALLBACK;
  } catch (err) {
    console.error('OpenAI explainer failed:', err);
    if (process.env.NODE_ENV !== 'development') {
      return EXPLANATION_FALLBACK;
    }

    return `Explanation failed: ${err instanceof Error ? err.message : String(err)}`;
  }
}
