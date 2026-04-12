# Codebase Structure Refactor

## Why We Changed the Structure

The original version of the app worked, but too many responsibilities lived in a few files:

- `src/app/page.tsx` handled page layout, UI rendering, browser state, fetch logic, and spot-detail behavior.
- `src/app/api/surf-conditions/route.ts` handled the API endpoint, the list of surf spots, forecast fetching, score calculation, and response shaping.

That setup was fine for a first pass, but it made the code harder to grow. A small change to UI behavior, data fetching, or scoring logic meant opening large files and touching unrelated code. The refactor separated concerns so each file now has one main job.

## What Changed At a High Level

We moved from a mostly monolithic structure to a feature-oriented structure with clear layers:

- `src/app` now focuses on routes and page entry points.
- `src/components` now holds presentational UI pieces.
- `src/hooks` now holds client-side stateful logic.
- `src/lib` now holds server-side services, integrations, and domain logic.
- `src/types` now holds shared TypeScript contracts.

This means the UI, data fetching, scoring, database access, and AI explanation logic can evolve independently.

## Before And After

### Before

The main page contained:

- local React state for spots and selection
- the fetch call to `/api/surf-conditions`
- all home page sections
- cards and detail view markup
- helper UI functions

The surf conditions route contained:

- a hardcoded list of spots
- Open-Meteo orchestration
- score calculation
- response building

### After

The main page is now a composition layer. It wires together:

- `Header`
- `SearchPanel`
- `SpotCards`
- `SpotDetails`
- `Footer`
- `useSurfConditions`

The routes are now thin wrappers around library functions, and the core surf logic lives in `src/lib`.

### Code Example: `page.tsx` Before

Before the refactor, the page owned state, data loading, and UI markup in one place:

```tsx
const [spots, setSpots] = useState<SpotData[]>([]);
const [loading, setLoading] = useState(false);
const [selectedSpot, setSelectedSpot] = useState<SpotData | null>(null);

const fetchConditions = async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/surf-conditions');
    const data = await response.json();
    setSpots(data);
  } finally {
    setLoading(false);
  }
};
```

This worked, but it mixed page composition with async data behavior.

### Code Example: `page.tsx` After

Now the page mostly coordinates other pieces:

```tsx
const { spots, loading, error, fetchConditions, fetchExplanation, explainingSpotId } =
  useSurfConditions();
const [selectedSpotId, setSelectedSpotId] = useState<number | null>(null);

return (
  <div className="min-h-screen bg-[#e0f4ff]">
    <Header onShowConditions={() => setSelectedSpotId(null)} />
    <SearchPanel
      loading={loading}
      error={error}
      onFetchConditions={async () => {
        setSelectedSpotId(null);
        await fetchConditions();
      }}
    />
  </div>
);
```

This is the key improvement: the route entry file now reads like page structure instead of implementation detail.

## Why Specific Files Live Where They Do

### `src/app/page.tsx`

This file is now the page-level orchestrator for the home route.

Why it belongs here:

- In the Next.js App Router, `app/page.tsx` should represent the route entry point.
- It should decide which page sections to render, not own every detail of how those sections work.
- Keeping it small makes the route easier to scan and safer to change.

What it does now:

- owns only route-level UI flow
- tracks the selected spot id
- triggers explanation loading when a spot is opened
- composes the page from reusable parts

### `src/components/home/*`

These files hold home-page-specific UI pieces:

- `Header.tsx`
- `SearchPanel.tsx`
- `SpotCards.tsx`
- `SpotDetails.tsx`
- `Footer.tsx`

Why they belong here:

- They are presentational components, not route files and not business logic.
- Grouping them under `components/home` makes it obvious they belong to the home screen.
- This keeps `page.tsx` readable and makes individual UI sections easier to edit or restyle without touching data logic.

This folder exists because the app has already outgrown a single-page file, but these components are still specific to the home experience rather than generic site-wide components.

Code example:

```tsx
export function SearchPanel({ loading, error, onFetchConditions }: SearchPanelProps) {
  return (
    <div className="relative z-10 -mt-10 px-10">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-lg">
        <button type="button" onClick={onFetchConditions} disabled={loading}>
          {loading ? 'Loading...' : 'Check Conditions'}
        </button>
        {error && <div>{error}</div>}
      </div>
    </div>
  );
}
```

This component renders UI from props only. It does not know where the data comes from or how it is fetched.

### `src/hooks/useSurfConditions.ts`

This file owns client-side surf-condition state and browser fetch behavior.

Why it belongs here:

- Hooks are the right place for reusable stateful client logic in React.
- It bundles together loading state, error state, explanation loading state, and fetch functions.
- The page can stay focused on rendering while the hook focuses on how data is loaded and updated.

This is better than keeping fetch logic inside `page.tsx` because the async behavior is now isolated, easier to test, and easier to reuse if another page or component needs the same workflow later.

Code example:

```ts
const fetchConditions = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch('/api/surf-conditions');
    const data: SurfSpot[] = await response.json();
    setSpots(data);
  } catch (error) {
    setError(error instanceof Error ? error.message : 'Unable to load surf conditions.');
  } finally {
    setLoading(false);
  }
}, []);
```

This code lives in `hooks` because it is stateful browser behavior, not presentation.

### `src/app/api/surf-conditions/route.ts`

This route is now intentionally thin.

Why it belongs here:

- API routes should expose HTTP behavior for the frontend.
- They should not carry all domain logic themselves.
- A thin route is easier to validate, log, and change without duplicating business logic.

What it does now:

- calls `getSurfConditions()`
- returns JSON
- handles route-level error responses

Code example:

```ts
export async function GET() {
  try {
    const conditions = await getSurfConditions();
    return Response.json(conditions);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
```

Compared to the old route, this file no longer knows how forecasts are fetched or how scores are calculated.

### `src/app/api/surf-explanation/route.ts`

This new route isolates AI explanation generation from the conditions endpoint.

Why it belongs here:

- It is a separate API concern with its own request shape and error handling.
- The app does not need to generate explanations for every spot up front.
- Splitting this out allows explanations to load on demand when the user opens a spot.

This keeps the initial conditions request lighter and prevents AI generation concerns from being mixed into the general forecast endpoint.

Code example:

```ts
const explanation = await getSurfExplanation({
  spotId: body.spotId,
  name: body.name,
  waveHeight: body.waveHeight,
  windSpeed: body.windSpeed,
  windDirection: body.windDirection,
  period: body.period,
  score: body.score,
  rating: body.rating,
});
```

That small handoff is intentional. The route validates HTTP input, then delegates the real work.

### `src/lib/surfConditions.ts`

This file became the main domain service for surf-condition workflows.

Why it belongs here:

- It is business logic, not UI and not route wiring.
- It coordinates database reads, forecast fetching, scoring, persistence, and final response shaping.
- Multiple routes can depend on the same domain functions without duplicating implementation.

What it centralizes:

- reading spots from the database
- fetching forecast inputs for each spot
- calculating scores
- saving score snapshots
- building `SurfSpot` responses
- retrieving extra data needed for explanations

This file exists so the rules of “how surf conditions are assembled” live in one place.

Code example:

```ts
export async function getSurfConditions(): Promise<SurfSpot[]> {
  const spots = await getSpots();
  return Promise.all(spots.map(buildSurfSpot));
}
```

And inside the same service:

```ts
const { score, rating } = calculateSurfScore(
  waveHeight,
  windSpeed,
  windDirection,
  period,
  swellDirection,
  spot.ideal_swell_dir,
  spot.offshore_wind_dir,
  spot.reef_penalty
);
```

This is why `surfConditions.ts` lives in `lib`: it coordinates domain steps across multiple lower-level utilities.

### `src/lib/db.ts`

This file centralizes the Postgres connection pool.

Why it belongs here:

- Database setup is infrastructure code.
- It should be instantiated once and reused, not recreated inside route files or service files.
- Keeping it in `lib` makes the dependency easy to import anywhere server-side code needs database access.

Code example:

```ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

### `src/lib/openai.ts`

This file centralizes the OpenAI client.

Why it belongs here:

- External service clients are shared infrastructure.
- It avoids repeating client construction and environment variable handling.
- It keeps secret-bearing server code out of UI files.

Code example:

```ts
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
```

### `src/lib/explainer.ts`

This file owns the AI explanation generation behavior.

Why it belongs here:

- Prompting and model calls are application logic, not route logic and not page logic.
- It keeps OpenAI-specific behavior behind a small function interface.
- If the prompt, model, or response handling changes, those changes stay isolated here.

This also prevents `surfConditions.ts` from becoming a second monolith.

Code example:

```ts
const response = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  max_tokens: 120,
  messages: [{ role: 'user', content: prompt }],
});
```

Keeping this in its own file means prompt changes do not require touching route code or forecast code.

### `src/lib/openMeteo.ts`

This file contains the forecast integration with Open-Meteo.

Why it belongs here:

- It is an external API integration with provider-specific response types and fetch details.
- Those details should not leak into route files or UI components.
- The helper functions here, like `pickClosestIndex()` and `degreesToCompass()`, are tightly related to forecast processing.

This keeps vendor-specific logic in one place.

Code example:

```ts
export async function fetchMarineForecast(spot: Spot): Promise<MarineResponse> {
  const params = new URLSearchParams({
    latitude: String(spot.lat),
    longitude: String(spot.lon),
    timezone: 'UTC',
    forecast_days: '2',
  });

  const res = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params.toString()}`, {
    next: { revalidate: 600 },
  });

  return res.json();
}
```

### `src/lib/scoring.ts`

This file contains the surf scoring model.

Why it belongs here:

- Scoring is domain logic with its own rules, comments, and revisions.
- It should be isolated from transport concerns like HTTP and from presentation concerns like React.
- Keeping scoring separate makes it easier to adjust the formula without risking unrelated code.

Code example:

```ts
const raw =
  scoreWaveHeight(waveM) * 0.40 +
  scoreWind(windKmh, windDirDeg, offshoreDir) * 0.25 +
  scorePeriod(periodSec, windIsOnshore) * 0.20 +
  scoreSwellDirection(swellDirDeg, idealSwellDir) * 0.15;
```

This logic belongs in a dedicated scoring module because it is a domain formula, not an API or UI concern.

### `src/types/surf.ts`

This file holds shared TypeScript types for the surf feature.

Why it belongs here:

- These types are used across the app, routes, hooks, and library files.
- A shared `types` folder avoids duplicating interfaces in multiple files.
- It creates one source of truth for the shape of spots, explanation requests, and scoring records.

This is one of the most important structure changes because it reduces drift between frontend and backend assumptions.

Code example:

```ts
export interface SurfSpot {
  id: number;
  name: string;
  location: string;
  waveHeight: number;
  period: number;
  windSpeed: number;
  windDirection: string;
  waterTemp: number;
  score: number;
  rating: Rating;
  bestTime: string;
  explanation: string;
}
```

This shared contract is used across the route response, the hook state, and the UI components.

## Benefits Of The New Structure

The new layout improves the project in a few concrete ways:

- Smaller files with clearer responsibilities
- Easier onboarding because each folder answers a different question
- Better reuse across routes and components
- Less duplication between frontend and backend code
- Safer future changes because UI and business logic are decoupled
- Easier testing because logic is more isolated

## Folder Responsibility Summary

- `src/app`: Next.js routes, page entry points, and route handlers
- `src/components`: UI building blocks
- `src/hooks`: client-side state and async interaction logic
- `src/lib`: domain logic, infrastructure, and external integrations
- `src/types`: shared contracts between layers

## Refactor Principle We Followed

The main rule behind this refactor was:

**put code where its primary responsibility lives**

That means:

- route files handle HTTP
- page files handle page composition
- components handle rendering
- hooks handle client-side stateful workflows
- `lib` files handle domain and service logic
- shared types live in one shared place

This structure gives us a better foundation for the next steps of the app, especially as we keep expanding data sources, AI features, and UI complexity.
