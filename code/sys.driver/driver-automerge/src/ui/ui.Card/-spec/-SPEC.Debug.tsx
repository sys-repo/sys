import React from 'react';

import { createRepo } from '../../-test.ui.ts';
import { type t, Button, Color, css, D, LocalStorage, Obj, ObjectView, Signal } from '../common.ts';

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

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    redraw: s(0),
    textbox: s(store.current.textbox),
    doc: s<t.CrdtRef<TDoc>>(),
  };

  const p = props;
  const repo = createRepo();
  const api = {
    props,
    store,
    repo,
    reset,
    listen() {
      Object.values(p)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.textbox = p.textbox.value;
    });
  });

  /**
   * Redraw on Document change:
   */
  let events: t.CrdtEvents | undefined;
  Signal.effect(() => {
    events?.dispose();
    const doc = p.doc.value;
    events = doc?.events();
    events?.$.subscribe(() => p.redraw.value++);
  });

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  return api;
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
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      {valueEditorButtons(debug)}

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button block label={() => `redraw`} onClick={() => p.redraw.value++} />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />

      <ObjectView name={'debug'} data={wrangle.data(debug)} style={{ marginTop: 15 }} expand={0} />
      {!!p.doc.value && (
        <ObjectView name={'doc'} data={p.doc.value.current} style={{ marginTop: 5 }} expand={0} />
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
      <Button block label={() => `increment`} onClick={() => increment(1)} />
      <Button block label={() => `decrement`} onClick={() => increment(-1)} />
      <Button
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
