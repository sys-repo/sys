import React from 'react';
import { parse } from 'yaml';
import {
  type t,
  Is,
  Arr,
  Button,
  Crdt,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  rx,
  Signal,
} from '../common.ts';
import { EditorPanel } from './-ui.EditorPanel.tsx';

type Doc = { count: number };
type P = t.CanvasProjectProps;
type Storage = Pick<P, 'theme' | 'debug'> & { showEditorPanel?: boolean; showCanvas?: boolean };

export const PATHS = {
  DEV: ['.dev', D.displayName],
  YAML: ['project', 'config', 'yaml'],
  YAML_PARSED: ['project', 'config', 'yaml.parsed'],
};

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
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const repo = Crdt.repo({
    storage: { database: 'dev.slc.crdt' },
    network: { ws: 'sync.db.team' },
  });

  const props = {
    redraw: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
    showEditorPanel: s(snap.showEditorPanel),
    showCanvas: s(snap.showCanvas),
    doc: s<t.Crdt.Ref<Doc>>(),
    video: s<t.SampleVideo>(),
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
    const change = (d: Storage) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.showCanvas = p.showCanvas.value;
      d.showEditorPanel = p.showEditorPanel.value;
    };

    store.change(change);
    p.doc.value?.change((d) => {
      const ns = Obj.Path.Mutate.ensure<Storage>(d, PATHS.DEV, {});
      change(ns);
    });
  });


  /**
   * Sync: DevHarness
   */
  let _events: t.Crdt.Events<Doc> | undefined;
  Signal.effect(() => {
    const doc = p.doc.value;
    _events?.dispose();
    _events = doc?.events();

    });

    _events
      ?.path(PATHS.YAML)
      .$.pipe(
        rx.debounceTime(300),
        rx.map((e) => Obj.Path.get<string>(doc?.current, PATHS.YAML) ?? ''),
      )
      .subscribe((text) => {
        let obj = {} as any;
        try {
          obj = parse(text);
        } catch (error: any) {
          obj = {};
        }
        doc?.change((d) => Obj.Path.mutate(d, PATHS.YAML_PARSED, obj));
      });

    _events
      ?.path(PATHS.YAML_PARSED)
      .$.pipe(
        rx.map((e) => Obj.Path.get(doc?.current, PATHS.YAML_PARSED)),
        rx.distinctWhile((p, n) => Obj.eql(p, n)),
        rx.debounceTime(300),
      )
      .subscribe((e) => {
        const obj = Obj.Path.get(doc?.current, PATHS.YAML_PARSED) as any;
        if (Is.record(obj.video)) {
          const video = obj.video as t.SampleVideo;
          if (!Obj.eql(p.video.value, video)) p.video.value = video;
        } else {
          p.video.value = undefined;
        }
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

      <hr />
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
        label={() => `count: increment (${p.doc.value?.current.count})`}
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
              // const path = ['project', 'config'];
              // const text = Obj.Path.get(d, [...path, 'code']);
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
