import { type t, Err, Path, rx } from './common.ts';
import { Is } from './m.Is.ts';

export const Dist: t.PkgDistLib = {
  async fetch(options = {}) {
    const { origin = location.origin, pathname = 'dist.json' } = options;
    const errors = Err.errors();
    const controller = new AbortController();
    const signal = controller.signal;
    const life = rx.disposable(options.dispose$);
    life.dispose$.subscribe(() => controller.abort(options.disposeReason ?? 'disposed'));

    const url = new URL(Path.join(origin, pathname));
    const fetched = await fetch(url, { signal });
    const { status, ok } = fetched;

    let dist: t.DistPkg | undefined;
    try {
      if (fetched.ok) {
        const json = (await fetched.json()) as t.DistPkg;
        const isPkg = Is.dist(json);
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

    return { ok, status, dist, error: errors.toError() };
  },
};
