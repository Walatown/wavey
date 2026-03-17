# Wavey 🌊
A surf forecast app for beginners. Shows live wave and wind conditions for 5 spots in Bali, calculates a safety score, and explains the conditions in plain English using AI.

**Built by Polina Terentjeva** — Fontys ICT, Semester 7, Open Learning

---

## What it does

Most surf apps are built for experienced surfers and show raw marine data with no context. Wavey is designed for beginners — it takes live wave, wind, and swell data and turns it into a simple Good/Fair/Poor rating with an AI-generated explanation of what the conditions actually mean.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js / React / TypeScript |
| API routes | Next.js route handlers |
| Scoring engine | Custom TypeScript module |
| AI explanation | OpenAI API |
| Database | PostgreSQL (in progress) |
| Weather data | Open-Meteo Marine API + Forecast API |

---

## Project structure

```
src/
├── app/
│   └── api/
│       └── spots/
│           └── route.ts        # GET /api/spots — main API route
├── lib/
│   ├── openMeteo.ts            # Fetches marine + wind data from Open-Meteo
│   └── scoring.ts              # Calculates surf score from wave, wind, period
```

### Key files

**`openMeteo.ts`** — fetches live data from two separate Open-Meteo endpoints (marine and forecast) in parallel. Responses are cached for 10 minutes via `next: { revalidate: 600 }` to avoid hitting rate limits.

**`scoring.ts`** — pure function, no side effects. Takes wave height (m), wind speed (km/h), and swell period (s) and returns a weighted score and rating label. Hard overrides force a score of 0 if wave height > 2.0 m or wind > 40 km/h — unsafe conditions for beginners always score Poor regardless of other values.

```
Score = wave height × 0.5 + wind speed × 0.3 + swell period × 0.2
```

| Rating | Score |
|---|---|
| Epic | ≥ 8.0 |
| Good | ≥ 6.0 |
| Fair | ≥ 4.0 |
| Poor | < 4.0 |

**`route.ts`** — orchestrates everything. Reads 5 predefined Bali spots, fetches marine and wind data in parallel for each, runs the scoring engine, and calls OpenAI to generate a plain-English explanation. Returns a JSON array to the client.

---

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The surf data API is available at:
```
GET http://localhost:3000/api/spots
```

### Environment variables

Create a `.env.local` file:

```env
OPENAI_API_KEY=your_key_here
DATABASE_URL=your_postgres_url_here
```

---

## Surf spots

| Spot | Location |
|---|---|
| Kuta | Bali, Indonesia |
| Seminyak | Bali, Indonesia |
| Canggu | Bali, Indonesia |
| Uluwatu | Bali, Indonesia |
| Padang Padang | Bali, Indonesia |

---

## Status

| Feature | Status |
|---|---|
| Live marine + wind data | ✅ Done |
| Surf scoring engine | ✅ Done |
| API route | ✅ Done |
| OpenAI explanation | 🔧 In progress |
| PostgreSQL / historical data | 🔧 In progress |
| React frontend | 🔧 In progress |
| Tests | 🔧 In progress |

---

## Data sources

- [Open-Meteo Marine API](https://open-meteo.com/en/docs/marine-weather-api) — wave height, swell period, direction, water temperature
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) — wind speed and direction
- [OpenAI API](https://platform.openai.com/docs/api-reference) — plain-English condition explanations
