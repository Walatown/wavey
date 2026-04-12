import type { MarineResponse } from './openMeteo';
import type { SurfExplanationRequest, SurfSpot } from '../types/surf';

export function getWaveHeight(
  marine: Pick<MarineResponse, 'hourly'>,
  forecastIndex: number
): number {
  return marine.hourly.wave_height?.[forecastIndex] ?? 0;
}

export function toSurfExplanationRequest(spot: SurfSpot): SurfExplanationRequest {
  return {
    spotId: spot.id,
    name: spot.name,
    waveHeight: spot.waveHeight,
    windSpeed: spot.windSpeed,
    windDirection: spot.windDirection,
    period: spot.period,
    score: spot.score,
    rating: spot.rating,
  };
}
