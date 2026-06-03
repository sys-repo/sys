import { type t } from '../common.ts';
import { resolveOrbiterPushTargets } from './u.resolveOrbiterPushTargets.ts';
import { resolveR2PushTargets } from './u.resolveR2PushTargets.ts';

type ResolvePushTargetsArgs = {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
  onMultipleIndexMappings?: (message: string) => void;
};

export async function resolvePushTargets(args: ResolvePushTargetsArgs): Promise<t.PushTargetPlan> {
  const provider = args.yaml.provider;
  if (!provider) {
    return { targets: [], missing: [], stats: { total: 0, missing: 0 } };
  }
  if (provider.kind === 'r2') return await resolveR2PushTargets(args);
  if (provider.kind !== 'orbiter') {
    return { targets: [], missing: [], stats: { total: 0, missing: 0 } };
  }

  const plan = await resolveOrbiterPushTargets(args);
  return {
    targets: plan.targets,
    missing: plan.missing,
    stats: { total: plan.stats.total, missing: plan.stats.missing },
  };
}
