import { type t } from '../common.ts';
import { migrate01 } from './u.migrate.-01.ts';

/**
 * Endpoint YAML migration orchestrator.
 */
export const EndpointsMigrate = {
  async run(cwd: t.StringDir): Promise<t.YamlConfig.Migrate.DirResult> {
    return await migrate01(cwd);
  },
} as const;
