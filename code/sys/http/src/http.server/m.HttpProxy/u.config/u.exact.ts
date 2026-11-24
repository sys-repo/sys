import { Is, type t } from '../common.ts';

type RouteIndex = ReadonlyMap<t.StringUrlRoute, t.HttpProxy.ExactRoute>;

const METHOD_TOKEN = /^[!#$%&'*+.^_`|~0-9A-Z-]+$/;
const FORBIDDEN_METHODS = new Set(['CONNECT', 'TRACE', 'TRACK']);
const KEYS = new Set(['path', 'method', 'target']);
const PATH_BASE = 'http://proxy.invalid';

/** Validate the shared exact-route shape and index an independent routing snapshot. */
export function indexExactRoutes(input: unknown, errorPrefix: string): RouteIndex {
  const routes = new Map<t.StringUrlRoute, t.HttpProxy.ExactRoute>();
  if (input === undefined) return routes;
  if (!Is.array(input)) throw new Error(`${errorPrefix}: exactRoutes must be a list`);

  for (const [index, entry] of input.entries()) {
    const label = `${errorPrefix}: exactRoutes[${index}]`;
    if (!Is.record(entry)) throw new Error(`${label} must be an object`);
    const unknownKey = Object.keys(entry).find((key) => !KEYS.has(key));
    if (unknownKey !== undefined) throw new Error(`${label}: unknown key '${unknownKey}'`);

    const { method, target } = entry;
    const path = pathnameOf(entry.path);
    if (path === undefined) {
      throw new Error(`${label}.path must be a serialized URL pathname`);
    }
    if (!Is.str(method) || !METHOD_TOKEN.test(method) || FORBIDDEN_METHODS.has(method)) {
      const msg = `${label}.method must be an uppercase HTTP method supported by Fetch`;
      throw new Error(msg);
    }
    if (!Is.urlString(target)) throw new Error(`${label}.target must be an absolute HTTP(S) URL`);

    const { href, username, password } = new URL(target);
    const hasQueryOrFragment = href.includes('?') || href.includes('#');
    if (username || password || hasQueryOrFragment) {
      const msg = `${label}.target must not include credentials, query, or fragment`;
      throw new Error(msg);
    }
    if (routes.has(path)) {
      const msg = `${label}.path duplicates a reserved pathname: ${path}`;
      throw new Error(msg);
    }

    routes.set(path, { path, method, target: href });
  }
  return routes;
}

function pathnameOf(value: unknown): t.StringUrlRoute | undefined {
  if (!Is.str(value) || !value.startsWith('/')) return;
  const { pathname } = new URL(`${PATH_BASE}${value}`);
  return pathname === value ? pathname : undefined;
}
