import React from 'react';

import { createUiRepo, Spec } from '../../-test.ui.ts';
import { Color, css, D, Dev, Is, LocalStorage, Obj, Signal, type t } from './common.ts';

type P = t.CardProps;
type Storage = Pick<P, 'theme' | 'debug'> & { textbox?: string };
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
};

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;
export type TDoc = {
  count: number;
  text?: string;
};

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;

  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;
  const repo = createUiRepo();

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    redraw: s(0),
    textbox: s(store.current.textbox),
    doc: s<t.CrdtRef<TDoc>>(),
  };

  const p = props;
  const { attach } = Spec.attachments({
    shared() {
      // The shared lifetime owns two independent dependency sets.
      using effects = new DisposableStack();
      effects.defer(Signal.effect(() => {
        store.change((d) => {
          d.theme = p.theme.value;
          d.debug = p.debug.value;
          d.textbox = p.textbox.value;
        });
      }));
      effects.defer(Signal.effect(() => {
        const events = p.doc.value?.events();
        if (Is.nil(events)) return;
        events.$.subscribe(() => p.redraw.value++);
        return () => events.dispose();
      }));
      const owned = effects.move();
      return () => owned.dispose();
    },
  });

  function listen() {
    Signal.listen(props);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get(defaults, e.path)));
  }

  return { props, store, repo, listen, reset, attach };
}

const Styles = {
  title: css({
    fontWeight: 'bold',
    marginBottom: 10,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  }),
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  Signal.useRedrawEffect(() => debug.listen());

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = { base: css({}) };

  return (
    <div className={css(styles.base, props.style).class}>
      <Dev.Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      {valueEditorButtons(debug)}

      <hr />
      <Dev.Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Dev.Button block label={() => `redraw`} onClick={() => p.redraw.value++} />
      <Dev.Button block label={() => `(reset)`} onClick={() => debug.reset()} />

      <Dev.ObjectView
        name={'debug'}
        data={wrangle.data(debug)}
        style={{ marginTop: 15 }}
        expand={0}
      />
      {!!p.doc.value && (
        <Dev.ObjectView
          name={'doc'}
          data={p.doc.value.current}
          style={{ marginTop: 5 }}
          expand={0}
        />
      )}
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  data(debug: DebugSignals) {
    const p = debug.props;
    const doc = p.doc.value;
    return Signal.toObject({ ...p, doc: doc?.current });
  },
} as const;

/**
 * Dev Helpers:
 */
export function valueEditorButtons(debug: DebugSignals) {
  const { props: p, repo } = debug;

  const increment = async (by: number) => {
    const textbox = debug.store.current.textbox;
    if (!textbox || !repo) return;

    const doc = (await repo.get<TDoc>(textbox)).doc;
    doc?.change((d) => (d.count += by));
  };

  return (
    <React.Fragment>
      <Dev.Button block label={() => `increment`} onClick={() => increment(1)} />
      <Dev.Button block label={() => `decrement`} onClick={() => increment(-1)} />
      <Dev.Button
        block
        label={() => {
          const doc = p.doc.value;
          const current = doc?.current.text;
          return current ? `text: 👋 (← remove)` : `text: 👋`;
        }}
        onClick={() => {
          const doc = p.doc.value;
          const current = doc?.current.text;
          const next = !!current ? '' : '👋';
          doc?.change((d) => (d.text = next));
        }}
      />
    </React.Fragment>
  );
}
