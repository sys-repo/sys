import { type t, Arr, Is, rx } from './common.ts';

/**
 * Change Patch Standard:
 *    RFC-6902 JSON patch standard
 *    https://tools.ietf.org/html/rfc6902
 */
type DefaultPatch = t.PatchOperation;
type PatchToPath = t.ImmutablePatchLib['toObjectPath'];

/**
 * Creates a factory function for filtering on changes at specific paths.
 */
export function pathFilter<
  T,
  P = DefaultPatch,
  C extends t.ImmutableChange<T, P> = t.ImmutableChange<T, P>,
>($: t.Observable<C>, toPath: (patch: P) => t.ObjectPath): t.ImmutablePathEventsFactory<T, P, C> {
  return (
    input: t.ObjectPath | t.ObjectPath[],
    opt?: t.ImmutablePathEventsOptions | boolean,
  ): t.ImmutablePathEvents<T, P, C> => {
    const paths = wrangle.paths(input).filter((a) => a.length > 0);
    const options = wrangle.pathOptions(opt);
    const { exact = false } = options;

    const matchPath = (a: t.ObjectPath, b: t.ObjectPath) => {
      return exact ? Arr.equal(a, b) : Arr.startsWith(a, b);
    };
    const matchPatch = (p: P): boolean => {
      return paths.some((path) => matchPath(toPath(p), path));
    };

    return {
      $: $.pipe(rx.filter((e) => e.patches.some(matchPatch))),
      match: { paths, exact },
    };
  };
}

/**
 * Helpers:
 */
const wrangle = {
  pathOptions(input?: t.ImmutablePathEventsOptions | boolean): t.ImmutablePathEventsOptions {
    if (!input) return {};
    if (Is.bool(input)) return { exact: input };
    return input;
  },

  paths(input: t.ObjectPath | t.ObjectPath[]): t.ObjectPath[] {
    if (Array.isArray(input[0])) return input as t.ObjectPath[];
    return [input as t.ObjectPath];
  },
} as const;
