import React from 'react';
import { SignalsObjectView } from '../-dev/ui.SignalsObjectView.tsx';
import { createRepo, DevUrl } from '../../-test.ui.ts';
import {
  type t,
  Arr,
  Button,
  Color,
  Crdt,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  STORAGE_KEY,
} from '../common.ts';

type P = t.VideoRecorderViewProps;
type Storage = Pick<P, 'theme' | 'debug' | 'aspectRatio' | 'docPath' | 'slugPath'> & {
  header: Pick<t.CrdtView.LayoutHeader, 'visible' | 'readOnly'>;
  sidebar: t.CrdtView.LayoutSidebar;
  urlKey?: string;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  docPath: ['yaml.parsed'],
  slugPath: ['slug'],
  header: D.header,
  sidebar: D.sidebar,
  aspectRatio: D.aspectRatio,
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
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
  const snap = store.current;

  const signals: t.VideoRecorderViewSignals = {
    doc: s(),
    camera: s(),
    audio: s(),
    stream: s(),
    recorder: s(),
    config: s(),
  };

  const repo = createRepo();
  const crdt: t.CrdtView.LayoutBindings = {
    repo,
    storageKey: STORAGE_KEY.DEV,
    get urlKey() {
      return p.urlKey.value;
    },
  };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    docPath: s(snap.docPath),
    slugPath: s(snap.slugPath),
    aspectRatio: s(snap.aspectRatio),
    urlKey: s(snap.urlKey),
    header: {
      visible: s((snap.header ?? {}).visible),
      readOnly: s((snap.header ?? {}).readOnly),
    },
    sidebar: {
      position: s((snap.sidebar ?? {}).position),
      visible: s((snap.sidebar ?? {}).visible),
      resizable: s((snap.sidebar ?? {}).resizable),
      width: s((snap.sidebar ?? {}).width),
    },
  };
  const p = props;
  const api = {
    props,
    signals,
    repo,
    crdt,
    url: DevUrl.make(window),
    reset,
    listen,
  };

  function listen() {
    Signal.listen(p, true);
    Signal.listen(signals);
  }

  function reset() {
    Signal.walk(p, (e) => e.mutate(Obj.Path.get<any>(defaults, e.path)));
  }

  Signal.effect(() => {
    store.change((d) => {
      d.theme = p.theme.value;
      d.debug = p.debug.value;
      d.docPath = p.docPath.value;
      d.slugPath = p.slugPath.value;
      d.aspectRatio = p.aspectRatio.value;
      d.urlKey = p.urlKey.value;

      d.header = d.header ?? {};
      d.header.visible = p.header.visible.value;
      d.header.readOnly = p.header.readOnly.value;

      d.sidebar = d.sidebar ?? {};
      d.sidebar.position = p.sidebar.position.value;
      d.sidebar.visible = p.sidebar.visible.value;
      d.sidebar.resizable = p.sidebar.resizable.value;
      d.sidebar.width = p.sidebar.width.value;
    });
  });

  if (api.url.debug === false) p.debug.value = false;
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
  const signals = debug.signals;
  const doc = signals.doc?.value;
  const docPath = p.docPath.value;

  Signal.useRedrawEffect(debug.listen);

  /**
   * Render:
   */
  const theme = Color.theme();
  const styles = {
    base: css({ color: theme.fg }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={Styles.title.class}>{D.name}</div>
      <Button
        block
        label={() => `theme: ${p.theme.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => `aspectRatio: ${p.aspectRatio.value ?? '(undefined)'}`}
        onClick={() => Signal.cycle(p.aspectRatio, [D.aspectRatio, '16/9', 1.618])}
      />
      <Button
        block
        label={() => {
          const v = p.docPath.value;
          return `path doc: ${Arr.isArray(v) ? `[${v}]` : (v ?? '(undefined)')}`;
        }}
        onClick={() => Signal.cycle(p.docPath, [['yaml'], ['foo'], ['foo', 'bar'], undefined])}
      />
      <Button
        block
        label={() => {
          const v = p.slugPath.value;
          return `path doc/slug: ${Arr.isArray(v) ? `[${v}]` : (v ?? '(undefined)')}`;
        }}
        onClick={() => {
          Signal.cycle(p.slugPath, [['slug'], ['hello', 'world'], undefined]);
        }}
      />

      <hr />
      <Button
        block
        label={() => `header.visible: ${p.header.visible.value ?? `(undefined)`}`}
        onClick={() => Signal.toggle(p.header.visible)}
      />
      <Button
        block
        label={() => `header.readOnly: ${p.header.readOnly.value ?? `(undefined)`}`}
        onClick={() => Signal.toggle(p.header.readOnly)}
      />

      <hr />
      <Button
        block
        label={() => `crdt.urlKey: ${p.urlKey.value ?? `(undefined)`}`}
        onClick={() => Signal.cycle(p.urlKey, ['foo', undefined])}
      />

      <hr />
      <Button
        block
        label={() => `sidebar.position: ${p.sidebar.position.value}`}
        onClick={() => Signal.cycle(p.sidebar.position, ['left', 'right'])}
      />
      <Button
        block
        label={() => `sidebar.visible: ${p.sidebar.visible.value}`}
        onClick={() => Signal.toggle(p.sidebar.visible)}
      />
      <Button
        block
        label={() => `sidebar.resizable: ${p.sidebar.resizable.value}`}
        onClick={() => Signal.toggle(p.sidebar.resizable)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `debug=false (via query-string → reload)`}
        onClick={() => {
          debug.url.debug = false;
          window.location.reload();
        }}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <SignalsObjectView
        signals={signals}
        doc={doc}
        style={{ marginTop: 10 }}
        expand={Crdt.UI.Dev.expandPaths([docPath])}
        lenses={[
          {
            name: Crdt.UI.Dev.fieldFromPath(docPath),
            path: docPath,
          },
        ]}
      />
    </div>
  );
};
