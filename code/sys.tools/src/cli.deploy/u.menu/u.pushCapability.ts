import { type t, Fs, Path } from '../common.ts';
import { probeProvider } from '../u.push/u.probe.ts';

type Reason =
  | 'yaml-invalid'
  | 'no-provider'
  | 'noop-provider'
  | 'no-staging-output'
  | 'probe-failed';

type PushCapability =
  | {
      readonly show: false;
      readonly reason: Reason;
      readonly hint?: string;
      readonly error?: unknown;
    }
  | {
      readonly show: true;
      readonly enabled: boolean;
      readonly provider: t.DeployTool.Config.Provider.All;
      readonly stagingDirs: readonly t.StringDir[]; // Absolute staging dirs that exist on disk (deploy root resolved).
      readonly reason?: 'probe-failed';
      readonly hint?: string;
      readonly error?: unknown;
    };

/**
 * Determine whether the endpoint menu should show a "push" action, and whether it
 * should be enabled.
 *
 * Rules (current):
 * - Only show when endpoint YAML validates AND a provider exists AND staging output exists.
 * - Disable when provider probe fails.
 * - Never throws.
 */
export async function pushCapabilityOf(args: {
  cwd: t.StringDir; //      Deploy root (config folder).
  yamlAbs: t.StringPath; // Absolute path to the endpoint YAML file.
  checkOk: boolean; //      YAML schema validation result from EndpointsFs.validateYaml(abs).
}): Promise<PushCapability> {
  const { cwd, yamlAbs, checkOk } = args;

  if (!checkOk) {
    return { show: false, reason: 'yaml-invalid', hint: 'Fix YAML errors to enable push.' };
  }

  // Read endpoint YAML (provider + mappings). Keep it coarse; never throw.
  let yaml: t.DeployTool.Config.EndpointYaml.Doc | undefined;
  try {
    const res = await Fs.readYaml<t.DeployTool.Config.EndpointYaml.Doc>(String(yamlAbs));
    yaml = res.ok ? res.data : undefined;
  } catch {
    yaml = undefined;
  }

  const provider = yaml?.provider;
  if (!provider) {
    return {
      show: false,
      reason: 'no-provider',
      hint: 'No provider configured for this endpoint.',
    };
  }

  if (provider.kind === 'noop') {
    return { show: false, reason: 'noop-provider' };
  }

  /**
   * Staging outputs live under `yaml.staging.dir` (relative to deploy root),
   * then each mapping stages into a subdir relative to that staging root.
   *
   * Before: we incorrectly resolved `m.dir.staging` directly under `cwd`,
   * which breaks multi-mapping endpoints (e.g. "./staging" + "./ui.components").
   */
  const stagingRootRel = String(yaml?.staging?.dir ?? '').trim() || '.';
  const stagingRootAbs = Path.resolve(String(cwd), stagingRootRel);

  const mappings = yaml?.mappings ?? [];
  const stagingAbs = [
    ...new Set(
      mappings.map((m) => {
        const rel = String(m.dir.staging ?? '').trim() || '.';
        return Path.resolve(stagingRootAbs, rel);
      }),
    ),
  ];

  const exists = await Promise.all(
    stagingAbs.map(async (p) => {
      try {
        return (await Fs.exists(p)) ? p : undefined;
      } catch {
        return undefined;
      }
    }),
  );

  const stagingDirs = exists.filter(Boolean) as readonly t.StringDir[];

  // Show push only when staging output exists.
  if (!stagingDirs.length) {
    return {
      show: false,
      reason: 'no-staging-output',
      hint: 'Run staging first (no staging output found).',
    };
  }

  // Provider preflight (runtime).
  const preflight = await probeProvider(provider);
  if (!preflight.ok) {
    return {
      show: true,
      enabled: false,
      provider,
      stagingDirs,
      reason: 'probe-failed',
      hint: preflight.hint,
      error: preflight.error,
    };
  }

  return {
    show: true,
    enabled: true,
    provider,
    stagingDirs,
  };
}
