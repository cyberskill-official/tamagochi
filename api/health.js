export default function handler(request, response) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.setHeader('allow', 'GET, HEAD');
    response.status(405).json({ ok: false, error: 'method_not_allowed' });
    return;
  }

  response.status(200).json({
    ok: true,
    app: 'tamagochi',
    target: process.env.TAMAGOCHI_DEPLOY_TARGET ?? 'standard',
    vercel: {
      env: process.env.VERCEL_ENV ?? 'local',
      region: process.env.VERCEL_REGION ?? 'local',
      commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? null
    }
  });
}
