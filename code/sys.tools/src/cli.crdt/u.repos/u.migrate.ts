import { type t, Fs } from '../common.ts';
import { Config } from '../u.config.ts';
import { CrdtReposFs } from './u.fs.ts';

export type MigrateResult = {
  readonly migrated: number;
  readonly skipped: number;
};

/**
 * Migration helpers for converting legacy JSON repo config to YAML files.
 */
export const CrdtReposMigrate = {
  async run(cwd: t.StringDir): Promise<MigrateResult> {
    const config = await Config.get(cwd);
    const endpoints = config.current.repo?.daemon?.sync?.websockets ?? [];
    if (endpoints.length === 0) return { migrated: 0, skipped: 0 };

    await CrdtReposFs.ensureDir(cwd);
    const path = Fs.join(cwd, CrdtReposFs.file());
    if (await Fs.exists(path)) return { migrated: 0, skipped: 1 };

    await CrdtReposFs.writeDoc(path, { sync: [...endpoints] });
    return { migrated: 1, skipped: 0 };
  },
} as const;
