import { getSurfExplanation } from '@/lib/surfConditions';
import type { SurfExplanationRequest } from '@/types/surf';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SurfExplanationRequest>;

    if (
      typeof body.spotId !== 'number' ||
      typeof body.name !== 'string' ||
      typeof body.waveHeight !== 'number' ||
      typeof body.windSpeed !== 'number' ||
      typeof body.windDirection !== 'string' ||
      typeof body.period !== 'number' ||
      typeof body.score !== 'number' ||
      (body.rating !== 'Good' && body.rating !== 'Fair' && body.rating !== 'Poor')
    ) {
      return Response.json({ error: 'Invalid explanation payload.' }, { status: 400 });
    }

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
    return Response.json({ explanation });
  } catch (error) {
    console.error('Explanation route crashed:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
