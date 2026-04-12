import pool from '@/lib/db';
import { generateExplanation } from '@/lib/explainer';
import {
  degreesToCompass,
  fetchMarineForecast,
  fetchWindForecast,
  pickClosestIndex,
} from '@/lib/openMeteo';
import { calculateSurfScore } from '@/lib/scoring';
import { getWaveHeight } from '@/lib/waveHeight';
import type {
  SpotForecastInput,
  SurfExplanationRequest,
  SurfScoreRecord,
  SurfSpot,
} from '@/types/surf';

async function getSpots(): Promise<SpotForecastInput[]> {
  const { rows } = await pool.query<SpotForecastInput>('SELECT * FROM spots ORDER BY id');
  return rows;
}

async function getSpotById(spotId: number): Promise<SpotForecastInput | null> {
  const { rows } = await pool.query<SpotForecastInput>(
    'SELECT * FROM spots WHERE id = $1 LIMIT 1',
    [spotId]
  );

  return rows[0] ?? null;
}

async function saveSurfScore(record: SurfScoreRecord) {
  await pool.query(
    `INSERT INTO surf_scores
      (spot_id, wave_height, wind_speed, wind_direction, period, swell_direction, water_temp, score, rating)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      record.spotId,
      record.waveHeight,
      record.windSpeed,
      record.windDirection,
      record.period,
      record.swellDirection,
      record.waterTemp,
      record.score,
      record.rating,
    ]
  );
}

function getHourlyValue(values: number[] | undefined, index: number) {
  return values?.[index] ?? 0;
}

async function buildSurfSpot(
  spot: SpotForecastInput,
  options: { persistScore?: boolean } = {}
): Promise<SurfSpot> {
  const [marine, wind] = await Promise.all([
    fetchMarineForecast(spot),
    fetchWindForecast(spot),
  ]);

  const forecastIndex = pickClosestIndex(marine.hourly.time);
  const waveHeight = getWaveHeight(marine, forecastIndex);
  const period = getHourlyValue(marine.hourly.wave_period, forecastIndex);
  const swellDirection = getHourlyValue(marine.hourly.swell_wave_direction, forecastIndex);
  const windSpeed = getHourlyValue(wind.hourly.wind_speed_10m, forecastIndex);
  const windDirection = getHourlyValue(wind.hourly.wind_direction_10m, forecastIndex);
  const waterTemp = getHourlyValue(marine.hourly.sea_surface_temperature, forecastIndex);

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

  if (options.persistScore) {
    await saveSurfScore({
      spotId: spot.id,
      waveHeight,
      windSpeed,
      windDirection,
      period,
      swellDirection,
      waterTemp,
      score,
      rating,
    });
  }

  return {
    id: spot.id,
    name: spot.name,
    location: spot.location,
    waveHeight,
    period,
    windSpeed,
    windDirection: degreesToCompass(windDirection),
    waterTemp,
    score,
    rating,
    bestTime: '',
    explanation: '',
  };
}

export async function getSurfConditions(): Promise<SurfSpot[]> {
  const spots = await getSpots();
  return Promise.all(spots.map(buildSurfSpot));
}

export async function refreshSurfScores(): Promise<{ inserted: number }> {
  const spots = await getSpots();

  await Promise.all(
    spots.map((spot) =>
      buildSurfSpot(spot, {
        persistScore: true,
      })
    )
  );

  return { inserted: spots.length };
}

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
