import { type t } from '../common.ts';
import { resolveR2PushTargets } from './u.resolveR2PushTargets.ts';

type ResolvePushTargetsArgs = {
  cwd: t.StringDir;
  yaml: t.DeployTool.Config.EndpointYaml.Doc;
};

export async function resolvePushTargets(args: ResolvePushTargetsArgs): Promise<t.PushTargetPlan> {
  if (args.yaml.provider?.kind === 'r2') return await resolveR2PushTargets(args);
  return { targets: [], missing: [] };
}
