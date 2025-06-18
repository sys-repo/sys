import React from 'react';
import { type t, Button, Crdt, css, D, LocalStorage, ObjectView, Signal, Str } from '../common.ts';
import { CanvasCell } from '../../ui.Canvas.Cell/mod.ts';

type P = t.EditorCanvasProps;
type Storage = Pick<P, 'theme' | 'debug'>;

type Doc = { text: string };

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = ReturnType<typeof createDebugSignals>;

/**
 * Signals:
 */
export function createDebugSignals() {
  const s = Signal.create;

  const defaults: Storage = { theme: 'Dark', debug: false };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  const repo = Crdt.repo({ storage: true, network: [{ ws: 'sync.db.team' }] });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    doc: s<t.CrdtRef<Doc>>(),
    panels: s<P['panels']>(),
  };
  const p = props;

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
    });
  });

  const api = {
    props,
    repo,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  /**
   * Panel Layout
   */
  const cell = (panel: t.CanvasPanel) => {
    console.log('panel', panel);
    return { el: <CanvasCell theme={p.theme.value} /> };
  };

  p.panels.value = {
    purpose: cell('purpose'),
    uvp: cell('uvp'),
  };

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
  const styles = {
    base: css({}),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject({
          ...p,
          doc: p.doc.value?.current,
        })}
        expand={['$', '$.doc']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
