import { Path, type t } from '../common.ts';

export const PullMap: t.HttpPull.Map.Lib = {
  urlToPath(u, options) {
    const mapped = options?.mapPath?.(u);
    if (mapped) return Path.relativePosix(mapped) as t.StringPath;

    const emptyBasename = options?.emptyBasename ?? 'index';
    const host = u.host;
    const base = PullMap.baseFrom(options?.relativeTo);
    let rel = Path.relativePosix(u.pathname);

    rel = PullMap.rebase(rel, base);
    if (options?.includeHost) rel = rel ? `${host}/${rel}` : host;
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
      return Path.relativePosix(String(relativeTo));
    }
  },
};
