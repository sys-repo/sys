import { Path, type t, Url } from '../common.ts';
import { PullMap } from './u.map.ts';

const FALLBACK_FILENAME_MAX_BYTES = 180;

/** Derive one legacy target, falling back to a bounded filename for malformed sources. */
export function resolveTarget(
  source: string,
  dir: t.StringDir,
  map?: t.HttpPull.Map.Options,
): t.StringPath {
  try {
    const url = Url.parse(source);
    if (!url.ok) return fallbackTarget(source, dir);
    const relative = PullMap.urlToPath(url.toURL(), map);
    return Path.join(dir, relative) as t.StringPath;
  } catch {
    return fallbackTarget(source, dir);
  }
}

function fallbackTarget(source: string, dir: t.StringDir): t.StringPath {
  return Path.join(dir, sanitizeForFilename(source)) as t.StringPath;
}

/** Collapse malformed legacy source text to one bounded ASCII diagnostic filename. */
function sanitizeForFilename(input: string): string {
  const filename = Path.relativePosix(input)
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .slice(0, FALLBACK_FILENAME_MAX_BYTES);

  return filename.length === 0 || filename === '.' || filename === '..' ? 'invalid' : filename;
}
