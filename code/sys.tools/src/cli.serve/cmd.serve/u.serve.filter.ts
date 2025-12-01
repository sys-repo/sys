import { type t, Path } from '../common.ts';
import { Mime } from '../cmd.serve/mod.ts';

type F = (path: t.StringPath) => boolean;

export function makeFilter(args: { allowedMimes: t.ServeMimeLookup }): F {
  return (path: string) => {
    const base = Path.basename(path);

    // Keep entries that don't look like files (no dot in basename).
    const dotIndex = base.lastIndexOf('.');
    if (dotIndex <= 0 || dotIndex === base.length - 1) return true;

    // Ensure files are on the accept list (mime).
    const ext = base.slice(dotIndex + 1).toLowerCase();
    const mime = Mime.extensionMap[ext];

    if (!mime) return false;
    return args.allowedMimes.has(mime);
  };
}
