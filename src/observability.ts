import type { AudienceAgeGate, TenantSlug } from './types.ts';
import { assert } from './utils.ts';

export class ObservabilityService {
  readonly events: Array<Record<string, unknown>> = [];
  readonly uptimeChecks = ['api', 'realtime', 'supabase', 'cdn'];

  sdkPlan(audience: AudienceAgeGate): string[] {
    if (audience === 'under-13') return ['GameAnalytics', 'Sentry'];
    return ['GameAnalytics', 'Mixpanel', 'AppsFlyer', 'Sentry', 'Better Stack'];
  }

  track(name: string, props: Record<string, unknown>, tenantId: TenantSlug = 'mochi'): void {
    assert(!name.includes('email'), 'obs.no_pii_event_name');
    this.events.push({ name, tenantId, ...props });
  }

  sentryTags(tenantId: TenantSlug, buildTarget: 'kids' | 'standard'): Record<string, string> {
    return { tenant_id: tenantId, build_target: buildTarget };
  }

  antiCheatDecision(input: { signatureValid: boolean; rateLimited: boolean; impossibleTransition: boolean; tenantId: TenantSlug }): 'allow' | 'ban_review' {
    if (!input.signatureValid || input.rateLimited || input.impossibleTransition) {
      this.track('security.impossible-transition', { reason: JSON.stringify(input) }, input.tenantId);
      return 'ban_review';
    }
    return 'allow';
  }

  reconcileLedger(driftPct: number): 'ok' | 'alert' {
    if (driftPct > 0.1) {
      this.track('econ.reconciliation.drift', { drift_pct: driftPct });
      return 'alert';
    }
    return 'ok';
  }
}
