import { type t } from '../common.ts';
import { migrate01 } from './u.migrate.-01.ts';
import { migrate02 } from './u.migrate.-02.ts';

/**
 * Serve YAML migration orchestrator.
 */
export const ServeMigrate = {
  async run(cwd: t.StringDir): Promise<t.YamlConfig.Migrate.DirResult> {
    const one = await migrate01(cwd);
    const two = await migrate02(cwd);
    return {
      migrated: [...one.migrated, ...two.migrated],
      skipped: [...one.skipped, ...two.skipped],
    };
  },
} as const;
