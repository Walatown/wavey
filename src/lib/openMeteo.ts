export type MarineResponse = {
  hourly: {
    time: string[];
    wave_height?: number[];
    wave_period?: number[];
    wave_direction?: number[];
    swell_wave_height?: number[];
    swell_wave_period?: number[];
    swell_wave_direction?: number[];
    wind_wave_height?: number[];
    wind_wave_period?: number[];
    wind_wave_direction?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
    sea_surface_temperature?: number[];  // ← add this
  };
  hourly_units?: Record<string, string>;
};
  
  export type Spot = {
    name: string;
    lat: number;
    lon: number;
  };
  

  
  export async function fetchMarineForecast(spot: Spot): Promise<MarineResponse> {
    const params = new URLSearchParams({
      latitude: String(spot.lat),
      longitude: String(spot.lon),
      hourly: [
        "wave_height",
        "wave_period",
        "wave_direction",
        "swell_wave_height",
        "swell_wave_period",
        "swell_wave_direction",
        "wind_wave_height",
        "wind_wave_period",
        "wind_wave_direction",
        "sea_surface_temperature",
      ].join(","),
      timezone: "auto",
      forecast_days: "2",
    });
  
    const url = `https://marine-api.open-meteo.com/v1/marine?${params.toString()}`;
  
    // Next.js fetch: cache + revalidate so you don't spam the API while developing
    const res = await fetch(url, { next: { revalidate: 600 } }); // 10 min
    if (!res.ok) {
      const text = await res.text();
      
      throw new Error(`Open-Meteo error ${res.status}: ${text}`);
    }
    
    return res.json();

  }

  
  export function pickClosestIndex(times: string[]): number {
    const now = Date.now();
    let bestIdx = 0;
    let bestDiff = Infinity;
  
    for (let i = 0; i < times.length; i++) {
      const t = new Date(times[i]).getTime();
      const diff = Math.abs(t - now);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    return bestIdx;
  }

  export type WindResponse = {
    hourly: {
      time: string[];
      wind_speed_10m?: number[];
      wind_direction_10m?: number[];
    };
  };
  
  export async function fetchWindForecast(spot: Spot): Promise<WindResponse> {
    const params = new URLSearchParams({
      latitude: String(spot.lat),
      longitude: String(spot.lon),
      hourly: "wind_speed_10m,wind_direction_10m",
      timezone: "auto",
      forecast_days: "2",
    });
  
    const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;

    // Next.js deduplicates fetch() calls that share the same URL string.
    // Because all 5 Bali spots are so close together, their lat/lon round to
    // the same URL after URL encoding, causing the cache to return the first
    // spot's wind data for every subsequent spot.
    // Setting cache: 'no-store' bypasses deduplication so each spot gets its
    // own real response. The 10-min revalidation on the marine call is still
    // in place, so we are not spamming Open-Meteo overall.
    const res = await fetch(url, { cache: 'no-store' });
  
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Open-Meteo wind error ${res.status}: ${text}`);
    }
  
    return res.json();
  }
  
  export function degreesToCompass(deg: number): string {
    const dirs = ["N","NNE","NE","ENE","E","ESE","SE","SSE","S","SSW","SW","WSW","W","WNW","NW","NNW"];
    return dirs[Math.round(deg / 22.5) % 16];
  }