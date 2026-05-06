import pool from '@/lib/db';
import { generateExplanation } from '@/lib/explainer';
import {
  degreesToCompass,
  fetchMarineForecast,
  fetchWindForecast,
  pickClosestIndex,
} from '@/lib/openMeteo';
import { calculateSurfScore } from '@/lib/scoring';
import type {
  ForecastHour,
  SpotForecastInput,
  SurfExplanationRequest,
  SurfSpot,
} from '@/types/surf';

// Returns all configured surf spots from the database.
async function getSpots(): Promise<SpotForecastInput[]> {
  const { rows } = await pool.query<SpotForecastInput>('SELECT * FROM spots ORDER BY id');
  return rows;
}

// Loads one surf spot so explanation requests can include spot metadata.
async function getSpotById(spotId: number): Promise<SpotForecastInput | null> {
  const { rows } = await pool.query<SpotForecastInput>(
    'SELECT * FROM spots WHERE id = $1 LIMIT 1',
    [spotId]
  );

  return rows[0] ?? null;
}

// Reads a required hourly value and falls back to zero when it is missing.
function getHourlyValue(values: number[] | undefined, index: number) {
  return values?.[index] ?? 0;
}

// Returns the wave height for the selected forecast hour, or zero when missing.
function getWaveHeight(values: number[] | undefined, index: number) {
  return values?.[index] ?? 0;
}

// Reads an optional hourly value and keeps missing data as null.
function getOptionalHourlyValue(values: number[] | undefined, index: number) {
  return values?.[index] ?? null;
}

// Processes items with a small worker pool to avoid overloading external APIs.
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await worker(items[currentIndex]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runWorker()
  );

  await Promise.all(workers);
  return results;
}

// Builds one UI-ready surf spot by combining forecasts and the scoring rules.
async function buildSurfSpot(spot: SpotForecastInput): Promise<SurfSpot> {
  const [marine, wind] = await Promise.all([
    fetchMarineForecast(spot),
    fetchWindForecast(spot),
  ]);

  const forecastIndex = pickClosestIndex(marine.hourly.time);
  const waveHeight = getWaveHeight(marine.hourly.wave_height, forecastIndex);
  const period = getHourlyValue(marine.hourly.wave_period, forecastIndex);
  const swellDirection = getHourlyValue(marine.hourly.swell_wave_direction, forecastIndex);
  const windSpeed = getHourlyValue(wind.hourly.wind_speed_10m, forecastIndex);
  const windDirection = getHourlyValue(wind.hourly.wind_direction_10m, forecastIndex);
  const waterTemp = getOptionalHourlyValue(marine.hourly.sea_surface_temperature, forecastIndex);

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

  const forecast: ForecastHour[] = [];
  for (let step = 3; step <= 24; step += 3) {
    const idx = forecastIndex + step;
    if (idx >= marine.hourly.time.length) break;

    const fWave = getWaveHeight(marine.hourly.wave_height, idx);
    const fPeriod = getHourlyValue(marine.hourly.wave_period, idx);
    const fSwellDir = getHourlyValue(marine.hourly.swell_wave_direction, idx);
    const fWindSpeed = getHourlyValue(wind.hourly.wind_speed_10m, idx);
    const fWindDir = getHourlyValue(wind.hourly.wind_direction_10m, idx);

    const { score: fScore, rating: fRating } = calculateSurfScore(
      fWave, fWindSpeed, fWindDir, fPeriod, fSwellDir,
      spot.ideal_swell_dir, spot.offshore_wind_dir, spot.reef_penalty
    );

    forecast.push({
      time: marine.hourly.time[idx],
      score: fScore,
      rating: fRating,
      waveHeight: fWave,
      windSpeed: fWindSpeed,
    });
  }

  return {
    id: spot.id,
    name: spot.name,
    location: spot.location,
    lat: spot.lat,
    lon: spot.lon,
    waveHeight,
    period,
    windSpeed,
    windDirection: degreesToCompass(windDirection),
    waterTemp,
    score,
    rating,
    bestTime: '',
    explanation: '',
    forecast,
  };
}

// Returns the latest computed conditions for every surf spot.
export async function getSurfConditions(): Promise<SurfSpot[]> {
  const spots = await getSpots();
  return mapWithConcurrency(spots, 2, (spot) => buildSurfSpot(spot));
}

// Generates an AI explanation for a single spot using the saved spot metadata.
export async function getSurfExplanation(input: SurfExplanationRequest): Promise<string> {
  const spot = await getSpotById(input.spotId);

  if (!spot) {
    throw new Error(`Spot ${input.spotId} not found.`);
  }

  return generateExplanation({
    name: input.name,
    waveHeight: input.waveHeight,
    windSpeed: input.windSpeed,
    windDirection: input.windDirection,
    period: input.period,
    score: input.score,
    rating: input.rating,
    bottomType: spot.bottom_type,
  });
}
