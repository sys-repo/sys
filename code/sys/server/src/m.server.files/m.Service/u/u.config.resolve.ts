import { Fs, Path, type t } from '../common.ts';

const ERROR_PREFIX = 'FilesWebSocketService';

/**
 * Resolve the config path from Cell/service start args.
 */
export function resolveConfigPath(args: t.FilesWebSocketService.StartArgs): t.StringPath {
  const path = args.paths?.config;
  if (!path) throw new Error(`${ERROR_PREFIX}: missing config path.`);
  if (Path.Is.absolute(path)) return Path.normalize(path) as t.StringPath;
  const cwd = args.cwd ? Fs.resolve(args.cwd) : Fs.cwd('process');
  return Path.resolve(cwd, path) as t.StringPath;
}

/**
 * Resolve and bound a configured source root against the service cwd.
 */
export function resolveRoot(
  cwd: string,
  root: string,
  context = ERROR_PREFIX,
): t.StringDir {
  const base = Fs.resolve(cwd);
  const resolved = Path.Is.absolute(root) ? Path.normalize(root) : Path.resolve(base, root);

  if (!Path.Is.within(base, resolved)) {
    throw new Error(`${context}: root escapes service cwd: ${root}`);
  }

  return resolved as t.StringDir;
}
