import { refreshSurfScores } from '@/lib/surfConditions';

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET is not set.');
    return false;
  }

  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await refreshSurfScores();

    return Response.json({
      ok: true,
      inserted: result.inserted,
      ranAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron surf score refresh failed:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
