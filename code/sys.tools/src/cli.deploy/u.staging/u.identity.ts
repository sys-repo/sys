import { Fs, Num, Path, type t } from '../common.ts';
import { throwIfStagingCancelled } from './u.cancel.ts';

/** Capture one canonical directory identity for later replacement checks. */
export async function captureDirectoryIdentity(args: {
  path: string;
  label: string;
  signal?: AbortSignal;
}): Promise<t.DeployTool.Staging.DirectoryIdentity> {
  throwIfStagingCancelled(args.signal);
  const path: t.StringAbsoluteDir = Path.resolve(args.path, '.');
  const info = await Fs.lstat(path);
  if (!isDirectoryWithIdentity(info)) throw invalidDirectory(args.label, path);

  const canonical = await Fs.realPath(path);
  if (canonical !== path) throw invalidDirectory(args.label, path);
  throwIfStagingCancelled(args.signal);

  return Object.freeze({ path, device: info.dev, inode: info.ino });
}

/** Revalidate one previously captured canonical directory identity. */
export async function assertDirectoryIdentity(
  identity: t.DeployTool.Staging.DirectoryIdentity,
  label: string,
  signal?: AbortSignal,
): Promise<void> {
  throwIfStagingCancelled(signal);
  const info = await Fs.lstat(identity.path);
  if (
    !isDirectoryWithIdentity(info) ||
    info.dev !== identity.device ||
    info.ino !== identity.inode
  ) {
    throw new Error(`${label} identity changed: ${identity.path}`);
  }

  const canonical = await Fs.realPath(identity.path);
  if (canonical !== identity.path) {
    throw new Error(`${label} canonical path changed: ${identity.path}`);
  }
  throwIfStagingCancelled(signal);
}

/** Safely establish one descendant directory beneath a retained root identity. */
export async function ensureStagingDirectory(args: {
  root: t.DeployTool.Staging.DirectoryIdentity;
  path: string;
  label: string;
  signal?: AbortSignal;
}): Promise<t.DeployTool.Staging.DirectoryIdentity> {
  await assertDirectoryIdentity(args.root, 'Deploy staging root', args.signal);
  const target: t.StringAbsoluteDir = Path.resolve(args.path, '.');
  const relativeHost = Path.relative(args.root.path, target);
  if (Path.Is.absolute(relativeHost) || !Path.Is.within(args.root.path, target)) {
    throw new Error(`${args.label} escapes the staging root: ${target}`);
  }

  const relative = Path.relativePosix(relativeHost);
  if (!relative || relative === '.') return args.root;

  let current = args.root.path as string;
  for (const segment of relative.split('/')) {
    throwIfStagingCancelled(args.signal);
    current = Path.join(current, segment);
    if (!(await Fs.lstat(current))) await Fs.ensureDir(current);

    const observed = await Fs.lstat(current);
    if (!observed?.isDirectory || observed.isSymlink) {
      throw invalidDirectory(args.label, current);
    }
  }

  await assertDirectoryIdentity(args.root, 'Deploy staging root', args.signal);
  return await captureDirectoryIdentity({
    path: target,
    label: args.label,
    signal: args.signal,
  });
}

function isDirectoryWithIdentity(
  info: Deno.FileInfo | undefined,
): info is Deno.FileInfo & { dev: number; ino: number } {
  return Boolean(
    info?.isDirectory &&
      !info.isSymlink &&
      Num.Is.safeInt(info.dev) &&
      info.dev >= 0 &&
      Num.Is.safeInt(info.ino) &&
      info.ino >= 0,
  );
}

function invalidDirectory(label: string, path: string): Error {
  return new Error(`${label} must be a canonical directory: ${path}`);
}
