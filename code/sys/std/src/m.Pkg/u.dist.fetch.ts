import { type t, Err, Path, Rx, Url } from './common.ts';
import { PkgIs } from './m.Is.ts';

export const fetchDist: t.PkgDistLib['fetch'] = async (opts = {}) => {
  const options = wrangle.options(opts);
  const { origin = location.origin, pathname = 'dist.json' } = options;
  const errors = Err.errors();
  const controller = new AbortController();
  const signal = controller.signal;
  const life = Rx.disposable(options.until);
  life.dispose$.subscribe(() => controller.abort(options.disposeReason ?? 'disposed'));

  const url = new URL(Path.join(origin, pathname));
  const fetched = await fetch(url, { signal });
  const { status, ok } = fetched;

  let dist: t.DistPkg | undefined;
  try {
    if (fetched.ok) {
      const json = (await fetched.json()) as t.DistPkg;
      const isPkg = PkgIs.dist(json);
      if (isPkg) dist = json;
    } else {
      fetched.body?.cancel();
      const cause = Err.std(`${fetched.status}:${fetched.text}`);
      errors.push(Err.std(`Failed while loading: ${url.href}`, { cause }));
    }
  } catch (cause: any) {
    fetched.body?.cancel();
    errors.push(Err.std(`An unexpected error occured: ${url}`, { cause }));
  }

  return {
    ok,
    status,
    href: url.href,
    get dist() {
      if (!dist) return;
      return {
        ...dist,
        hash: {
          ...dist.hash,
          get parts() {
            return dist.hash.parts;
          },
        },
      };
    },
    error: errors.toError(),
  };
};

/**
 * Helpers:
 */
const wrangle = {
  options(input: Parameters<t.PkgDistLib['fetch']>[0]): t.PkgDistFetchOptions {
    if (!input) return {};
    if (typeof input === 'string') {
      const url = Url.parse(input);
      if (url.error) throw new Error(`Failed to parse DistPkg url "${input}"`);
      const { origin, pathname } = url.toURL();
      return { origin, pathname };
    }
    return input;
  },
} as const;
