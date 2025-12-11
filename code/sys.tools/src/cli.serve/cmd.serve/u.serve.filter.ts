import { type t, Path } from '../common.ts';
import { Mime } from '../cmd.serve/mod.ts';

type F = (path: t.StringPath) => boolean;

export function makeFilter(args: { allowedMimes: t.ServeTool.MimeLookup }): F {
  const { allowedMimes } = args;

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

    // Ensure files are on the accept list (mime).
    const ext = base.slice(dotIndex + 1).toLowerCase();
    const mime = Mime.extensionMap[ext];

    if (!mime) return false;
    return allowedMimes.has(mime);
  };
}
