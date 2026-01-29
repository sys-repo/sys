import { type t, Fs } from '../common.ts';
import { CrdtDocsFs } from './u.fs.ts';
import type { LegacyConfigDoc } from '../u.migrate.legacy.ts';

export type MigrateResult = {
  readonly migrated: number;
  readonly skipped: number;
};

/**
 * Migration helpers for converting legacy JSON docs to YAML files.
 */
export const CrdtDocsMigrate = {
  async run(cwd: t.StringDir, legacy?: LegacyConfigDoc): Promise<MigrateResult> {
    const docs = legacy?.docs ?? [];
    if (docs.length === 0) return { migrated: 0, skipped: 0 };

    await CrdtDocsFs.ensureDir(cwd);

    let migrated = 0;
    let skipped = 0;

    for (const doc of docs) {
      const path = Fs.join(cwd, CrdtDocsFs.fileOf(doc.id));
      if (await Fs.exists(path)) {
        skipped++;
        continue;
      }
      await CrdtDocsFs.writeDoc(path, { id: doc.id, name: doc.name });
      migrated++;
    }

    return { migrated, skipped };
  },
} as const;
