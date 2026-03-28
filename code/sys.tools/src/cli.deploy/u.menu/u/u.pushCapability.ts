import { type t, Fs } from './common.ts';
import { Provider } from '../../u.providers/mod.ts';
import { resolvePushTargets } from './u.resolvePushTargets.ts';

type Reason =
  | 'yaml-invalid'
  | 'no-provider'
  | 'noop-provider'
  | 'no-push-targets'
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
      readonly targets: readonly t.PushTarget[];
      readonly reason?: 'probe-failed';
      readonly hint?: string;
      readonly error?: unknown;
    };

/**
 * Determine whether the endpoint menu should show a "push" action, and whether it
 * should be enabled.
 *
 * Rules (current):
 * - Only show when endpoint YAML validates AND a provider exists AND push targets resolve.
 * - Disable when provider probe fails.
 * - Never throws.
 */
export async function pushCapabilityOf(args: {
  cwd: t.StringDir;
  yamlPath: t.StringRelativeDir;
  checkOk: boolean; // YAML schema validation result from EndpointsFs.validateYaml(abs).
}): Promise<PushCapability> {
  const { cwd, yamlPath, checkOk } = args;

  if (!checkOk) {
    return { show: false, reason: 'yaml-invalid', hint: 'Fix YAML errors to enable push.' };
  }

  // Read endpoint YAML (provider + mappings). Keep it coarse; never throw.
  let yaml: t.DeployTool.Config.EndpointYaml.Doc | undefined;
  try {
    const path = Fs.join(cwd, yamlPath);
    const res = await Fs.readYaml<t.DeployTool.Config.EndpointYaml.Doc>(path);
    yaml = res.ok ? res.data : undefined;
  } catch {
    yaml = undefined;
  }

  if (!yaml) {
    return {
      show: false,
      reason: 'yaml-invalid',
      hint: 'Unable to read endpoint YAML.',
    };
  }

  const provider = yaml.provider;
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
  const plan = await resolvePushTargets({ cwd, yaml });
  const targets = plan.targets;

  // Show push only when provider push targets resolve.
  if (!targets.length) {
    return {
      show: false,
      reason: provider.kind === 'orbiter' ? 'no-staging-output' : 'no-push-targets',
      hint:
        provider.kind === 'orbiter'
          ? 'Run staging first (no staging output found).'
          : 'No deploy targets resolved for this provider.',
    };
  }

  // Provider preflight (runtime).
  const preflight = await Provider.probe(cwd, provider);
  if (!preflight.ok) {
    return {
      show: true,
      enabled: false,
      provider,
      targets,
      reason: 'probe-failed',
      hint: preflight.hint,
      error: preflight.error,
    };
  }

  return {
    show: true,
    enabled: true,
    provider,
    targets,
  };
}
