import React from 'react';
import {
  type t,
  Obj,
  Button,
  Crdt,
  css,
  D,
  CanvasPanel,
  LocalStorage,
  ObjectView,
  Signal,
} from '../common.ts';
import { EditorPanel } from './-ui.EditorPanel.tsx';

type Doc = { count: number };
type P = t.CanvasProjectProps;
type Storage = Pick<P, 'theme' | 'debug'> & { showEditorPanel?: boolean; showCanvas?: boolean };

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
    showCanvas: false,
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
    showCanvas: s(snap.showCanvas),
    doc: s<t.Crdt.Ref<Doc>>(),
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
      d.showCanvas = p.showCanvas.value;
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
      <Button
        block
        label={() => `show canvas: ${p.showCanvas.value}`}
        onClick={() => Signal.toggle(p.showCanvas)}
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

      <Button
        block
        label={() => `reset`}
        onClick={() => {
          const doc = p.doc.value;
          p.showCanvas.value = false;
          p.showEditorPanel.value = false;
          doc?.change((d) => (d.count = 0));
        }}
      />

      <Button
        block
        label={() => `🐷 ƒ migrate `}
        onClick={() => {
          const doc = p.doc.value;
          if (doc) {
            doc.change((d) => {
              const path = ['project', 'panels'];
              Obj.Path.Mutate.ensure(d, path, {});

              const o = d as any;
              const panels = Obj.Path.get<any>(d, path)!;

              CanvasPanel.all.forEach((panel) => {
                const from = o.project[panel];

                if (from) {
                  const text = from.text;
                  panels[panel] = { text };
                }

                delete o.project[panel];
              });
            });
          }
        }}
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
