import { Dev } from './-ui.tsx';
import { DEFAULTS, ObjectPath, rx, type t } from './common.ts';

/**
 * Default sync logic for Textbox ←|→ ImmutableRef<T> state.
 *
 * NOTE: see implementation examples:
 *        - sys.ui.common:CmdBar.Stateful
 *        - ext.lib.automerge:Sync.textbox
 */
export const TextboxSync = {
  Dev,

  listen(
    textbox: t.TextInputRef,
    state: t.TextboxSyncState,
    path: t.ObjectPath,
    options: {
      debug?: string;
      splice?: t.TextSplice;
      diff?: t.TextDiffCalc;
      dispose$?: t.UntilObservable;
    } = {},
  ) {
    const { debug = 'Unknown', splice = DEFAULTS.splice, diff = DEFAULTS.diff } = options;
    const life = rx.lifecycle(options.dispose$);
    const { dispose, dispose$ } = life;

    const event = {
      handlers: { change: new Set<t.TextboxSyncChangeHandler>() },
      textbox: textbox.events(dispose$),
      state: state.events(dispose$),
    } as const;
    dispose$.subscribe(() => event.handlers.change.clear());

    /**
     * Ensure property target exists.
     */
    const resolve = ObjectPath.resolver<string>();
    const initial = resolve(state.current, path);
    if (typeof initial !== 'string') {
      if (initial !== undefined) throw new Error(`The sync path [${path}] is not of type string.`);
      state.change((d) => ObjectPath.Mutate.value(d, path, ''));
    }

    /**
     * Changes from the <input> element → [State]
     */
    const input$ = event.textbox.change$.pipe(
      rx.filter((e) => e.to !== resolve(state.current, path)),
      rx.map((e) => diff(e.from, e.to, e.selection.start)),
      rx.filter((e) => e.index >= 0),
    );
    input$.subscribe((e) => {
      try {
        state.change((d) => splice(d, path, e.index, e.delCount, e.newText));
      } catch (error: any) {
        const msg = `Failed while splicing change from textbox into CRDT (wait for CRDT sync update).`;
        console.error(msg, error);
      }
    });

    /**
     * Changes from [State] → <input>
     */
    event.state.changed$
      .pipe(rx.filter((e) => resolve(e.after, path) !== textbox.current.value))
      .subscribe((e) => {
        const text = resolve(e.after, path) ?? '';
        const pos = textbox.current.selection.start;
        event.handlers.change.forEach((onChange) => onChange({ text, pos }));
      });

    /**
     * API
     */
    const api: t.TextboxSyncListener = {
      onChange(fn) {
        event.handlers.change.add(fn);
        return api;
      },

      // Lifecycle
      dispose,
      dispose$,
      get disposed() {
        return life.disposed;
      },
    } as const;
    return api;
  },
} as const;
