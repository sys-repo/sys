import { type t, Arr, Dispose, Is, rx } from './common.ts';
type O = Record<string, unknown>;

/**
 * Create a new event-emitter.
 */
export function eventsFactory<T extends O>(
  doc$: t.Observable<t.CrdtChange<T>>,
  dispose$?: t.UntilInput,
): t.CrdtEvents<T> {
  const life = rx.lifecycle(dispose$);
  const $ = doc$.pipe(rx.takeUntil(life.dispose$));

  return Dispose.toLifecycle<t.CrdtEvents<T>>(life, {
    $,
    path(input, opt) {
      const paths = wrangle.paths(input).filter((a) => a.length > 0);
      const options = wrangle.pathOptions(opt);
      const { exact = false } = options;

      const match = (p: t.Automerge.Patch): boolean => {
        return paths.some((path) => {
          return exact ? Arr.equal(p.path, path) : Arr.startsWith(p.path, path);
        });
      };

      return {
        $: $.pipe(rx.filter((e) => e.patches.some(match))),
        paths,
        exact,
      };
    },
  });
}

/**
 * Helpers:
 */
const wrangle = {
  pathOptions(input?: Parameters<t.CrdtEvents['path']>[1]): t.CrdtPathEventsOptions {
    if (!input) return {};
    if (Is.bool(input)) return { exact: input };
    return input;
  },

  paths(input: t.ObjectPath | t.ObjectPath[]): t.ObjectPath[] {
    if (Array.isArray(input[0])) return input as t.ObjectPath[];
    return [input as t.ObjectPath];
  },
} as const;
