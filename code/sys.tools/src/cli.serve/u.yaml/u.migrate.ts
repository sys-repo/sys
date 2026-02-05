import { type t } from '../common.ts';
import { migrate01 } from './u.migrate.-01.ts';

/**
 * Serve YAML migration orchestrator.
 */
export const ServeMigrate = {
  async run(cwd: t.StringDir): Promise<t.YamlConfig.Migrate.DirResult> {
    return await migrate01(cwd);
  },
} as const;
