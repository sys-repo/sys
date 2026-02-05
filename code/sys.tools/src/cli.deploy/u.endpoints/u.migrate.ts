import { type t } from '../common.ts';

export type MigrateResult = {
  readonly migrated: number;
  readonly skipped: number;
};

/**
 * Migration helpers for endpoint YAMLs.
 *
 * Legacy migrations removed (unused).
 */
export const EndpointsMigrate = {
  async run(cwd: t.StringDir): Promise<MigrateResult> {
    void cwd;
    return { migrated: 0, skipped: 0 };
  },
} as const;
