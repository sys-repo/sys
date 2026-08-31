import { Fs, type t } from './common.ts';
import { resolvePushTargets } from '../../u.push/u.resolvePushTargets.ts';

type Reason =
  | 'yaml-invalid'
  | 'no-provider'
  | 'noop-provider'
  | 'no-push-targets'
  | 'target-resolution-failed';

type PushCapability =
  | {
    readonly show: false;
    readonly reason: Reason;
    readonly hint?: string;
  }
  | {
    readonly show: true;
    readonly provider: t.DeployTool.Config.Provider.R2;
    readonly targets: readonly t.PushTarget[];
  };

/**
 * Resolve whether valid endpoint YAML has a publish target for the push action.
 * Returns an unavailable capability instead of throwing.
 */
export async function pushCapabilityOf(args: {
  cwd: t.StringDir;
  yamlPath: t.StringPath;
  checkOk: boolean; // YAML schema validation result from EndpointsFs.validateYaml(abs).
  yaml?: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<PushCapability> {
  const { cwd, yamlPath, checkOk } = args;

  if (!checkOk) {
    return { show: false, reason: 'yaml-invalid', hint: 'Fix YAML errors to enable push.' };
  }

  // Read endpoint YAML (provider + mappings). Keep it coarse; never throw.
  let yaml = args.yaml;
  if (!yaml) {
    try {
      const path = Fs.resolve(cwd, yamlPath);
      const res = await Fs.readYaml<t.DeployTool.Config.EndpointYaml.Doc>(path);
      yaml = res.ok ? res.data : undefined;
    } catch {
      yaml = undefined;
    }
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

  let targets: readonly t.PushTarget[];
  try {
    targets = (await resolvePushTargets({ cwd, yaml })).targets;
  } catch {
    return {
      show: false,
      reason: 'target-resolution-failed',
      hint: 'Unable to resolve deploy targets.',
    };
  }

  if (!targets.length) {
    return {
      show: false,
      reason: 'no-push-targets',
      hint: 'No deploy targets resolved for this provider.',
    };
  }

  return {
    show: true,
    provider,
    targets,
  };
}
