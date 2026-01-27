import { type t, Fs, Str, Yaml } from '../common.ts';
import { ServeFs } from './u.fs.ts';
import { ServeYamlSchema } from './u.schema.ts';

const LEGACY_FILENAMES = ['-serve.config.json', '-config/-serve.config.json'];

export type MigrateResult = {
  readonly migrated: number;
  readonly skipped: number;
};

/**
 * Legacy JSON config structure.
 */
type LegacyConfig = {
  name?: string;
  '.meta'?: { createdAt?: number; modifiedAt?: number };
  dirs?: LegacyDir[];
};

type LegacyDir = {
  name: string;
  dir: string;
  contentTypes?: string[];
  createdAt?: number;
  modifiedAt?: number;
  lastUsedAt?: number;
  remoteBundles?: Array<{
    remote: { dist: string };
    local: { dir: string };
    lastUsedAt?: number;
  }>;
};

/**
 * Migration helpers for converting legacy JSON config to YAML files.
 */
export const ServeMigrate = {
  /**
   * Run migration at CLI startup.
   * Converts legacy `-serve.config.json` to per-location YAML files.
   * Idempotent: skips if no legacy config found.
   */
  async run(cwd: t.StringDir): Promise<MigrateResult> {
    // Find legacy config file.
    const legacyPath = await findLegacyConfig(cwd);
    if (!legacyPath) {
      return { migrated: 0, skipped: 0 };
    }

    // Read and parse legacy JSON.
    const json = await Fs.readJson<LegacyConfig>(legacyPath);
    if (!json.ok || !json.data) {
      return { migrated: 0, skipped: 0 };
    }

    const dirs = json.data.dirs ?? [];
    if (dirs.length === 0) {
      // No locations to migrate - just delete the legacy file.
      await Fs.remove(legacyPath);
      return { migrated: 0, skipped: 0 };
    }

    let migrated = 0;
    let skipped = 0;

    // Ensure target directory exists.
    await Fs.ensureDir(Fs.join(cwd, ServeFs.dir));

    for (const legacyDir of dirs) {
      const result = await migrateLocation(cwd, legacyDir);
      if (result.migrated) {
        migrated++;
      } else {
        skipped++;
      }
    }

    // Delete legacy config after successful migration.
    if (migrated > 0 || skipped === 0) {
      await Fs.remove(legacyPath);
    }

    return { migrated, skipped };
  },
} as const;

/**
 * Find legacy config file.
 */
async function findLegacyConfig(cwd: t.StringDir): Promise<t.StringPath | undefined> {
  for (const filename of LEGACY_FILENAMES) {
    const path = Fs.join(cwd, filename);
    if (await Fs.exists(path)) {
      return path;
    }
  }
  return undefined;
}

/**
 * Migrate a single location from legacy JSON to YAML.
 */
async function migrateLocation(
  cwd: t.StringDir,
  legacy: LegacyDir,
): Promise<{ migrated: boolean }> {
  // Transform: strip timestamps, keep real data.
  const name = resolveName(legacy);
  const doc: t.ServeTool.LocationYaml.Doc = {
    name,
    dir: legacy.dir as t.StringDir,
  };

  // Only include contentTypes if present (optional in new schema).
  if (legacy.contentTypes && legacy.contentTypes.length > 0) {
    doc.contentTypes = legacy.contentTypes as t.MimeType[];
  }

  // Include remoteBundles if present (preserve lastUsedAt on bundles).
  if (legacy.remoteBundles && legacy.remoteBundles.length > 0) {
    doc.remoteBundles = legacy.remoteBundles.map((b) => ({
      remote: { dist: b.remote.dist as t.StringUrl },
      local: { dir: b.local.dir as t.StringRelativeDir },
      ...(b.lastUsedAt ? { lastUsedAt: b.lastUsedAt } : {}),
    }));
  }

  // Validate the transformed doc.
  const validation = ServeYamlSchema.validate(doc);
  if (!validation.ok) {
    return { migrated: false };
  }

  // Derive filename from name (sanitize).
  const safeName = sanitizeName(name);

  // Find unique target path.
  const targetPath = await findUniquePath(cwd, safeName);

  // Write YAML.
  const yamlResult = Yaml.stringify(doc);
  if (yamlResult.error || !yamlResult.data) {
    return { migrated: false };
  }

  await Fs.write(targetPath, yamlResult.data);

  // Validate the written file.
  const check = await ServeFs.validateYaml(targetPath);
  if (!check.ok) {
    await Fs.remove(targetPath);
    return { migrated: false };
  }

  return { migrated: true };
}

/**
 * Sanitize name for use as filename.
 */
function sanitizeName(name: string): string {
  const raw = String(name ?? '').trim();
  const safe = raw
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');
  return safe || 'location';
}

function resolveName(legacy: LegacyDir): string {
  const raw = String(legacy.name ?? '').trim();
  if (raw) return raw;
  const dir = String(legacy.dir ?? '').trim();
  const base = dir ? Fs.basename(Str.trimLeadingDotSlash(dir)) : '';
  return base || 'Location';
}

/**
 * Find a unique target path, using incremental suffix if needed.
 */
async function findUniquePath(cwd: t.StringDir, name: string): Promise<t.StringPath> {
  const basePath = Fs.join(cwd, ServeFs.fileOf(name));

  if (!(await Fs.exists(basePath))) {
    return basePath;
  }

  for (let i = 1; i < 100; i++) {
    const suffix = String(i).padStart(2, '0');
    const incrementalName = `${name}.${suffix}`;
    const incrementalPath = Fs.join(cwd, ServeFs.fileOf(incrementalName));

    if (!(await Fs.exists(incrementalPath))) {
      return incrementalPath;
    }
  }

  throw new Error(`Unable to find unique path for: ${name}`);
}
