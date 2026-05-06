import { toErrorPayload } from '@/lib/apiError';
import { getSurfConditions, getSurfExplanation } from '@/lib/surfConditions';
import type { SurfExplanationRequest } from '@/types/surf';

// Validates the POST body before requesting an AI explanation.
function isValidExplanationRequest(
  body: Partial<SurfExplanationRequest>
): body is SurfExplanationRequest {
  return (
    typeof body.spotId === 'number' &&
    typeof body.name === 'string' &&
    typeof body.waveHeight === 'number' &&
    typeof body.windSpeed === 'number' &&
    typeof body.windDirection === 'string' &&
    typeof body.period === 'number' &&
    typeof body.score === 'number' &&
    (body.rating === 'Good' || body.rating === 'Fair' || body.rating === 'Poor')
  );
}

// Returns the latest surf conditions for all configured spots.
export async function GET() {
  try {
    const conditions = await getSurfConditions();
    return Response.json(conditions);
  } catch (error) {
    console.error('Surf data route GET crashed:', error);
    return Response.json({ error: toErrorPayload(error) }, { status: 500 });
  }
}

// Generates an explanation for a single surf spot from the submitted payload.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<SurfExplanationRequest>;

    if (!isValidExplanationRequest(body)) {
      return Response.json({ error: 'Invalid explanation payload.' }, { status: 400 });
    }

    const explanation = await getSurfExplanation(body);
    return Response.json({ explanation });
  } catch (error) {
    console.error('Surf data route POST crashed:', error);
    return Response.json({ error: toErrorPayload(error) }, { status: 500 });
  }
}
