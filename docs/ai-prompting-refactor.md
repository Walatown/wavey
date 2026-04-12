# AI Prompting Refactor

## Why We Changed The Prompting Setup

The original AI explanation logic worked, but the prompt was hardcoded directly inside `src/lib/explainer.ts`.

That caused a few problems:

- prompt wording was mixed with OpenAI request logic
- changing prompt copy required editing code and redeploying the app
- non-code prompt updates were harder to manage
- UI values and prompt values could drift apart, which is what caused examples like `1.28` in the explanation and `1.3 m` on the card

We changed the setup so the prompt template is now stored in PostgreSQL and loaded at runtime through the existing database connection.

## What Changed At A High Level

We moved from a hardcoded prompt string in code to a database-backed prompt template.

The new setup looks like this:

- `src/lib/explainer.ts` now fetches the prompt template from the `prompts` table
- the database stores the prompt text under the key `surf_explanation`
- spot values are injected into placeholders like `{{waveHeight}}` at runtime
- OpenAI model settings are read from environment variables instead of being hardcoded
- the explainer now returns a fallback message if prompt loading or OpenAI generation fails

This means prompt content is now data, while `explainer.ts` focuses on application behavior.

## Before And After

### Before

The explainer file contained:

- the full prompt text
- the OpenAI API call
- hardcoded model and token settings
- raw surf values inserted directly into the prompt

### After

The explainer file now contains:

- prompt loading from Postgres
- placeholder replacement logic
- env-based OpenAI config
- fallback handling
- a small in-memory cache for the loaded prompt

The prompt content itself now lives in the database.

## Why Specific Pieces Live Where They Do

### `src/lib/explainer.ts`

This file is still the home of the explainer workflow.

Why it belongs here:

- it is server-side application logic
- it coordinates database access, template filling, and the OpenAI call
- it is the right place for the "generate one explanation" workflow

What changed inside it:

- removed the hardcoded prompt string
- removed the debug `console.log` lines
- added database prompt loading
- added placeholder replacement
- added env-based model configuration
- added a user-facing fallback response

Code example:

```ts
const promptTemplate = await getPromptTemplate();
const prompt = fillPromptTemplate(promptTemplate, spot);

const response = await openai.chat.completions.create({
  model: getOpenAIModel(),
  max_tokens: getOpenAIMaxTokens(),
  messages: [{ role: 'user', content: prompt }],
});
```

This is the main improvement: the file now orchestrates the explanation process instead of embedding all prompt content inline.

### `prompts` table in PostgreSQL

The prompt template now lives in the database.

Why it belongs there:

- prompt copy can be updated without changing code
- the team can treat prompt wording as managed content
- future prompt variants can be added as new rows instead of new hardcoded strings
- it supports a more scalable setup if we later add different prompt keys for different audiences or use cases

Current table structure:

- `id serial primary key`
- `key varchar unique`
- `content text`
- `updated_at timestamp default now()`

Code example:

```sql
CREATE TABLE IF NOT EXISTS prompts (
  id serial PRIMARY KEY,
  key varchar(255) UNIQUE NOT NULL,
  content text NOT NULL,
  updated_at timestamp NOT NULL DEFAULT now()
);
```

### `docs/sql/prompts.sql`

This file documents and seeds the prompt template.

Why it belongs here:

- the repo does not currently have a migration system
- we still need a repeatable place to define the required SQL
- it makes the database dependency visible to other developers

Code example:

```sql
INSERT INTO prompts (key, content)
VALUES ('surf_explanation', $prompt$ ... $prompt$)
ON CONFLICT (key) DO UPDATE
SET
  content = EXCLUDED.content,
  updated_at = now();
```

This lets us seed or update the prompt template without manually editing rows every time.

### `src/lib/db.ts`

We reused the existing Postgres pool rather than creating a new connection.

Why that matters:

- one shared database client is simpler and safer
- it avoids duplicate infrastructure setup
- it keeps explainer changes aligned with the rest of the server-side codebase

Code example:

```ts
const { rows } = await pool.query<PromptRow>(
  'SELECT content FROM prompts WHERE key = $1 LIMIT 1',
  [EXPLANATION_PROMPT_KEY]
);
```

## Prompt Template Design

The prompt is stored as a template with placeholders:

- `{{name}}`
- `{{waveHeight}}`
- `{{windSpeed}}`
- `{{windDirection}}`
- `{{period}}`
- `{{bottomType}}`
- `{{score}}`
- `{{rating}}`

This is better than building the entire prompt text inline because the stable instructions and the changing surf values are now clearly separated.

Code example:

```txt
Spot: {{name}}
Conditions right now:
- Wave height: {{waveHeight}}m
- Wind: {{windSpeed}} km/h from {{windDirection}}
- Wave period: {{period}}s
- Bottom: {{bottomType}}
- Surf score: {{score}}/10 ({{rating}})
```

## Runtime Placeholder Replacement

At runtime, `explainer.ts` replaces the placeholders with real values from the selected spot.

Code example:

```ts
return template.replace(
  /{{\s*(name|waveHeight|windSpeed|windDirection|period|bottomType|score|rating)\s*}}/g,
  (_, key: string) => replacements[key] ?? ''
);
```

This keeps the template simple while still giving us dynamic prompt content.

## Prompt Value Formatting Fix

One issue we found after the database move was that the AI explanation could show raw numeric values while the UI showed rounded display values.

Example:

- card: `1.3 m`
- AI explanation: `1.28`

We fixed that by formatting prompt values before replacement.

What we now do:

- `waveHeight` is rounded to one decimal place
- `windSpeed` is rounded to a whole number
- `period` is rounded to a whole number
- `score` is rounded to one decimal place

Code example:

```ts
const replacements: Record<string, string> = {
  waveHeight: spot.waveHeight.toFixed(1),
  windSpeed: String(Math.round(spot.windSpeed)),
  period: String(Math.round(spot.period)),
  score: spot.score.toFixed(1),
};
```

This keeps the AI explanation aligned with what the user sees in the interface.

## Environment Variables

The model configuration no longer lives as hardcoded literals in the OpenAI request.

We now read:

- `OPENAI_MODEL`
- `OPENAI_MAX_TOKENS`

Why this is better:

- model changes do not require code edits
- token limits can be tuned per environment
- the app is easier to configure for testing and production

Code example:

```ts
function getOpenAIModel(): string {
  return process.env.OPENAI_MODEL || 'gpt-4o-mini';
}
```

## Error Handling Improvements

Previously, the explainer returned an empty string on failure.

That made the failure harder to understand in the UI because the user could end up with a blank explanation section.

Now the explainer returns:

`Explanation could not be loaded at this time.`

Why this is better:

- clearer user experience
- easier to distinguish "no explanation" from "failed explanation"
- safer fallback if the database prompt row is missing or OpenAI fails

Code example:

```ts
catch (err) {
  console.error('OpenAI explainer failed:', err);
  return EXPLANATION_FALLBACK;
}
```

## Small Performance Improvement

The current implementation also keeps the loaded prompt in memory after the first successful read:

```ts
let cachedPrompt: string | null = null;
```

Why this helps:

- avoids querying the database on every single explanation request
- keeps the database-backed architecture while reducing repeated reads

This is a lightweight optimization, not a full caching system.

## Benefits Of The New Prompting Setup

The new prompting flow improves the project in a few concrete ways:

- prompt text is no longer buried in code
- prompt updates are easier to manage
- runtime values are formatted consistently with the UI
- model settings are configurable
- failures degrade more gracefully
- the system is more ready for future prompt variations

## Refactor Principle We Followed

The rule behind this change was:

**treat prompt content as configurable application data, not hardcoded implementation detail**

That means:

- code handles behavior
- the database stores editable prompt content
- environment variables store deploy-time model configuration
- the explainer stitches those pieces together

This gives us a cleaner foundation for future AI work, especially if we later add prompt versioning, different explanation styles, or admin-managed prompt updates.
