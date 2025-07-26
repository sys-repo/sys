import React from 'react';
import {
  type t,
  Button,
  Crdt,
  css,
  D,
  LocalStorage,
  Obj,
  ObjectView,
  Signal,
  Url,
} from '../common.ts';

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

  type S = t.SampleState;
  const signals: t.SampleSignals = {
    editor: s<S['editor']>(),
    doc: s<S['doc']>(),
    'yaml.path': s<S['yaml.path']>(['foo']),
  };

  const props = {
    debug: s(snap.debug),
    theme: s(snap.theme),
  };
  const p = props;
  const api = {
    Crdt,
    props,
    repo,
    signals,
    listen() {
      Object.values(props)
        .filter(Signal.Is.signal)
        .forEach((s) => s.value);
      Object.values(signals)
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
      <ObjectView name={'debug'} data={Signal.toObject(p)} expand={0} style={{ marginTop: 15 }} />
      <ObjectView
        name={'signals'}
        data={{
          ...Signal.toObject(debug.signals),
          doc: Obj.trimStringsDeep(debug.signals.doc.value?.current ?? {}),
        }}
        expand={1}
        style={{ marginTop: 5 }}
      />
    </div>
  );
};
