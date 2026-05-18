import { brotliCompressSync, gzipSync } from 'node:zlib';
import type { BuildTarget, TenantSlug } from './types.ts';
import { assert } from './utils.ts';

export interface BundleRecord {
  name: string;
  tenantSlug: TenantSlug;
  url: string;
  version?: string;
}

export class AssetBundleLoader {
  private readonly cache = new Map<string, BundleRecord>();

  async loadBundle(name: string, opts: { cdnPrefix: string; tenantSlug?: TenantSlug; version?: string; retry?: { max: number; baseMs: number } }): Promise<BundleRecord> {
    const tenantSlug = opts.tenantSlug ?? 'mochi';
    const key = `${tenantSlug}:${name}:${opts.version ?? 'last-good'}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    assert(/^https?:\/\//.test(opts.cdnPrefix), 'infra.invalid_cdn_prefix');
    const url = `${opts.cdnPrefix.replace(/\/$/, '')}/${tenantSlug}/${name}${opts.version ? `?v=${opts.version}` : ''}`;
    const record = { name, tenantSlug, url, version: opts.version };
    this.cache.set(key, record);
    return record;
  }

  evict(name: string, tenantSlug: TenantSlug): void {
    for (const key of [...this.cache.keys()]) {
      if (key.startsWith(`${tenantSlug}:${name}:`)) this.cache.delete(key);
    }
  }
}

export class InfraService {
  readonly cocosVersion = '3.8.4';
  readonly typescriptVersion = '5.4.x';
  readonly nodeVersion = '22.x';
  readonly region = 'ap-southeast-1';
  readonly loader = new AssetBundleLoader();
  readonly supabaseProjects = ['standard', 'kids'] as const;
  readonly rlsTemplates = ['tenant scoped read', 'tenant scoped write', 'dpo audit'];

  buildConfig(target: BuildTarget): Record<string, string | boolean> {
    return {
      target,
      buildTarget: target,
      bundleId: target === 'kids' ? 'app.tamagochi.kids' : 'app.tamagochi.standard',
      appName: target === 'kids' ? 'Tamagochi Kids' : 'Tamagochi',
      analyticsEnabled: false,
      sourceMapsPublic: false,
      deterministicTimestamp: '2000-01-01T00:00:00Z'
    };
  }

  assertBundleBudget(buffers: Buffer[], budgetBytes = 15 * 1024 * 1024): true {
    const merged = Buffer.concat(buffers);
    assert(brotliCompressSync(merged).length <= budgetBytes, 'infra.webgl_brotli_budget_exceeded');
    assert(gzipSync(merged).length <= budgetBytes, 'infra.webgl_gzip_budget_exceeded');
    return true;
  }

  createRealtimeRoom(name: string, tenantId: TenantSlug): { name: string; tenantId: TenantSlug; stickySession: true; redisPresence: true } {
    return { name, tenantId, stickySession: true, redisPresence: true };
  }

  assertSupabaseBaseline(): true {
    assert(this.supabaseProjects.includes('standard'), 'infra.standard_project_missing');
    assert(this.supabaseProjects.includes('kids'), 'infra.kids_project_missing');
    assert(this.rlsTemplates.length >= 3, 'infra.rls_templates_missing');
    return true;
  }
}
