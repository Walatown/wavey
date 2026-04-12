import { getSurfConditions } from '@/lib/surfConditions';

export async function GET() {
  try {
    const conditions = await getSurfConditions();
    return Response.json(conditions);
  } catch (err) {
    console.error('Route crashed:', err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
