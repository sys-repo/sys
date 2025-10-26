import React from 'react';
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

type P = t.ConceptPlayerProps;
type Storage = Pick<P, 'debug' | 'theme' | 'docPath' | 'slugPath'> & {
  header: Pick<t.CrdtView.LayoutHeader, 'visible' | 'readOnly'>;
  sidebar: t.CrdtView.LayoutSidebar;
};
const defaults: Storage = {
  debug: false,
  theme: 'Dark',
  docPath: ['yaml'],
  slugPath: ['slug'],
  header: D.header,
  sidebar: D.sidebar,
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

  const signals: t.ConceptPlayerSignals = {
    doc: s(),
  };

  const repo = createRepo();
  const crdt: t.CrdtView.LayoutBindings = {
    repo,
    storageKey: STORAGE_KEY.DEV,
  };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
    docPath: s(snap.docPath),
    slugPath: s(snap.slugPath),
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
        label={() => `theme: ${p.theme.value ?? '<undefined>'}`}
        onClick={() => Signal.cycle<t.CommonTheme>(p.theme, ['Light', 'Dark'])}
      />
      <Button
        block
        label={() => {
          const v = p.docPath.value;
          return `doc path: ${Arr.isArray(v) ? `[${v}]` : (v ?? '(undefined)')}`;
        }}
        onClick={() => Signal.cycle(p.docPath, [['yaml'], ['foo'], ['foo', 'bar'], undefined])}
      />
      <Button
        block
        label={() => {
          const v = p.slugPath.value;
          return `slug path: ${Arr.isArray(v) ? `[${v}]` : (v ?? '(undefined)')}`;
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
      <Crdt.UI.Dev.ObjectView
        doc={debug.signals.doc.value}
        style={{ marginTop: 5 }}
        expand={['$', '$.doc:editor']}
        lenses={[
          {
            name: 'doc:editor',
            path: Obj.Path.appendSuffix(p.docPath.value, '.parsed'),
          },
        ]}
      />
    </div>
  );
};
