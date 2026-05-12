import { type t, Cli, Fmt } from '../common.ts';
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
export async function probe(
  cwd: t.StringDir,
  provider?: t.DeployTool.Config.Provider.All,
  opts: { spin?: boolean } = {},
): Promise<t.PushProbe> {
  const msg = Fmt.spinnerText(`checking environment`);
  const spinner = (opts.spin ?? true) ? Cli.spinner(msg) : undefined;

  const done = (res: t.PushProbe): t.PushProbe => {
    spinner?.stop();
    return res;
  };

  if (!provider) {
    return done({
      ok: false,
      reason: 'no-provider',
      hint: 'No provider configured for this endpoint.',
    });
  }

  switch (provider.kind) {
    case 'orbiter': {
      const res = await probeOrbiter(cwd);
      if (res.ok) return done({ ok: true });
      return done({ ok: false, reason: res.reason, hint: res.hint, error: res.error });
    }

    case 'noop': {
      // No-op provider is always "available"
      return done({ ok: true });
    }

    default: {
      const kind = (provider as { kind?: unknown }).kind;
      return done({
        ok: false,
        reason: 'unsupported-provider',
        hint: `Unsupported provider kind: ${kind}`,
      });
    }
  }
}
