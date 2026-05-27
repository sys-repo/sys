import { type t, Yaml } from '../common.ts';
import { CellPaths } from '../u/paths.ts';
import { CellSchema } from '../u.schema/mod.ts';
import type { CellMigrateOptions, CellMigrateResult } from './mod.ts';

/**
 * WHAT: this file is the descriptor migration filesystem seam.
 * WHY: migration is opt-in and must never be pulled into the public/browser-safe Cell graph.
 */
import { Fs } from '@sys/fs';

const item = {
  from: CellPaths.legacy.descriptor,
  to: CellPaths.descriptor,
} as const;

/**
 * Migration 01: move the legacy descriptor path to the canonical Cell metadata path.
 */
export const migrate01 = {
  async dir(root: t.StringDir, options: CellMigrateOptions = {}): Promise<CellMigrateResult> {
    const canonical = Fs.join(root, item.to);
    const legacy = Fs.join(root, item.from);
    const [hasCanonical, hasLegacy] = await Promise.all([Fs.exists(canonical), Fs.exists(legacy)]);

    if (hasCanonical && hasLegacy) {
      throw new Error(
        `Cell.migrate: multiple descriptors found: ${canonical}; ${legacy}. Resolve the descriptor conflict before migrating.`,
      );
    }

    if (hasCanonical) {
      return result({ skipped: [{ ...item, reason: 'canonical descriptor already exists' }] });
    }

    if (!hasLegacy) {
      return result({ skipped: [{ ...item, reason: 'legacy descriptor not found' }] });
    }

    await validateLegacyDescriptor(legacy);

    if (options.dryRun === true) return result({ planned: [item] });

    await Fs.ensureDir(Fs.dirname(canonical));
    await Fs.move(legacy, canonical, { overwrite: false });
    return result({ migrated: [item] });
  },
} as const;

/**
 * Helpers:
 */

function result(input: Partial<CellMigrateResult>): CellMigrateResult {
  return {
    planned: input.planned ?? [],
    migrated: input.migrated ?? [],
    skipped: input.skipped ?? [],
  };
}

async function validateLegacyDescriptor(path: t.StringPath) {
  const read = await Fs.readText(path);
  if (!read.ok) throw read.error;

  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) {
    throw new Error(`Cell.migrate: legacy descriptor is invalid YAML: ${path}`);
  }

  const validation = CellSchema.Descriptor.validate(parsed.data);
  if (!validation.ok) {
    const message = validation.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Cell.migrate: legacy descriptor is invalid: ${message}`);
  }
}
