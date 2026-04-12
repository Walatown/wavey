// src/lib/openMeteo.ts
// Fetches marine and wind forecast data from Open-Meteo APIs.
// All timestamps are forced to UTC so pickClosestIndex works consistently
// across both APIs — mixing timezone: 'auto' and UTC caused an 8-hour offset
// in Bali (UTC+8) which returned the wrong forecast hour.

export type MarineResponse = {
  hourly: {
    time:                      string[];
    wave_height?:              number[];
    wave_period?:              number[];
    wave_direction?:           number[];
    swell_wave_height?:        number[];
    swell_wave_period?:        number[];
    swell_wave_direction?:     number[];
    wind_wave_height?:         number[];
    wind_wave_period?:         number[];
    wind_wave_direction?:      number[];
    sea_surface_temperature?:  number[];
  };
  hourly_units?: Record<string, string>;
};

export type WindResponse = {
  hourly: {
    time:               string[];
    wind_speed_10m?:    number[];
    wind_direction_10m?: number[];
  };
};

export type Spot = {
  name: string;
  lat:  number;
  lon:  number;
};

// Fetches wave data for a spot from the Open-Meteo Marine API.
// Includes wave height, period, swell direction, and water temperature.
// Cached for 10 minutes (revalidate: 600) to avoid spamming the API.
export async function fetchMarineForecast(spot: Spot): Promise<MarineResponse> {
  const params = new URLSearchParams({
    latitude:      String(spot.lat),
    longitude:     String(spot.lon),
    hourly: [
      'wave_height',
      'wave_period',
      'wave_direction',
      'swell_wave_height',
      'swell_wave_period',
      'swell_wave_direction',
      'wind_wave_height',
      'wind_wave_period',
      'wind_wave_direction',
      'sea_surface_temperature',
    ].join(','),
    timezone:      'UTC',  // explicit UTC — must match wind fetch for pickClosestIndex
    forecast_days: '2',
  });

  const url = `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;

  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Open-Meteo marine error ${res.status}: ${text}`);
  }

  return res.json();
}

// Fetches wind speed and direction for a spot from the Open-Meteo Forecast API.
// Uses cache: 'no-store' to bypass Next.js fetch deduplication — all 5 Bali spots
// are so close together that their lat/lon round to the same URL after encoding,
// causing the cache to return the first spot's wind for every subsequent spot.
// timezone: 'UTC' matches the marine fetch so pickClosestIndex returns the same hour.
export async function fetchWindForecast(spot: Spot): Promise<WindResponse> {
  const params = new URLSearchParams({
    latitude:      String(spot.lat),
    longitude:     String(spot.lon),
    hourly:        'wind_speed_10m,wind_direction_10m',
    timezone:      'UTC',  // explicit UTC — must match marine fetch
    forecast_days: '2',
  });

  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Open-Meteo wind error ${res.status}: ${text}`);
  }

  return res.json();
}

// Finds the index in the hourly time array closest to the current moment.
// Both APIs return 48 hours of hourly data — this picks the right hour.
// Relies on all timestamps being in UTC (enforced by timezone: 'UTC' above).
export function pickClosestIndex(times: string[]): number {
  const now = Date.now();
  let bestIdx  = 0;
  let bestDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const diff = Math.abs(new Date(times[i]).getTime() - now);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestIdx  = i;
    }
  }

  return bestIdx;
}

// Converts wind direction in degrees to a compass label.
// Example: 270° → 'W', 45° → 'NE'
export function degreesToCompass(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}