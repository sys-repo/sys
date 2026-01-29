import { type t, Fs, Is } from '../common.ts';
import { CrdtReposFs } from './u.fs.ts';
import { CrdtRepoSchema } from './u.schema.ts';
import type { LegacyConfigDoc } from '../u.migrate.legacy.ts';

export type MigrateResult = {
  readonly migrated: number;
  readonly skipped: number;
};

/**
 * Migration helpers for converting legacy JSON repo config to YAML files.
 */
export const CrdtReposMigrate = {
  async run(cwd: t.StringDir, legacy?: LegacyConfigDoc): Promise<MigrateResult> {
    const endpoints = legacy?.repo?.daemon?.sync?.websockets ?? [];
    await CrdtReposFs.ensureDir(cwd);
    const path = Fs.join(cwd, CrdtReposFs.file());

    if (!(await Fs.exists(path))) {
      if (endpoints.length === 0) return { migrated: 0, skipped: 0 };
      const initial = CrdtRepoSchema.initial();
      await CrdtReposFs.writeDoc(path, { sync: [...endpoints], ports: { ...initial.ports } });
      return { migrated: 1, skipped: 0 };
    }

    const res = await CrdtReposFs.readYaml(path);
    if (!res.ok) return { migrated: 0, skipped: 0 };

    const updated = CrdtRepoSchema.withDefaultPorts(res.doc);
    const ports = res.doc.ports ?? {};
    const changed = !Is.num(ports.repo) || !Is.num(ports.sync);
    if (!changed) return { migrated: 0, skipped: 1 };

    await CrdtReposFs.writeDoc(path, updated);
    return { migrated: 1, skipped: 0 };
  },
} as const;
