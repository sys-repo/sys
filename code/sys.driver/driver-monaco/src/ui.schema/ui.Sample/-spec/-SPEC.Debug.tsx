import React from 'react';
import { Button, css, D, LocalStorage, ObjectView, Signal, type t, Url } from '../common.ts';
import { importLibs } from '../libs.ts';

type P = t.SampleProps;
type Storage = Pick<P, 'theme' | 'debug'>;

/**
 * Types:
 */
export type DebugProps = { debug: DebugSignals; style?: t.CssInput };
export type DebugSignals = Awaited<ReturnType<typeof createDebugSignals>>;

/**
 * Signals:
 */
export async function createDebugSignals() {
  const s = Signal.create;
  const { Crdt, A } = await importLibs();

  const defaults: Storage = {
    theme: 'Dark',
    debug: true,
  };
  const store = LocalStorage.immutable<Storage>(`dev:${D.displayName}`, defaults);
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
      { ws: 'waiheke.sync.db.team' },
      isLocalhost && { ws: 'localhost:3030' },
      qsSyncServer && { ws: qsSyncServer },
    ],
  });

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
  };
  const p = props;
  const api = {
    Crdt,
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

      <hr />
      <Button
        block
        label={() => `debug: ${p.debug.value}`}
        onClick={() => Signal.toggle(p.debug)}
      />
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 10 }} />
    </div>
  );
};
