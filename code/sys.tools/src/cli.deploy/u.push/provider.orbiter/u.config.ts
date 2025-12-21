import { type t, Json } from '../../common.ts';

/**
 * Build the orbiter.json object for an endpoint staging root.
 *
 * `buildCommand` is always a no-op because sys.tools owns build orchestration.
 * `buildDir` should be the *staging-relative* directory orbiter should publish
 * (eg "staging-1/ui-react-components").
 */
export function orbiterConfigOf(args: {
  readonly provider: t.DeployTool.Config.Provider.Orbiter;
  readonly buildDir: t.StringPath;
}): t.OrbiterConfig {
  const { provider } = args;
  return {
    siteId: String(provider.siteId ?? ''),
    domain: String(provider.domain ?? ''),
    buildCommand: 'echo no-op',
    buildDir: String(args.buildDir ?? ''),
  };
}

export function orbiterConfigJsonOf(config: t.OrbiterConfig): string {
  // Stable, readable JSON for a file users may inspect.
  return Json.stringify(config);
}

export async function writeOrbiterConfigFile(
  deps: t.OrbiterConfigDeps,
  args: {
    /** Absolute or staging-root-relative path to orbiter.json. */
    readonly path: t.StringPath;
    readonly provider: t.DeployTool.Config.Provider.Orbiter;
    /** Staging-relative build dir orbiter should publish. */
    readonly buildDir: t.StringPath;
  },
): Promise<{ readonly ok: true } | { readonly ok: false; readonly error: unknown }> {
  try {
    const config = orbiterConfigOf({ provider: args.provider, buildDir: args.buildDir });
    const json = orbiterConfigJsonOf(config);
    await deps.writeText(args.path, json);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}
