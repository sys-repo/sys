import { type t, Path } from './common.ts';

/**
 * Derive the absolute path to a config file.
 *
 * By default, the file is resolved under `-config/`.
 * If `opts.subdir` is `""`, the file is resolved directly under `cwd`.
 *
 * Pure path logic only — no validation or filesystem access.
 */
export function getPath(
  cwd: t.StringDir,
  filename: string,
  opts: { readonly subdir?: string } = {},
): t.StringAbsolutePath {
  const subdir = opts.subdir ?? '-config';
  return Path.join(cwd, subdir, filename);
}
