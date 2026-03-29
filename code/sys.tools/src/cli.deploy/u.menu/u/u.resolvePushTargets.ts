import { DenoProvider } from '../../u.providers/mod.ts';
import { type t } from './common.ts';
import { resolveOrbiterPushTargets } from './u.resolveOrbiterPushTargets.ts';
import { Fs } from '../../common.ts';

export async function resolvePushTargets(args: {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<t.PushTargetPlan> {
  const provider = args.yaml.provider;
  if (!provider) {
    return { targets: [], stats: { total: 0 } };
  }
  if (provider.kind === 'deno') {
    const res = DenoProvider.resolveTarget(args);
    if (!res.ok) return { targets: [], stats: { total: 0 } };
    if (!(await Fs.exists(res.stagingRootAbs))) {
      return { targets: [], stats: { total: 0 } };
    }
    return {
      targets: [
        {
          provider: res.provider,
          sourceDir: res.targetDir,
          stagingDir: res.stagingRootAbs,
        },
      ],
      stats: { total: 1 },
    };
  }
  if (provider.kind !== 'orbiter') return { targets: [], stats: { total: 0 } };

  const plan = await resolveOrbiterPushTargets(args);
  return { targets: plan.targets, stats: { total: plan.stats.total } };
}
