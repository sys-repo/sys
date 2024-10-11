import { eventsFactory } from './Lens.Events.ts';
import { Registry } from './Lens.Registry.ts';
import { Is, ObjectPath, Symbols, Wrangle, rx, slug, toObject, type t } from './common.ts';

type O = Record<string, unknown>;
type P = t.Patch;
type PathInput = t.ObjectPath | (() => t.ObjectPath);
type Options<R extends O> = {
  init?: t.InitializeLens<R>;
  dispose$?: t.UntilObservable;
};

/**
 * Lens for operating on a sub-tree within a CRDT.
 */
export function create<R extends O, L extends O>(
  root: t.Doc<R> | t.Lens<R>,
  path?: PathInput,
  options?: Options<R> | t.InitializeLens<R>,
): t.Lens<L> {
  const args = wrangle.options<R>(options);
  if (Is.lens(root)) return root.lens<L>(wrangle.path(path), args.init);

  Registry.add(root);
  let _count = 0;
  let _changing = false;
  let _lastValue: L | undefined;

  const resolve = (root: R) => ObjectPath.resolve<L>(root, wrangle.path(path))!;

  const events = root.events(args.dispose$);
  const { dispose, dispose$ } = events;
  dispose$.subscribe(() => {
    fire.$.complete();
    Registry.remove(root);
  });

  const uri = root.uri;
  const fire = {
    $: rx.subject<t.LensEvent<L>>(),
    changed(e: t.DocChanged<R>) {
      const before = resolve(e.before);
      const after = resolve(e.after);
      const patches = wrangle.patches(e.patches, path);
      const source = e.source;
      fire.$.next({
        type: 'crdt:lens/Changed',
        payload: { uri, source, before, after, patches },
      });
    },
    deleted(e: t.DocDeleted<R>) {
      const before = resolve(e.doc);
      const after = undefined;
      fire.$.next({
        type: 'crdt:lens/Deleted',
        payload: { uri, before, after },
      });
    },
  } as const;

  // Monitor for changes made to the lens scope independently of this instance.
  events.changed$
    .pipe(
      rx.takeUntil(dispose$),
      rx.filter(() => !_changing),
      rx.filter(() => _lastValue !== api.current),
    )
    .subscribe((e) => {
      fire.changed(e);
      _lastValue = api.current;
    });

  events.deleted$.pipe(rx.takeUntil(dispose$)).subscribe((e) => {
    fire.deleted(e);
    dispose();
  });

  /**
   * API
   */
  const api: t.Lens<L> = {
    instance: `crdt:${root.uri}:lens.${slug()}`,

    /**
     * Current value of the descendent.
     */
    get current() {
      if (api.disposed) return undefined as any; // Edge-case (disposed).
      return resolve(root.current);
    },

    /**
     * Immutable change mutation on the descendent.
     */
    change(fn, options) {
      if (api.disposed) return;
      _changing = true;

      // NB: forces the [get] factory to initialize the descendent if necessary.
      if (_count === 0) {
        root.change((draft) => {
          /**
           * HACK: The `get` function is called for the total
           *       number of current lens instances to ensure that
           *       all sub-trees lens getters are correctly initialized.
           */
          const length = Registry.total(root) + 1;
          Array.from({ length }).forEach(() => resolve(draft));
        });
      }

      let _fired: t.DocChanged<R> | undefined;
      events.changed$.pipe(rx.take(1)).subscribe((e) => (_fired = e as t.DocChanged<R>));

      // Perform change.
      const opt = wrangle.changeOptions(path, options);
      root.change((d) => fn(resolve(d)), opt);

      // Alert listeners.
      if (_fired) fire.changed(_fired);

      // Finish up.
      _lastValue = api.current;
      _changing = false;
      _count++;
    },

    /**
     * Create new events observer.
     */
    events(dispose$?: t.UntilObservable) {
      return eventsFactory(fire.$, { dispose$: [dispose$, events.dispose$] });
    },

    /**
     * Create a new sub-lens from the current lens.
     */
    lens<T extends O>(subpath: t.ObjectPath, fn?: t.InitializeLens<L>) {
      const composite = [...wrangle.path(path), ...subpath];
      if (fn && typeof ObjectPath.resolve(root, composite) !== 'object') api.change((d) => fn(d));
      return create<R, T>(root, composite, { dispose$ });
    },

    /**
     * Convert the current lens state to a plain object.
     */
    toObject() {
      return toObject(api.current);
    },

    /**
     * Lifecycle.
     */
    dispose,
    dispose$,
    get disposed() {
      return events.disposed;
    },
  };

  /**
   * Initialize.
   */
  (() => {
    const current = () => resolve(root.current);
    if (typeof current() === 'object') return;

    // Generate lens root from constructor function.
    const fn = args.init;
    if (typeof fn === 'function') root.change((d) => fn(d));

    // Ensure simple {object} root if nothing is provided.
    if (args.init === undefined && current() === undefined) {
      root.change((d) => ObjectPath.Mutate.ensure(d, wrangle.path(path), {}));
    }

    // Catch error condition, there is no root for the lens.
    if (typeof current() !== 'object') {
      const target = wrangle.path(path).join('/');
      throw new Error(`Target path of [Lens] is not an object: [${target}]`);
    }
  })();

  api.change(() => null); // NB: Ensure the lens is initialized.
  _lastValue = api.current;

  (api as any)[Symbols.kind] = Symbols.Lens;
  return api;
}

/**
 * Helpers
 */

const wrangle = {
  options<R extends O>(options?: Options<R> | t.InitializeLens<R>): Options<R> {
    if (typeof options === 'function') return { init: options };
    return options ?? {};
  },

  path(path?: PathInput) {
    return typeof path === 'function' ? path() : path ?? [];
  },

  patches(patches: t.Patch[], path?: PathInput) {
    const length = wrangle.path(path).length;
    return patches.map((patch) => ({ ...patch, path: patch.path.slice(length) }));
  },

  changeOptions(path?: PathInput, options?: t.ImmutableChangeOptionsInput<P>) {
    const fn = Wrangle.patchCallback(options);
    if (!fn) return;

    const res: t.ImmutableChangeOptions<P> = {
      patches(e) {
        fn(wrangle.patches(e, wrangle.path(path)));
      },
    };
    return res;
  },
} as const;
