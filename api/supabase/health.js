const requiredKeys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

export default async function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('allow', 'GET, HEAD');
    response.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    response.status(503).json({
      ok: false,
      error: 'missing_supabase_env',
      missing
    });
    return;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const upstream = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    response.status(upstream.ok ? 200 : 502).json({
      ok: upstream.ok,
      supabase_status: upstream.status,
      target: process.env.TAMAGOCHI_DEPLOY_TARGET ?? 'standard'
    });
  } catch (error) {
    clearTimeout(timeout);
    response.status(502).json({
      ok: false,
      error: 'supabase_unreachable',
      detail: error instanceof Error ? error.message : 'unknown_error'
    });
  }
}
