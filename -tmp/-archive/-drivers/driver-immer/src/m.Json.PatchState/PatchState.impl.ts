import { Patch, rx, slug, type t } from './common.ts';
import { defaultEvents } from './PatchState.events.ts';

type O = Record<string, unknown>;
type P = t.PatchOperation;

/**
 * Initialize a new `PatchState` object.
 */
export function create<T extends O, E = t.PatchStateEvents<T>>(
  initial: T,
  options: {
    typename?: string;
    events?: t.PatchStateEventFactory<T, E>;
    onChange?: t.PatchChangeHandler<T>;
  } = {},
): t.PatchState<T, E> {
  const $ = rx.subject<t.PatchChange<T>>();
  let _current = { ...initial };
  const state: t.PatchState<T, E> = {
    /**
     * Unique instance identifier.
     * NB: This does not pertain to the data itself, rather
     *     is an instance identifier that can be used for
     *     cheap object instance comparison (eg. in hooks).
     */
    instance: slug(),

    /**
     * Current state.
     */
    get current() {
      return _current;
    },

    /**
     * Immutable mutator.
     */
    change(fn, opt) {
      const e = Patch.change<T>(_current, fn);
      _current = e.after;
      options.onChange?.(e);
      const callback = wrangle.options(opt).patches;
      callback?.(wrangle.formatPatches(e.patches.next));
      $.next(e);
    },

    /**
     * Observable event listener with controllable lifetime.
     */
    events(dispose$?: t.UntilObservable) {
      const factory = options.events ?? defaultEvents;
      return factory($, dispose$) as E;
    },
  };

  if (options.typename) (state as any).typename = options.typename;
  return state;
}

/**
 * Helpers
 */
const wrangle = {
  options(input?: t.ImmutableChangeOptionsInput<P>): t.ImmutableChangeOptions<P> {
    if (!input || input === null) return {};
    if (typeof input === 'function') return { patches: input };
    return input;
  },

  formatPatches(patches: t.PatchOperation[]) {
    // NB: the leading "/" is a part of the RFC-6902 JSON patch standard.
    //     but not present on the immer patches.
    //     Fire the patch standards based paths out of the callback.
    const formatPath = (path: string) => `/${path.replace(/^\/+/, '')}`;
    return patches.map((patch) => ({ ...patch, path: formatPath(patch.path) }));
  },
} as const;
