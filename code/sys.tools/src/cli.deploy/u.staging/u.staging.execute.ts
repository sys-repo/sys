import { type t } from '../common.ts';
import { execBuildCopy } from './u.execBuildCopy.ts';
import { execCopy } from './u.execCopy.ts';

export async function executeStaging(
  mappings: readonly t.DeployTool.Staging.Mapping[],
  options: t.DeployTool.Staging.ExecuteOptions = {},
): Promise<void> {
  const cwd = options.cwd ?? '.';

  for (const m of mappings) {
    switch (m.mode) {
      case 'copy': {
        await execCopy(cwd, m.dir);
        break;
      }

      case 'build+copy': {
        await execBuildCopy(cwd, m.dir);
        break;
      }
    }
  }
}
