import { type t } from './common.ts';
import { resolveOrbiterPushTargets } from './u.resolveOrbiterPushTargets.ts';

export async function resolvePushTargets(args: {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<t.PushTargetPlan> {
  const provider = args.yaml.provider;
  if (!provider) {
    return { targets: [], stats: { total: 0 } };
  }
  if (provider.kind !== 'orbiter') return { targets: [], stats: { total: 0 } };

  const plan = await resolveOrbiterPushTargets(args);
  return { targets: plan.targets, stats: { total: plan.stats.total } };
}
