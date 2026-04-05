import { type t, Err, Fs, Is, Path } from './common.ts';
import { MountSchema } from './u.schema.ts';

const FILE = 'mounts.json' as const;
const PREFIX = 'slug-tree.';
const SUFFIX = '.json';
const ASSETS_SUFFIX = '.assets';

/**
 * Filesystem helpers for the staged root mount index.
 */
export const MountsFs = {
  file: FILE,

  /** Resolve the root mounts index path. */
  path(root: t.StringDir): t.StringFile {
    return Fs.join(root, FILE) as t.StringFile;
  },
} as const;

/** Collect mount entries from the staged root on disk. */
export async function collectMounts(root: t.StringDir): Promise<t.SlcDataPipeline.Mounts.Doc> {
  const mounts = new Set<t.StringId>();
  if (!(await Fs.exists(root))) return { mounts: [] };

  for await (const entry of Fs.walk(root, {
    includeDirs: true,
    includeFiles: false,
    includeSymlinks: false,
    followSymlinks: false,
    maxDepth: 1,
  })) {
    if (entry.path === root || !entry.isDirectory) continue;
    const manifestsDir = Fs.join(root, entry.name, 'manifests');
    if (!(await Fs.exists(manifestsDir))) continue;

    for await (const manifest of Fs.walk(manifestsDir, {
      includeDirs: false,
      includeFiles: true,
      includeSymlinks: false,
      followSymlinks: false,
      maxDepth: 1,
    })) {
      const mount = parseMountName(Path.basename(manifest.path));
      if (mount) mounts.add(mount);
    }
  }

  return {
    mounts: [...mounts]
      .sort((a, b) => a.localeCompare(b))
      .map((mount) => ({ mount })),
  };
}

/** Refresh the root mounts index from the staged root on disk. */
export async function refreshMounts(root: t.StringDir): Promise<t.StringFile> {
  const doc = await collectMounts(root);
  const checked = MountSchema.validate(doc);
  if (!checked.ok) {
    throw new Error(`MountSchema: ${Err.summary(checked.errors)}`);
  }

  const path = MountsFs.path(root);
  await Fs.write(path, MountSchema.stringify(doc));
  return path;
}

function parseMountName(name: string): t.StringId | undefined {
  if (!isTreeManifest(name)) return;
  const mount = name.slice(PREFIX.length, -SUFFIX.length);
  if (!mount || mount.endsWith(ASSETS_SUFFIX)) return;
  return mount as t.StringId;
}

function isTreeManifest(name: string): boolean {
  return Is.string(name) && name.startsWith(PREFIX) && name.endsWith(SUFFIX);
}
