import { Err, Is, Path, Rx, type t, Url } from '../common.ts';
import { PkgIs } from '../m.Is.ts';

export const fetchDist: t.Pkg.Dist.Lib['fetch'] = async (opts = {}) => {
  const options = wrangle.options(opts);
  const { origin = location.origin, pathname = 'dist.json' } = options;
  const url = new URL(Path.join(origin, pathname));
  const errors = Err.errors();
  const controller = new AbortController();
  const signal = controller.signal;
  const life = Rx.disposable(options.until);
  life.dispose$.subscribe(() => controller.abort(options.disposeReason ?? 'disposed'));

  const fetched = await fetch(url, { signal });
  const dist = await readDist(fetched, url, errors);

  return toResponse(fetched, url, dist, errors);
};

/**
 * Helpers:
 */
type ErrorBag = ReturnType<typeof Err.errors>;

async function readDist(
  fetched: Response,
  url: URL,
  errors: ErrorBag,
): Promise<t.DistPkg | undefined> {
  try {
    if (!fetched.ok) {
      await addLoadError(fetched, url, errors);
      return;
    }

    const json = await fetched.json();
    return PkgIs.dist(json) ? json : undefined;
  } catch (cause: any) {
    errors.push(Err.std(`An unexpected error occurred: ${url.href}`, { cause }));
  }
}

async function addLoadError(fetched: Response, url: URL, errors: ErrorBag) {
  const cause = Err.std(await statusMessage(fetched));
  errors.push(Err.std(`Failed while loading: ${url.href}`, { cause }));
}

async function statusMessage(fetched: Response) {
  const text = (await fetched.text()).trim();
  const message = text || fetched.statusText;
  return `${fetched.status}:${message}`;
}

function toResponse(
  fetched: Response,
  url: URL,
  dist: t.DistPkg | undefined,
  errors: ErrorBag,
): t.PkgDistFetchResponse {
  return {
    ok: fetched.ok,
    status: fetched.status,
    href: url.href,
    dist: toDistValue(dist),
    error: errors.toError(),
  };
}

function toDistValue(dist?: t.DistPkg): t.DistPkg | undefined {
  if (!dist) return;

  const { hash } = dist;
  return {
    ...dist,
    hash: {
      ...hash,
      get parts() {
        return hash.parts;
      },
    },
  };
}

const wrangle = {
  options(input: Parameters<t.Pkg.Dist.Lib['fetch']>[0]): t.PkgDistFetchOptions {
    if (!input) return {};
    if (Is.str(input)) {
      const url = Url.parse(input);
      if (url.error) throw new Error(`Failed to parse DistPkg url "${input}"`);
      const { origin, pathname } = url.toURL();
      return { origin, pathname };
    }
    return input;
  },
} as const;
