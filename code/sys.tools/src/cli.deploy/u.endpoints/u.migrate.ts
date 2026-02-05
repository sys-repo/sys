import { type t } from '../common.ts';
import { migrate01, type MigrateResult } from './u.migrate.-01.ts';

/**
 * Endpoint YAML migration orchestrator.
 */
export const EndpointsMigrate = {
  async run(cwd: t.StringDir): Promise<MigrateResult> {
    return await migrate01(cwd);
  },
} as const;
