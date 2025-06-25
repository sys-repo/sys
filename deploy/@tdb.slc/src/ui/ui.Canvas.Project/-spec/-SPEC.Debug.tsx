import React from 'react';
import { type t, Button, Crdt, css, D, LocalStorage, ObjectView, Signal } from '../common.ts';
import { EditorPanel } from './-ui.EditorPanel.tsx';

type Doc = { count: number };
type P = t.CanvasProjectProps;
type Storage = Pick<P, 'theme' | 'debug'> & { showEditorPanel?: boolean };

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

  const defaults: Storage = {
    theme: 'Dark',
    debug: true,
    showEditorPanel: true,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.name}`, defaults);
  const snap = store.current;

  const repo = Crdt.repo({
    storage: { database: 'dev.slc.crdt' },
    network: { ws: 'sync.db.team' },
  });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    showEditorPanel: s(snap.showEditorPanel),
    doc: s<t.CrdtRef<Doc>>(),
  };
  const p = props;
  const api = {
    props,
    repo,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
    },
  };

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.showEditorPanel = p.showEditorPanel.value;
    });
  });

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
  if (p.showEditorPanel.value) return <EditorPanel debug={debug} />;

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>

      <Button
        block
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />

      <Button
        block
        label={() => `show editor: ${p.showEditorPanel.value}`}
        onClick={() => Signal.toggle(p.showEditorPanel)}
      />

      <hr />
      <Button
        block
        label={() => `count: increment`}
        onClick={() => {
          const doc = p.doc.value;
          doc?.change((d) => d.count++);
        }}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView
        name={'debug'}
        data={Signal.toObject({ ...p, doc: p.doc.value?.current })}
        expand={['$']}
        style={{ marginTop: 10 }}
      />
    </div>
  );
};
