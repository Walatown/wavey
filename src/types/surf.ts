export type Rating = 'Good' | 'Fair' | 'Poor';

export interface ForecastHour {
  time: string;
  score: number;
  rating: Rating;
  waveHeight: number;
  windSpeed: number;
}

export interface SurfSpot {
  id: number;
  name: string;
  location: string;
  lat: number;
  lon: number;
  waveHeight: number;
  period: number;
  windSpeed: number;
  windDirection: string;
  waterTemp: number | null;
  score: number;
  rating: Rating;
  bestTime: string;
  explanation: string;
  forecast: ForecastHour[];
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
