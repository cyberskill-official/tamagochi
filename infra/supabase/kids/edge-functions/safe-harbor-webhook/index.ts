const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { status: 204, headers: corsHeaders });
  if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

  const secret = Deno.env.get('SAFE_HARBOR_WEBHOOK_SECRET');
  if (!secret || request.headers.get('x-webhook-secret') !== secret) {
    return json(401, { error: 'invalid_webhook_secret' });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return json(400, { error: 'invalid_json' });

  const verificationId = text(body.verification_id);
  const parentEmail = text(body.parent_email);
  const outcome = text(body.outcome);
  if (!verificationId || !parentEmail || !['approved', 'denied', 'needs_review'].includes(outcome)) {
    return json(422, { error: 'invalid_safe_harbor_payload' });
  }

  const tenantId = text(body.tenant_id) || 'mochi-kids';
  if (!/^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/.test(tenantId)) {
    return json(422, { error: 'tenant.invalid' });
  }

  const inserted = await insertAudit(tenantId, {
    verification_id: verificationId,
    parent_email: parentEmail,
    outcome,
    vendor: body.vendor ?? 'safe-harbor',
    received_at: new Date().toISOString()
  });

  if (!inserted.ok) return json(502, { error: 'supabase_insert_failed', detail: inserted.detail });
  return json(202, { ok: true, tenant_id: tenantId });
});

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json; charset=utf-8' }
  });
}

async function insertAudit(tenantId: string, payload: Record<string, unknown>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return { ok: false, detail: 'missing_supabase_env' };

  const response = await fetch(`${supabaseUrl}/rest/v1/t_000_kids_baseline`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal'
    },
    body: JSON.stringify({
      id: `safe-harbor-${crypto.randomUUID()}`,
      tenant_id: tenantId,
      status: 'accepted',
      payload
    })
  });

  if (response.ok) return { ok: true };
  return { ok: false, detail: await response.text() };
}
