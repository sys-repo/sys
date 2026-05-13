import { c, type t } from './common.ts';
import { resolveOrbiterPushTargets as resolveOrbiterPushTargetsBase } from '../../u.push/u.resolveOrbiterPushTargets.ts';

export async function resolveOrbiterPushTargets(args: {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<t.OrbiterPushTargetPlan> {
  return await resolveOrbiterPushTargetsBase({
    ...args,
    onMultipleIndexMappings: (message) => console.info(c.yellow(message)),
  });
}
