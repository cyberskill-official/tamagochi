const tenantPattern = /^[a-z0-9][a-z0-9_-]{1,62}[a-z0-9]$/;

export function resolveTenant(request: Request, body?: Record<string, unknown>): string {
  const fromHeader = request.headers.get('x-tenant-id');
  const fromBody = typeof body?.tenant_id === 'string' ? body.tenant_id : undefined;
  const tenantId = fromHeader ?? fromBody ?? 'mochi';

  if (!tenantPattern.test(tenantId)) {
    throw new Error('tenant.invalid');
  }

  return tenantId;
}
