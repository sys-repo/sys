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
      await CrdtReposFs.writeDoc(path, {
        sync: endpoints.map((endpoint) => ({ endpoint, enabled: true })),
        ports: { ...initial.ports },
      });
      return { migrated: 1, skipped: 0 };
    }

    const res = await CrdtReposFs.readYaml(path);
    if (!res.ok) return { migrated: 0, skipped: 0 };

    const updated = CrdtRepoSchema.normalize(res.doc);
    const ports = res.doc.ports ?? {};
    const missingPorts = !Is.num(ports.repo) || !Is.num(ports.sync);
    const syncItems = res.doc.sync ?? [];
    const missingEnabled = syncItems.some((item) => item.enabled === undefined);
    const hasLegacy = endpoints.length > 0 && syncItems.length === 0;
    const changed = missingPorts || missingEnabled || hasLegacy;
    if (!changed) return { migrated: 0, skipped: 1 };

    const merged = hasLegacy
      ? { ...updated, sync: endpoints.map((endpoint) => ({ endpoint, enabled: true })) }
      : updated;

    await CrdtReposFs.writeDoc(path, merged);
    return { migrated: 1, skipped: 0 };
  },
} as const;
