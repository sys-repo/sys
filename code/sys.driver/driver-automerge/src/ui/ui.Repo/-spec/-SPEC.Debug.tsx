import React from 'react';
import {
  type t,
  Button,
  Crdt,
  css,
  D,
  LocalStorage,
  ObjectView,
  Signal,
  STORAGE_KEY,
  Url,
} from '../common.ts';

type P = t.SyncEnabledSwitchProps;
type Storage = Pick<P, 'theme' | 'debug' | 'localstorage' | 'mode'> & { noRepo?: boolean };
const defaults: Storage = {
  theme: 'Dark',
  debug: false,
  noRepo: false,
  localstorage: STORAGE_KEY.DEV.SUBJECT,
  mode: D.mode,
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

  const store = LocalStorage.immutable<Storage>(STORAGE_KEY.DEV.SPEC, defaults);
  const snap = store.current;

  /**
   * CRDT:
   */
  const qsSyncServer = Url.parse(location.href).toURL().searchParams.get('ws');
  const isLocalhost = location.hostname === 'localhost';
  const repo = Crdt.repo({
    storage: { database: 'dev.crdt' },
    network: [
      // { ws: 'sync.db.team' },
      // { ws: 'titirangi.sync.db.team' },
      { ws: 'waiheke.sync.db.team' },
      isLocalhost && { ws: 'localhost:3030' },
      qsSyncServer && { ws: qsSyncServer },
    ],
  });

  const props = {
    redraw: s(0),
    debug: s(snap.debug),
    theme: s(snap.theme),
    localstorage: s(snap.localstorage),
    mode: s(snap.mode),
    noRepo: s(snap.noRepo),
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
      d.noRepo = p.noRepo.value;
      d.localstorage = p.localstorage.value;
      d.mode = p.mode.value;
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
        label={() => `mode: ${p.mode.value ?? `<undefined> (default)`}`}
        onClick={() => {
          Signal.cycle<P['mode']>(p.mode, ['switch-only', 'switch + network-icons', undefined]);
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
        label={() => `debug: no-repo: ${p.noRepo.value}`}
        onClick={() => Signal.toggle(p.noRepo)}
      />

      <Button
        block
        label={() => {
          const v = p.localstorage.value;
          return `debug: localstorage: ${v ? `"${v}"` : '(none)'}`;
        }}
        onClick={() => {
          const s = p.localstorage;
          s.value = s.value ? undefined : STORAGE_KEY.DEV.SUBJECT;
        }}
      />

      <Button
        block
        label={() => `reset`}
        onClick={() => {
          p.noRepo.value = false;
        }}
      />

      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 15 }} />
      <ObjectView name={'repo'} data={debug.repo} expand={0} style={{ marginTop: 5 }} />
    </div>
  );
};
