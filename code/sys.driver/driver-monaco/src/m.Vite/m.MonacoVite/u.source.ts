import { Fs, Is, Obj, Str } from './common.ts';
import { MAX_BYTES, MOUNT, NOTICE_FILES, PACKAGE_NAME } from './u.constants.ts';
import type { NoticeFile, Source } from './t.ts';
import { fail } from './u.error.ts';
import { hashDir } from './u.hash.ts';
import { inspectTree, readRegularFile } from './u.tree.ts';

export async function resolveSource(): Promise<Source> {
  const entry = Fs.Path.fromFileUrl(import.meta.resolve(PACKAGE_NAME));
  const resolved = await Fs.findAncestor<{ readonly root: string; readonly version: string }>(
    entry,
    async ({ dir }) => {
      const manifestPath = Fs.join(dir, 'package.json');
      const stat = await Fs.lstat(manifestPath);
      if (!stat?.isFile || stat.isSymlink) return undefined;

      const manifest = await Fs.readJson<{ readonly name?: unknown; readonly version?: unknown }>(
        manifestPath,
      );
      if (!manifest.ok || manifest.data?.name !== PACKAGE_NAME) return undefined;
      const version = manifest.data.version;
      if (Is.string(version) && version.trim()) return { root: dir, version };
      return fail(`Invalid package version in ${manifestPath}.`);
    },
  );
  if (!resolved) return fail(`Could not locate the resolved ${PACKAGE_NAME} package root.`);

  const runtimeDir = Fs.join(resolved.root, 'min', MOUNT);
  const stats = await inspectTree(runtimeDir);
  if (stats.bytes > MAX_BYTES) {
    fail(
      `${PACKAGE_NAME}@${resolved.version} runtime assets are ${Str.bytes(stats.bytes)}; ` +
        `the reviewed ceiling is ${Str.bytes(MAX_BYTES)}.`,
    );
  }

  const hash = await hashDir(runtimeDir);
  const files = Obj.keys(hash.parts).length;
  if (files !== stats.files) fail(`Could not hash every regular runtime file in ${runtimeDir}.`);

  const notices = {} as Record<NoticeFile, Uint8Array>;
  for (const filename of NOTICE_FILES) {
    notices[filename] = await readRegularFile(Fs.join(resolved.root, filename));
  }

  return {
    packageRoot: resolved.root,
    runtimeDir,
    version: resolved.version,
    bytes: stats.bytes,
    hash,
    notices,
  };
}

export function sourcePath(source: Source, relative: string) {
  if (!relative || relative.endsWith('/')) return undefined;
  if (NOTICE_FILES.includes(relative as NoticeFile)) return Fs.join(source.packageRoot, relative);
  if (!Obj.hasOwn(source.hash.parts, relative)) return undefined;
  return Fs.join(source.runtimeDir, ...relative.split('/'));
}
