import React from 'react';
import { Crdt } from '../../-test.ui.ts';
import { createRepo } from '../../../-test.repo.ts';

import {
  type t,
  Button,
  css,
  D,
  Is,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  STORAGE_KEY,
} from '../common.ts';

type P = t.LayoutProps;
type Storage = Pick<P, 'theme' | 'debug' | 'spinning'> & {
  header: Pick<t.LayoutHeader, 'visible' | 'readOnly'>;
  sidebar: t.LayoutSidebar;
  cropmarks: t.LayoutCropmarks;
  debugSlots?: boolean;
  urlKey?: string;
};
const defaults: Storage = {
  debug: false,
  debugSlots: true,
  spinning: false,
  theme: 'Dark',
  header: D.header,
  sidebar: D.sidebar,
  cropmarks: D.cropmarks,
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

  const signals: t.LayoutSignals = { doc: s<t.Crdt.Ref>() };
  const repo = createRepo();
  const crdt: t.LayoutBindings = {
    repo,
    storageKey: STORAGE_KEY.DEV,
    get urlKey() {
      return p.urlKey.value;
    },
  };

  const props = {
    debug: s(snap.debug),
    debugSlots: s(snap.debugSlots),
    theme: s(snap.theme),
    spinning: s(snap.spinning),
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
      divider: s((snap.sidebar ?? {}).divider),
    },
    cropmarks: {
      size: s((snap.cropmarks ?? {}).size),
      subjectOnly: s((snap.cropmarks ?? {}).subjectOnly),
    },
  };

  const p = props;
  const api = {
    props,
    repo,
    crdt,
    signals,
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
      d.spinning = p.spinning.value;
      d.debugSlots = p.debugSlots.value;
      d.urlKey = p.urlKey.value;

      d.header = d.header ?? {};
      d.header.visible = p.header.visible.value;
      d.header.readOnly = p.header.readOnly.value;

      d.sidebar = d.sidebar ?? {};
      d.sidebar.position = p.sidebar.position.value;
      d.sidebar.visible = p.sidebar.visible.value;
      d.sidebar.resizable = p.sidebar.resizable.value;
      d.sidebar.width = p.sidebar.width.value;
      d.sidebar.divider = p.sidebar.divider.value;

      d.cropmarks = d.cropmarks ?? {};
      d.cropmarks.size = p.cropmarks.size.value;
      d.cropmarks.subjectOnly = p.cropmarks.subjectOnly.value;
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
      <Button
        block
        label={() => {
          const v = p.spinning.value;
          const l = Is.bool(v) || v == null ? v : JSON.stringify(v);
          return `spinning: ${l}`;
        }}
        onClick={() => {
          Signal.cycle<P['spinning']>(p.spinning, [
            true,
            { main: true },
            { sidebar: true },
            { sidebar: true, main: true },
            { footer: true },
            false,
          ]);
        }}
      />

      <hr />
      <Button
        block
        label={() => `header.visible: ${p.header.visible.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.header.visible)}
      />
      <Button
        block
        label={() => `header.readOnly: ${p.header.readOnly.value ?? `<undefined>`}`}
        onClick={() => Signal.toggle(p.header.readOnly)}
      />
      <hr />
      <Button
        block
        label={() => `crdt.urlKey: ${p.urlKey.value ?? `<undefined>`}`}
        onClick={() => Signal.cycle(p.urlKey, ['foo', undefined])}
      />

      <hr />
      <Button
        block
        label={() => `sidebar.visible: ${p.sidebar.visible.value}`}
        onClick={() => Signal.toggle(p.sidebar.visible)}
      />
      <Button
        block
        label={() => `sidebar.position: ${p.sidebar.position.value}`}
        onClick={() => Signal.cycle(p.sidebar.position, ['left', 'right'])}
      />
      <Button
        block
        label={() => `sidebar.resizable: ${p.sidebar.resizable.value}`}
        onClick={() => Signal.toggle(p.sidebar.resizable)}
      />
      <Button
        block
        label={() => `sidebar.width: ${p.sidebar.width.value}px`}
        onClick={() => Signal.cycle(p.sidebar.width, [D.sidebar.width, 200, 420])}
      />
      <Button
        block
        label={() => {
          const v = p.sidebar.divider.value;
          return `sidebar.divider: ${v} (${Number(v) * 100}%)`;
        }}
        onClick={() => Signal.cycle(p.sidebar.divider, [0, D.sidebar.divider, 0.3, 0.6])}
      />

      <hr />
      <Button
        block
        label={() => {
          const v = p.cropmarks.size.value;
          let out = '(none)';
          if (v?.mode) out = v.mode === 'percent' ? 'percent, aspectRatio' : v.mode;
          return `cropmarks.size: ${out} `;
        }}
        onClick={() => {
          Signal.cycle(p.cropmarks.size, [
            { mode: 'fill' },
            { mode: 'percent', width: 80, aspectRatio: '4/3' },
            { mode: 'center' },
          ]);
        }}
      />
      <Button
        block
        label={() => `cropmarks.subjectOnly: ${p.cropmarks.subjectOnly.value}`}
        onClick={() => Signal.toggle(p.cropmarks.subjectOnly)}
      />

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <Button
        block
        label={() => `debug/slots: ${p.debugSlots.value}`}
        onClick={() => Signal.toggle(p.debugSlots)}
      />
      <Button block label={() => `(reset)`} onClick={() => debug.reset()} />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 20 }} />
      <Crdt.UI.Dev.ObjectView
        doc={debug.signals.doc.value}
        style={{ marginTop: 5 }}
        lenses={[
          //
          { name: 'my-lens', path: ['.meta'] },
          () => ({ name: 'via-ƒn', path: ['.meta'] }),
        ]}
      />
    </div>
  );
};
