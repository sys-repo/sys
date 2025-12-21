import { type t } from '../common.ts';
import { probeProvider } from './u.probe.ts';
import { pushOrbiter } from './provider.orbiter/u.push.ts';

/**
 * Execute a push for the given provider.
 *
 * - Always preflights via probeProvider.
 * - Never throws (returns a PushResult).
 * - Provider-specific mechanics live behind kind dispatch.
 */
export async function pushProvider(args: {
  readonly provider?: t.DeployTool.Config.Provider.All;

  /** Absolute staging root directory (cwd for provider CLIs). */
  readonly stagingDir?: t.StringDir;

  /** Staging-relative directory the provider should publish. */
  readonly buildDir?: t.StringPath;

  /** Optional provider CLI binary override (defaults provider-specific). */
  readonly cmd?: string;
}): Promise<t.PushResult> {
  const { provider } = args;

  const preflight = await probeProvider(provider);
  if (!preflight.ok) {
    return { ok: false, reason: 'probe-failed', hint: preflight.hint, error: preflight.error };
  }

  if (!provider) {
    return { ok: false, reason: 'probe-failed', hint: 'No provider configured for this endpoint.' };
  }

  switch (provider.kind) {
    case 'orbiter': {
      const stagingDir = args.stagingDir;
      const buildDir = args.buildDir;

      if (!stagingDir) {
        return { ok: false, reason: 'failed', hint: 'Missing stagingDir for orbiter deploy.' };
      }
      if (!buildDir) {
        return { ok: false, reason: 'failed', hint: 'Missing buildDir for orbiter deploy.' };
      }

      return await pushOrbiter({
        stagingDir,
        provider,
        buildDir,
        cmd: args.cmd,
      });
    }

    case 'noop': {
      return { ok: true };
    }

    default: {
      const hint = `Unsupported provider kind: ${(provider as { kind?: unknown }).kind}`;
      return { ok: false, reason: 'unsupported-provider', hint };
    }
  }
}
