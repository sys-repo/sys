import { D, Str, type t } from '../../common.ts';

export function manifestPath(path: t.StringUrlRoute | undefined): t.StringUrlRoute {
  const base = normalizePath(path ?? D.path);
  return (base === '/' ? '/manifest' : `${base}/manifest`) as t.StringUrlRoute;
}

export function matchesPath(request: Request, path: t.StringUrlRoute): boolean {
  const actual = new URL(request.url).pathname;
  return actual === path;
}

function normalizePath(path: t.StringUrlRoute): t.StringUrlRoute {
  const suffix = Str.trimSlashes(path);
  return (suffix ? `/${suffix}` : '/') as t.StringUrlRoute;
}
