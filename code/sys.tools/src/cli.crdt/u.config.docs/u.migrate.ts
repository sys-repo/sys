import { type t } from '../common.ts';
import { migrate01 } from './u.migrate.-01.ts';

/**
 * Document YAML migration orchestrator.
 */
export const CrdtDocsMigrate = {
  async run(cwd: t.StringDir): Promise<t.YamlConfig.Migrate.DirResult> {
    return await migrate01(cwd);
  },
} as const;
