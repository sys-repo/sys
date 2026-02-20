import { type t, Path } from '../common.ts';

type F = (path: t.StringPath) => boolean;

export function makeFilter(): F {
  return (path: string) => {
    const normalized = path.replaceAll('\\', '/');
    const base = Path.basename(normalized);

    /**
     * Hide any path that contains a dot-prefixed segment (".git", ".vscode", etc).
     * The top-level label (".tmp/") is added separately by Fs.Fmt and
     * is not subject to this filter.
     */
    const segments = normalized.split('/');
    for (const segment of segments) {
      if (segment.startsWith('.') && segment.length > 1) return false;
    }

    const EXCLUDE = ['.DS_Store'];
    if (EXCLUDE.includes(base)) return false;

    // Keep entries that don't look like files (no dot in basename).
    const dotIndex = base.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === base.length - 1) return true;

    // Keep all file extensions.
    return true;
  };
}
