import { fetchMarineForecast, fetchWindForecast, pickClosestIndex, degreesToCompass } from '@/lib/openMeteo';
import { calculateSurfScore } from '@/lib/scoring';

// Spots sourced from: mokumsurfclub.com/surfing-bali-8-best-surf-beaches/
const SPOTS = [
  { name: 'Canggu',        location: 'Bali, Indonesia', lat: -8.6478,  lon: 115.1385 },
  { name: 'Kedungu',       location: 'Bali, Indonesia', lat: -8.6089,  lon: 115.0833 },
  { name: 'Balian Beach',  location: 'Bali, Indonesia', lat: -8.5031,  lon: 114.9656 },
  { name: 'Balangan',      location: 'Bali, Indonesia', lat: -8.7905,  lon: 115.1234 },
  { name: 'Bingin',        location: 'Bali, Indonesia', lat: -8.8057,  lon: 115.1130 },
  { name: 'Padang Padang', location: 'Bali, Indonesia', lat: -8.8111,  lon: 115.1038 },
  { name: 'Uluwatu',       location: 'Bali, Indonesia', lat: -8.8291,  lon: 115.0849 },
  { name: 'Keramas',       location: 'Bali, Indonesia', lat: -8.6002,  lon: 115.3352 },
];

export async function GET() {
  try {
    const results = await Promise.all(
      SPOTS.map(async (spot) => {
        const [marine, wind] = await Promise.all([
          fetchMarineForecast(spot),
          fetchWindForecast(spot),
        ]);

        const idx = pickClosestIndex(marine.hourly.time);

        const waveHeight  = marine.hourly.wave_height?.[idx]             ?? 0;
        const period      = marine.hourly.wave_period?.[idx]             ?? 0;
        const swellDirDeg = marine.hourly.swell_wave_direction?.[idx]    ?? 0;
        const windSpeed   = wind.hourly.wind_speed_10m?.[idx]            ?? 0;
        const windDirDeg  = wind.hourly.wind_direction_10m?.[idx]        ?? 0;
        const waterTemp   = marine.hourly.sea_surface_temperature?.[idx] ?? 0;

        const { score, rating } = calculateSurfScore(
          waveHeight,
          windSpeed,
          windDirDeg,
          period,
          swellDirDeg,
          spot.name,
        );

        console.log(`\n--- ${spot.name} ---`);
        console.log('wave_height:', waveHeight);
        console.log('wave_period:', period);
        console.log('swell_direction:', swellDirDeg);
        console.log('wind_speed (km/h):', windSpeed);
        console.log('wind_direction:', windDirDeg, `(${degreesToCompass(windDirDeg)})`);
        console.log('water_temp:', waterTemp);
        console.log('score:', score, '|', rating);

        return {
          name:          spot.name,
          location:      spot.location,
          waveHeight,
          period,
          windSpeed,
          windDirection: degreesToCompass(windDirDeg),
          waterTemp,
          score,
          rating,
          bestTime:    '',
          explanation: '',
        };
      })
    );

    return Response.json(results);
  } catch (err) {
    console.error('Route crashed:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}