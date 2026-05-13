import { c, type t } from './common.ts';
import { resolvePushTargets as resolvePushTargetsBase } from '../../u.push/u.resolvePushTargets.ts';

export async function resolvePushTargets(args: {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
}): Promise<t.PushTargetPlan> {
  return await resolvePushTargetsBase({
    ...args,
    onMultipleIndexMappings: (message) => console.info(c.yellow(message)),
  });
}
