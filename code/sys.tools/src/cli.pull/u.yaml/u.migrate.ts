import { type t } from '../common.ts';
import { migrate01 } from './u.migrate.-01.ts';
import { migrate02 } from './u.migrate.-02.ts';
import { migrate03 } from './u.migrate.-03.ts';
import { migrate04 } from './u.migrate.-04.ts';

export const PullMigrate = {
  async run(cwd: t.StringDir): Promise<t.YamlConfig.Migrate.DirResult> {
    const one = await migrate01(cwd);
    const two = await migrate02(cwd);
    const three = await migrate03(cwd);
    const four = await migrate04(cwd);
    return {
      migrated: [...one.migrated, ...two.migrated, ...three.migrated, ...four.migrated],
      skipped: [...one.skipped, ...two.skipped, ...three.skipped, ...four.skipped],
    };
  },
} as const;
