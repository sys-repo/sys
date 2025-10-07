import { type t, Path } from './common.ts';

export const PullMap: t.HttpPullMapLib = {
  urlToPath(u, options) {
    // 1. mapPath wins (still normalized to relative POSIX):
    const mapped = options?.mapPath?.(u);
    if (mapped) return Path.relativePosix(mapped) as t.StringPath;

    const emptyBasename = options?.emptyBasename ?? 'index';
    const host = u.host;
    const base = PullMap.baseFrom(options?.relativeTo);

    // 2. start with pathname → relative POSIX:
    let rel = Path.relativePosix(u.pathname);

    // 3. rebase on segment boundary:
    rel = PullMap.rebase(rel, base);

    // 4. optional host prefix:
    if (options?.includeHost) rel = rel ? `${host}/${rel}` : host;

    // 5. never return empty:
    return (rel || emptyBasename) as t.StringPath;
  },

  rebase(pathname, base) {
    if (!base) return pathname;
    if (pathname === base) return '';
    return pathname.startsWith(base + '/') ? pathname.slice(base.length + 1) : pathname;
  },

  baseFrom(relativeTo) {
    if (!relativeTo) return '';
    try {
      const raw = typeof relativeTo === 'string' ? relativeTo : (relativeTo as URL).pathname;
      return Path.relativePosix(raw);
    } catch {
      // If it looked like a URL but failed parsing, treat it as a path.
      return Path.relativePosix(String(relativeTo));
    }
  },
};
