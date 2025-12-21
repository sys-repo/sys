import { type t } from '../common.ts';
import { probeProvider } from './u.probe.ts';

/**
 * Execute a push for the given provider.
 *
 * - Always preflights via probeProvider.
 * - Never throws (returns a PushResult).
 * - Provider-specific mechanics live behind kind dispatch.
 */
export async function pushProvider(args: {
  readonly provider?: t.DeployTool.Config.Provider.All;
}): Promise<t.PushResult> {
  const { provider } = args;

  const preflight = await probeProvider(provider);
  if (!preflight.ok) {
    return {
      ok: false,
      reason: 'probe-failed',
      hint: preflight.hint,
      error: preflight.error,
    };
  }

  if (!provider) {
    return {
      ok: false,
      reason: 'probe-failed',
      hint: 'No provider configured for this endpoint.',
    };
  }

  switch (provider.kind) {
    case 'orbiter': {
      return {
        ok: false,
        reason: 'not-implemented',
        hint: 'Orbiter push execution not implemented yet.',
      };
      // 🌸 ---------- /ADDED ----------
    }

    case 'noop': {
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
