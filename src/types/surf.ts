export type Rating = 'Good' | 'Fair' | 'Poor';

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

export interface SurfExplanationRequest {
  spotId: number;
  name: string;
  waveHeight: number;
  windSpeed: number;
  windDirection: string;
  period: number;
  score: number;
  rating: Rating;
}

export interface SpotForecastInput {
  id: number;
  name: string;
  location: string;
  lat: number;
  lon: number;
  ideal_swell_dir: number;
  offshore_wind_dir: number;
  reef_penalty: number;
  bottom_type: string;
}

export interface SurfScoreRecord {
  spotId: number;
  waveHeight: number;
  windSpeed: number;
  windDirection: number;
  period: number;
  swellDirection: number;
  waterTemp: number;
  score: number;
  rating: Rating;
}
