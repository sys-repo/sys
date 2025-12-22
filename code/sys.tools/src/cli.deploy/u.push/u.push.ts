import { type t } from '../common.ts';
import { pushOrbiter } from './provider.orbiter/u.push.ts';
import { probeProvider } from './u.probe.ts';

/**
 * Execute a push for the given provider.
 *
 * - Always preflights via probeProvider.
 * - Never throws (returns a PushResult).
 * - Provider-specific mechanics live behind kind dispatch.
 */
export async function pushProvider(args: {
  provider?: t.DeployTool.Config.Provider.All;
  stagingDir: t.StringDir;
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
      return await pushOrbiter({
        stagingDir: args.stagingDir,
        provider,
      });
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
