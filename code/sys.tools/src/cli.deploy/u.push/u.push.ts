import { type t } from '../common.ts';
import { OrbiterProvider, Provider } from '../u.providers/mod.ts';

/**
 * Execute a push for the given provider.
 *
 * - Always preflights via probeProvider.
 * - Never throws (returns a PushResult).
 * - Provider-specific mechanics live behind kind dispatch.
 */
export async function pushProvider(args: {
  cwd: t.StringDir;
  provider?: t.DeployTool.Config.Provider.All;
  stagingDir: t.StringDir;
}): Promise<t.PushResult> {
  const { cwd, provider, stagingDir } = args;

  const preflight = await Provider.probe(cwd, provider);
  if (!preflight.ok) {
    return { ok: false, reason: 'probe-failed', hint: preflight.hint, error: preflight.error };
  }

  if (!provider) {
    return { ok: false, reason: 'probe-failed', hint: 'No provider configured for this endpoint.' };
  }

  switch (provider.kind) {
    case 'orbiter': {
      return await OrbiterProvider.push({ cwd, stagingDir, provider });
    }
    case 'noop': {
      return { ok: true };
    }

    default: {
      const kind = (provider as { kind?: unknown }).kind;
      return {
        ok: false,
        reason: 'unsupported-provider',
        hint: `Unsupported provider kind: ${kind}`,
      };
    }
  }
}
