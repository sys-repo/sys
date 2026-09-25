import { Fs, Is, Obj, Str } from './common.ts';
import { MAX_BYTES, MOUNT, NOTICE_FILES, PACKAGE_NAME } from './u.constants.ts';
import type { NoticeFile, Source, SourceLocation } from './t.ts';
import { fail } from './u.error.ts';
import { hashDir } from './u.hash.ts';
import { inspectTree, readRegularFile } from './u.tree.ts';

/** Resolve the pinned package roots without inspecting the complete runtime tree. */
export async function resolveSourceLocation(): Promise<SourceLocation> {
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

  return {
    packageRoot: Fs.resolve(resolved.root),
    runtimeDir: Fs.resolve(resolved.root, 'min', MOUNT),
    version: resolved.version,
  };
}

/** Verify the complete pinned source tree for production emission. */
export async function resolveSource(location?: SourceLocation): Promise<Source> {
  const resolved = location ?? await resolveSourceLocation();
  const stats = await inspectTree(resolved.runtimeDir);
  if (stats.bytes > MAX_BYTES) {
    fail(
      `${PACKAGE_NAME}@${resolved.version} runtime assets are ${Str.bytes(stats.bytes)}; ` +
        `the reviewed ceiling is ${Str.bytes(MAX_BYTES)}.`,
    );
  }

  const hash = await hashDir(resolved.runtimeDir);
  const files = Obj.keys(hash.parts).length;
  if (files !== stats.files) {
    fail(`Could not hash every regular runtime file in ${resolved.runtimeDir}.`);
  }

  const notices = {} as Record<NoticeFile, Uint8Array>;
  for (const filename of NOTICE_FILES) {
    notices[filename] = await readRegularFile(Fs.join(resolved.packageRoot, filename));
  }

  return {
    ...resolved,
    bytes: stats.bytes,
    hash,
    notices,
  };
}

/** Resolve one development asset beneath its canonical source root. */
export async function resolveSourcePath(source: SourceLocation, relative: string) {
  if (!relative || relative.endsWith('/')) return undefined;
  const isNotice = NOTICE_FILES.some((filename) => filename === relative);
  const root = isNotice ? source.packageRoot : source.runtimeDir;
  if (Fs.Path.Is.absolute(relative)) return undefined;
  const candidate = Fs.resolve(root, relative);
  if (!isWithin(root, candidate)) return undefined;

  const stat = await Fs.lstat(candidate);
  if (!stat?.isFile || stat.isSymlink) return undefined;

  const canonicalRoot = await Fs.realPath(root);
  const canonical = await Fs.realPath(candidate);
  return isWithin(canonicalRoot, canonical) ? canonical : undefined;
}

function isWithin(root: string, candidate: string) {
  const delta = Fs.Path.relative(root, candidate);
  const escapes = /^\.\.(?:[\\/]|$)/.test(delta);
  return !Is.blank(delta) && !escapes && !Fs.Path.Is.absolute(delta);
}
