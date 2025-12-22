import { type t } from '../common.ts';
import { probe as probeOrbiter } from './provider.orbiter/u.probe.ts';

/**
 * Probe availability for the configured provider.
 *
 * This is a *runtime preflight*, not schema validation.
 * Callers (menus, CLI flows) should use this to:
 * - warn users early
 * - disable push actions when unavailable
 *
 * No throwing. Ever.
 */
export async function probe(provider?: t.DeployTool.Config.Provider.All): Promise<t.PushProbe> {
  if (!provider) {
    return {
      ok: false,
      reason: 'no-provider',
      hint: 'No provider configured for this endpoint.',
    };
  }

  switch (provider.kind) {
    case 'orbiter': {
      const res = await probeOrbiter();
      if (res.ok) return { ok: true };
      return { ok: false, reason: res.reason, hint: res.hint, error: res.error };
    }

    case 'noop': {
      // No-op provider is always "available"
      return { ok: true };
    }

    default: {
      return {
        ok: false,
        reason: 'unsupported-provider',
        hint: `Unsupported provider kind: ${(provider as { kind?: unknown }).kind}`,
      };
    }
  }
}
