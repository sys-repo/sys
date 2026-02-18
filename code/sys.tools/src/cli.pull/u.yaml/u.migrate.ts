import { type t } from '../common.ts';

export const PullMigrate = {
  async run(_cwd: t.StringDir): Promise<t.YamlConfig.Migrate.DirResult> {
    return { migrated: [], skipped: [] };
  },
} as const;
