import { jsonResponse, preflight } from '../_shared/cors.ts';
import { resolveTenant } from '../_shared/tenant-resolver.ts';

Deno.serve(async (request) => {
  const options = preflight(request);
  if (options) return options;
  if (request.method !== 'POST') return jsonResponse(request, 405, { error: 'method_not_allowed' });

  const secret = Deno.env.get('BREACH_DRAFT_WEBHOOK_SECRET');
  if (!secret || request.headers.get('x-webhook-secret') !== secret) {
    return jsonResponse(request, 401, { error: 'invalid_webhook_secret' });
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return jsonResponse(request, 400, { error: 'invalid_json' });

  const incidentId = typeof body.incident_id === 'string' ? body.incident_id.trim() : '';
  const severity = typeof body.severity === 'string' ? body.severity.trim() : '';
  if (!incidentId || !['low', 'medium', 'high', 'critical'].includes(severity)) {
    return jsonResponse(request, 422, { error: 'invalid_breach_payload' });
  }

  let tenantId = 'mochi';
  try {
    tenantId = resolveTenant(request, body);
  } catch {
    return jsonResponse(request, 422, { error: 'tenant.invalid' });
  }

  const inserted = await insertAudit('breach-draft-flush', tenantId, {
    incident_id: incidentId,
    severity,
    draft_type: body.draft_type ?? 'a05_72h_notice',
    affected_subject_count: Number(body.affected_subject_count ?? 0),
    flushed_at: new Date().toISOString()
  });

  if (!inserted.ok) {
    return jsonResponse(request, 502, { error: 'supabase_insert_failed', detail: inserted.detail });
  }

  return jsonResponse(request, 202, { ok: true, tenant_id: tenantId });
});

async function insertAudit(idPrefix: string, tenantId: string, payload: Record<string, unknown>) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return { ok: false, detail: 'missing_supabase_env' };

  const response = await fetch(`${supabaseUrl}/rest/v1/t_000_baseline`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
      prefer: 'return=minimal'
    },
    body: JSON.stringify({
      id: `${idPrefix}-${crypto.randomUUID()}`,
      tenant_id: tenantId,
      status: 'accepted',
      payload
    })
  });

  if (response.ok) return { ok: true };
  return { ok: false, detail: await response.text() };
}
