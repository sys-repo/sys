import { type t } from '../common.ts';
import { resolveOrbiterPushTargets } from './u.resolveOrbiterPushTargets.ts';

type ResolvePushTargetsArgs = {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
  onMultipleIndexMappings?: (message: string) => void;
};

export async function resolvePushTargets(args: ResolvePushTargetsArgs): Promise<t.PushTargetPlan> {
  const provider = args.yaml.provider;
  if (!provider) {
    return { targets: [], stats: { total: 0 } };
  }
  if (provider.kind !== 'orbiter') return { targets: [], stats: { total: 0 } };

  const plan = await resolveOrbiterPushTargets(args);
  return { targets: plan.targets, stats: { total: plan.stats.total } };
}
